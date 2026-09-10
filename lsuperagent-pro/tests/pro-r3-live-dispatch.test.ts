import { describe, expect, it, vi } from 'vitest'
import { dispatchTrustedGateway } from '../lib/gateway/server-dispatch'
import type { GatewayContext } from '../lib/gateway/types'

const context: GatewayContext = {
  requestId: 'req-pro-r3-dispatch-001',
  userId: null,
  workspaceId: 'workspace-1',
  action: 'chat',
  input: { message: 'hello' },
  receivedAt: '2026-08-21T00:00:00.000Z',
}

const gatewayUrl = 'https://gateway-preview.example.test'
const clientId = 'lsuperagent-pro'
const secret = 'unit-test-r3-hmac-secret'
const userAuthToken = 'owner-jwt-test-only'

describe('PRO R3 live gateway dispatch compatibility', () => {
  it('preserves request ID and maps the canonical authenticated 503 truthfully', async () => {
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.method).toBe('POST')
      const body = JSON.parse(String(init?.body))
      expect(body.requestId).toBe(context.requestId)
      const headers = new Headers(init?.headers)
      expect(headers.get('x-lsuperagent-request-id')).toBe(context.requestId)
      expect(headers.get('authorization')).toBe(`Bearer ${userAuthToken}`)
      expect(String(init?.body)).not.toContain(userAuthToken)

      return Response.json(
        {
          requestId: context.requestId,
          status: 'failed',
          code: 'UPSTREAM_UNAVAILABLE',
          gateway: 'CONNECTED',
          backend: 'NOT_CONNECTED',
        },
        { status: 503 },
      )
    })

    await expect(
      dispatchTrustedGateway(context, {
        gatewayUrl,
        clientId,
        secret,
        userAuthToken,
        fetchImpl: fetchImpl as typeof fetch,
        nowSeconds: 1_800_000_000,
        nonce: 'nonce-dispatch-001',
      }),
    ).resolves.toEqual({
      status: 'gateway_connected',
      requestId: context.requestId,
      backend: 'not_connected',
    })
  })

  it('fails closed on a network failure', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('network down')
    })

    await expect(
      dispatchTrustedGateway(context, {
        gatewayUrl,
        clientId,
        secret,
        userAuthToken,
        fetchImpl: fetchImpl as typeof fetch,
      }),
    ).resolves.toEqual({
      status: 'not_connected',
      requestId: context.requestId,
    })
  })

  it('fails closed when any required server configuration is absent', async () => {
    await expect(
      dispatchTrustedGateway(context, {
        gatewayUrl: '',
        clientId,
        secret,
        userAuthToken,
      }),
    ).resolves.toEqual({
      status: 'not_connected',
      requestId: context.requestId,
    })
  })

  it('rejects non-HTTPS gateway URLs without making a network request', async () => {
    const fetchImpl = vi.fn<typeof fetch>()

    await expect(
      dispatchTrustedGateway(context, {
        gatewayUrl: 'http://gateway-preview.example.test',
        clientId,
        secret,
        userAuthToken,
        fetchImpl,
      }),
    ).resolves.toEqual({
      status: 'not_connected',
      requestId: context.requestId,
    })

    expect(fetchImpl).not.toHaveBeenCalled()
  })
})
