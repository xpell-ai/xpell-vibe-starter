# @xpell/core Skill API Map

## 1. package.json exports map

Verbatim export keys:

- `"."`
- `"./package.json"`

Resolved values summary:

- `"."`
  - `types`: `./dist/index.d.ts`
  - `import`: `./dist/xpell-core.es.js`
  - `require`: `./dist/xpell-core.cjs.js`
- `"./package.json"` → `./package.json`

Related package entry fields:

- `main`: `./dist/xpell-core.cjs.js`
- `module`: `./dist/xpell-core.es.js`
- `types`: `./dist/index.d.ts`

## 2. Entrypoints and exports

### `src/index.ts`

- `export * from "./Xpell"`
- `export { default } from "./Xpell"`

### `src/Xpell.ts`

Public package surface re-exported by package root.

Engine:

- `XpellEngine`
- `Xpell`
- `_x`
- `XD_FRAME_NUMBER`
- `XD_FPS`

State:

- `XData`
- `_xd`
- `_XData`
- `type XDataStore`

Events:

- `XEventManager`
- `_xem`
- `_XEventManager`
- `setXEventManager`
- `getXEventManager`
- `XEventModule`
- `type XEventListener`
- `type XEventListenerOptions`
- `type XEventListenerId`

Modules and objects:

- `XModule`
- `type XModuleData`
- `XObject`
- `XObjectPack`
- `XObjectManager`
- `type XObjectData`
- `type XObjectOnEventIndex`
- `type XObjectOnEventHandler`
- `type XDataXporter`
- `type XDataXporterHandler`
- `type IXData`
- `type XValue`

Commands and parsing:

- `XParser`
- `XCommand`
- `type XCommandData`
- `type XNanoCommandPack`
- `type XNanoCommand`
- `XParams`

Utilities and runtime helpers:

- `XUtils`
- `_xu`
- `_XUtils`
- `setXRuntime`
- `getXRuntime`
- `type XFrameScheduler`
- `XLogger`
- `_xlog`
- `_XLogger`

Protocol and errors:

- `XError`
- `type XErrorOptions`
- `type XErrorLevel`
- `type XErrorMeta`
- `XResponse`
- `XResponseOK`
- `XResponseError`
- `type XResponseData`

## 3. Main subsystems

### `src/Xpell.ts`

Engine singleton and frame loop.

Responsibilities:

- module loading
- top-level command dispatch
- runtime start lifecycle
- frame loop / scheduler
- frame metrics keys

Important symbols:

- `XpellEngine`
- `Xpell`
- `_x`
- `XD_FRAME_NUMBER`
- `XD_FPS`

### `src/XRuntime.ts` or runtime accessor source

Runtime accessor injection.

Responsibilities:

- provide `setXRuntime(runtime)`
- provide `getXRuntime()`
- avoid direct singleton imports from low-level runtime objects
- prevent circular imports between `Xpell` and `XObject`

Important symbols:

- `setXRuntime`
- `getXRuntime`

### `src/XData.ts`

XData2 shared runtime memory.

Responsibilities:

- runtime key/value store
- change notifications
- namespaced runtime keys
- legacy `_o` compatibility proxy
- no persistence ownership

Important symbols:

- `XData`
- `_xd`
- `_XData`
- `type XDataStore`

Common API:

- `get`
- `set`
- `patch`
- `touch`
- `has`
- `delete`
- `pick`
- `on`
- `off`
- `onAny`
- `clean`

### `src/XDataModule.ts`

Command bridge over XData.

Responsibilities:

- expose XData operations as module commands
- support declarative handlers and flows
- keep XData itself pure and module-free

Important module name:

- `xd`

Common ops:

- `get`
- `set`
- `patch`
- `delete`
- `touch`
- `has`
- `pick`

### `src/XNanoCommands.ts`

Built-in object nano-commands.

Responsibilities:

- object-scoped data-only command handlers
- local command execution before module routing
- basic object field mutation and utility ops

Known built-ins include:

- `info`
- `log`
- `fire`
- `noop`
- field mutators
- `run-seq`

### `src/XEventManager.ts`

Process-wide event bus.

Responsibilities:

- listener registration
- one-time listeners
- listener ids
- owner cleanup
- event dispatch
- platform-neutral event coordination

Important symbols:

- `XEventManager`
- `_xem`
- `_XEventManager`
- `setXEventManager`
- `getXEventManager`
- `XEventModule`
- `type XEventListener`
- `type XEventListenerOptions`
- `type XEventListenerId`

### `src/XModule.ts`

Base module extension point.

Responsibilities:

- module identity
- object manager ownership
- op dispatch mapping
- object-targeted command routing

Important behavior:

- command `"my-op"` maps to method `"_my_op"`
- object-targeted commands require explicit `_object`

### `src/XObject.ts`

Base runtime object.

Responsibilities:

- lifecycle hooks
- event wiring
- data-source binding
- local nano-command execution
- module-routed command fallback through `getXRuntime()`
- JSON/XData export

Important constraints:

- no UI assumptions
- no DOM
- no server APIs
- no direct `_x` import

### `src/XObjectManager.ts`

Registry for object classes and module-owned objects.

Responsibilities:

- object type registration
- object creation
- live object lookup
- object removal/disposal coordination

### `src/XParser.ts` and `src/XCommand.ts`

Command parsing and command envelopes.

Responsibilities:

- parse text commands
- normalize command data
- support `_module`, `_op`, `_params`, `_object`

Important caveat:

- `XParser.xmlString2Xpell()` uses `DOMParser`, so it requires an environment that provides `DOMParser`.

### `src/XProtocol.ts` and `src/XError.ts`

Protocol response and structured errors.

Responsibilities:

- transport-safe response envelopes
- structured error handling
- success/error response helpers

Important symbols:

- `XResponse`
- `XResponseOK`
- `XResponseError`
- `XError`

### `src/XUtils.ts`, `src/XLogger.ts`, `src/XParams.ts`, `src/XConst.ts`

Runtime utilities.

Responsibilities:

- utility helpers
- AI/runtime primitive helpers
- logging facade
- parameter extraction
- shared constants
- reducing duplicated generated helper code

Important symbols:

- `XUtils`
- `_xu`
- `_XUtils`
- `XLogger`
- `_xlog`
- `_XLogger`
- `XParams`

Package root exports:

- `XUtils`
- `_xu`
- `_XUtils`

Preferred generated-code import:

```ts
import { _xu } from "@xpell/core";
```

`_xu` is the preferred singleton for generated code. Use it for existing runtime-safe helpers instead of recreating local utility functions.

`_XUtils` serves as the AI Primitive Layer for Xpell-generated code.

AI / runtime primitive helper groups:

Object / type helpers:

- `is_plain_object(value)`
- `is_non_empty_string(value)`
- `has_value(value)`
- `to_record(value)`
- `ensure_params(raw)`
- `ensure_object(value, "field_name")`

String validation:

- `ensure_string(value, "field_name")`
- `read_optional_string(value, "field_name")`
- `ensure_number(value, "field_name")`
- `read_optional_number(value, "field_name")`
- `ensure_boolean(value, "field_name")`
- `read_optional_boolean(value, "field_name")`

Prompt helpers:

- `normalize_prompt(prompt)` for preserving casing while normalizing spacing/unicode
- `normalize_prompt_key(prompt)` only for matching/search keys where lowercase normalization is safe

Array helpers:

- `ensure_array(value)`
- `compact_array(value, max_items)`
- `unique_strings(values)`
- `unique_normalized_ids(ids)`
- `normalize_id_array(value)`
- `ensure_object_array(value)`

JSON helpers:

- `safe_json_parse(value, fallback)`
- `safe_json_stringify(value, fallback)`
- `clone_json(value)`
- `compact_json(value, max_chars)`
- `compact_inline_json(value, max_chars)`
- `safe_compact_inline_json(value, max_chars)`

Path helpers:

- `get_path(obj, "a.b.c", fallback)`
- `set_path(obj, "a.b.c", value)`

Keyword helpers:

- `escape_regexp(value)`
- `matches_keyword(prompt, keyword)`
- `match_keywords(prompt, keywords)`
- `contains_keyword(prompt, keywords)`

Identifier helpers:

- `normalize_id(value)`
- `unique_normalized_ids(ids)`
- `normalize_id_array(value)`

## 4. Hot classes and singletons

Hot singletons:

- `_x` / `Xpell` → global engine instance
- `_xd` / `XData` → global runtime memory store
- `_xem` / `XEventManager` → global event bus
- `_xlog` / `XLogger` → logging facade
- `_xu` / `XUtils` → utility singleton

Hot base classes:

- `XModule` → behavior extension boundary
- `XObject` → base runtime object
- `XObjectManager` → module object/class registry
- `XCommand` → normalized command envelope
- `_XData` → implementation behind XData singleton
- `_XEventManager` → implementation behind XEM singleton
- `_XLogger` → implementation behind logger singleton
- `_XUtils` → implementation behind utils singleton

Hot runtime helpers:

- `setXRuntime`
- `getXRuntime`
- `setXEventManager`
- `getXEventManager`

## 5. Command shape reference

Canonical module command:

```json
{
  "_module": "module_name",
  "_op": "operation_name",
  "_params": {}
}

Object-targeted command:

{
  "_module": "module_name",
  "_op": "operation_name",
  "_object": "object_id",
  "_params": {}
}

XData command bridge example:

{
  "_module": "xd",
  "_op": "set",
  "_params": {
    "key": "ui:status",
    "value": "ready",
    "source": "example"
  }
}

XEM command bridge example:

{
  "_module": "xem",
  "_op": "fire",
  "_params": {
    "event": "vibe:prompt:send",
    "data": {
      "source": "vibe-editor"
    }
  }
}

6. Maintainer notes

Code-vs-doc reality:
	•	docs/nano-commands2.md states “no run-seq nano command”, but src/XNanoCommands.ts currently implements "run-seq".
	•	Data-only handlers are required for persisted views/flows/entities.
	•	XObject may still accept function handlers for runtime/dev use, but functions must not be persisted or generated into agent-editable payloads.
	•	If docs and source disagree, follow source code and record the mismatch.

Layer notes:
	•	DOM/browser event adaptation belongs in @xpell/ui, not @xpell/core.
	•	Node/transport/filesystem behavior belongs in @xpell/node, not @xpell/core.
	•	3D/spatial behavior belongs in @xpell/3d, not @xpell/core.
