# XDashboard Skill Checklist

Use this before generating or modifying `@xpell/xdashboard` code or XUI dashboard JSON.

## Source Of Truth
- [ ] Read `SKILL.md` and `SKILL_API_MAP.md` before generating dashboard JSON.
- [ ] Treat `XDashPack.getObjects()` as the authoritative registry.
- [ ] Keep `static _xtype`, registry key, skill `_id`, and generated JSON `_type` aligned.
- [ ] Do not invent `_type` names or aliases.
- [ ] Use current runtime names exactly: `xselect`, `xsection`, `empty`, and `igroup`.
- [ ] Do not use stale aliases: `select`, `section`, `empty-state`, or `input-group`.

## Dashboard Generation
- [ ] Use xdashboard semantic objects before generic `view`, `stack`, or `xhtml`.
- [ ] Use `sidebar` + `navlist` for app navigation.
- [ ] Use `xsection` for page sections.
- [ ] Use `card` for panels/forms/grouped content.
- [ ] Use `kpi-card` for metrics such as requests, tokens, credits, and provider cost.
- [ ] Use `table` for API keys, usage events, model prices, and other records.
- [ ] Use `field` for one labeled control.
- [ ] Use `igroup` for related controls/filter rows.
- [ ] Use `toolbar` for top bars and action rows.
- [ ] Use `badge` for compact statuses.
- [ ] Use `empty` for no-data states.
- [ ] Use `toast` for feedback.
- [ ] Use `scroll` for long dashboard content.
- [ ] Prefer `grid._min_col_width` for responsive dashboard grids.
- [ ] Prefer gap props over `spacer`; use `spacer` only for intentional fixed blank space.
- [ ] Put `_id` on interactive objects, tables, forms, drawers, modals, toasts, and nav objects.

## Styling
- [ ] Import/use the bundled stylesheet: `@xpell/xdashboard/xdashboard.css`.
- [ ] Use existing app/component CSS classes; do not generate huge inline style-sheet objects unless requested.
- [ ] Do not add Tailwind, Bootstrap, raw HTML documents, or a parallel design system.
- [ ] Only use `class` for existing app classes or CSS variants.
- [ ] Only use inline `style` when a component-supported size/CSS variable escape hatch is needed.

## Data And Events
- [ ] Preserve existing `_data_source`, `_rows`, `_data_output`, `_on_data`, and bindings when editing views.
- [ ] Use `table._data_source` or `table._rows` for table data.
- [ ] Use `field._data_output` only to pass binding into the field control when appropriate.
- [ ] Use `xselect._on_change` only as a data-only command object if the target runtime supports the op.
- [ ] Do not generate JavaScript function handlers in persisted/generated JSON.
- [ ] Do not invent client ops, `_on_click`, `_client_op`, `_flow`, or command shapes.
- [ ] Action-bearing fields (`_actions`, `_action`, table action columns, `_footer`) must contain valid child XUI objects.

## Xpell Dev Console
- [ ] API key table data source is `xai:keys`.
- [ ] API key creation uses `xai-router-client.create-api-key`.
- [ ] Auth user is available from `auth:user`.
- [ ] Admin-only features should be hidden or gated by client logic.
- [ ] Use `kpi-card` for requests, tokens, credits, and provider cost.
- [ ] Use `table` for API keys, usage events, and model prices.

## Code Changes
- [ ] Respect `xpell-contract`, `xpell-core`, and `xpell-ui` invariants.
- [ ] Keep root public API stable unless intentionally changed.
- [ ] If API changes, update `src/index.ts`, `package.json` `exports`, and this skill.
- [ ] Use `XUIObject` subclasses and JSON `_type` composition.
- [ ] No React/Vue/Svelte/Angular/JSX/hooks/virtual DOM.
- [ ] No direct server/API transport logic in xdashboard components.
- [ ] No hidden shared state mirrors.
- [ ] Forbidden in exported components: `setInterval`, polling loops, and unbounded retries.
- [ ] Avoid `setTimeout`; if used, it must be bounded, cancelable, and documented.
- [ ] Keep styling token-driven and compatible with the single bundled stylesheet.

## Known Documentation/Test Gaps
- [ ] `XSpacer` embeds `_size` in skill text, but current implementation does not read `_size` from data.
- [ ] Add tests or examples that assert registered `_type` names remain `xselect`, `xsection`, `empty`, and `igroup`.
- [ ] Add component-level JSON fixture tests for admin dashboard composition.
