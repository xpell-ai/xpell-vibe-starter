# XDashboard API Map (Code-Derived)

## package.json export map
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

## Entrypoints and exports
- `src/index.ts`
  - Side effect: `import "./style/style.css";`
  - Exports:
    - `XDashPack`
    - `XDashboardPack` (alias to `XDashPack`)
- `src/xcomp.ts`
  - Declares `XDashPack extends XObjectPack`.
  - `XDashPack.getObjects()` returns the registered `_type -> class` map.

## Public symbols (root import)
- `XDashPack`
- `XDashboardPack`

No other component classes/types are re-exported from `src/index.ts`.

## Registered dashboard classes (`XDashPack.getObjects()`)
- `XCard` (`card`)
- `XGrid` (`grid`)
- `XNavList` (`navlist`)
- `XBadge` (`badge`)
- `XTable` (`table`)
- `XModal` (`modal`)
- `XToast` (`toast`)
- `XDivider` (`divider`)
- `XStack` (`stack`)
- `XKpiCard` (`kpi-card`)
- `XScroll` (`scroll`)
- `XSpacer` (`spacer`)
- `XToolbar` (`toolbar`)
- `XEmptyState` (`empty`)
- `XInputGroup` (`igroup`)
- `XSearchBox` (`search`)
- `XSelect` (`select`)
- `XField` (`field`)
- `XDrawer` (`drawer`)
- `XSidebar` (`sidebar`)
- `XSection` (`section`)

## Folder / subsystem map
- `src/index.ts`
  - Package entrypoint and export surface.
- `src/xcomp.ts`
  - Pack registry (`XDashPack`) and authoritative object registration.
- `src/x*.ts` (component classes)
  - Dashboard UI objects (layout, data display, forms, overlays, navigation).
- `src/style/*.css`
  - Tokens and component styles; bundled into one CSS output.
- `src/xsimp.ts`, `src/xtest.ts`
  - Local playground/test-style scripts; not exported via package entrypoint.
- `dist/`
  - Built JS/CSS and generated type declarations.

## Main classes/components/widgets
- Pack: `XDashPack`
- Layout/container primitives: `XGrid`, `XStack`, `XScroll`, `XSpacer`, `XDivider`, `XSection`, `XToolbar`, `XSidebar`, `XDrawer`, `XModal`
- Data/display: `XCard`, `XKpiCard`, `XTable`, `XBadge`, `XEmptyState`, `XToast`
- Inputs/navigation: `XSearchBox`, `XSelect`, `XField`, `XInputGroup`, `XNavList`

## Dependency boundary
- Peer dependencies:
  - `@xpell/core` (`>=2.0.0-alpha`)
  - `@xpell/ui` (`>=2.0.0-alpha`)
- Source imports in exported components:
  - Runtime classes are imported from `@xpell/ui` (`XUIObject`, `XUI`, `XObjectPack`, `_xd`).
  - No source import of `@xpell/node`.
- Build boundary (`vite.config.ts`):
  - `@xpell/ui` and `@xpell/core` are externalized in Rollup.
- Runtime shape:
  - Browser-oriented UI pack; no server module or transport API implementation in `src/`.
