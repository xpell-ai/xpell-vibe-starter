# XDashboard Skill Checklist

Use this before generating or modifying code in `@xpell/xdashboard`.

- [ ] Respect `xpell-contract`, `xpell-core`, and `xpell-ui` invariants.
- [ ] Keep root public API stable unless intentionally changed:
  - Root export currently exposes only `XDashPack` / `XDashboardPack`.
  - If API changes, update both `src/index.ts` and `package.json` `exports`.
- [ ] Register dashboard object types only via `XDashPack.getObjects()` and keep `static _xtype` aligned.
- [ ] Use `XUIObject` subclasses and JSON `_type` composition; keep underscore-prefixed props for component contracts.
- [ ] No frameworks unless already present (do not introduce React/Vue/Svelte/etc.).
- [ ] Forbidden in exported components: `setInterval`, polling loops, and unbounded retries. Avoid `setTimeout`; if used, it must be bounded/cancelable and explicitly documented in component behavior.
- [ ] Use XUI wrappers over raw XHTML where wrappers exist; use XHTML aliases/selectively only where needed.
- [ ] Use Nano-Commands-compatible handler style (`_on_*`, `checkAndRunInternalFunction`) where applicable.
- [ ] For generated dashboards/persisted views: handlers MUST be Nano-Commands v2 (text/JSON); do not output JS function handlers.
- [ ] No hidden shared state mirrors; if binding data, use explicit keys/handlers (`_data_source`, `_on_data`) as implemented.
- [ ] No direct server/API transport logic in this pack (`fetch`, websocket clients, service layers).
- [ ] Keep styling token-driven (`var(--x-*)`) and compatible with the single bundle stylesheet (`xdashboard.css`).
- [ ] Mobile-first rule: not explicitly codified in repository contracts; preserve existing responsive primitives (e.g., `XGrid._min_col_width`) and avoid desktop-only hard assumptions.
