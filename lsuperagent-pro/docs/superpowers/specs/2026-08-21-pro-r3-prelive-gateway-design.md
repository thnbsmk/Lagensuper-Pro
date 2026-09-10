# LSUPERAGENT PRO-R3 Pre-Live Gateway Design

**Date:** 2026-08-21
**Status:** DESIGN_APPROVED_BY_OPERATING_MODE
**Scope:** PRELIVE_ONLY
**Canonical authority:** existing LSUPERAGENT / Supabase

## 1. Goal

Add a server-only, provider-neutral gateway boundary to LSUPERAGENT PRO without connecting to any live gateway, model provider, Supabase mutation path, deployment target, or production resource.

PRO remains an alternate client. It must not become a second Core, Gateway authority, Memory authority, Audit authority, policy engine, model runtime, or database.

## 2. Architecture

```text
Browser
  ↓
LSUPERAGENT PRO UI
  ↓
POST /api/chat
  ↓
Server-only request validation
  ↓
Normalized GatewayContext
  ↓
Fail-closed Trusted Gateway Adapter
  ↓
NOT_CONNECTED

[Future hard gate]
  ↓
Existing Trusted LSUPERAGENT Gateway
  ↓
Canonical LSUPERAGENT / Supabase
```

## 3. PRO-R3 PRELIVE scope

Implement:

- server-only `/api/chat` Route Handler;
- stable public error categories;
- normalized request context;
- strict request validation;
- request ID generation;
- fail-closed gateway adapter;
- unit/contract tests;
- CI checks proving no live endpoint, privileged credential, provider call, Supabase mutation, or unapproved server route is introduced.

Do not implement:

- live Trusted Gateway URL or token;
- Supabase Auth/session verification;
- provider API calls;
- model routing;
- tool execution;
- canonical memory reads/writes;
- canonical audit writes;
- Vercel deployment;
- production/domain/DNS changes.

## 4. Server contract

`POST /api/chat` accepts JSON only:

```ts
export type ChatRequest = {
  message: string
  workspaceId?: string | null
}
```

Validation rules:

- body must be valid JSON;
- `message` must be a string;
- `message.trim().length` must be between 1 and 12000 characters;
- `workspaceId`, when present, must be a string or null;
- unknown fields are rejected;
- no browser-supplied user ID, role, policy decision, execution ID, provider, model, or audit result is accepted as authority.

## 5. Normalized context

```ts
export type GatewayContext = {
  requestId: string
  userId: null
  workspaceId: string | null
  action: 'chat'
  input: { message: string }
  receivedAt: string
}

export function buildGatewayContext(
  request: ChatRequest,
  requestId?: string,
): GatewayContext
```

If `requestId` is omitted, `buildGatewayContext()` generates one with `crypto.randomUUID()`. `/api/chat` creates a request ID before JSON parsing and passes the same ID into `buildGatewayContext()` for valid requests so malformed and valid responses follow one correlation model.

`userId` remains `null` in PRELIVE. PRO-R4/live-auth work must replace this with verified server-side session identity; browser input never populates it.

## 6. Public error contract

```ts
export type PublicGatewayErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'INVALID_REQUEST'
  | 'POLICY_BLOCKED'
  | 'UPSTREAM_UNAVAILABLE'
  | 'AUDIT_WRITE_FAILED'
  | 'INTERNAL_ERROR'
```

PRELIVE behavior:

- invalid request → HTTP 400 + `INVALID_REQUEST`;
- valid request while live gateway is absent → HTTP 503 + `UPSTREAM_UNAVAILABLE`;
- every response includes `requestId`;
- internal stack traces, tokens, secrets, provider payloads, and authorization headers are never returned.

## 7. Gateway adapter

The server adapter has one responsibility: accept a normalized `GatewayContext` and return a normalized result.

```ts
export type GatewayDispatchResult =
  | { status: 'not_connected'; requestId: string }
  | { status: 'verified'; requestId: string; data: unknown }
  | { status: 'blocked'; requestId: string; code: PublicGatewayErrorCode }
  | { status: 'failed'; requestId: string; code: PublicGatewayErrorCode }
```

In PRO-R3 PRELIVE, the implementation MUST always return `not_connected`. No environment variable may activate a live upstream in this phase.

## 8. Security boundaries

Forbidden in PRELIVE source/config:

- service-role credentials;
- provider API keys;
- GitHub/Vercel deployment tokens;
- live gateway secrets;
- direct Supabase mutation code;
- network calls from the gateway adapter;
- direct provider SDK calls from `/api/chat`;
- logging raw request bodies or auth headers.

## 9. Testing contract

Required tests:

1. valid chat request is normalized into `GatewayContext` with generated/preserved `requestId`, `userId: null`, `action: 'chat'`, and normalized workspace ID;
2. empty, whitespace-only, too-long, malformed, wrong-type, and unknown-field requests are rejected;
3. `/api/chat` returns HTTP 503 / `UPSTREAM_UNAVAILABLE` for a valid request while adapter is not connected;
4. response includes request ID and no internal stack/provider/secret material;
5. gateway adapter contains no `fetch`, provider SDK, Supabase mutation, or live endpoint configuration;
6. `/api/health` remains unchanged and existing PRO-R1/PRO-R2 tests continue to pass;
7. the existing PRO-R2 CI boundary is advanced so `/api/chat` becomes approved in R3 while `/api/execute`, `/api/memory`, `/api/memory/candidate`, `/api/tools`, and `/api/audit` remain forbidden.

Verification sequence:

```text
pnpm install --frozen-lockfile
pnpm vitest run
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

## 10. Hard gate

The following require explicit user approval and are OUTSIDE this design:

- setting a real Trusted Gateway URL/secret;
- connecting Supabase Auth/session identity;
- enabling provider/model execution;
- enabling tools, memory, or audit operations;
- deploying to Vercel or any production host;
- domain/DNS changes.

Next gate after PRELIVE verification:

`PRO-R3_LIVE_GATEWAY_APPROVAL_REQUIRED`
