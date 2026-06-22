# XDashboard API Map (Code-Derived)

Source of truth scanned on 2026-06-22:
- `src/index.ts`
- `src/xcomp.ts`
- `src/x*.ts`
- `src/style/x*.css`

## Package Export Map
```json
{
  ".": {
    "types": "./dist/types/index.d.ts",
    "import": "./dist/index.js",
    "require": "./dist/index.cjs"
  },
  "./xdashboard.css": "./dist/xdashboard.css",
  "./package.json": "./package.json"
}
```

## Entrypoints And Exports
- `src/index.ts`
  - Side effect: `import "./style/style.css";`
  - Exports `XDashPack`.
  - Exports `XDashboardPack` as an alias to `XDashPack`.
- `src/xcomp.ts`
  - Declares `XDashPack extends XObjectPack`.
  - `XDashPack.getObjects()` returns the authoritative `_type -> class` map.

No component classes/types are re-exported from `src/index.ts`.

## Registered Dashboard Classes
- `XCard` -> `card`
- `XGrid` -> `grid`
- `XNavList` -> `navlist`
- `XBadge` -> `badge`
- `XTable` -> `table`
- `XModal` -> `modal`
- `XToast` -> `toast`
- `XDivider` -> `divider`
- `XStack` -> `stack`
- `XKpiCard` -> `kpi-card`
- `XScroll` -> `scroll`
- `XSpacer` -> `spacer`
- `XToolbar` -> `toolbar`
- `XEmptyState` -> `empty`
- `XInputGroup` -> `igroup`
- `XSearchBox` -> `search`
- `XSelect` -> `xselect`
- `XField` -> `field`
- `XDrawer` -> `drawer`
- `XSidebar` -> `sidebar`
- `XSection` -> `xsection`

## Component Reference

### XCard
- `_type` / `_xtype`: `card`.
- Supported fields / props: `_image`, `_title`, `_text`, `_href`, `_link_text`, `_actions`, `_image_alt`, `_hide_image`, `class`.
- Required fields: none.
- Common usage pattern: content panel, form panel, grouped content, summary card. Use `_hide_image: true` for text-only dashboard cards.
- Data binding support: no component-specific binding; child controls/actions may have their own bindings.
- Event/action support: `_actions` accepts child XUI objects. `_href` renders a link. No component-level generated handler field.
- CSS/class expectations: auto base class `xcard`; internal classes `xcard__inner`, `xcard__image`, `xcard__body`, `xcard__title`, `xcard__text`, `xcard__link`, `xcard__actions`; adds `xcard--no-image` when no image is rendered.
- Minimal JSON:
```json
{ "_type": "card", "_id": "billing-card", "_title": "Billing", "_text": "Credits: 0", "_hide_image": true }
```

### XGrid
- `_type` / `_xtype`: `grid`.
- Supported fields / props: `_children`, `_cols`, `_gap`, `_min_col_width`, `class`.
- Required fields: none.
- Common usage pattern: responsive card/KPI layouts. Prefer `_min_col_width` for dashboards.
- Data binding support: none beyond child objects.
- Event/action support: none.
- CSS/class expectations: auto base class `xgrid`; uses CSS variables `--x-grid-cols`, `--x-grid-gap`, `--x-grid-min-col`.
- Minimal JSON:
```json
{ "_type": "grid", "_id": "kpis", "_min_col_width": 240, "_gap": 16, "_children": [] }
```

### XNavList
- `_type` / `_xtype`: `navlist`.
- Supported fields / props: `_items`, `_active`, `_dense`, `_dividers`, `class`. Item fields: `_label`, `_value`, `_id`, `_icon`, `_badge`, `_disabled`, `_active`.
- Required fields: no required root fields; each item should include `_label`.
- Common usage pattern: sidebar/dashboard navigation. Use stable `_value` keys and `_active` to highlight the current route/view.
- Data binding support: none.
- Event/action support: implementation has `_on_select` runtime callback; do not generate JavaScript functions in persisted JSON.
- CSS/class expectations: auto base class `xnavlist`; item classes include `xnavlist__item`, `xnavlist__item--active`, `xnavlist__item--disabled`, `xnavlist__label`, `xnavlist__badge`.
- Minimal JSON:
```json
{
  "_type": "navlist",
  "_id": "main-nav",
  "_active": "keys",
  "_dense": true,
  "_items": [
    { "_label": "Overview", "_value": "overview" },
    { "_label": "API Keys", "_value": "keys" }
  ]
}
```

### XBadge
- `_type` / `_xtype`: `badge`.
- Supported fields / props: `_text`, `_variant`, `_size`, `_pill`, `_dot`, `_title`, `class`.
- Required fields: none.
- Common usage pattern: status label, compact counter, tag, dot indicator.
- Data binding support: no component-specific binding.
- Event/action support: none; do not use as a button.
- CSS/class expectations: auto base class `xbadge`; modifier classes include `xbadge--default`, `xbadge--success`, `xbadge--warn`, `xbadge--error`, `xbadge--info`, `xbadge--sm`, `xbadge--md`, `xbadge--pill`, `xbadge--dot`.
- Minimal JSON:
```json
{ "_type": "badge", "_id": "key-status", "_text": "Active", "_variant": "success", "_size": "md", "_pill": true }
```

### XTable
- `_type` / `_xtype`: `table`.
- Supported fields / props: `_columns`, `_rows`, `_data_source`, `_on_data`, `_row_key`, `_dense`, `_striped`, `_hover`, `_bordered`, `_empty_text`, `class`.
- Column fields: `_key` or `key`, `_title` or `label`, `_type`, `_actions`, `width`, `align`, `class`, `render`.
- Required fields: `_columns` is required by the interface and should be an array. Do not generate `render` functions.
- Common usage pattern: API keys, usage events, model prices, structured rows.
- Data binding support: `_rows` can be an array or XData key string; `_data_source` updates rows via `onData`; `_on_data` exists for data handling.
- Event/action support: action columns use `{ "_type": "actions", "_actions": [...] }`; cloned action objects receive `_row`, `_row_index`, and `_context`.
- CSS/class expectations: auto base class `xtable`; modifier classes `xtable--dense`, `xtable--striped`, `xtable--hover`, `xtable--bordered`; internal table classes `xtable__table`, `xtable__th`, `xtable__td`, `xtable__td--actions`, `xtable__empty`.
- Minimal JSON:
```json
{
  "_type": "table",
  "_id": "api-keys-table",
  "_data_source": "xai:keys",
  "_row_key": "id",
  "_columns": [
    { "_key": "name", "_title": "Name" },
    { "_key": "createdAt", "_title": "Created" },
    { "_key": "status", "_title": "Status" }
  ],
  "_empty_text": "No API keys yet",
  "_hover": true,
  "_bordered": true
}
```

### XModal
- `_type` / `_xtype`: `modal`.
- Supported fields / props: `_open`, `_title`, `_subtitle`, `_size`, `_width`, `_closable`, `_close_on_backdrop`, `_scroll`, `_actions`, `_content`, `_children`, `class`.
- Required fields: none.
- Common usage pattern: confirmations, focused forms, dialogs.
- Data binding support: none beyond children.
- Event/action support: `_actions` accepts footer child objects; implementation has runtime `_on_open` and `_on_close`; do not generate JS functions.
- CSS/class expectations: auto base class `xmodal`; modifier classes `xmodal--open`, `xmodal--sm`, `xmodal--md`, `xmodal--lg`; width via `--xmodal-width`.
- Minimal JSON:
```json
{
  "_type": "modal",
  "_id": "create-key-modal",
  "_open": false,
  "_title": "Create API key",
  "_size": "md",
  "_closable": true,
  "_children": []
}
```

### XToast
- `_type` / `_xtype`: `toast`.
- Supported fields / props: `_open`, `_text`, `_variant`, `_icon`, `_actions`, `_closable`, `_auto_close_ms`, `_position`, `class`.
- Required fields: none.
- Common usage pattern: temporary save/error/status feedback.
- Data binding support: none.
- Event/action support: `_actions` accepts child objects; implementation has runtime `_on_open` and `_on_close`; do not generate JS functions.
- CSS/class expectations: auto base class `xtoast`; modifier classes `xtoast--open`, variant classes, position classes. Auto-close is frame-driven.
- Minimal JSON:
```json
{ "_type": "toast", "_id": "save-toast", "_open": false, "_text": "Saved", "_variant": "success", "_position": "bottom-right" }
```

### XDivider
- `_type` / `_xtype`: `divider`.
- Supported fields / props: `_orientation`, `_thickness`, `_length`, `_inset`, `_muted`, `class`.
- Required fields: none.
- Common usage pattern: visual separation between sections/groups.
- Data binding support: none.
- Event/action support: none.
- CSS/class expectations: auto base class `xdivider`; modifier classes `xdivider--h`, `xdivider--v`, `xdivider--muted`; style variables `--xdivider-thickness`, `--xdivider-length`, `--xdivider-inset`.
- Minimal JSON:
```json
{ "_type": "divider", "_orientation": "horizontal", "_thickness": 1, "_length": "100%", "_muted": true }
```

### XStack
- `_type` / `_xtype`: `stack`.
- Supported fields / props: `_children`, `_direction`, `_gap`, `_align`, `_justify`, `_wrap`, `_grow`, `_class`, `class`.
- Required fields: none.
- Common usage pattern: simple vertical/horizontal groups. Prefer semantic objects before using stack as a generic container.
- Data binding support: none beyond children.
- Event/action support: none.
- CSS/class expectations: auto base class `xstack`; direction classes `xstack--v` or `xstack--h`; managed style includes gap, align, justify, wrap, flex grow.
- Minimal JSON:
```json
{ "_type": "stack", "_direction": "vertical", "_gap": 12, "_children": [] }
```

### XKpiCard
- `_type` / `_xtype`: `kpi-card`.
- Supported fields / props: `_label`, `_value`, `_delta`, `_delta_state`, `_icon`, `class`.
- Required fields: none.
- Common usage pattern: dashboard summary metrics.
- Data binding support: no component-specific binding.
- Event/action support: none.
- CSS/class expectations: auto base class `xkpi-card`; modifier classes `xkpi-card--up`, `xkpi-card--down`, `xkpi-card--flat`; internal classes `kpi-body`, `kpi-top`, `kpi-icon`, `kpi-label`, `kpi-value`, `kpi-delta`.
- Minimal JSON:
```json
{ "_type": "kpi-card", "_id": "tokens-kpi", "_label": "Tokens", "_value": "0", "_delta_state": "flat" }
```

### XScroll
- `_type` / `_xtype`: `scroll`.
- Supported fields / props: `_children`, `_direction`, `_grow`, `_hide_scrollbar`, `_max_height`, `_max_width`, `class`.
- Required fields: none.
- Common usage pattern: long dashboard content, tables, lists, modal/drawer body overflow.
- Data binding support: none beyond children.
- Event/action support: none.
- CSS/class expectations: auto base class `xscroll`; direction classes `xscroll--v`, `xscroll--h`, `xscroll--both`; hidden scrollbar class `xscroll--hide`; managed overflow styles.
- Minimal JSON:
```json
{ "_type": "scroll", "_id": "main-scroll", "_direction": "vertical", "_grow": true, "_children": [] }
```

### XSpacer
- `_type` / `_xtype`: `spacer`.
- Supported fields / props: `_direction`, `class`; implementation also references `_size` in embedded skill text, but current constructor does not read `_size` from data.
- Required fields: none.
- Common usage pattern: intentional fixed blank space only. Prefer gap props on layout components.
- Data binding support: none.
- Event/action support: none.
- CSS/class expectations: auto base class `xspacer`; implementation writes width/height styles from internal default size `16`; CSS also contains size variant classes but `_size` is not currently wired.
- Minimal JSON:
```json
{ "_type": "spacer", "_direction": "vertical" }
```

### XToolbar
- `_type` / `_xtype`: `toolbar`.
- Supported fields / props: `_children`, `_gap`, `_align`, `_justify`, `_wrap`, `_sticky`, `_top`, `_elevated`, `class`.
- Required fields: none.
- Common usage pattern: page top bars, table action rows, filter/action rows, modal footer groups.
- Data binding support: none beyond children.
- Event/action support: child actions only.
- CSS/class expectations: auto base class `xtoolbar`; modifier class `xtoolbar--elevated`; managed styles for gap, align, justify, wrap, sticky position/top.
- Minimal JSON:
```json
{ "_type": "toolbar", "_id": "topbar", "_justify": "space-between", "_align": "center", "_children": [] }
```

### XEmptyState
- `_type` / `_xtype`: `empty`.
- Supported fields / props: `_title`, `_description`, `_icon`, `_action`, `_size`, `_align`, `class`.
- Required fields: none.
- Common usage pattern: no data, no results, onboarding fallback.
- Data binding support: none beyond child action.
- Event/action support: `_action` accepts one child object, usually a button.
- CSS/class expectations: auto base class `xempty`; modifier classes `xempty--sm`, `xempty--md`, `xempty--lg`, `xempty--start`, `xempty--center`; internal classes `xempty__stack`, `xempty__title`, `xempty__desc`.
- Minimal JSON:
```json
{ "_type": "empty", "_id": "no-keys", "_title": "No API keys yet", "_description": "Create a key to start using the API." }
```

### XInputGroup
- `_type` / `_xtype`: `igroup`.
- Supported fields / props: `_children`, `_gap`, `_align`, `_wrap`, `_dense`, `_merged`, `class`.
- Required fields: none.
- Common usage pattern: related controls, filter groups, connected input/button rows.
- Data binding support: none beyond children.
- Event/action support: child actions only.
- CSS/class expectations: auto base class `xigroup`; modifier classes `xigroup--dense`, `xigroup--merged`; managed flex/gap/alignment styles.
- Minimal JSON:
```json
{ "_type": "igroup", "_id": "filters", "_gap": 8, "_align": "center", "_wrap": true, "_children": [] }
```

### XSearchBox
- `_type` / `_xtype`: `search`.
- Supported fields / props: `_value`, `_placeholder`, `_size`, `_disabled`, `_clearable`, `_icon`, `_autofocus`, `_input_id`, `class`.
- Required fields: none.
- Common usage pattern: table/list/sidebar filtering.
- Data binding support: no declarative source field; callbacks can report value.
- Event/action support: implementation has runtime `_on_input`, `_on_change`, and `_on_clear`; do not generate JavaScript functions in persisted JSON.
- CSS/class expectations: auto base class `xsearch`; modifier classes `xsearch--sm`, `xsearch--md`, `xsearch--disabled`; internal classes `xsearch__icon`, `xsearch__input`, `xsearch__clear`.
- Minimal JSON:
```json
{ "_type": "search", "_id": "api-key-search", "_placeholder": "Search API keys...", "_clearable": true, "_icon": true }
```

### XSelect
- `_type` / `_xtype`: `xselect`.
- Supported fields / props: `_value`, `_placeholder`, `_options`, `_size`, `_disabled`, `_name`, `_select_id`, `_on_change`, `class`.
- Option fields: `value`, `label`, `disabled`.
- Required fields: no required root fields; each option should include `value` and `label`.
- Common usage pattern: styled dashboard dropdown, filters, form choice controls. Wrap in `field` for label/hint/error.
- Data binding support: no source field; `_on_change` receives selected value as `$data`.
- Event/action support: `_on_change` can be a data-only command object; do not generate a JS function. Backward-compatible `_on.change` / `_on._change` is read by implementation but should not be generated for new views.
- CSS/class expectations: auto base class `xselect`; modifier classes `xselect--sm`, `xselect--md`, `xselect--disabled`; internal class `xselect__control`.
- Minimal JSON:
```json
{
  "_type": "xselect",
  "_id": "status-filter",
  "_placeholder": "Status",
  "_options": [
    { "value": "active", "label": "Active" },
    { "value": "revoked", "label": "Revoked" }
  ]
}
```

### XField
- `_type` / `_xtype`: `field`.
- Supported fields / props: `_label`, `_hint`, `_error`, `_required`, `_inline`, `_size`, `_control`, `class`, `_data_output`, `_update_data_source_event`.
- Required fields: none by constructor; use `_control` for a useful field.
- Common usage pattern: wrap a single form control with label, required marker, hint, or validation error.
- Data binding support: if field-level `_data_output` or `_update_data_source_event` exists and `_control` does not already define it, the field copies the value into `_control`.
- Event/action support: no component event; events belong to `_control`.
- CSS/class expectations: auto base class `xfield`; modifier classes `xfield--sm`, `xfield--md`, `xfield--inline`, `xfield--stack`, `xfield--error`; internal classes `xfield__label`, `xfield__required`, `xfield__control`, `xfield__hint`, `xfield__error`.
- Minimal JSON:
```json
{
  "_type": "field",
  "_id": "key-name-field",
  "_label": "Key name",
  "_required": true,
  "_control": {
    "_type": "text",
    "_id": "key-name-input",
    "placeholder": "Production key",
    "_data_output": "apiKeyForm.name"
  }
}
```

### XDrawer
- `_type` / `_xtype`: `drawer`.
- Supported fields / props: `_open`, `_side`, `_width`, `_title`, `_closable`, `_scroll`, `_elevated`, `_overlay`, `_children`, `class`.
- Required fields: none.
- Common usage pattern: side detail panel, filters, settings.
- Data binding support: none beyond children.
- Event/action support: close button is internally wired when `_closable` is true; implementation has runtime `_on_open` and `_on_close`; do not generate JS functions.
- CSS/class expectations: auto base class `xdrawer`; modifier classes `xdrawer--open`, `xdrawer--left`, `xdrawer--right`, `xdrawer--elevated`, `xdrawer--overlay`; width via `--xdrawer-width`.
- Minimal JSON:
```json
{ "_type": "drawer", "_id": "details-drawer", "_open": false, "_side": "right", "_width": "420px", "_title": "Details", "_children": [] }
```

### XSidebar
- `_type` / `_xtype`: `sidebar`.
- Supported fields / props: `_side`, `_width`, `_title`, `_subtitle`, `_logo`, `_actions`, `_nav`, `_scroll`, `_dividers`, `_footer`, `_collapsed`, `_children`, `class`.
- Required fields: none.
- Common usage pattern: persistent app navigation; use `_nav` with `navlist`.
- Data binding support: none beyond children.
- Event/action support: `_actions` and `_footer` accept child objects; implementation has runtime `_on_toggle` but only invokes it if it is a function, so do not generate it in persisted JSON.
- CSS/class expectations: auto base class `xsidebar`; modifier classes `xsidebar--left`, `xsidebar--right`, `xsidebar--collapsed`, `xsidebar--dividers`; width via `--xsidebar-width`; internal classes `xsidebar__header`, `xsidebar__body`, `xsidebar__footer`.
- Minimal JSON:
```json
{
  "_type": "sidebar",
  "_id": "admin-sidebar",
  "_title": "Xpell Dev Console",
  "_scroll": true,
  "_dividers": true,
  "_nav": {
    "_type": "navlist",
    "_items": [
      { "_label": "Overview", "_value": "overview" },
      { "_label": "API Keys", "_value": "api-keys" }
    ],
    "_active": "overview"
  }
}
```

### XSection
- `_type` / `_xtype`: `xsection`.
- Supported fields / props: `_title`, `_subtitle`, `_actions`, `_children`, `class`.
- Required fields: none.
- Common usage pattern: semantic page section with optional heading and actions.
- Data binding support: none beyond children.
- Event/action support: `_actions` accepts header child objects.
- CSS/class expectations: auto base class `xsection`; internal classes `xsection__container`, `xsection__header`, `xsection__title`, `xsection__subtitle`, `xsection__actions`, `xsection__body`. CSS contains variant/elevation/density classes, but no dedicated props for them.
- Minimal JSON:
```json
{
  "_type": "xsection",
  "_id": "api-keys-section",
  "_title": "API keys",
  "_children": [
    { "_type": "table", "_columns": [], "_rows": [] }
  ]
}
```

## Dependency Boundary
- Peer dependencies:
  - `@xpell/core` `^2.0.3`
  - `@xpell/ui` `^2.0.3`
- Source imports in exported components:
  - Runtime classes from `@xpell/ui`: `XUIObject`, `XUI`, `XObjectPack`, `_xd`.
  - No source import of `@xpell/node`.
- Build boundary:
  - `@xpell/ui` and `@xpell/core` are externalized in Rollup.
- Runtime shape:
  - Browser-oriented UI pack; no server module or transport API implementation in `src/`.
