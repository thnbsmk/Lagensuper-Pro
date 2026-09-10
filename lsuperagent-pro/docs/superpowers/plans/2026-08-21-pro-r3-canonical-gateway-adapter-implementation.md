# LSUPERAGENT PRO-R3 Canonical Gateway Adapter Implementation Plan

> Execute with TDD on branch `agent/pro-r3-prelive-gateway-v1`; keep PR #3 Draft. No deployment or real secret injection.

**Goal:** Convert the existing PRO-R3 fail-closed server dispatcher into a server-only HMAC client for the canonical LSUPERAGENT Control Center `/api/chat`, while provider/model execution remains disabled.

**Canonical contract:** `v1\n<timestamp>\n<requestId>\n<sha256Hex(rawBody)>`, HMAC-SHA256 shared secret, 300-second freshness on canonical side. Valid canonical handshake returns HTTP 503 with `gateway: CONNECTED`, `execution: NOT_CONNECTED`, `code: UPSTREAM_UNAVAILABLE`.

## Constraints

- PRO remains a thin client, never canonical gateway authority.
- Server-only envs: `LSUPERAGENT_GATEWAY_URL`, `LSUPERAGENT_GATEWAY_SHARED_SECRET`.
- Do not add these to browser/public `.env.example` and never use `NEXT_PUBLIC_`.
- No OpenAI/Anthropic/Gemini/provider calls.
- No direct Supabase execution or mutation.
- Missing config, timeout, network failure, malformed canonical response -> fail closed as `not_connected`.
- Valid canonical handshake -> `gateway_connected`, execution still `not_connected`.
- No provider fallback.
- No Vercel deployment/real URL/secret/production/domain/DNS changes.

### Task 1 — Signing + canonical client contract

Create `lib/gateway/canonical-client.ts` and test `tests/pro-r3-canonical-client.test.ts`.

Tests first must prove:
- deterministic `v1=<64 hex>` signature;
- exact HMAC protocol compatible with canonical design;
- missing server config returns `not_connected` without calling fetch;
- valid canonical 503 response maps to `gateway_connected` + execution `not_connected`;
- unreachable/malformed response remains `not_connected`;
- no provider fallback.

Implementation:
- `createCanonicalSignature({secret,timestamp,requestId,body})` uses SHA-256 body hash + HMAC-SHA256.
- `dispatchCanonicalChat(context, options?)` reads server-only config by default; optional injected config/fetch/clock are test seams only.
- POST exact body `{message, workspaceId}` to `${gatewayUrl}/api/chat`.
- Send `x-lsuperagent-client`, timestamp, request-id, signature, content-type.
- Validate response shape before trusting `gateway: CONNECTED`.
- Network timeout uses AbortController and fails closed.

### Task 2 — Dispatcher integration

Update `lib/gateway/types.ts` and `lib/gateway/server-dispatch.ts`.

Add dispatch result:

```ts
{ status: 'gateway_connected'; requestId: string; execution: 'not_connected' }
```

`dispatchTrustedGateway(context)` delegates only to `dispatchCanonicalChat(context)`; no provider fallback.

Update route test so a valid canonical handshake remains HTTP 503 but public response may include `gateway: CONNECTED`, `execution: NOT_CONNECTED`, and requestId. Missing config remains the existing 503 `UPSTREAM_UNAVAILABLE` behavior.

### Task 3 — Security boundary progression

Update `tests/pro-r3-security-boundary.test.ts` from PRELIVE-offline rules to LIVE-GATEWAY-source rules:
- `fetch`/`process.env` allowed only in `lib/gateway/canonical-client.ts`;
- `app/api/chat/route.ts` must not read env or call canonical network directly;
- dispatcher must not contain provider/Supabase execution or public env names;
- canonical client must not contain `NEXT_PUBLIC_`, provider SDK names, direct Supabase imports, or service-role authority.

Update R3 verifier to confirm server-only adapter exists and provider/direct-Supabase fallback remains absent. Keep R1/R2 regressions.

### Task 4 — Current-head verification

GitHub Actions current head must pass:
- R1 Verify
- R2 Verify
- R3 Verify
- full Vitest
- secret scan
- lint
- TypeScript
- production build
- live-gateway source boundary

Keep PR #3 Draft and unmerged. Record:

```text
R3B_PRO_ADAPTER_SOURCE: VERIFIED
LIVE_NETWORK_HANDSHAKE: NOT_RUN
PROVIDER_EXECUTION: DISABLED
DEPLOYMENT: NONE
NEXT_GATE: PRO-R3_CANONICAL_GATEWAY_PREVIEW_APPROVAL_REQUIRED
```
