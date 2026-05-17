---
name: Xpell XDB Contract
id: xpell-xdb
version: 1.1.0
updated: 2026-05-11
description: XDB entity, persistence, indexing, storage bootstrap, and identity rules for deterministic Xpell apps and agents.
requires:
  - xpell-contract
  - xpell-node
---
# Prime directive (MANDATORY)
Apply this skill as a strict contract. Do not infer missing state.
If entity schema, storage wiring, indexing behavior, or migration intent is unclear, require the relevant file or explicit instruction before changing persistence behavior.
## Key updates
- `XDBEntity` is engine-layer: return raw data, throw native errors, never return `XResponse`.
- `EntityManager` is module/API-layer: wrap public results with `XResponseOK` / `XResponseError`.
- XNode owns XDB bootstrap through `XNodeOptions.xdb`.
- Use `loadModuleAsync()` for deterministic infrastructure boot.
- `_id` primary index maps `_id -> _data array position`.
- Unique indexes map `value -> _id`.
- Non-unique indexes map `value -> _id[]`.
- Delete/splice paths must call `indexAll()`.
## Identity rules
- Canonical identity is always `record._id` GUID.
- Never use array position, row order, adapter offset, or auto-increment as identity.
- Human-readable fields like `username`, `slug`, or `email` are secondary identifiers only.
- Cross-entity references must store GUID `_id` values.
- Channel IDs are linkage fields only, not primary identity.
## Schema defaults
- Entity JSON schemas may omit `_id`, `_created_at`, and `_updated_at`.
- `XDBEntity.setScheme()` injects these fields before use.
- `_id` is primary unique index.
- `_created_at` is immutable.
- `_updated_at` is updated on every update.
- Password-like fields must use `_type: "Hash"`.
## Runtime layering
### XDBEntity
- Return raw data.
- Throw native errors.
- Own CRUD, schema normalization, indexing, embedding hooks, and persistence staging.
- Do not return `XResponse`, `XResponseOK`, or `XResponseError`.
### EntityManager
- Catch `XDBEntity` errors.
- Wrap command results with `XResponseOK` / `XResponseError`.
- Keep transport contracts consistent.
Recommended result keys:
- `_record`
- `_records`
- `_meta`
- `_updated`
- `_deleted`
## XNode / XDB bootstrap
- XNode owns XDB bootstrap for server apps.
- Hosting apps should configure XDB through `XNodeOptions.xdb`.
- Default storage is FS under `work/xdb`.
- Do not manually call `XDB.init()` and `_x.loadModule(XDB)` in app code unless building a custom runtime.
Example:

await node.start({
    work_folder: "./work",
    xdb: {
        _type: "fs"
    }
});

Use:

await _x.loadModuleAsync(XDB);

for deterministic boot.

loadModule() is fire-and-forget legacy behavior.

Persistence discipline

* XData is not persistence.
* Do not mirror persisted state into XData unless documented as a cache.
* Writes happen through XDBEntity CRUD and commit().
* No implicit migrations or silent repair during normal reads/writes.
* Do not mutate storage files directly when an entity API exists.
* Storage adapters own their internal topology.

Indexing rules

* _index: true means indexed, not unique.
* _index: { _unique: true } means unique secondary index.
* _index: { _unique: true, _primary: true } means primary index.

Index layout:

// primary
_id -> array position
// unique secondary
fieldValue -> record._id
// non-unique
fieldValue -> record._id[]

Rules:

* _id primary index maps record _id to current _data array position.
* Unique secondary indexes map normalized field value to record _id.
* Non-unique indexes map normalized field value to _id[].
* Never expose array position outside XDB internals.
* Delete/splice changes array positions, so delete paths must call indexAll().
* indexAll() is the canonical rebuild path after delete, load, migration, import, or ambiguous indexed mutation.
* Unique constraints must be enforced before insert and before indexed unique-field update.
* Updating an indexed field must update indexes or rebuild deterministically.
* Persisted index snapshots are derived state, not authoritative if schema/index format changed.

CRUD contract

XDBEntity

add(data): Promise<XDBEntityData>
find(filter, skip, limit, includeSchema, reverseOrder, sortInput): XDBFindResult
findById(id): XDBEntityData | null
update(filter, updates): Promise<{ _updated: number }>
delete(filter): Promise<{ _deleted: number }>

EntityManager command examples

await _x.execute({
    _module: "entity-manager",
    _op: "add",
    _params: {
        _app_id: "vibe-app",
        _entity: "users",
        data: {
            username: "tamir",
            email: "tamir@test.com",
            password: "123456"
        }
    }
});
await _x.execute({
    _module: "entity-manager",
    _op: "find",
    _params: {
        _app_id: "vibe-app",
        _entity: "users",
        filter: {
            username: "tamir"
        }
    }
});
await _x.execute({
    _module: "entity-manager",
    _op: "update",
    _params: {
        _app_id: "vibe-app",
        _entity: "users",
        filter: {
            _id: "record-guid"
        },
        updates: {
            display_name: "Tamir Fridman"
        }
    }
});
await _x.execute({
    _module: "entity-manager",
    _op: "delete",
    _params: {
        _app_id: "vibe-app",
        _entity: "users",
        filter: {
            _id: "record-guid"
        }
    }
});

Embedding / semantic fields

* Embedding runs only for fields marked _embed.
* Stage-1 deterministic flows do not embed content.
* Store deterministic KB content as File / String and query by explicit filters/indexes.
* If embedding is enabled, vector IDs must be tracked in _entity_vectors_index.
* On update/delete, old vector IDs must be deleted or replaced deterministically.

Security

* Never store access tokens in plaintext XDB records.
* Store secrets in SettingsModule with masking and access control.
* Passwords must use Hash.
* Persist minimum required data.
* Do not persist internal stack traces, adapter paths, debug dumps, or kernel internals.

Recommended users entity

{
  "_id": "users",
  "_title": "Users",
  "_description": "System users entity",
  "_meta": {
    "_version": 1
  },
  "_schema": {
    "username": {
      "_type": "String",
      "_required": true,
      "_min_length": 3,
      "_max_length": 32,
      "_index": {
        "_unique": true
      }
    },
    "email": {
      "_type": "String",
      "_required": true,
      "_index": {
        "_unique": true
      }
    },
    "password": {
      "_type": "Hash",
      "_required": true
    },
    "display_name": {
      "_type": "String"
    },
    "avatar": {
      "_type": "File"
    },
    "roles": {
      "_type": "Array",
      "_default": []
    },
    "active": {
      "_type": "Boolean",
      "_default": true
    },
    "last_login_at": {
      "_type": "Date"
    }
  }
}

Checklist

* Entity layer injects _id, _created_at, and _updated_at if omitted
* _id is canonical GUID identity
* No sequential IDs are used as identity
* Human-readable IDs are secondary fields only
* Cross-entity references use GUID _id
* XData is not authoritative persistence
* Writes happen through XDBEntity CRUD and commit()
* XDBEntity returns raw data and throws native errors
* EntityManager wraps public command output
* XNode owns XDB bootstrap unless custom runtime is explicit
* Infrastructure modules use loadModuleAsync()
* Password-like fields use Hash
* Unique indexes are enforced
* Indexed field updates maintain indexes deterministically
* Delete/splice paths call indexAll()
* Embedding runs only on _embed fields
* Vector IDs are tracked and removed on update/delete
* Channel IDs are linkage fields only

Hard forbiddens

* Do not use auto-increment integers, row order, array position, or adapter offsets as identity.
* Do not treat channel-specific IDs as canonical identity.
* Do not persist secrets, tokens, internal paths, or debug dumps in entity records.
* Do not bypass entity CRUD with direct file edits.
* Do not run implicit migrations during normal reads/writes.
* Do not update indexed fields without deterministic index maintenance.
* Do not create embeddings for undeclared fields.
* Do not leave orphaned vectors.
* Do not return XResponse from XDBEntity.
* Do not manually bootstrap XDB in app code when XNode owns the runtime.

Canonical implementation pattern

1. Define entity schema with business fields and explicit _index metadata.
2. Let XDBEntity.setScheme() inject _id, _created_at, and _updated_at.
3. Bootstrap XDB through XNode using XNodeOptions.xdb.
4. Use loadModuleAsync() for deterministic infrastructure startup.
5. Register entities through ServerXVM / EntityManager.
6. Create records with GUID _id, immutable _created_at, and initialized _updated_at.
7. Read/write only through XDBEntity CRUD or EntityManager commands.
8. Keep XDBEntity return values raw.
9. Wrap command/API results only at module boundary.
10. Commit writes through XDBEngine.
11. Rebuild or update indexes deterministically.
12. Update vectors deterministically for _embed fields.

Compatibility notes

* Preserve deterministic XDB identity and persistence rules over product-specific convenience.
* Preserve adapter-driven persistence over XData mirroring.
* Prefer explicit migrations over hidden repair.

