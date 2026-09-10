import { describe, expect, it } from 'vitest'
import { buildGatewayContext } from '../lib/gateway/context'
import { parseChatRequest } from '../lib/gateway/chat-request'

describe('PRO-R3 chat request and gateway context', () => {
  it('normalizes a valid request and generates a gateway context', () => {
    const parsed = parseChatRequest({
      message: '  hello LSUPERAGENT  ',
      workspaceId: 'workspace-1',
    })

    expect(parsed).toEqual({
      message: 'hello LSUPERAGENT',
      workspaceId: 'workspace-1',
    })

    const context = buildGatewayContext(parsed)
    expect(context.requestId.length).toBeGreaterThan(0)
    expect(context.userId).toBeNull()
    expect(context.workspaceId).toBe('workspace-1')
    expect(context.action).toBe('chat')
    expect(context.input).toEqual({ message: 'hello LSUPERAGENT' })
    expect(Number.isNaN(Date.parse(context.receivedAt))).toBe(false)
  })

  it('preserves an explicitly supplied request id', () => {
    const context = buildGatewayContext(
      parseChatRequest({ message: 'hello' }),
      'request-fixed-123',
    )

    expect(context.requestId).toBe('request-fixed-123')
    expect(context.workspaceId).toBeNull()
  })

  it.each([
    null,
    [],
    {},
    { message: '' },
    { message: '   ' },
    { message: 'x'.repeat(12001) },
    { message: 123 },
    { message: 'hello', workspaceId: 42 },
    { message: 'hello', unexpected: true },
  ])('rejects invalid chat request %#', (input) => {
    expect(() => parseChatRequest(input)).toThrow()
  })
})
