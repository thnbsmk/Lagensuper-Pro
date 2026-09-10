import { createR3SignedRequest } from './r3-signing'
import type { GatewayContext, GatewayDispatchResult } from './types'

type DispatchOptions = {
  gatewayUrl?: string
  clientId?: string
  secret?: string
  userAuthToken?: string
  fetchImpl?: typeof fetch
  nowSeconds?: number
  nonce?: string
  timeoutMs?: number
}

type CanonicalHandshake =
  | { backend: 'not_connected' }
  | { backend: 'connected'; provider: 'disabled' }

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && !Array.isArray(value) && typeof value === 'object'
}

function parseCanonicalHandshake(
  input: unknown,
  requestId: string,
): CanonicalHandshake | null {
  if (!isRecord(input)) return null

  const common =
    input.requestId === requestId &&
    input.status === 'failed' &&
    input.code === 'UPSTREAM_UNAVAILABLE' &&
    input.gateway === 'CONNECTED'

  if (!common) return null

  if (input.backend === 'NOT_CONNECTED') {
    return { backend: 'not_connected' }
  }

  if (input.backend === 'CONNECTED' && input.provider === 'DISABLED') {
    return { backend: 'connected', provider: 'disabled' }
  }

  return null
}

function parseVerifiedExecution(
  input: unknown,
  requestId: string,
): Record<string, unknown> | null {
  if (!isRecord(input)) return null
  if (
    input.requestId !== requestId ||
    input.status !== 'verified' ||
    input.gateway !== 'CONNECTED' ||
    input.backend !== 'CONNECTED' ||
    input.provider !== 'xai' ||
    !isRecord(input.data)
  ) {
    return null
  }

  const data = input.data
  if (
    data.status !== 'EXECUTED' ||
    data.provider !== 'xai' ||
    typeof data.runtime_version !== 'string' ||
    typeof data.model !== 'string' ||
    !isRecord(data.evidence)
  ) {
    return null
  }

  const evidence = data.evidence
  if (
    typeof evidence.provider_request_id !== 'string' ||
    !evidence.provider_request_id ||
    typeof evidence.correlation_id !== 'string' ||
    !evidence.correlation_id ||
    typeof evidence.qa_run_id !== 'string' ||
    !evidence.qa_run_id
  ) {
    return null
  }

  return data
}

export async function dispatchTrustedGateway(
  context: GatewayContext,
  options: DispatchOptions = {},
): Promise<GatewayDispatchResult> {
  const gatewayUrl = options.gatewayUrl ?? process.env.LSUPERAGENT_GATEWAY_URL ?? ''
  const clientId =
    options.clientId ?? process.env.LSUPERAGENT_GATEWAY_CLIENT_ID ?? ''
  const secret =
    options.secret ?? process.env.LSUPERAGENT_GATEWAY_HMAC_SECRET ?? ''
  const userAuthToken = options.userAuthToken ?? ''

  if (!userAuthToken.trim()) {
    return {
      status: 'blocked',
      requestId: context.requestId,
      code: 'UNAUTHENTICATED',
    }
  }

  if (!gatewayUrl || clientId !== 'lsuperagent-pro' || !secret) {
    return { status: 'not_connected', requestId: context.requestId }
  }

  let endpoint: string
  try {
    const base = new URL(gatewayUrl)
    if (base.protocol !== 'https:') {
      return { status: 'not_connected', requestId: context.requestId }
    }
    endpoint = new URL('/api/chat', base).toString()
  } catch {
    return { status: 'not_connected', requestId: context.requestId }
  }

  const signed = createR3SignedRequest(context, {
    clientId,
    secret,
    timestamp: options.nowSeconds,
    nonce: options.nonce,
  })
  const headers = new Headers(signed.headers)
  headers.set('authorization', `Bearer ${userAuthToken}`)

  const protectionBypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim()
  if (protectionBypass) {
    headers.set('x-vercel-protection-bypass', protectionBypass)
  }

  const controller = new AbortController()
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? 20_000,
  )

  try {
    const response = await (options.fetchImpl ?? fetch)(endpoint, {
      method: 'POST',
      headers,
      body: signed.body,
      signal: controller.signal,
    })

    let payload: unknown
    try {
      payload = await response.json()
    } catch {
      return { status: 'not_connected', requestId: context.requestId }
    }

    if (response.status === 401) {
      return {
        status: 'blocked',
        requestId: context.requestId,
        code: 'UNAUTHENTICATED',
      }
    }

    if (response.status === 403) {
      return {
        status: 'blocked',
        requestId: context.requestId,
        code: 'FORBIDDEN',
      }
    }

    if (response.status === 429) {
      return {
        status: 'blocked',
        requestId: context.requestId,
        code: 'POLICY_BLOCKED',
      }
    }

    if (response.status === 200) {
      const data = parseVerifiedExecution(payload, context.requestId)
      if (!data) {
        return {
          status: 'failed',
          requestId: context.requestId,
          code: 'UPSTREAM_UNAVAILABLE',
        }
      }
      return { status: 'verified', requestId: context.requestId, data }
    }

    if (response.status === 503) {
      const handshake = parseCanonicalHandshake(payload, context.requestId)
      if (!handshake) {
        return {
          status: 'failed',
          requestId: context.requestId,
          code: 'UPSTREAM_UNAVAILABLE',
        }
      }

      if (handshake.backend === 'connected') {
        return {
          status: 'gateway_connected',
          requestId: context.requestId,
          backend: 'connected',
          provider: 'disabled',
        }
      }

      return {
        status: 'gateway_connected',
        requestId: context.requestId,
        backend: 'not_connected',
      }
    }

    return {
      status: 'failed',
      requestId: context.requestId,
      code: 'UPSTREAM_UNAVAILABLE',
    }
  } catch {
    return { status: 'not_connected', requestId: context.requestId }
  } finally {
    clearTimeout(timeout)
  }
}
