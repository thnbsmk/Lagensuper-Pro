import { randomUUID } from 'node:crypto'
import { parseChatRequest } from '@/lib/gateway/chat-request'
import { buildGatewayContext } from '@/lib/gateway/context'
import { dispatchTrustedGateway } from '@/lib/gateway/server-dispatch'

export async function POST(request: Request): Promise<Response> {
  const requestId = randomUUID()
  const authorization = request.headers.get('authorization') ?? ''

  if (!authorization.startsWith('Bearer ') || authorization.length <= 7) {
    return Response.json(
      { code: 'UNAUTHENTICATED', requestId },
      { status: 401 },
    )
  }
  const userAuthToken = authorization.slice(7)

  let input: unknown
  try {
    input = await request.json()
  } catch {
    return Response.json(
      { code: 'INVALID_REQUEST', requestId },
      { status: 400 },
    )
  }

  try {
    const chatRequest = parseChatRequest(input)
    const context = buildGatewayContext(chatRequest, requestId)
    const result = await dispatchTrustedGateway(context, { userAuthToken })

    if (result.status === 'verified') {
      return Response.json(
        {
          status: 'verified',
          requestId: result.requestId,
          data: result.data,
        },
        { status: 200 },
      )
    }

    if (result.status === 'blocked') {
      const status =
        result.code === 'UNAUTHENTICATED'
          ? 401
          : result.code === 'FORBIDDEN'
            ? 403
            : result.code === 'POLICY_BLOCKED'
              ? 429
              : 403
      return Response.json(
        { code: result.code, requestId: result.requestId },
        { status },
      )
    }

    if (result.status === 'failed') {
      return Response.json(
        { code: result.code, requestId: result.requestId },
        { status: result.code === 'INTERNAL_ERROR' ? 500 : 503 },
      )
    }

    if (result.status === 'not_connected') {
      return Response.json(
        { code: 'UPSTREAM_UNAVAILABLE', requestId: result.requestId },
        { status: 503 },
      )
    }

    if (result.status === 'gateway_connected') {
      if (result.backend === 'connected') {
        return Response.json(
          {
            code: 'UPSTREAM_UNAVAILABLE',
            requestId: result.requestId,
            gateway: 'CONNECTED',
            backend: 'CONNECTED',
            provider: 'DISABLED',
          },
          { status: 503 },
        )
      }

      return Response.json(
        {
          code: 'UPSTREAM_UNAVAILABLE',
          requestId: result.requestId,
          gateway: 'CONNECTED',
          backend: 'NOT_CONNECTED',
        },
        { status: 503 },
      )
    }

    return Response.json(
      { code: 'INTERNAL_ERROR', requestId },
      { status: 500 },
    )
  } catch {
    return Response.json(
      { code: 'INVALID_REQUEST', requestId },
      { status: 400 },
    )
  }
}
