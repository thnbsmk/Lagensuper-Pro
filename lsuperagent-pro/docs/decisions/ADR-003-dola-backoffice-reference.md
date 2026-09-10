# ADR-003 — DOLA Backoffice Reference

## Status
ACCEPTED

## Decision
The standalone DOLA-generated HTML is **not** an approved visual/UI template for the LSUPERAGENT PRO application.

It is accepted only as a **backoffice / runtime control-plane reference** for system structure and operational concepts.

Approved concepts to preserve:
- Gateway status and connectivity visibility
- Runtime / health overview
- Authority-boundary visibility
- Request correlation / request context
- Audit and observability surfaces
- Explicit separation of client, gateway, canonical backend, and provider execution

Rejected as product UI direction:
- DOLA page layout
- DOLA visual styling
- Hard-coded operational states
- Static request IDs, latency values, health states, or connectivity claims

## Runtime truth rule
Any value such as `CONNECTED`, `NOT_CONNECTED`, request ID, latency, HTTP status, error code, gateway/backend state, or execution state must come from the live runtime/API when the system is deployed.

The product UI must never present static/mock operational values as live system truth.

## Scope
This decision affects presentation and observability only. It does not authorize provider execution, Supabase mutation, production deployment, DNS changes, or canonical authority changes.
