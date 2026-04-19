---
name: Xpell Node (xnode) Contract
id: xpell-node
version: 1.0.0
updated: 2026-02-15
description: >
  Layer skill for @xpell/node (xnode). Deterministic server runtime rules:
  modules, transport trust boundary, Wormholes envelope protocol, explicit persistence adapters,
  no timers/polling, and single-source-of-truth through _x.execute().
requires:
  - xpell-contract
---

# Applies on top of: xpell-contract

This skill adds the **server runtime** constraints for `@xpell/node` (xnode) and server-side apps.

# Core identity
- xnode is a **library**, not a framework.
- Host controls routes/transport; xnode provides the deterministic runtime, module system, and gateways.
- Single source of truth for externally visible behavior: requests must route to **`_x.execute(xcmd)`** (no side channels).

# Hard forbiddens
- UI logic / DOM / browser APIs
- Transport-specific logic inside modules (no raw ws/express/fetch in modules)
- Background loops: `setInterval`, `setTimeout`
- Polling watchers / implicit schedulers
- Hidden persistence or inferred state

# Modules (XModule) — only extension point
- Every module extends `XModule` with unique `static _name`.
- External operations are `_op_<name>` methods.
- Cross-module interaction only via commands/events/XData keys (documented).

# Transport trust boundary (mandatory)
- Transport is untrusted.
- Gateway must validate:
  - envelope shape
  - session requirements
  - xcmd shape (module/op/params)
- Modules may assume validated envelope, but must still perform domain validation.

# Wormholes v2 (server) — envelope-only
- JSON only
- `_kind` is UPPERCASE
- REQ/RES correlate via `_rid`
- Session `_sid` enforced after auth (policy-defined)
- Gateway responsibilities:
  - parse + validate envelope
  - inject server-controlled context (e.g., `_ctx`)
  - call `_x.execute(xcmd)`
  - return RES with same `_rid`
  - send EVT only to subscribed targets

# Persistence (explicit & deterministic)
- Persistence is **not XData**.
- Use explicit adapters + codecs:
  - `*_repo.ts` storage adapter CRUD
  - `*_codec.ts` validation + serialize/deserialize
- Repos never call modules.
- No implicit migrations; migrations are explicit ops.

# Errors (structured)
- Never throw raw exceptions across Wormholes boundaries.
- Return structured errors with stable `_code` strings.

# Logging
- Use `_xlog` only.
- Never log secrets/tokens.
- Prefer correlation ids (`_rid`, `_trace`) if present; do not invent hidden tracing systems.

# Output checklist for code generation
When asked to generate xnode code, output:
1) Short explanation
2) Types/interfaces (DTOs with `_snake_case`)
3) Module implementation (`XModule` + `_op_*`)
4) Minimal request example (client → REQ → `_x.execute` → RES)

