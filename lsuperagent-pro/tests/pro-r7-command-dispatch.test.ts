import { describe, expect, it, vi } from 'vitest'
import { dispatchTrustedGateway } from '../lib/gateway/server-dispatch'
import type { GatewayContext } from '../lib/gateway/types'

const context: GatewayContext = {
  requestId: 'req-pro-r7-command-001',
  userId: null,
  workspaceId: null,
  action: 'chat',
  input: { message: 'Return one bounded command.' },
  receivedAt: '2026-08-21T01:00:00.000Z',
}

const ownerToken = 'owner-jwt-test-only'

function verifiedPayload() {
  return {
    requestId: context.requestId,
    status: 'verified',
    gateway: 'CONNECTED',
    backend: 'CONNECTED',
    provider: 'xai',
    data: {
      status: 'EXECUTED',
      runtime_version: '2026.08.21.1',
      provider: 'xai',
      model: 'grok-build-0.1',
      command: { action: 'NOOP', parameters: [] },
      evidence: {
        provider_request_id: 'xai-request-1',
        correlation_id: 'corr-1',
        qa_run_id: 'qa-1',
        duration_ms: 100,
      },
    },
  }
}

describe('PRO R7 authenticated gateway execution', () => {
  it('fails closed before network access when owner auth is missing', async () => {
    const fetchImpl = vi.fn()

    await expect(
      dispatchTrustedGateway(context, {
        gatewayUrl: 'https://gateway.example.test',
        clientId: 'lsuperagent-pro',
        secret: 'unit-test-r7-secret',
        fetchImpl: fetchImpl as typeof fetch,
        nowSeconds: 1_800_000_000,
        nonce: 'nonce-pro-r7-001',
      }),
    ).resolves.toEqual({
      status: 'blocked',
      requestId: context.requestId,
      code: 'UNAUTHENTICATED',
    })

    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('forwards owner auth only as Authorization and accepts verified xAI execution', async () => {
    const payload = verifiedPayload()
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.method).toBe('POST')
      const headers = new Headers(init?.headers)
      expect(headers.get('authorization')).toBe(`Bearer ${ownerToken}`)
      expect(String(init?.body)).not.toContain(ownerToken)
      return Response.json(payload, { status: 200 })
    })

    await expect(
      dispatchTrustedGateway(context, {
        gatewayUrl: 'https://gateway.example.test',
        clientId: 'lsuperagent-pro',
        secret: 'unit-test-r7-secret',
        userAuthToken: ownerToken,
        fetchImpl: fetchImpl as typeof fetch,
        nowSeconds: 1_800_000_000,
        nonce: 'nonce-pro-r7-002',
      }),
    ).resolves.toEqual({
      status: 'verified',
      requestId: context.requestId,
      data: payload.data,
    })

    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })
})
