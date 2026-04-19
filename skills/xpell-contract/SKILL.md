---
name: Xpell Contract
id: xpell-contract
version: 1.0.0
updated: 2026-02-15
description: >
  Canonical, non-negotiable foundation contract for all Xpell work (core/ui/node/3d/apps).
  Enforces: no-inference, deterministic runtime, naming, XData2 discipline, nano-commands v2 (data-only),
  module boundaries, and event bus rules.
---

# Prime directive (MANDATORY)

Apply the Xpell contract as a strict system contract. **Do not infer missing state**.
If anything is unclear or missing, request the relevant file/tree/info instead of guessing.

# Scope

This skill applies to **ALL** Xpell repositories and apps:
- `@xpell/core` (runtime engine)
- `@xpell/ui` (UI runtime)
- `@xpell/3d` (3D runtime)
- `@xpell/node` (xnode server runtime)
- Product repos (e.g. VIBE, AIME, etc.)

This skill defines **global invariants**. Layer/product skills may add constraints but must not violate these.

# Global invariants

## 1) Deterministic runtime, explicit state
- Xpell is a **real-time interpreter**, not a framework.
- Runtime state must be **explicit and inspectable**.
- No hidden auto-magic, no inference, no silent auto-repair.

## 2) Naming (runtime state)
- All **runtime-managed properties** MUST:
  - start with `_`
  - use `snake_case`
- Method names MAY use `camelCase`.
- Command/CLI parameters MUST be `snake_case`.

## 3) XObject vs UI (hard boundary)
- `XObject` is **UI-agnostic**.
- `XObject` MUST NOT include or assume:
  - DOM access
  - visibility logic
  - UI methods (`show`, `hide`, etc.)
- UI behavior exists only in higher layers (e.g. `XUIObject`).

## 4) Modules are the only extension point
- Behavior is implemented ONLY via `XModule`.
- Each module:
  - has a unique `static _name`
  - owns its objects and internal state
  - exposes operations via underscore-prefixed methods (e.g. `_op_*`)
  - must not mutate other modules directly
- Cross-module interaction:
  - commands, events, or documented XData keys only.

## 5) Events are coordination, not state
- `_xem` is a lightweight event bus.
- Events must not be treated as a state store.
- Listener order must not be assumed.
- Payloads must be explicit; no hidden control flow.

## 6) XData2 (shared runtime memory) — strict
XData2 is runtime-only shared memory (NOT persistence).

**Canonical API only (required):**
- `get(key)`
- `set(key, value, { source })`
- `delete(key, { source })`
- `touch(key, { source })`
- `pick(key, { source })`
- `on(key, cb)`

Rules:
- Every `set/delete/touch/pick` MUST include a stable `source` string.
- Keys must be stable + namespaced (recommended: `module:topic`).
- Do NOT mirror XData into hidden mutable “shadow” state.
- Do NOT use XData as an event bus (use `_xem` for events).

Legacy compatibility:
- Direct `_o` access may exist for migration, but **new code MUST NOT write via `_o`**.

## 7) Nano-Commands v2 (DB-safe handlers) — strict
If output is stored (DB/files) or agent-editable:
- Handlers MUST be **data-only** (no JS functions)
- Allowed handler forms:
  - string nano-command (legacy shorthand)
  - JSON command: `{ "_op": "...", "_params": {} }`
  - sequence: `[ <handler>, <handler>, ... ]` (executed in order, awaited)
- No eval / no function strings / no scripting.
- Unknown ops must be rejected at validation boundaries.

## 8) Output discipline (when generating code)
- Never invent file paths; ask for repo tree if needed.
- Prefer small, auditable changes.
- Add runtime logging/instrumentation when debugging behavior changes.
- No background loops (`setInterval`, `setTimeout`) unless a layer contract explicitly allows it (most do not).

# Precedence
1) This skill (foundation)
2) Layer skill (node/ui/3d)
3) Product skill (vibe-* etc.)
4) Repo-local `codex.md` deltas (must not conflict with above)

