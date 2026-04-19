# @xpell/3d API Map (code-derived)

## package.json exports map
```json
{
  ".": {
    "types": "./dist/index.d.ts",
    "import": "./dist/index.js",
    "require": "./dist/index.cjs",
    "default": "./dist/index.js"
  },
  "./package.json": "./package.json"
}
```

## Entrypoints and what they export
- Package root entrypoint: `src/index.ts` (built to `dist/index.js` / `dist/index.cjs`, types at `dist/index.d.ts`).
- Root value exports:
  - `X3D`, `X3DModule`
  - `X3DDefaultApp`, `X3DAppGenerator`
  - `X3DSceneBackgroundTypes`
  - `X3DObject`
  - `XGeometry`, `XGroup`, `XMaterial`, `XMesh`, `XCamera`, `XLight`
  - `X3DPrimitives`, `XBox`, `XCone`, `XCylinder`, `XPlane`, `XSphere`, `XTorus`, `XCircle`
  - `X3DWorld`, `XWorldStatus`
  - `X3DLoader`
- Root type exports:
  - `X3DApp`, `X3DSceneControl`, `X3DPhysicsEngines`, `X3DHelpers`, `X3AxesHelper`, `XHelperData`
  - `X3DSceneBackground`, `X3DSceneBackgroundHandler`, `X3DSceneBackgroundParams`
  - `IX3DObjectData`, `XVector3Data`, `X3DListener`
  - `XCameraTypes`, `XCameraData`, `XLightData`, `XLightTypes`
- Subpath exports:
  - Only `./package.json` is exported as a subpath.
  - No additional code subpath exports.

## Folder / subsystem map
- `src/index.ts`
  - Defines the full public package surface.
- `src/X3D/X3D.ts`
  - Module singleton/runtime bootstrap (`X3DModule`, exported singleton `X3D`), player element creation, world start, raycast integration.
- `src/X3D/X3DWorld.ts`
  - Scene orchestration, renderer/camera/control setup, object mount/remove, physics stepping, frame loop integration.
- `src/X3D/X3DObject.ts`
  - Base 3D object wrapper on `XObject`: state, three/cannon object management, canonical mutators, lifecycle hooks.
- `src/X3D/X3DCoreObjects.ts`
  - Core wrappers (`XCamera`, `XLight`, `XGeometry`, `XMaterial`, `XMesh`, `XGroup`) and three-class mapping tables.
- `src/X3D/X3DPrimitives.ts`
  - Primitive object classes (`XPlane`, `XBox`, `XSphere`, `XCylinder`, `XTorus`, `XCone`, `XCircle`, `XModel`) and `X3DPrimitives` object pack.
- `src/X3D/X3DNanoCommands.ts`
  - `_x3dobject_nano_commands` pack for object command ops (`rotation`, `position`, `scale`, etc.).
- `src/X3D/X3DLoader.ts`
  - Asset loading singleton with GLTF/FBX/DRACO and loader status writes to `_xd`.
- `src/X3D/X3DWorldSceneBackground.ts`
  - Scene background types and built-in background handlers.
- `src/X3D/X3DUtils.ts`
  - `CannonDebugRenderer`.

## Hot classes / singletons (exact names)
- Singletons:
  - `X3D` (instance of `X3DModule`)
  - `X3DLoader` (instance of `_X3DLoader`)
- Runtime classes:
  - `X3DModule`, `X3DWorld`, `X3DObject`, `X3DPrimitives`
  - `X3DAppGenerator`
- Core scene object classes:
  - `XCamera`, `XLight`, `XGeometry`, `XMaterial`, `XMesh`, `XGroup`
  - `XPlane`, `XBox`, `XSphere`, `XCylinder`, `XTorus`, `XCone`, `XCircle`

## three.js import expectations
- `three` is declared as a `peerDependency` (`^0.182.0`) and also present in `devDependencies` for local build/test.
- `cannon-es` and `three-to-cannon` are peer dependencies marked optional via `peerDependenciesMeta`.
- `@xpell/core` and `@xpell/ui` are peer dependencies.
- Source imports three.js directly from:
  - `three`
  - `three/examples/jsm/controls/*`
  - `three/examples/jsm/loaders/*`
- Runtime boundary is mixed:
  - many features are wrapped through X3D classes,
  - but `THREE` objects are also surfaced directly by public methods/fields (`getThreeObject`, `_threeSync`, world fields).
