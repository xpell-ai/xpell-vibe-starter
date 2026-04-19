# @xpell/3d Code Generation Checklist

## Mandatory gates
- [ ] Always obey `xpell-contract` + `xpell-core` invariants.
- [ ] Keep `@xpell/3d` deterministic: explicit mutation paths only (canonical setters / commands / explicit ops).
- [ ] Use `XData2` APIs (`_xd.get/_xd.set/_xd.delete`) with explicit keys; no hidden state mirrors.
- [ ] Use `XEM` (`_xem`) events for cross-object signaling; do not assume listener ordering.
- [ ] No `setInterval`/polling loops.
- [ ] No Node/server APIs unless the repository explicitly adds dual-runtime support.
- [ ] No server transport logic and no direct `XDB` usage.
- [ ] No hidden persistence.
- [ ] No UI/DOM behavior in `X3DObject` or core/base 3D object wrappers.

## API surface discipline
- [ ] Export only through `src/index.ts` unless package `exports` map is intentionally expanded.
- [ ] Do not document or depend on non-root exports as public API.
- [ ] Preserve existing root exports:
  - `X3D`, `X3DModule`, `X3DWorld`, `XWorldStatus`, `X3DLoader`
  - `X3DObject`, `X3DPrimitives`, primitives (`XBox`, `XCone`, `XCylinder`, `XPlane`, `XSphere`, `XTorus`, `XCircle`)
  - core wrappers (`XGeometry`, `XGroup`, `XMaterial`, `XMesh`, `XCamera`, `XLight`)
  - app/background symbols (`X3DDefaultApp`, `X3DAppGenerator`, `X3DSceneBackgroundTypes`)

## Object model checks
- [ ] For `X3DObject` changes, keep canonical setters (`setPosition`, `setRotation`, `setScale`) as single mutation source.
- [ ] Helper mutators must delegate to canonical setters.
- [ ] Avoid exposing additional mutable engine internals (`THREE`/`CANNON`) directly.
- [ ] If physics is enabled, keep three/cannon state synchronization explicit and auditable.

## XData2/XEM correctness checks
- [ ] XData controls keys: write canonical `x3d:control:*` keys only (`x3d:control:azimuth`, `x3d:control:target`).
- [ ] Never write legacy dash variants (`x3d:control-azimuth`, `x3d:control-target`).
- [ ] If legacy keys are encountered, normalize to canonical keys and stop using legacy keys.
- [ ] If adding keys/events, document producer and consumer in skill docs/API map.
- [ ] Remove one-shot control keys after consumption when required (existing pattern: control target).

## THREE boundary checks
- [ ] Never mutate `THREE` transforms directly from external runtime paths; use `X3DObject` setters or Nano-Commands.
- [ ] Direct `THREE` access is read-only for integration/debug/tooling unless explicitly reconciled through `X3DObject` setter APIs.
- [ ] If no reconciliation API path is available for a direct mutation case, treat that mutation path as forbidden.

## Performance and lifecycle checks
- [ ] Keep per-frame logic inside `onFrame` paths; avoid ad-hoc async loops.
- [ ] Dispose/release replaced geometries/resources where applicable.
- [ ] Keep physics stepping and debug behavior explicit.

## Final verification before merge
- [ ] Re-scan `src/` for forbidden APIs/patterns.
- [ ] Reconfirm package exports and root entrypoint alignment.
- [ ] Update `docs/SKILL.md` and `docs/SKILL_API_MAP.md` if public API or contracts changed.
