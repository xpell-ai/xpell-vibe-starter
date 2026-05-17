---
name: VIBE Server Contract
id: vibe-server
version: 1.1.0
updated: 2026-04-17
description: >
  Product skill for xpell-vibe-starter server (xnode). Deterministic backend for
  real-time app mutation using server-xvm, minimal demo data, Wormholes v2, explicit
  persistence, and structured errors. This starter is intentionally NOT a SaaS platform.
requires:
  - xpell-contract
  - xpell-node
  - server-xvm
---

# Applies on top of: xpell-contract + xpell-node + server-xvm

## Purpose

This skill defines the server-side contract for the **xpell-vibe-starter** project.

It is derived from the original vibe-server contract, but narrowed to a minimal starter
focused on:

- loading an app from server-xvm
- previewing prompt-driven mutations
- applying confirmed changes
- persisting app/view updates through server-xvm
- exposing minimal demo data

This skill intentionally excludes SaaS/product complexity.

---

## Starter scope (explicit)

### Domain
- `users` (minimal demo entity)
- `app` / `views` via `server-xvm`
- `vibe` prompt → preview/apply flow

### Constraints
- No multi-tenant logic
- No ordering
- No payments
- No external channel APIs
- No chatbot / agent runtime behavior
- No onboarding
- No voice/media pipelines
- No admin product surface
- No autonomous background behavior
- No inferred state

---

## Single source of truth

All externally visible server behavior must flow through `_x.execute(xcmd)`.

For application structure:
- authoritative app/view persistence is handled by `server-xvm`

For demo/business data:
- persistence may use XDB filesystem storage

Do not bypass these boundaries.

---

## Server architecture

### Runtime
- Server runs on `@xpell/node`
- Use `XNode.start(...)`
- Wormholes transport is provided by XNode/XWebServer
- `ServerXVMModule` is already loaded by XNode and must not be duplicated

### Starter modules
- `users`
- `vibe`

### Do not add
- manual Wormholes gateway code
- custom Express transport for core logic
- duplicate server-xvm bootstrap
- product/SaaS modules from old VIBE

---

## Minimal modules

### `users`
Purpose:
- provide simple demo data for the starter app

Expected operations:
- `_op_list_users`
- `_op_add_user`

The exact surface may evolve, but it must remain minimal and deterministic.

### `vibe`
Purpose:
- receive prompt input
- generate previewable app/view JSON
- apply confirmed updates through server-xvm

Expected operations:
- `_op_generate_app`
- `_op_apply_app`

`vibe` is a thin intelligence/orchestration layer.
It must not become a large product module.

---

## Persistence pattern (required)

### For app/views
Use `server-xvm` as the authoritative persistence boundary.

Do not write authoritative app/view files directly when an equivalent `server-xvm` operation exists.

### For demo entities
Use Repository + Codec boundaries:

- `*_repo.ts` storage adapter CRUD
- `*_codec.ts` validation + serialization

Rules:
- Module ops call repos
- Repos never call modules
- No persistence work in constructors
- No hidden persistence
- No implicit migrations

---

## server-xvm usage

Use `server-xvm` for:

- app loading
- view loading
- persisted update flow
- version bumping
- update broadcast

The apply flow should align with the server-xvm push/update model:

1. Validate
2. Persist
3. Increment version
4. Emit update event
5. Notify subscribers

Do not reimplement this logic outside server-xvm.

---

## Wormholes & security

- Wormholes v2 envelope-only
- Transport is untrusted
- Gateway injects server context and overwrites any client-provided `_ctx`
- REQ execution must route to `_x.execute(xcmd)`
- Modules must not depend on raw Express/WebSocket objects
- Do not manually implement Wormholes router/server inside app code; XNode/XWebServer already owns transport installation

---

## Validation

- Params are `_snake_case` only
- Centralize enums/constants; do not scatter raw strings
- Keep request/response payloads explicit
- Persisted handlers must stay Nano-Commands v2 compatible (data only)
- No functions in persisted JSON

---

## Preview vs Apply (mandatory)

This project must preserve the distinction:

### Preview
- temporary
- in-memory / non-authoritative
- safe to discard

### Apply
- explicit user confirmation
- persisted on server
- authoritative

Do not blur this boundary.

---

## Error format (mandatory)

Return structured errors:

```json
{
  "_ok": false,
  "_error": {
    "_code": "E_SOMETHING",
    "_message": "Human readable",
    "_details": {}
  }
}

Do not throw raw transport-facing errors across boundaries.

⸻

Logging
	•	Use _xlog
	•	Do not use console.log
	•	Never log secrets
	•	Keep logs explicit and small
	•	Prefer auditable execution flow over noisy output

⸻

Hard forbiddens
	•	No multi-tenant SaaS logic
	•	No tenant provisioning scripts
	•	No payments/billing logic
	•	No chatbot/conversation orchestration in this starter
	•	No onboarding flow modules
	•	No voice modules
	•	No background loops, timers, polling, or autonomous workers
	•	No direct transport handling inside business modules
	•	No direct authoritative app/view file mutation outside server-xvm
	•	No inferred runtime state
	•	No hidden persistence

⸻

Output format (when generating code)
	1.	Short explanation
	2.	DTO types/interfaces (_snake_case)
	3.	XModule implementation (_op_*)
	4.	Repo/codec layer if persistence is needed
	5.	Minimal client REQ → server op → RES example

When generating starter code, prefer the smallest implementation that supports:

prompt → preview → apply → persist

