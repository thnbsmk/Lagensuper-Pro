// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { POST } from '../app/api/chat/route'

const userAuthToken = 'owner-jwt-test-only'

afterEach(() => {
  delete process.env.LSUPERAGENT_GATEWAY_URL
  delete process.env.LSUPERAGENT_GATEWAY_CLIENT_ID
  delete process.env.LSUPERAGENT_GATEWAY_HMAC_SECRET
  vi.unstubAllGlobals()
})

describe('PRO /api/chat R4 backend state compatibility', () => {
  it('surfaces legacy backend CONNECTED with provider DISABLED without claiming execution', async () => {
    process.env.LSUPERAGENT_GATEWAY_URL = 'https://gateway.example.test'
    process.env.LSUPERAGENT_GATEWAY_CLIENT_ID = 'lsuperagent-pro'
    process.env.LSUPERAGENT_GATEWAY_HMAC_SECRET = 'route-r4-hmac-secret'

    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        expect(init?.method).toBe('POST')
        const headers = new Headers(init?.headers)
        expect(headers.get('authorization')).toBe(`Bearer ${userAuthToken}`)
        expect(String(init?.body)).not.toContain(userAuthToken)
        const body = JSON.parse(String(init?.body)) as { requestId: string }
        return Response.json(
          {
            requestId: body.requestId,
            status: 'failed',
            code: 'UPSTREAM_UNAVAILABLE',
            gateway: 'CONNECTED',
            backend: 'CONNECTED',
            provider: 'DISABLED',
          },
          { status: 503 },
        )
      },
    )
    vi.stubGlobal('fetch', fetchMock)

    const response = await POST(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${userAuthToken}`,
        },
        body: JSON.stringify({ message: 'backend-health-only' }),
      }),
    )

    expect(response.status).toBe(503)
    expect(await response.json()).toMatchObject({
      code: 'UPSTREAM_UNAVAILABLE',
      gateway: 'CONNECTED',
      backend: 'CONNECTED',
      provider: 'DISABLED',
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
