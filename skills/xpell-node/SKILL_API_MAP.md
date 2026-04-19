# @xpell/node API Map (Code-Derived)

## Package Entry Points
- Package name: `@xpell/node`
- Version: `2.0.0-alpha.10`
- Type: `module` (ESM)
- Entrypoints:
  - `main`: `./dist/index.js`
  - `module`: `./dist/index.js`
  - `types`: `./dist/index.d.ts`
- `exports` map: **not present** in `package.json`.

## Dependency Notes
- `peerDependencies`:
  - `@xpell/core: ^2.0.0-alpha`
- `dependencies` (runtime):
  - `express`, `express-sslify`, `better-sqlite3`, `mongoose`, `bcryptjs`

## Full Top-Level Export Surface (`src/index.ts`)

### Core Type Exports (from `@xpell/core`)
- `XValue`
- `IXData`
- `XObjectData`
- `XDataXporter`
- `XDataXporterHandler`
- `XObjectOnEventIndex`
- `XObjectOnEventHandler`
- `XEventListener`
- `XNanoCommandPack`
- `XNanoCommand`
- `XCommandData`
- `XModuleData`
- `XErrorOptions`
- `XErrorLevel`
- `XErrorMeta`
- `XResponseData`

### Core Runtime Exports (from `@xpell/core`)
- default export (`@xpell/core` default)
- `Xpell`, `_x`
- `XData`, `_xd`, `_XData`
- `XParser`
- `XCommand`
- `XLogger`, `_xlog`, `_XLogger`
- `XModule`
- `XObject`, `XObjectPack`
- `XObjectManager`
- `XParams`
- `XError`
- `XD_FRAME_NUMBER`, `XD_FPS`
- `XpellEngine`
- `XResponse`, `XResponseOK`, `XResponseError`

### Node/Server Utility Exports
- `XUtils`, `_xu` (from `src/XNUtils/XUtils.ts`)
- `XEventManager`, `_xem`, `_XEventManager`, `XEventListenerOptions` (from `src/XEM/XEventManager.ts`)
- `Settings` (alias of internal `XSettings` singleton, from `src/XSettings/XSettings.ts`)
- `XWebServer` (from `src/XServer/XWebServer.ts`)
- `XNode` (from `src/XServer/XNode.ts`)

### ServerXVM Exports
- `ServerXVMModule`
- `ServerXVMModuleDefault`
- Types:
  - `XVMEnv`
  - `XVMView`
  - `XVMAppMeta`
  - `XVMAppFile`
  - `XVMAppBundle`
  - `SubscriberTarget`
  - `PushEventArgs`
  - `PushEventResult`
  - `ViewScope`
  - `ValidationCtx`
  - `ServerXVMModuleOptions`

### XDB Exports
- Runtime:
  - `XDB` (default singleton)
  - `XDBModule`
  - `XDBEngine`
  - `XDBEntity`
  - `XDBVector`
  - `XDBFile`
  - `XDBTemp`
  - `XDBCache`
  - `XDBStorageFS`
  - `XDBStorageSqlite`
  - `XpellEmbeddingProvider`
- Types:
  - `XDBModuleInitOptions`
  - `IXDBEmbeddingProvider`
  - `IXDBVectorQueryProvider`
  - `IXDBStorage`
  - `XDBData`
  - `XDBEntityPersisted`
  - `IXDBMaintenance`

### Wormholes Exports (`export * from "./Wormholes/wh.index.js"`)

#### Protocol/Envelope (`wh.types.ts`)
- constants:
  - `WH_VERSION`
- types:
  - `WHVersion`
  - `WHKind`
  - `WHPeer`
  - `WHRoute`
  - `XCmd`
  - `WHHelloPayload`
  - `WHAuthPayload`
  - `WHEventPayload`
  - `WHPingPayload`
  - `WHPongPayload`
  - `WHEnvelope`
  - `WHHello`
  - `WHAuth`
  - `WHReq`
  - `WHRes`
  - `WHEvt`
  - `WHPing`
  - `WHPong`
  - `WHAny`
  - `WHAuthState`
  - `WHConnMeta`
  - `WHContext`

#### Errors (`wh.errors.ts`)
- `WH_ERR`
- `WHErrorCode`
- `whBadEnvelope`
- `whUnsupportedVersion`
- `whUnknownKind`
- `whMissingRid`
- `whUnauthorized`
- `whForbidden`
- `whTimeout`
- `whInternal`

#### Gateway (`wh.gateway.ts`)
- `handleEnvelope`
- `WHGatewayOptions`

#### Session (`wh.session.ts`)
- `WHSession` (default export aliased as `WHSession`)

#### WebSocket Server (`wh.ws.server.ts`)
- `createWormholesWSServer`
- `wsSendEvt`
- `WHWSServerOptions`

#### WebSocket Client (`wh.ws.client.ts`)
- `WHWSClient` (default export aliased as `WHWSClient`)
- `WHWSClientOptions`
- `WHWSEventHandler`

#### REST Router (`wh.rest.router.ts`)
- `createWormholesRestRouter`
- `WHRestRouterOptions`

## Subsystem Mapping (Source Files)
- Bootstrap/server:
  - `src/XServer/XNode.ts`
  - `src/XServer/XWebServer.ts`
- Settings:
  - `src/XSettings/XSettings.ts`
- Wormholes:
  - `src/Wormholes/wh.index.ts`
  - `src/Wormholes/wh.types.ts`
  - `src/Wormholes/wh.codec.ts`
  - `src/Wormholes/wh.gateway.ts`
  - `src/Wormholes/wh.errors.ts`
  - `src/Wormholes/wh.session.ts`
  - `src/Wormholes/wh.ws.server.ts`
  - `src/Wormholes/wh.ws.client.ts`
  - `src/Wormholes/wh.rest.router.ts`
- XDB core:
  - `src/XDB/XDB.ts`
  - `src/XDB/XDBEngine.ts`
  - `src/XDB/IXDBStorage.ts`
  - `src/XDB/xdbReady.ts`
- XDB object layers:
  - `src/XDB/XDBEntity.ts`
  - `src/XDB/XDBVector.ts`
  - `src/XDB/XDBFile.ts`
  - `src/XDB/XDBTemp.ts`
  - `src/XDB/XDBCache.ts`
  - `src/XDB/XDBObject.ts` (present but not exported from index)
- XDB adapters:
  - `src/XDB/XDBStorageFS.ts`
  - `src/XDB/XDBStorageSqlite.ts`
  - `src/XDB/IXDBMaintenance.ts`
  - `src/XDB/providers/index.ts`
  - `src/XDB/providers/XpellEmbeddingProvider.ts`

## Gateway-Related Types (Operational Set)
- Envelope and command:
  - `WHEnvelope<T>`
  - `WHAny`
  - `XCmd`
- Execution context:
  - `WHContext`
  - `WHAuthState`
  - `WHConnMeta`
  - `WHRoute`
- Options:
  - `WHGatewayOptions`
  - `WHWSServerOptions`
  - `WHRestRouterOptions`
  - `WHWSClientOptions`
- Correlation:
  - `WHReq` (`_id`)
  - `WHRes` (`_rid`)

## Storage Adapters and Contracts
- Core contract:
  - `IXDBStorage` (required adapter interface)
- Implementations:
  - `XDBStorageFS`
  - `XDBStorageSqlite`
- Optional extension contracts:
  - `IXDBMaintenance` (folder/zip utilities)
  - `IXDBBackup` (backup/restore, implemented by `XDBStorageSqlite`)

## XSettings API (Internal Class `_XSettings`, Public Alias `Settings`)
- Lifecycle:
  - `onSetup(workFolder = ".work")`
  - `init(workFolder = ".work")`
  - `load(jsonFilePath: string)`
  - `close()`
- Accessors/mutation:
  - `get(key: string)`
  - `set(key: string, value: any)`
  - `has(key: string): boolean`
  - `getAll()`
- Events (via inherited event manager):
  - `update` (on save/load)
  - `error` (on IO/parse failure)
