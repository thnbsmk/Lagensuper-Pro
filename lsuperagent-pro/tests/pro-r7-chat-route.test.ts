// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { POST } from '../app/api/chat/route'

const ownerToken = 'owner-jwt-test-only'

afterEach(() => {
  delete process.env.LSUPERAGENT_GATEWAY_URL
  delete process.env.LSUPERAGENT_GATEWAY_CLIENT_ID
  delete process.env.LSUPERAGENT_GATEWAY_HMAC_SECRET
  vi.unstubAllGlobals()
})

function enableGateway() {
  process.env.LSUPERAGENT_GATEWAY_URL = 'https://gateway.example.test'
  process.env.LSUPERAGENT_GATEWAY_CLIENT_ID = 'lsuperagent-pro'
  process.env.LSUPERAGENT_GATEWAY_HMAC_SECRET = 'route-r7-hmac-secret'
}

describe('PRO /api/chat R7 authenticated execution', () => {
  it('requires owner auth before contacting the gateway', async () => {
    enableGateway()
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const response = await POST(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: 'bounded command' }),
      }),
    )

    expect(response.status).toBe(401)
    expect(await response.json()).toMatchObject({ code: 'UNAUTHENTICATED' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns verified command data without exposing the owner token', async () => {
    enableGateway()
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers)
      expect(headers.get('authorization')).toBe(`Bearer ${ownerToken}`)
      expect(String(init?.body)).not.toContain(ownerToken)
      const body = JSON.parse(String(init?.body)) as { requestId: string }

      return Response.json(
        {
          requestId: body.requestId,
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
        },
        { status: 200 },
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    const response = await POST(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({ message: 'bounded command' }),
      }),
    )

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload).toMatchObject({
      status: 'verified',
      data: {
        status: 'EXECUTED',
        provider: 'xai',
        model: 'grok-build-0.1',
      },
    })
    expect(JSON.stringify(payload)).not.toContain(ownerToken)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
