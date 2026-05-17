---
name: Xpell 3D Contract
id: xpell-3d
version: 1.0.0
updated: 2026-02-26
description: >
  Spatial runtime layer for Xpell 2 built on three.js. Defines the @xpell/3d execution model,
  object/scene contracts, and integration rules with Xpell Core (XData2, XEM, Nano-Commands).
requires:
  - xpell-contract
  - xpell-core
---

## 1) Applies to / Scope
- Package: `@xpell/3d` (`package.json` name `@xpell/3d`, version `2.0.0-alpha.1`).
- Source scope scanned: `src/index.ts` and all modules under `src/X3D/`.
- Build entrypoint: `src/index.ts` (via Vite lib build), runtime entry files emitted to `dist/index.js` and `dist/index.cjs`.

## 2) Core identity (what @xpell/3d is and is not)
- `@xpell/3d` is a browser-oriented 3D runtime layer built on `three`, optional `cannon-es` physics, and `@xpell/ui` runtime primitives (`XModule`, `XObject`, `_xd`, `_xem`).
- It provides:
  - world bootstrap and render orchestration (`X3DModule`, `X3DWorld`)
  - scene/object wrappers (`X3DObject`, `XMesh`, `XCamera`, `XLight`, primitives)
  - asset loading (`X3DLoader`)
  - background handlers (`X3DWorldSceneBackground`)
  - nano-command pack for 3D mutations (`_x3dobject_nano_commands`, attached by `X3DObject`)
- It is not a server transport or persistence layer: no `XDB` usage and no network server stack in `src/`.
- Current code is not "no-DOM": `X3DModule` and background handlers intentionally use `document`/`window` for player mount, resize/raycast listeners, canvas/video backgrounds.

## 3) Public API overview
- Public API is defined by `src/index.ts` and exported at package root (`"."` export).
- Exported values:
  - `X3D`, `X3DModule`
  - `X3DDefaultApp`, `X3DAppGenerator`
  - `X3DSceneBackgroundTypes`
  - `X3DObject`
  - `XGeometry`, `XGroup`, `XMaterial`, `XMesh`, `XCamera`, `XLight`
  - `X3DPrimitives`, `XBox`, `XCone`, `XCylinder`, `XPlane`, `XSphere`, `XTorus`, `XCircle`
  - `X3DWorld`, `XWorldStatus`
  - `X3DLoader`
- Exported types:
  - `X3DApp`, `X3DSceneControl`, `X3DPhysicsEngines`, `X3DHelpers`, `X3AxesHelper`, `XHelperData`
  - `X3DSceneBackground`, `X3DSceneBackgroundHandler`, `X3DSceneBackgroundParams`
  - `IX3DObjectData`, `XVector3Data`, `X3DListener`
  - `XCameraTypes`, `XCameraData`, `XLightData`, `XLightTypes`
- Not exported from package root: `XModel`, `X3DEngineStatus`, `_X3DLoader`, `X3DNanoCommands` symbol.

## 4) Object model contract (X3DObject / scene graph types — use exact names from code)
- Base object type: `X3DObject extends XObject`.
- Encapsulation behavior in code:
  - Internal runtime refs are private fields (`__three_obj`, `__cannon_obj`, `__cannon_shape`).
  - Public snapshots are value copies for `_position`, `_rotation`, `_scale`.
  - Direct three exposure still exists via `_threeSync` getter and `getThreeObject()`.
- Canonical mutation APIs on `X3DObject`:
  - `setPosition`, `setRotation`, `setScale`
  - helper mutators: `setPositionFromVector3`, `setRotationFromEuler`, `setScaleFromVector3`, `setPositionXYZ`, `translate`, `rotate`, `scaleBy`
  - helpers delegate to canonical setters.
- Scene graph wrapper classes:
  - `XGeometry`, `XMaterial`, `XMesh`, `XGroup`
  - `XCamera` (camera wrapper), `XLight` (light wrapper)
  - primitives: `XPlane`, `XBox`, `XSphere`, `XCylinder`, `XTorus`, `XCone`, `XCircle`
  - data-only model wrapper class exists internally: `XModel` (`_type: "xmodel"`) but is not root-exported.

## 5) Scene/player bootstrap contract (use exact names from code)
- `X3DModule`:
  - constructs module with name `"x3d"`, imports `X3DPrimitives`, writes `_xd.set("x3d-om", this._object_manager)`, fires `_xem.fire("x3d:init")`
  - `createPlayer(...)` creates and appends HTML `<div>` player
  - `loadDefaultApp(...)` uses `X3DAppGenerator.getDefaultApp(...)`
  - `loadApp(...)` instantiates `X3DWorld`, wires resize, optional raycast enable, and optional auto-start
  - `start()` runs world and fires `_xem.fire("x3d:world:load")`
- `X3DWorld`:
  - builds `THREE.Scene`, `THREE.WebGLRenderer`, `THREE.Raycaster`, optional `CANNON.World`
  - `run()` mounts renderer to `_parent_element`, loads helpers/cameras/lights/objects/controls/background, then renders
  - world object lifecycle through `addX3DObject` and `removeX3DObject`
  - per-frame via `onFrame(frameNumber)` (called from module `onFrame`)
- App schema object: `X3DApp` and default template `X3DDefaultApp`.

## 6) XData2 integration rules (explicit keys, no hidden mirrors)
- Source-proven keys:
  - `x3d-om` (set by `X3DModule` constructor)
  - `x3d:loader` (status object set by `X3DLoader`)
  - `x3d:transform:mode` (read in transform-controls mode handler)
  - `x3d:control:azimuth` (set by `X3DWorld.onFrame`)
  - `x3d:control:target` (read/delete by `X3DWorld.onFrame`)
  - `x3d:cam:path:pos` (read by `X3DWorld.onFrame`)
  - `x3d:joy-move` (read by `follow-joystick` command)
  - `x3d:control-azimuth` (read by `follow-joystick`)
  - `x3d:control-target` (set by `follow-joystick`)
  - `x3d:joystick-vector`, `x3d:joystick-position` (set by `follow-joystick`)
- Contract requirements for new code:
  - Use `_xd.get/_xd.set/_xd.delete` only; do not add hidden object mirrors.
  - Keep key naming stable and namespaced.

### Canonical XData keys (no duplicates)
- `@xpell/3d` MUST use one canonical key scheme for each semantic.
- Canonical control keys:
  - `x3d:control:azimuth`
  - `x3d:control:target`
- Legacy control keys:
  - `x3d:control-azimuth`
  - `x3d:control-target`
- Repository reality: both forms are currently used (`X3DWorld` uses canonical keys; `X3DNanoCommands` reads/writes legacy dash keys).
- Backward-compatibility rule:
  - Readers MAY accept legacy keys for a transition period.
  - Writers MUST write canonical keys only.
  - If legacy keys are detected at runtime, normalize explicitly to canonical keys and stop using legacy keys.
- Explicit normalization rule:
  - If `_xd.get("x3d:control-azimuth")` exists, write `_xd.set("x3d:control:azimuth", value)` and `_xd.delete("x3d:control-azimuth")`.
  - If `_xd.get("x3d:control-target")` exists, write `_xd.set("x3d:control:target", value)` and `_xd.delete("x3d:control-target")`.
- Verified ambiguity in current code:
  - `x3d:control:azimuth` vs `x3d:control-azimuth`
  - `x3d:control:target` vs `x3d:control-target`

## 7) Events (XEM) integration rules
- Source-proven XEM usage:
  - `_xem.fire("x3d:init")` on module construction
  - `_xem.fire("x3d:world:load")` after `start()`
  - `_xem.on("xtransform-controls-state-changed", ...)` in world transform-controls setup
- Contract requirements:
  - Use explicit event names and payloads.
  - Do not rely on listener ordering; write handlers as order-independent.

## 8) Command / mutation model (Nano-Commands if present; otherwise explicit ops contract)
- Nano-commands are present and attached in `X3DObject.init()` from `_x3dobject_nano_commands`.
- Provided ops in `_x3dobject_nano_commands`:
  - `rotation`, `position`, `scale`, `spin`, `stop`, `follow-joystick`, `orbit`
- Mutation pattern in commands:
  - commands read object snapshot (`_position`, `_rotation`, `getScaleData`) and commit through canonical setters.
- Additional command in `XLight`: `rotate-color`.
- TransformControls synchronization commits through setter helpers (`setPositionFromVector3`, `setRotationFromEuler`, `setScaleFromVector3`).
- Unknown (not provable from this repo alone):
  - cross-package Nano-Command validation/allowlist boundary is implemented in `@xpell/ui`/core runtime, not in this repository.

## 9) three.js boundary rules (what may be used directly vs wrapped)
- Wrapped-by-default layers:
  - scene objects are expected to be `X3DObject` derivatives (`XMesh`, `XCamera`, `XLight`, primitives).
  - geometry/material/camera/light constructors are selected from internal maps (`threeGeometries`, `threeMaterials`, `threeCameras`, `threeLights`).
- Direct three.js exposure (currently allowed by code):
  - `X3DObject.getThreeObject()` returns `THREE.Object3D | Promise<THREE.Object3D> | null`
  - `X3DObject._threeSync` exposes `THREE.Object3D | null`
  - `X3DWorld` public fields expose `scene`, `renderer`, `raycaster`, `defaultCamera`, `controls`.
  - helper mutators accept `THREE.Vector3` and `THREE.Euler`.
- `three/examples/jsm/*` usage is part of runtime boundary:
  - controls: `OrbitControls`, `FirstPersonControls`, `PointerLockControls`, `TransformControls`
  - loaders: `GLTFLoader`, `FBXLoader`, `DRACOLoader`, `RGBELoader`

### THREE mutation policy (deterministic boundary)
- Current boundary is mixed: wrapper classes exist, and raw `THREE` objects are also publicly reachable (`getThreeObject`, `_threeSync`, `X3DWorld` fields).
- Preferred mutation path:
  - mutate transforms through `X3DObject` canonical setters (`setPosition`, `setRotation`, `setScale`)
  - or via Nano-Commands that route through these setters.
- Allowed exception:
  - direct `THREE` access for read-only integration/debug/tooling.
- Forbidden:
  - direct external mutation of `THREE` transform fields (`position`, `rotation`, `scale`) that bypasses canonical setter flow.
- Exception reconciliation rule:
  - if direct mutation is unavoidable and an `X3DObject` reference is available, immediately reconcile via `setPositionFromVector3`, `setRotationFromEuler`, and `setScaleFromVector3` (or canonical setters) on that same `X3DObject`.
  - unknown: if only a raw `THREE.Object3D` is available and no `X3DObject` reference exists, no public reconciliation API is proven in this repository; treat the mutation as forbidden.
- Examples of forbidden direct mutations:
  - mutating `object.getThreeObject().position` directly from external code without a setter reconciliation call.
  - assigning `rotation`/`scale` on exposed `_threeSync` from external runtime code.
  - writing to `X3DWorld.scene` child transforms directly as a persistent state path.

## 10) Performance rules (only if proven by code; otherwise “unknown”)
- Proven in source:
  - physics stepping is fixed at `1/60` (`CWORLD_STEP`).
  - loader optionally traverses loaded GLTF scene and sets `node.frustumCulled = false`.
  - no `setInterval`/`setTimeout`/`requestAnimationFrame` usage exists in `src/`; frame progression is delegated to module/world `onFrame`.
- Unknown:
  - formal frame budget/SLA policies
  - batching/instancing constraints
  - memory/texture lifecycle limits beyond object `dispose()` and geometry replacement disposal.

## 11) Hard forbiddens
- Do not add Node-only APIs (`fs`, `child_process`, etc.) to runtime paths; current source is browser-first and uses DOM APIs.
- Do not add server transport logic in `@xpell/3d`.
- Do not add direct `XDB` usage.
- Do not introduce polling loops (`setInterval`/manual polling).
- Do not introduce a second XData key for the same semantic; extend schema under the same namespace.
- Do not add hidden persistence/state mirrors outside explicit `_xd` keys.
- Do not add UI/DOM behavior inside base object wrappers (`X3DObject`, `XMesh`, `XCamera`, `XLight`, primitives).
- Do not mutate `THREE`/`CANNON` runtime state through ad-hoc side channels when canonical setters/commands exist.

## 12) Minimal usage examples (2 short snippets, using real exported APIs only)
```ts
import { X3D, X3DAppGenerator } from "@xpell/3d";

const app = X3DAppGenerator.getDefaultApp(true, "black", false);
X3D.createPlayer("x3d-player");
await X3D.loadApp(app, true);
```

```ts
import { X3D, XBox } from "@xpell/3d";

const box = new XBox({ _id: "box-1", _type: "box", _position: { x: 0, y: 1, z: 0 } });
await X3D.add(box);
box.setPosition({ x: 2, y: 1, z: 0 });
await box.execute({ _op: "rotation", _params: { y: "++0.01" } });
```
