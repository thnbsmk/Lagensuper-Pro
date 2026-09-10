import { afterEach, describe, expect, it, vi } from 'vitest'
import { POST } from '../app/api/chat/route'
import { dispatchTrustedGateway } from '../lib/gateway/server-dispatch'
import type { GatewayContext } from '../lib/gateway/types'

const userAuthToken = 'owner-jwt-test-only'

function chatRequest(body: string) {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${userAuthToken}`,
    },
    body,
  })
}

function canonicalFetch() {
  return vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers)
    const requestId = headers.get('x-lsuperagent-request-id')
    expect(headers.get('authorization')).toBe(`Bearer ${userAuthToken}`)
    expect(String(init?.body)).not.toContain(userAuthToken)

    return new Response(
      JSON.stringify({
        requestId,
        status: 'failed',
        gateway: 'CONNECTED',
        backend: 'NOT_CONNECTED',
        code: 'UPSTREAM_UNAVAILABLE',
      }),
      { status: 503, headers: { 'content-type': 'application/json' } },
    )
  })
}

function enableCanonicalGateway() {
  vi.stubEnv('LSUPERAGENT_GATEWAY_URL', 'https://gateway.example.test')
  vi.stubEnv('LSUPERAGENT_GATEWAY_CLIENT_ID', 'lsuperagent-pro')
  vi.stubEnv('LSUPERAGENT_GATEWAY_HMAC_SECRET', 'unit-test-secret-only')
  vi.stubGlobal('fetch', canonicalFetch())
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('PRO-R3 fail-closed chat route compatibility', () => {
  it('returns 503 UPSTREAM_UNAVAILABLE for an authenticated valid request without gateway config', async () => {
    const response = await POST(
      chatRequest(JSON.stringify({ message: 'hello', workspaceId: 'w1' })),
    )
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body.code).toBe('UPSTREAM_UNAVAILABLE')
    expect(typeof body.requestId).toBe('string')
    expect(body.requestId.length).toBeGreaterThan(0)
  })

  it('returns 400 INVALID_REQUEST for authenticated malformed JSON', async () => {
    const response = await POST(chatRequest('{not-json'))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.code).toBe('INVALID_REQUEST')
    expect(typeof body.requestId).toBe('string')
  })

  it('returns 400 for authenticated invalid or unknown request fields', async () => {
    const response = await POST(
      chatRequest(JSON.stringify({ message: 'hello', provider: 'browser-selected' })),
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.code).toBe('INVALID_REQUEST')
  })

  it('does not expose internal or privileged material in public responses', async () => {
    const response = await POST(chatRequest(JSON.stringify({ message: 'hello' })))
    const text = await response.text()
    const forbidden = [
      'stack',
      'authorization',
      'SUPABASE_' + 'SERVICE_ROLE_KEY',
      'OPENAI_' + 'API_KEY',
      'ANTHROPIC_' + 'API_KEY',
      'GEMINI_' + 'API_KEY',
      userAuthToken,
    ]

    for (const marker of forbidden) {
      expect(text.toLowerCase()).not.toContain(marker.toLowerCase())
    }
  })

  it('keeps the server dispatcher fail-closed when gateway config is absent', async () => {
    const context: GatewayContext = {
      requestId: 'request-1',
      userId: null,
      workspaceId: null,
      action: 'chat',
      input: { message: 'hello' },
      receivedAt: new Date().toISOString(),
    }

    await expect(
      dispatchTrustedGateway(context, { userAuthToken }),
    ).resolves.toEqual({
      status: 'not_connected',
      requestId: 'request-1',
    })
  })

  it('delegates to the canonical gateway and preserves backend as not connected', async () => {
    enableCanonicalGateway()

    const context: GatewayContext = {
      requestId: '11111111-1111-4111-8111-111111111111',
      userId: null,
      workspaceId: 'w1',
      action: 'chat',
      input: { message: 'hello' },
      receivedAt: new Date().toISOString(),
    }

    await expect(
      dispatchTrustedGateway(context, { userAuthToken }),
    ).resolves.toEqual({
      status: 'gateway_connected',
      requestId: context.requestId,
      backend: 'not_connected',
    })
  })

  it('reports canonical gateway connectivity without claiming backend execution', async () => {
    enableCanonicalGateway()

    const response = await POST(
      chatRequest(JSON.stringify({ message: 'hello', workspaceId: 'w1' })),
    )
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body).toMatchObject({
      code: 'UPSTREAM_UNAVAILABLE',
      gateway: 'CONNECTED',
      backend: 'NOT_CONNECTED',
    })
    expect(typeof body.requestId).toBe('string')
  })
})
