import { randomUUID } from 'node:crypto'
import type { ChatRequest, GatewayContext } from './types'

export function buildGatewayContext(
  request: ChatRequest,
  requestId: string = randomUUID(),
): GatewayContext {
  return {
    requestId,
    userId: null,
    workspaceId: request.workspaceId ?? null,
    action: 'chat',
    input: { message: request.message },
    receivedAt: new Date().toISOString(),
  }
}
