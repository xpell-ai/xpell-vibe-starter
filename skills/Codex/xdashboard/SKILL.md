---
name: XDashboard Contract
id: xdashboard
version: 1.1.0
updated: 2026-05-24
description: >
  Dashboard UI object pack for Xpell UI. Exposes XDashPack/XDashboardPack as the public API,
  registers dashboard-oriented XUIObject classes, ships a single CSS artifact,
  and supports runtime-generated skills through _x.getSkills().
requires:
  - xpell-contract
  - xpell-core
  - xpell-ui
---
## 1) Applies to / Scope
- Package: `@xpell/xdashboard`.
- Public entrypoint: `src/index.ts`.
- Public subpath export: `./xdashboard.css`.
- Scope of this contract:
  - `XDashPack`
  - `XDashboardPack`
  - objects registered in `XDashPack.getObjects()`
  - dashboard component skills generated through runtime skill sync.
- Non-scope:
  - local demo/test files
  - server modules
  - transport logic
  - app bootstrap templates
## 2) Core identity
- `@xpell/xdashboard` is a UI object pack.
- It registers dashboard components implemented as `XUIObject` subclasses.
- It is browser-oriented UI/runtime code.
- It is not a server package.
- It is not a data service.
- It is not a transport layer.
- It is not an app template entrypoint.
## 3) Public API
Root export:
```ts
export { XDashPack };
export { XDashPack as XDashboardPack };

CSS export:

import "@xpell/xdashboard/xdashboard.css";

Intended usage:

import { _x } from "@xpell/core";
import { XUI } from "@xpell/ui";
import { XDashPack } from "@xpell/xdashboard";
import "@xpell/xdashboard/xdashboard.css";
await _x.start();
await _x.loadModule(XUI);
await _x.loadObjectPack(XDashPack);

4) Authoritative registry

The authoritative dashboard registry is:

XDashPack.getObjects()

Documentation must not invent undocumented _type names.

Every registered component must obey:

static _xtype === XDashPack.getObjects() key === generated JSON _type

5) Registered dashboard object types

Current dashboard object types:

* card
* grid
* navlist
* badge
* table
* modal
* toast
* divider
* stack
* kpi-card
* scroll
* spacer
* toolbar
* empty
* igroup
* search
* xselect
* field
* drawer
* sidebar
* xsection

Important naming rules:

* Use xselect, not select, because XUI core may own native/core select behavior.
* Use xsection, not section, because XUI core / XHTML aliases may use section as an HTML tag.
* Do not generate names like x-card, x-grid, x-stack, or x-kpi-card.

6) Component construction pattern

Dashboard components should follow this pattern:

export class XSomething extends XUIObject {
  static _xtype = "something";
  static _skill: XpellSkill = {
    _id: "something",
    _type: "view-skill",
    _requires: ["xuiobject"]
  };
  constructor(data: XSomethingData) {
    const defaults = {
      _type: XSomething._xtype,
      class: "xsomething",
      _html_tag: "div"
    };
    super(data, defaults, true);
    this.parse(data);
  }
}

Common rules:

* Extend XUIObject.
* Use static _xtype.
* Keep _xtype, registry key, and skill _id aligned.
* Use super(data, defaults, true).
* Call this.parse(data).
* Use private __* fields for component-local runtime state.
* Keep component state explicit and synchronized through setters/methods.

7) Skills contract

Dashboard components should expose runtime skills using:

static _skill: XpellSkill

Runtime skill sync is the source of truth:

_x.getSkills()
→ xvibe.sync-skills
→ VibeKnowledgeSelector
→ prompt builder

Static KB JSON files are guidance-only and are not the source of truth.

Rules:

* Component skills describe only the component’s own fields and own behavior.
* Use _requires to point to inherited/base capabilities.
* Do not duplicate inherited fields or inherited nano commands.
* Object skills export only own nano commands.
* Inherited nano commands are resolved through _requires chains.
* _requires must point to skills available in the runtime skill registry.
* Runtime-generated skills should replace manual component lists where possible.

8) Data + state contract

Package-level shared state: none.

Component-local state:

* private __* fields are allowed.
* setters/methods must keep DOM/layout in sync.
* no hidden global state.
* no hidden shared state mirrors.

XData usage:

* Use explicit _data_source / _on_data only where implemented.
* XTable supports _data_source and _on_data.
* XTable may resolve _rows from an XData key.
* New components must not use _xd._o[...] for new writes.
* Do not use XData as persistence.

9) Events + handlers

Runtime/local handlers may support functions internally.

Persisted/generated Vibe JSON must be data-only.

Hard rule:

Persisted/generated XUI JSON MUST NOT contain JavaScript functions.

Allowed persisted handler forms:

{ "_op": "set-field", "_params": { "name": "_open", "value": true } }

or sequences:

[
  { "_op": "set-field", "_params": { "name": "_open", "value": true } },
  { "_op": "log", "_params": { "1": "opened" } }
]

Rules:

* For generated dashboards, use Nano-Commands v2 only.
* Do not generate function handlers such as _on_click: () => {}.
* Function handlers are allowed only for runtime-authored/internal component wiring.
* If a component interface contains _on_change, _on_input, _on_open, _on_close, _on_toggle, etc., these must not be exposed as JS functions in persisted/generated JSON.

10) Styling / theming

Styling is token-driven.

Use:

var(--x-*)

Prefer semantic dashboard fields:

_variant
_tone
_size
_density
_elevation
_theme

Avoid raw:

class
style

unless explicitly requested or required for a low-level escape hatch.

Rules:

* Component styles should be class-based and token-driven.
* Keep compatibility with bundled xdashboard.css.
* Do not generate Tailwind, Bootstrap, CSS files, or HTML documents for dashboard views.
* Prefer semantic fields and dashboard components over raw layout.

11) Layout guidance for Vibe

Preferred layout primitives:

* stack for simple vertical/horizontal layout.
* grid for responsive multi-column layouts.
* xsection for dashboard page sections.
* card for content summaries.
* kpi-card for metrics.
* toolbar for actions and filters.
* field for form controls.
* drawer, modal, toast for overlays/feedback.
* sidebar + navlist for navigation.

Guidance:

* Use _children arrays for composition.
* Prefer concrete XUI wrappers over xhtml when a wrapper exists.
* Use xhtml only for real HTML tags when no wrapper exists.
* Prefer grid._min_col_width for responsive dashboards.
* Prefer stack._gap over spacer for normal layout spacing.
* Use spacer only for intentional fixed blank space.

12) Performance rules

* No setInterval.
* No polling loops.
* No unbounded retries.
* Avoid setTimeout.
* If a one-shot timer is required, it must be bounded, cancelable, and documented.
* XToast auto-close should remain frame-driven through onFrame.
* Components should avoid re-entrant update loops.
* Data refresh should be explicit and event/data-driven.

13) Hard forbiddens

* Do not introduce new dashboard _type values without:
    * adding a class
    * setting static _xtype
    * registering it in XDashPack.getObjects()
    * adding/updating its skill
* Do not add React, Vue, Svelte, Angular, JSX, hooks, or virtual DOM.
* Do not add server/runtime transport logic.
* Do not add fetch/websocket/service layers inside dashboard components.
* Do not bypass XUIObject lifecycle with unmanaged DOM mutations.
* Do not persist JS functions in generated views.
* Do not generate raw HTML documents.
* Do not use Tailwind/Bootstrap as the layout system.
* Do not expose new public API symbols without updating src/index.ts and package exports.

14) Minimal JSON example

{
  "_type": "view",
  "_id": "main",
  "_theme": "dark",
  "_children": [
    {
      "_type": "sidebar",
      "_title": "Dashboard",
      "_nav": {
        "_type": "navlist",
        "_items": [
          { "_label": "Home", "_value": "home" },
          { "_label": "Reports", "_value": "reports" }
        ],
        "_active": "home"
      }
    },
    {
      "_type": "xsection",
      "_title": "Overview",
      "_subtitle": "Live business metrics",
      "_children": [
        {
          "_type": "grid",
          "_min_col_width": 240,
          "_gap": 16,
          "_children": [
            {
              "_type": "kpi-card",
              "_label": "Users",
              "_value": "1,204",
              "_delta": "+8%",
              "_delta_state": "up"
            },
            {
              "_type": "card",
              "_title": "Revenue",
              "_text": "$12,000"
            }
          ]
        }
      ]
    }
  ]
}