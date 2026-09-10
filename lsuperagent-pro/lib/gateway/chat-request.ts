import type { ChatRequest } from './types'

const allowedKeys = new Set(['message', 'workspaceId'])

export function parseChatRequest(input: unknown): ChatRequest {
  if (input === null || Array.isArray(input) || typeof input !== 'object') {
    throw new Error('invalid_chat_request')
  }

  const record = input as Record<string, unknown>

  for (const key of Object.keys(record)) {
    if (!allowedKeys.has(key)) {
      throw new Error('invalid_chat_request')
    }
  }

  if (typeof record.message !== 'string') {
    throw new Error('invalid_chat_request')
  }

  const message = record.message.trim()
  if (message.length < 1 || message.length > 12000) {
    throw new Error('invalid_chat_request')
  }

  const workspaceId = record.workspaceId
  if (
    workspaceId !== undefined &&
    workspaceId !== null &&
    typeof workspaceId !== 'string'
  ) {
    throw new Error('invalid_chat_request')
  }

  return {
    message,
    workspaceId: workspaceId === undefined ? undefined : workspaceId,
  }
}
