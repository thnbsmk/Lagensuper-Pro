export type ConnectionStatus =
  | 'NOT_CONNECTED'
  | 'CONNECTED'
  | 'DEGRADED'
  | 'BLOCKED'

export type GatewayErrorLayer =
  | 'UI_ERROR'
  | 'AUTH_ERROR'
  | 'GATEWAY_ERROR'
  | 'POLICY_ERROR'
  | 'MEMORY_ERROR'
  | 'TOOL_ERROR'
  | 'MODEL_ERROR'
  | 'AUDIT_ERROR'
  | 'DATABASE_ERROR'

export interface TrustedGatewayRequest<TPayload = unknown> {
  endpoint: string
  payload: TPayload
  userAuthToken?: string
}

export interface TrustedGatewayResponse<T = unknown> {
  status: 'verified' | 'blocked' | 'failed' | 'not_connected'
  data?: T
  executionId?: string
  errorLayer?: GatewayErrorLayer
  message?: string
}

export interface GatewaySnapshot {
  gateway: ConnectionStatus
  backend: ConnectionStatus
}

export type ChatRequest = {
  message: string
  workspaceId?: string | null
}

export type GatewayContext = {
  requestId: string
  userId: null
  workspaceId: string | null
  action: 'chat'
  input: { message: string }
  receivedAt: string
}

export type PublicGatewayErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'INVALID_REQUEST'
  | 'POLICY_BLOCKED'
  | 'UPSTREAM_UNAVAILABLE'
  | 'AUDIT_WRITE_FAILED'
  | 'INTERNAL_ERROR'

export type GatewayDispatchResult =
  | { status: 'not_connected'; requestId: string }
  | {
      status: 'gateway_connected'
      requestId: string
      backend: 'not_connected'
    }
  | {
      status: 'gateway_connected'
      requestId: string
      backend: 'connected'
      provider: 'disabled'
    }
  | { status: 'verified'; requestId: string; data: unknown }
  | { status: 'blocked'; requestId: string; code: PublicGatewayErrorCode }
  | { status: 'failed'; requestId: string; code: PublicGatewayErrorCode }
