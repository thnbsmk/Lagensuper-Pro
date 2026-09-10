import { createHash, createHmac, randomUUID } from 'node:crypto'
import type { GatewayContext } from './types'

type SigningInput = {
  clientId: string
  requestId: string
  timestamp: number
  nonce: string
  rawBody: string
}

type SignedRequestOptions = {
  clientId: string
  secret: string
  timestamp?: number
  nonce?: string
}

export function buildR3SigningString(input: SigningInput): string {
  const bodyHash = createHash('sha256').update(input.rawBody).digest('hex')

  return [
    'v1',
    'POST',
    '/api/chat',
    input.clientId,
    input.requestId,
    String(input.timestamp),
    input.nonce,
    bodyHash,
  ].join('\n')
}

export function createR3SignedRequest(
  context: GatewayContext,
  options: SignedRequestOptions,
): { body: string; headers: Record<string, string> } {
  const timestamp = options.timestamp ?? Math.floor(Date.now() / 1000)
  const nonce = options.nonce ?? randomUUID()
  const body = JSON.stringify({
    requestId: context.requestId,
    workspaceId: context.workspaceId,
    action: 'chat',
    input: context.input,
  })
  const signingString = buildR3SigningString({
    clientId: options.clientId,
    requestId: context.requestId,
    timestamp,
    nonce,
    rawBody: body,
  })
  const signature = createHmac('sha256', options.secret)
    .update(signingString)
    .digest('hex')

  return {
    body,
    headers: {
      'content-type': 'application/json',
      'x-lsuperagent-client': options.clientId,
      'x-lsuperagent-request-id': context.requestId,
      'x-lsuperagent-timestamp': String(timestamp),
      'x-lsuperagent-nonce': nonce,
      'x-lsuperagent-signature': signature,
    },
  }
}
