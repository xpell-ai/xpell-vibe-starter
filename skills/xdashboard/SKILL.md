---
name: XDashboard Contract
id: xdashboard
version: 1.0.0
updated: 2026-02-26
description: >
  Dashboard UI object pack for Xpell UI. Exposes XDashPack/XDashboardPack as the public API,
  registers dashboard-oriented XUIObject classes, and ships a single CSS artifact.
requires:
  - xpell-contract
  - xpell-core
  - xpell-ui
---

## 1) Applies to / Scope
- Package: `@xpell/xdashboard` in this repository.
- Public entrypoint: `src/index.ts` (published as `dist/index.js` / `dist/index.cjs`).
- Public subpath export: `./xdashboard.css`.
- Scope of this contract: the exported pack (`XDashPack` / `XDashboardPack`) and objects registered in `XDashPack.getObjects()`.
- Non-scope: local demo/test files (`src/xsimp.ts`, `src/xtest.ts`) are not exported by package entrypoints.

## 2) Core identity (what xdashboard is and is not)
- Is: a UI object pack (`XObjectPack`) that registers dashboard components implemented as `XUIObject` subclasses.
- Is: browser-oriented UI/runtime code (DOM/UI types and CSS; no server runtime module in `src/`).
- Is not: an app template entrypoint (no exported app bootstrap).
- Is not: a server package (`@xpell/node` is not used by source or peers).
- Is not: a data service or transport layer (no fetch/websocket/HTTP client in exported component sources).

## 3) Public API overview (exports + intended usage)
- Root export (`"."`):
  - `XDashPack`
  - `XDashboardPack` (alias of `XDashPack`)
- CSS subpath export:
  - `@xpell/xdashboard/xdashboard.css` -> `dist/xdashboard.css`
- `src/index.ts` also imports `./style/style.css` as a side effect.
- Intended usage: load the pack into XUI runtime (`_x.loadObjectPack(XDashPack)` or equivalent runtime call), then create JSON objects using registered `_type` values.

## 4) Component/object model contract (use exact names from code)
- Authoritative registry is `XDashPack.getObjects()` in `src/xcomp.ts`.
- Registered `_type` -> class mappings:
  - `card` -> `XCard`
  - `grid` -> `XGrid`
  - `navlist` -> `XNavList`
  - `badge` -> `XBadge`
  - `table` -> `XTable`
  - `modal` -> `XModal`
  - `toast` -> `XToast`
  - `divider` -> `XDivider`
  - `stack` -> `XStack`
  - `kpi-card` -> `XKpiCard`
  - `scroll` -> `XScroll`
  - `spacer` -> `XSpacer`
  - `toolbar` -> `XToolbar`
  - `empty` -> `XEmptyState`
  - `igroup` -> `XInputGroup`
  - `search` -> `XSearchBox`
  - `select` -> `XSelect`
  - `field` -> `XField`
  - `drawer` -> `XDrawer`
  - `sidebar` -> `XSidebar`
  - `section` -> `XSection`
- Common construction pattern across registered classes:
  - `class ... extends XUIObject`
  - `static _xtype = "..."`
  - `super(data, defaults, true)`
  - `this.parse(data)`

## 5) Data + state contract (XData2 keys if used; otherwise “no shared state”)
- Package-level shared state: none defined by exported entrypoint.
- Component-local state: private `__*` fields inside each component, synchronized via setters/methods.
- Explicit data-source integration in exported components:
  - `XTable` supports `_data_source` and `_on_data`; `onData()` consumes incoming data, optionally clears source (`emptyDataSource`/`emptyDataSorce` if available), and refreshes rows.
  - `XTable` may resolve `_rows` from `_xd._o[key]` when `_rows` is a string key.
- Other registered components do not expose package-wide shared XData keys.

## 6) Events + actions contract (Nano-Commands v2 usage if used)
- Event handler props are underscore-prefixed and component-specific (examples: `_on_change`, `_on_input`, `_on_select`, `_on_open`, `_on_close`, `_on_toggle`).
- Event execution in most components uses `checkAndRunInternalFunction(...)` for handler invocation.
- `XSidebar.setCollapsed()` invokes `_on_toggle` directly when it is a function.
- `XTable._on_data` accepts function or string and integrates with `super.onData(data)`.
- No Wormholes transport contract is implemented in this package.

### Handlers policy (Nano-Commands preferred)
1. Components may accept either Nano-Commands v2 (text or JSON), or JS functions (where supported by current implementation).
2. For Codex-generated dashboards, templates, and any persisted view data: handlers MUST use Nano-Commands v2 only and MUST NOT embed JS function handlers.
3. JS function handlers are allowed only for local prototypes, non-persisted runtime wiring, and internal testing.

## 7) Styling/theming contract (CSS vars/tokens if present)
- Style entrypoint: `src/style/style.css` (bundled to `dist/xdashboard.css`).
- Token file: `src/style/tokens.css` defines `--x-*` variables (color, spacing, radius, focus, etc.).
- Component styles (`src/style/*.css`) are class-based and token-driven via `var(--x-...)`.
- Package `sideEffects` includes CSS (`"**/*.css"`), so style imports must be preserved.

## 8) Performance rules (only if proven; otherwise “unknown”)
- Proven in exported components:
  - No `setInterval`/`setTimeout` usage inside registered components.
  - `XToast` auto-close is frame-driven (`onFrame`) and only active when open and `_auto_close_ms > 0`.
  - `XTable.onData()` includes `__data_inflight` guard to avoid re-entrant update loops.
- Unknown/not codified:
  - No global FPS/render budget is declared in repository code.

## 9) Hard forbiddens
- Do not introduce new dashboard `_type` values without adding a class and registering it in `XDashPack.getObjects()`.
- Do not add framework layers not present in repo (`react`, `vue`, etc.).
- Do not add server/runtime transport logic into this package (`fetch`/HTTP/WebSocket service layer in component pack code).
- Do not add polling/background loops to exported dashboard components (`setInterval`, polling, unbounded retries). Avoid `setTimeout`; if a one-shot timeout is required for UX infrastructure, it must be bounded/cancelable and explicitly documented.
- Do not bypass `XUIObject` lifecycle conventions with unmanaged external DOM mutations.
- Do not expose new public API symbols without updating both `src/index.ts` and `package.json` `exports`.

## 10) Minimal usage examples (2 short snippets using real exports only)
```ts
import { _x } from "@xpell/core";
import { XUI } from "@xpell/ui";
import { XDashPack } from "@xpell/xdashboard";
import "@xpell/xdashboard/xdashboard.css";

await _x.start();
await _x.loadModule(XUI);
await _x.loadObjectPack(XDashPack);
```

```ts
XUI.add({
  _type: "grid",
  _min_col_width: 240,
  _gap: 12,
  _children: [
    { _type: "kpi-card", _label: "Users", _value: "1204", _delta: "+8%", _delta_state: "up" },
    { _type: "table", _columns: [{ key: "id", label: "ID" }], _rows: [{ id: "u1" }] }
  ]
});
```
