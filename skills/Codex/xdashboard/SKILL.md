---
name: XDashboard Contract
id: xdashboard
version: 1.2.0
updated: 2026-06-22
description: >
  Dashboard UI object pack for Xpell UI. Use this skill when generating or
  editing XUI JSON views that should use @xpell/xdashboard semantic objects,
  especially admin dashboards such as the Xpell Dev Console.
requires:
  - xpell-contract
  - xpell-core
  - xpell-ui
---

## Applies To / Scope
- Package: `@xpell/xdashboard`.
- Public entrypoint: `src/index.ts`.
- Public CSS export: `@xpell/xdashboard/xdashboard.css`.
- Public objects are registered by `XDashPack.getObjects()` in `src/xcomp.ts`.
- Root import exports only `XDashPack` and `XDashboardPack`.
- This skill is for generated XUI dashboard JSON, component docs, and xdashboard code changes.

## When To Use XDashboard
Use `@xpell/xdashboard` when a generated XUI view is a dashboard, console, admin panel, data management surface, settings view, usage/billing screen, API key screen, model/provider management screen, or any workflow that needs structured navigation, sections, KPI metrics, tables, filters, form fields, overlays, or feedback.

Do not build admin dashboards from generic `view`, `stack`, `xhtml`, or raw styled objects when an xdashboard semantic object exists. Use generic layout only when there is no matching dashboard object.

Recommended mapping:
- `sidebar`: app menu / navigation.
- `xsection`: page sections.
- `card`: panels, forms, grouped content.
- `kpi-card`: metrics such as requests, tokens, credits, provider cost.
- `table`: API keys, usage events, model prices.
- `field`: form field wrapper.
- `igroup`: grouped form/filter rows.
- `toolbar`: navbars and action rows.
- `badge`: status labels.
- `divider`: visual separation.
- `empty`: no data yet.
- `toast`: feedback.
- `scroll`: long dashboard content.

## Preferred Dashboard Layout
For admin dashboards, prefer this composition:

1. A root `view` or app shell that owns the page layout.
2. A persistent `sidebar` with a `navlist` for app navigation.
3. A main content region with a top `toolbar`.
4. A `scroll` container for long content.
5. One or more `xsection` objects for page sections.
6. A responsive `grid` with `_min_col_width` for KPI rows and card groups.
7. `card`, `kpi-card`, `table`, `field`, and `igroup` inside sections.
8. `drawer`, `modal`, and `toast` only for secondary panels, focused dialogs, and feedback.

Use `_children` for composition. Prefer `grid._min_col_width` for responsive dashboards. Prefer `stack._gap`, `grid._gap`, `toolbar._gap`, and `igroup._gap` over fixed `spacer` objects for normal spacing.

## Component Selection Guide
- Navigation shell: `sidebar` with `_nav: { _type: "navlist" }`.
- Page grouping: `xsection`, not generic `view`, when the content has a section title/actions.
- Panel or grouped content: `card`.
- Metrics: `kpi-card`.
- Tabular records: `table`.
- Status/counters: `badge`.
- Forms: `field` around one control; `igroup` for related controls.
- Search/filter control: `search` and `xselect`.
- Action/filter row: `toolbar`.
- Overflow content: `scroll`.
- No records/results: `empty`.
- Side detail/settings panel: `drawer`.
- Confirmation/form overlay: `modal`.
- Save/error feedback: `toast`.
- Separation: `divider`.
- Simple flex grouping: `stack`.
- Intentional fixed blank space only: `spacer`.

## Authoritative Type Names
The runtime `_type` must equal the class `static _xtype` and the registry key in `XDashPack.getObjects()`.

Current registered `_type` values:
- `card`
- `grid`
- `navlist`
- `badge`
- `table`
- `modal`
- `toast`
- `divider`
- `stack`
- `kpi-card`
- `scroll`
- `spacer`
- `toolbar`
- `empty`
- `igroup`
- `search`
- `xselect`
- `field`
- `drawer`
- `sidebar`
- `xsection`

Important naming rules:
- Use `_type: "xselect"`, not `select`, for xdashboard styled selects.
- Use `_type: "xsection"`, not `section`, for xdashboard sections.
- Use `_type: "empty"`, not `empty-state`.
- Use `_type: "igroup"`, not `input-group`.
- Do not generate names like `x-card`, `x-grid`, `x-stack`, or `x-kpi-card`.

## Styling Rules
Import the bundled stylesheet once:

```ts
import "@xpell/xdashboard/xdashboard.css";
```

Use existing classes and component props from the app CSS. Do not generate huge inline style-sheet objects unless explicitly requested. Small `style` values are acceptable when the implementation supports a CSS variable or size field such as `_width`, `_max_height`, `_max_width`, `_gap`, `_top`, `_length`, `_inset`, `_cols`, or `_min_col_width`.

Each component applies its base CSS class automatically, for example `xcard`, `xgrid`, `xtable`, `xfield`, `xsidebar`, and `xsection`. Add `class` only for existing app-specific classes or documented CSS variants. Do not invent a parallel design system, Tailwind classes, Bootstrap classes, or raw HTML documents.

## Data Binding And Events
- `table` supports `_data_source`, `_rows` as an array, and `_rows` as an XData key. It also has `_on_data`.
- `field` can pass `_data_output` and `_update_data_source_event` from the field object to its `_control` when the control does not already define them.
- `xselect` supports `_on_change`; generated/persisted JSON should use a data-only command object, not a JavaScript function. The selected value is passed as `$data` by implementation.
- `search`, `navlist`, `modal`, `toast`, `drawer`, and `sidebar` have runtime callback fields in TypeScript, but generated/persisted JSON must not contain JavaScript functions.
- Action-bearing fields such as `_actions`, `_action`, table action columns, and `_footer` accept child XUI objects. Prefer `_id` on interactive objects so client logic can address them.

For generated dashboards:
- Do not invent client ops.
- Do not invent handler names.
- Do not generate JavaScript functions.
- Preserve existing `_data_source`, `_rows`, `_data_output`, `_on_data`, and other bindings when editing views.
- Use Nano-Commands/data-only handlers only when the target runtime already supports the op.

## Anti-Hallucination Rules
- Do not invent fields not supported by the implementation.
- Do not invent `_type` names.
- Do not invent `_xtype` names.
- Do not invent client ops.
- Do not rename `xselect` to `select` or `xsection` to `section`.
- Do not turn implementation-only callbacks into persisted JavaScript.
- Do not replace semantic xdashboard objects with generic `view` or `stack` when a semantic object exists.
- Do not remove or rewrite data sources and bindings unless the user explicitly asks.
- Prefer `_id` on interactive objects, tables, forms, drawers, modals, toasts, and navigation objects.

## Xpell Dev Console Notes
- API key table data source: `xai:keys`.
- API key creation op: `xai-router-client.create-api-key`.
- Auth user data source: `auth:user`.
- Admin-only features should be hidden or gated by client logic.
- Use `kpi-card` for requests, tokens, credits, and provider cost.
- Use `table` for API keys, usage events, and model prices.
- Use `field` and `xselect` inside `card` or `modal` for create/edit forms.

## Canonical Admin Dashboard Skeleton
```json
{
  "_type": "view",
  "_id": "xdev-console-shell",
  "class": "xdev-console-shell",
  "_children": [
    {
      "_type": "sidebar",
      "_id": "xdev-sidebar",
      "_title": "Xpell Dev Console",
      "_subtitle": "Admin",
      "_scroll": true,
      "_dividers": true,
      "_nav": {
        "_type": "navlist",
        "_id": "xdev-nav",
        "_active": "api-keys",
        "_items": [
          { "_label": "Overview", "_value": "overview" },
          { "_label": "API Keys", "_value": "api-keys" },
          { "_label": "Usage", "_value": "usage" },
          { "_label": "Model Prices", "_value": "model-prices" }
        ]
      }
    },
    {
      "_type": "scroll",
      "_id": "xdev-main-scroll",
      "_direction": "vertical",
      "_grow": true,
      "_children": [
        {
          "_type": "toolbar",
          "_id": "xdev-topbar",
          "_justify": "space-between",
          "_align": "center",
          "_children": [
            { "_type": "label", "_text": "API Keys" },
            {
              "_type": "button",
              "_id": "create-api-key-button",
              "_text": "Create key"
            }
          ]
        },
        {
          "_type": "xsection",
          "_id": "usage-summary-section",
          "_title": "Usage summary",
          "_children": [
            {
              "_type": "grid",
              "_id": "usage-kpis",
              "_min_col_width": 220,
              "_gap": 16,
              "_children": [
                {
                  "_type": "kpi-card",
                  "_id": "requests-kpi",
                  "_label": "Requests",
                  "_value": "0",
                  "_delta_state": "flat"
                },
                {
                  "_type": "kpi-card",
                  "_id": "tokens-kpi",
                  "_label": "Tokens",
                  "_value": "0",
                  "_delta_state": "flat"
                },
                {
                  "_type": "kpi-card",
                  "_id": "credits-kpi",
                  "_label": "Credits",
                  "_value": "0",
                  "_delta_state": "flat"
                },
                {
                  "_type": "kpi-card",
                  "_id": "provider-cost-kpi",
                  "_label": "Provider cost",
                  "_value": "$0.00",
                  "_delta_state": "flat"
                }
              ]
            }
          ]
        },
        {
          "_type": "xsection",
          "_id": "api-keys-section",
          "_title": "API keys",
          "_actions": [
            {
              "_type": "badge",
              "_id": "api-key-status-badge",
              "_text": "Admin",
              "_variant": "info"
            }
          ],
          "_children": [
            {
              "_type": "card",
              "_id": "create-api-key-card",
              "_title": "Create key",
              "_text": "Generate a scoped API key for this workspace.",
              "_hide_image": true,
              "_actions": [
                {
                  "_type": "button",
                  "_id": "create-api-key-action",
                  "_text": "Create key"
                }
              ]
            },
            {
              "_type": "field",
              "_id": "api-key-name-field",
              "_label": "Key name",
              "_required": true,
              "_control": {
                "_type": "text",
                "_id": "api-key-name-input",
                "placeholder": "Production key",
                "_data_output": "apiKeyForm.name"
              }
            },
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
          ]
        }
      ]
    }
  ]
}
```

Wire the create action to `xai-router-client.create-api-key` only in client logic that already supports that op. Do not invent an `_on_click`, `_client_op`, or `_flow` shape unless the project already uses it.

## References
- Component field map: `SKILL_API_MAP.md`.
- Generation checklist: `SKILL_CHECKLIST.md`.
