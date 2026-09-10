# LSUPERAGENT PRO-R3 Pre-Live Gateway Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a server-only, validated, fail-closed `/api/chat` boundary that cannot contact a live gateway or provider.

**Architecture:** Browser requests terminate at a Next.js Route Handler. The route validates input, creates a normalized `GatewayContext`, and dispatches to a PRELIVE adapter that always returns `not_connected`. Existing LSUPERAGENT/Supabase remains canonical and untouched.

**Tech Stack:** Next.js 16.3.1 App Router, React 19, TypeScript 5.9, Vitest 4, pnpm 10.

**Spec:** `docs/superpowers/specs/2026-08-21-pro-r3-prelive-gateway-design.md`

## Global Constraints

- PRELIVE only; no live gateway endpoint or secret.
- No provider SDK calls or model execution.
- No Supabase Auth/session integration or mutation.
- `/api/health` remains unchanged.
- Every public error response includes a generated `requestId`.
- Valid chat input is 1..12000 trimmed characters.
- Unknown request fields are rejected.
- `userId` is always `null` in PRO-R3 PRELIVE.
- No Vercel, production, domain, or DNS changes.

---

### Task 1: Request Validation and Gateway Context

**Files:**
- Create: `lib/gateway/context.ts`
- Create: `lib/gateway/chat-request.ts`
- Modify: `lib/gateway/types.ts`
- Test: `tests/pro-r3-context.test.ts`

**Interfaces:**
- Produces: `parseChatRequest(input: unknown): ChatRequest`
- Produces: `buildGatewayContext(request: ChatRequest, requestId?: string): GatewayContext`
- Produces: `ChatRequest`, `GatewayContext`, `PublicGatewayErrorCode`, `GatewayDispatchResult`

- [ ] **Step 1: Write failing context/validation tests**

Cover a valid message/workspace, empty message, whitespace-only message, message over 12000 chars, non-string message, invalid workspace type, and unknown fields. Assert `buildGatewayContext()` generates a non-empty request ID, preserves an explicitly supplied request ID, sets `userId === null`, `action === 'chat'`, and emits ISO `receivedAt`.

- [ ] **Step 2: Run the focused test and verify RED**

```bash
pnpm vitest run tests/pro-r3-context.test.ts
```

Expected: FAIL because `chat-request.ts` and `context.ts` do not exist.

- [ ] **Step 3: Implement strict validation**

Implement `ChatRequest` as `{ message: string; workspaceId?: string | null }`. Reject non-object/array/null bodies, keys outside `message` and `workspaceId`, invalid message/workspace types, and trimmed message lengths outside 1..12000. Return the trimmed message and normalized workspace value.

- [ ] **Step 4: Implement normalized context**

Use the supplied request ID when present, otherwise `crypto.randomUUID()`. Use `new Date().toISOString()` for `receivedAt`, set `userId: null`, `action: 'chat'`, and place only `{ message }` in `input`.

- [ ] **Step 5: Run focused tests GREEN**

```bash
pnpm vitest run tests/pro-r3-context.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 1**

```bash
git add lsuperagent-pro/lib/gateway lsuperagent-pro/tests/pro-r3-context.test.ts
git commit -m "feat(pro-r3): add validated gateway context"
```

---

### Task 2: Fail-Closed Server Adapter and `/api/chat`

**Files:**
- Create: `lib/gateway/server-dispatch.ts`
- Create: `app/api/chat/route.ts`
- Test: `tests/pro-r3-chat-route.test.ts`
- Modify: `tests/pro-r2-routes.test.ts`
- Modify: `.github/workflows/pro-r2-verify.yml`

**Interfaces:**
- Consumes: `GatewayContext`, `GatewayDispatchResult`, `parseChatRequest`, `buildGatewayContext`
- Produces: `dispatchTrustedGateway(context: GatewayContext): Promise<GatewayDispatchResult>`
- Produces: `POST(request: Request): Promise<Response>`

- [ ] **Step 1: Write failing route/adapter tests**

Assert valid input returns HTTP 503 with `{ code: 'UPSTREAM_UNAVAILABLE', requestId }`; malformed JSON and invalid contracts return HTTP 400 with `{ code: 'INVALID_REQUEST', requestId }`; response bodies do not contain stack traces, provider keys, tokens, or authorization headers. Assert adapter always returns `not_connected`.

Update the PRO-R2 route test only after RED is observed so `/api/chat` becomes the single newly approved PRELIVE route while `/api/execute`, `/api/memory`, `/api/memory/candidate`, `/api/tools`, and `/api/audit` remain absent.

- [ ] **Step 2: Run focused tests and verify RED**

```bash
pnpm vitest run tests/pro-r3-chat-route.test.ts tests/pro-r2-routes.test.ts
```

Expected: FAIL because `/api/chat` and `server-dispatch.ts` do not exist.

- [ ] **Step 3: Implement fail-closed dispatch**

`dispatchTrustedGateway()` must not call `fetch`, Supabase, provider SDKs, or read a live gateway environment variable. It returns `{ status: 'not_connected', requestId: context.requestId }`.

- [ ] **Step 4: Implement `POST /api/chat`**

Create `requestId = crypto.randomUUID()` before parsing so malformed JSON receives a correlation ID. Parse JSON safely. Validate with `parseChatRequest`. Build context with `buildGatewayContext(parsed, requestId)`. Invalid requests return `Response.json({ code: 'INVALID_REQUEST', requestId }, { status: 400 })`. Valid PRELIVE requests dispatch and return `Response.json({ code: 'UPSTREAM_UNAVAILABLE', requestId }, { status: 503 })`.

- [ ] **Step 5: Advance prior route boundary**

Update `tests/pro-r2-routes.test.ts` and `.github/workflows/pro-r2-verify.yml` so both require `/api/health` and `/api/chat`, while execute/memory/memory-candidate/tools/audit routes remain absent.

- [ ] **Step 6: Run focused/full tests GREEN**

```bash
pnpm vitest run tests/pro-r3-chat-route.test.ts tests/pro-r2-routes.test.ts
pnpm vitest run
```

Expected: PASS.

- [ ] **Step 7: Commit Task 2**

```bash
git add lsuperagent-pro/app/api/chat lsuperagent-pro/lib/gateway/server-dispatch.ts lsuperagent-pro/tests .github/workflows/pro-r2-verify.yml
git commit -m "feat(pro-r3): add fail-closed chat boundary"
```

---

### Task 3: Security Regression and Read-Only CI

**Files:**
- Create: `.github/workflows/pro-r3-prelive-verify.yml`
- Create: `tests/pro-r3-security-boundary.test.ts`

**Interfaces:**
- Verifies source-only PRELIVE boundary and all prior R1/R2 contracts.

- [ ] **Step 1: Write security-boundary tests**

Read `lib/gateway/server-dispatch.ts` and `app/api/chat/route.ts` as text and assert they do not contain network dispatch (`fetch(`), provider SDK imports, Supabase mutation methods, live gateway URL variables, privileged secret-name literals, or authorization-header forwarding logic.

- [ ] **Step 2: Run security test**

```bash
pnpm vitest run tests/pro-r3-security-boundary.test.ts
```

Expected: PASS once Task 2 implementation exists.

- [ ] **Step 3: Add read-only PR CI**

Create a PR-triggered workflow with `contents: read`. In `lsuperagent-pro`, run:

```bash
pnpm install --frozen-lockfile
pnpm vitest run
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

Add shell checks proving `app/api/chat/route.ts` and `app/api/health/route.ts` exist while execute/memory/tools/audit routes remain absent. Add a secret-name scan over `app components lib tests .env.example`.

- [ ] **Step 4: Run full runner verification**

```bash
pnpm vitest run
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

Expected: all exit 0.

- [ ] **Step 5: Open Draft PR and verify PR-triggered CI**

Base: `main`
Head: `agent/pro-r3-prelive-gateway-v1`
Title: `Add LSUPERAGENT PRO-R3 pre-live gateway boundary`

Do not merge.

- [ ] **Step 6: Stop at hard gate**

Report exactly:

```text
STATUS: PRO-R3_PRELIVE_VERIFIED | BLOCKED
LIVE_GATEWAY_CONNECTED: NO
SUPABASE_AUTH_CONNECTED: NO
PROVIDER_CONNECTED: NO
CANONICAL_DATA_CHANGED: NO
VERCEL_DEPLOYED: NO
PRODUCTION_CHANGED: NO
NEXT_GATE: PRO-R3_LIVE_GATEWAY_APPROVAL_REQUIRED
```
