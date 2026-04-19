---
name: Server XVM Contract
id: server-xvm
version: 1.1.0
updated: 2026-04-19
description: >
  Feature skill for server-side XVM (persisted apps/views). Defines storage layout,
  app/view lifecycle ops, subscribe model, realtime update contract, and filesystem-backed
  persistence for starter and runtime-driven apps.
requires:
  - xpell-contract
  - xpell-core
  - xpell-node
---

# Applies on top of: xpell-contract + xpell-node

## Purpose

`server-xvm` is the server-side runtime for persisted XVM apps.

It owns:
- app metadata
- persisted views
- app/view loading on boot
- app creation
- view mutation
- entry-view metadata
- client subscription state
- realtime update fanout

It must remain a generic runtime module, not product-specific logic.

---

## Storage layout

- `work/xvm/apps/<env>/<app_id>/app.json`
- `work/xvm/apps/<env>/<app_id>/views/*.json`

---

## app.json shape

```json
{
  "_app_id": "vibe-app",
  "_env": "default",
  "_meta": {
    "_name": "Vibe App",
    "_version": 1,
    "_entry_view_id": "main",
    "_updated_at": "2026-04-19T12:00:00.000Z"
  },
  "_config": {}
}


⸻

View shape

Each view file must be persisted as:

{
  "_id": "main",
  "_type": "view",
  "_children": []
}

_id is mandatory and is the persisted view identity.

⸻

Transport context contract

Inbound commands may include server-injected context:
	•	xcmd._ctx._wid (required for realtime subscriber identity)
	•	xcmd._ctx._sid (optional)

_ctx is transport-owned and must never be trusted as client-authored business data.

Because _ctx is transport/runtime-specific, it may not exist on the base XCommand TypeScript type and may need local narrowing/casting inside modules.

⸻

Public methods

Methods follow Xpell command mapping:
	•	_create_app → callable as create_app or create-app
	•	_get_app → callable as get_app or get-app
	•	_subscribe → callable as subscribe
	•	_set_entry_view → callable as set_entry_view or set-entry-view
	•	_push_update → callable as push_update or push-update

Do not use _op_* naming for this module.

⸻

Minimal runtime contract

server-xvm:create_app

Creates a new app if it does not already exist.

Input:
	•	_app_id
	•	_env?
	•	_name?
	•	_entry_view_id?

Behavior:
	•	if app exists: return existing app and _created: false
	•	if app does not exist:
	•	create app bundle
	•	persist app.json
	•	initialize _views: {}
	•	return _created: true

Result:

{
  "_ok": true,
  "_app": {},
  "_created": true
}


⸻

server-xvm:get_app

Returns the full app bundle needed by the client runtime.

Input:
	•	_app_id
	•	_env?

Result:

{
  "_ok": true,
  "_app": {},
  "_views": {}
}

This is the primary bootstrap op for minimal clients.

⸻

server-xvm:subscribe

Registers a client transport target for realtime updates for one app scope.

Input:
	•	_app_id
	•	_env?

Context:
	•	requires xcmd._ctx._wid
	•	may also use xcmd._ctx._sid

Behavior:
	•	store subscriber under <env>::<app_id>
	•	multiple subscribers per app are allowed

Result:

{
  "_ok": true
}


⸻

server-xvm:set_entry_view

Updates app._meta._entry_view_id.

Input:
	•	_app_id
	•	_env?
	•	_view_id

Behavior:
	•	mutate app metadata only
	•	persist app.json

Result:

{
  "_ok": true
}


⸻

server-xvm:push_update

Creates or replaces a view in an existing app.

Input:
	•	_app_id
	•	_env?
	•	_view

Required:
	•	_view._id

Behavior:
	1.	normalize _view as persisted XVMView
	2.	store/update it in bundle
	3.	increment app._meta._version
	4.	update app._meta._updated_at
	5.	persist app.json
	6.	persist views/<view_id>.json
	7.	emit realtime update event to subscribers

Result:

{
  "_ok": true,
  "_view_id": "main",
  "_version": 2
}


⸻

Boot behavior

On init_on_boot():
	1.	ensure work/xvm/apps exists
	2.	scan all <env>/<app_id> folders
	3.	load app.json
	4.	load views/*.json
	5.	rebuild in-memory _apps
	6.	return counts:
	•	_apps_loaded
	•	_views_loaded

This makes the runtime persistent across restarts.

⸻

Realtime update contract

On push_update:
	1.	persist app/view changes
	2.	update app version
	3.	emit realtime event for subscribers of the same app scope

Recommended event name:
	•	"xvm:update"

Recommended payload:

{
  "_app_id": "vibe-app",
  "_env": "default",
  "_view_id": "main",
  "_view": {}
}

The event fanout should be scoped by:
	•	_app_id
	•	_env

Only subscribed clients should receive updates.

⸻

Persistence rules
	•	app.json is always persisted on app create and view update
	•	each view is persisted to its own file:
	•	views/<view_id>.json
	•	the views directory must be created automatically if missing
	•	app/view persistence is server-owned and must not be bypassed by product modules

⸻

Minimal validation rules

For the current starter/runtime version:
	•	_app_id must be non-empty string
	•	_env defaults to "default"
	•	_view must be an object
	•	_view._id must be non-empty string
	•	persisted views must be plain JSON-compatible objects

If stricter validation is added later, it should remain inside server-xvm, not in product modules.

⸻

Scope boundaries

server-xvm may own:
	•	app persistence
	•	view persistence
	•	realtime subscription registry
	•	app/view metadata

server-xvm must not own:
	•	onboarding UX
	•	chatbot flows
	•	admin product features
	•	tenant/product-specific business logic
	•	prompt generation logic

Those belong to product/server modules such as vibe.

⸻

Output format (when generating code)
	1.	Short explanation
	2.	Method signatures
	3.	Storage/persistence changes
	4.	Event/update contract
	5.	Minimal usage example

