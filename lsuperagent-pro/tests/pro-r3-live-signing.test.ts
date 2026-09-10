import { createHash, createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import {
  buildR3SigningString,
  createR3SignedRequest,
} from '../lib/gateway/r3-signing'
import type { GatewayContext } from '../lib/gateway/types'

const context: GatewayContext = {
  requestId: 'req-pro-r3-001',
  userId: null,
  workspaceId: null,
  action: 'chat',
  input: { message: 'hello' },
  receivedAt: '2026-08-21T00:00:00.000Z',
}

const clientId = 'lsuperagent-pro'
const secret = 'unit-test-r3-hmac-secret'
const timestamp = 1_800_000_000
const nonce = 'nonce-pro-r3-001'

describe('PRO R3 approved signing protocol', () => {
  it('builds the exact canonical v1 signing string', () => {
    const body = JSON.stringify({
      requestId: context.requestId,
      workspaceId: context.workspaceId,
      action: 'chat',
      input: context.input,
    })
    const bodyHash = createHash('sha256').update(body).digest('hex')

    expect(
      buildR3SigningString({
        clientId,
        requestId: context.requestId,
        timestamp,
        nonce,
        rawBody: body,
      }),
    ).toBe(
      [
        'v1',
        'POST',
        '/api/chat',
        clientId,
        context.requestId,
        String(timestamp),
        nonce,
        bodyHash,
      ].join('\n'),
    )
  })

  it('creates the exact canonical body and required signed headers', () => {
    const result = createR3SignedRequest(context, {
      clientId,
      secret,
      timestamp,
      nonce,
    })

    expect(result.body).toBe(
      JSON.stringify({
        requestId: context.requestId,
        workspaceId: null,
        action: 'chat',
        input: { message: 'hello' },
      }),
    )
    expect(result.headers).toMatchObject({
      'content-type': 'application/json',
      'x-lsuperagent-client': clientId,
      'x-lsuperagent-request-id': context.requestId,
      'x-lsuperagent-timestamp': String(timestamp),
      'x-lsuperagent-nonce': nonce,
    })

    const expectedSignature = createHmac('sha256', secret)
      .update(
        buildR3SigningString({
          clientId,
          requestId: context.requestId,
          timestamp,
          nonce,
          rawBody: result.body,
        }),
      )
      .digest('hex')

    expect(result.headers['x-lsuperagent-signature']).toBe(expectedSignature)
  })
})
