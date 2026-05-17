---
name: Xpell Flow Manager Contract
id: xpell-flow-manager
version: 1.0.0
updated: 2026-05-11
description: Xpell Flow Manager contract for server flow execution and client flow triggering. Covers @xpell/node FlowManagerModule, @xpell/ui FlowManagerClient, flow JSON shape, runtime context, XData outputs, and UI-triggered flow execution.
requires:
  - xpell-contract
  - xpell-core
  - xpell-node
  - xpell-ui
  - xpell-xvm
---
## 1) Applies to / Scope
- Server runtime: `@xpell/node`, especially `FlowManagerModule` with module name `flow`.
- Client runtime: `@xpell/ui`, especially `FlowManagerClient` with module name `flow-client`.
- XVM storage: persisted flow JSON is owned by `server-xvm`.
- XUI/XVM integration: UI objects trigger flows through `ui:flow-trigger`.
Flow Manager owns orchestration only.
- Server `flow` loads persisted flow definitions and executes steps.
- Client `flow-client` sends flow trigger commands to the server and applies returned flow outputs into `_xd`.
- Flow definitions are data-only JSON. Do not persist functions.
## 2) Core Identity
A flow is a deterministic sequence of command steps.
FlowManager does not own:
- view rendering
- entity schema
- persistence files
- AI prompt generation
- browser DOM
- module internals
FlowManager must use module APIs through `_x.execute()` / Wormholes command sending.
## 3) Server Flow Contract
`FlowManagerModule` is an `XModule` with module name `flow`.
Primary op:
- `_run`
Caller op may be:

{
  "_module": "flow",
  "_op": "run",
  "_params": {
    "_app_id": "vibe-app",
    "_env": "default",
    "_flow_id": "greet-flow",
    "_event_payload": {}
  }
}

Server rules:

* _flow_id is required.
* _app_id is required.
* _env defaults to "default".
* Flow JSON is loaded from server-xvm.get_flow.
* Flow execution is sequential.
* Each step must contain _command._module and _command._op.
* Step command params are resolved before execution.
* Step execution must go through _x.execute().

4) Flow JSON Shape

Canonical persisted flow:

{
  "_id": "greet-flow",
  "_steps": [
    {
      "_id": "greet-user",
      "_command": {
        "_module": "xtest",
        "_op": "greet",
        "_params": {
          "name": "$event.name"
        }
      },
      "_output": {
        "_to": {
          "_type": "xdata",
          "_key": "greet.result"
        },
        "_value": "$step.greet-user._result.greeting"
      }
    }
  ]
}

Required:

* _id
* _steps
* step _command._module
* step _command._op

Optional:

* step _id
* step _command._params
* step _input
* step _output
* step _when

5) Runtime Context

Server flow context contains:

{
  event: event_payload,
  step_results: {}
}

Supported references:

* $event.path
* $xdata.key
* $step.step_id.path

Examples:

"name": "$event.name"
"user_id": "$step.create-user._result._record._id"
"title": "$xdata.page.title"

Rules:

* Do not infer missing values.
* Missing paths resolve to undefined.
* Use explicit paths only.

6) Step Input / Output

Step _input can read from XData:

"_input": {
  "name": {
    "_from": "xdata",
    "_key": "name"
  }
}

Step _output writes to flow outputs:

"_output": {
  "_to": {
    "_type": "xdata",
    "_key": "greet.result"
  },
  "_value": "$step.greet-user._result.greeting"
}

Server returns:

{
  "_flow": {
    "_outputs": {
      "greet.result": "Hello Tamir"
    },
    "_last": {}
  }
}

Client flow-client applies _flow._outputs into _xd.

7) Conditions

Step _when supports deterministic condition checks.

Examples:

"_when": {
  "_type": "event",
  "_key": "mode",
  "_equals": "create"
}
"_when": {
  "_type": "xdata",
  "_key": "user.logged_in",
  "_equals": true
}

Rules:

* Conditions are explicit.
* No inferred branching.
* No hidden fallback logic.

8) Client Flow Contract

FlowManagerClient is an XModule with module name flow-client.

Primary ops:

* _trigger
* _bind

Client listens to:

ui:flow-trigger

Trigger payload:

{
  _flow_id: string;
  _event_name?: string;
  _event_payload?: object;
  _app_id?: string;
  _env?: string;
  _source?: "ui" | "event";
}

Client behavior:

1. receive ui:flow-trigger
2. normalize payload
3. resolve _app_id / _env from payload or XVMClient
4. send Wormholes command to server:
    * _module: "flow"
    * _op: "run"
5. read returned _flow._outputs
6. write each output into _xd

9) UI Trigger Rules

XUI objects may trigger flows through _flow.

Example:

{
  "_type": "button",
  "_text": "Greet",
  "_flow": {
    "_id": "greet-flow",
    "_payload": {
      "name": "$xdata.name"
    }
  }
}

Rules:

* XUI emits ui:flow-trigger.
* flow-client sends the server command.
* Server flow executes the persisted flow.
* Returned outputs update _xd.
* UI labels can react with _data_source.

10) Event Binding Rules

Client flow bindings connect XEM events to flow execution.

{
  "_module": "flow-client",
  "_op": "bind",
  "_params": {
    "_flow_id": "some-flow",
    "_event": "some:event",
    "_app_id": "vibe-app",
    "_env": "default"
  }
}

Rules:

* Duplicate bindings are skipped.
* Events with _source: "ui" are not re-triggered as event flows.
* Event payload becomes _event_payload.

11) Hard Forbiddens

* Do not execute JavaScript from flow JSON.
* Do not persist functions in flow definitions.
* Do not bypass _x.execute() for server step execution.
* Do not let server-xvm execute flows.
* Do not let flow-client mutate server state directly.
* Do not infer missing $event, $step, or $xdata values.
* Do not write flow outputs directly to storage; outputs go to returned _flow._outputs, and client may mirror them into _xd.
* Do not treat _xd as persistence.

12) Working Procedure

When changing Flow Manager:

1. Decide whether the change is server flow, client flow-client, or cross-runtime.
2. Keep persisted flow JSON data-only.
3. Keep server execution deterministic and sequential.
4. Keep client trigger payload compatible with flow.run.
5. Keep output contract as _flow._outputs.
6. If changing payloads or output shape, update XVM/XUI integration docs too.

