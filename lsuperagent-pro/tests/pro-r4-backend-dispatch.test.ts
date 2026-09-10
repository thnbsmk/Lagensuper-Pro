import { describe, expect, it, vi } from 'vitest'
import { dispatchTrustedGateway } from '../lib/gateway/server-dispatch'
import type { GatewayContext } from '../lib/gateway/types'

const context: GatewayContext = {
  requestId: 'req-pro-r4-backend-001',
  userId: null,
  workspaceId: null,
  action: 'chat',
  input: { message: 'backend-health-only' },
  receivedAt: '2026-08-21T00:00:00.000Z',
}

const userAuthToken = 'owner-jwt-test-only'

describe('PRO R4 canonical backend state compatibility', () => {
  it('maps the legacy backend-connected/provider-disabled 503 without claiming model execution', async () => {
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers)
      expect(headers.get('authorization')).toBe(`Bearer ${userAuthToken}`)
      expect(String(init?.body)).not.toContain(userAuthToken)
      return Response.json(
        {
          requestId: context.requestId,
          status: 'failed',
          code: 'UPSTREAM_UNAVAILABLE',
          gateway: 'CONNECTED',
          backend: 'CONNECTED',
          provider: 'DISABLED',
        },
        { status: 503 },
      )
    })

    await expect(
      dispatchTrustedGateway(context, {
        gatewayUrl: 'https://gateway.example.test',
        clientId: 'lsuperagent-pro',
        secret: 'unit-test-r4-secret',
        userAuthToken,
        fetchImpl: fetchImpl as typeof fetch,
        nowSeconds: 1_800_000_000,
        nonce: 'nonce-r4-backend-001',
      }),
    ).resolves.toEqual({
      status: 'gateway_connected',
      requestId: context.requestId,
      backend: 'connected',
      provider: 'disabled',
    })
  })
})
