import { afterEach, describe, expect, it, vi } from 'vitest'
import { dispatchTrustedGateway } from '../lib/gateway/server-dispatch'
import type { GatewayContext } from '../lib/gateway/types'

const context: GatewayContext = {
  requestId: 'req-pro-r8-preview-bypass-001',
  userId: null,
  workspaceId: null,
  action: 'chat',
  input: { message: 'Run one bounded preview command.' },
  receivedAt: '2026-08-21T05:20:00.000Z',
}

const originalBypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET

afterEach(() => {
  if (originalBypassSecret === undefined) {
    delete process.env.VERCEL_AUTOMATION_BYPASS_SECRET
  } else {
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET = originalBypassSecret
  }
})

describe('PRO R8 Vercel preview protection bypass', () => {
  it('forwards the automation bypass only as a header when configured', async () => {
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET = 'preview-bypass-test-only'

    const payload = {
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
          provider_request_id: 'xai-preview-1',
          correlation_id: 'corr-preview-1',
          qa_run_id: 'qa-preview-1',
        },
      },
    }

    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers)
      expect(headers.get('x-vercel-protection-bypass')).toBe(
        'preview-bypass-test-only',
      )
      expect(String(init?.body)).not.toContain('preview-bypass-test-only')
      return Response.json(payload, { status: 200 })
    })

    await expect(
      dispatchTrustedGateway(context, {
        gatewayUrl: 'https://gateway-preview.example.test',
        clientId: 'lsuperagent-pro',
        secret: 'unit-test-hmac-secret',
        userAuthToken: 'owner-jwt-test-only',
        fetchImpl: fetchImpl as typeof fetch,
        nowSeconds: 1_800_000_000,
        nonce: 'nonce-pro-r8-preview-bypass-001',
      }),
    ).resolves.toEqual({
      status: 'verified',
      requestId: context.requestId,
      data: payload.data,
    })
  })
})
