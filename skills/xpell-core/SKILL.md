---
name: Xpell Core Contract
id: xpell-core
version: "1.0.0"
updated: "2026-02-26"
description: "Foundational runtime contract for @xpell/core: deterministic interpreter, XData2 shared state, Nano-Commands v2, XEM event bus, and module/object base classes. Enforces data-first AI-native execution."
requires:
  - xpell-contract
---

## 1) Applies to / Scope
- Package: `@xpell/core` in this repository.
- Source of truth scanned: `package.json`, all `src/*.ts`, `README.md`, `docs/Codex.md`, `docs/XData 2.md`, `docs/nano-commands2.md`, `docs/architecture/overview.md`, and built type entry (`dist/index.d.ts`).
- This contract governs code that depends on core directly, and integration layers built on top (`@xpell/ui`, `@xpell/node`, `@xpell/3d`, app repos).

## 2) Core identity (what it is / isn’t)
What it is:
- A runtime/interpreter core with:
- engine loop + scheduler (`XpellEngine.onFrame`, `start`)
- command dispatch (`run`, `execute`)
- shared runtime state (`XData` / `_xd`)
- event bus (`XEventManager` / `_xem`)
- base extension/object model (`XModule`, `XObject`, `XObjectManager`)

What it is not:
- Not a UI renderer or DOM layer.
- Not a persistence/database layer.
- Not an app/business framework.
- Not a hidden-state runtime; contracts are explicit.

Code reality caveat:
- `XParser.xmlString2Xpell()` uses `DOMParser`; this helper requires an environment that provides it.
