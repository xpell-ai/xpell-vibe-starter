---
name: Xpell XDB Contract
id: xpell-xdb
version: 1.0.0
updated: 2026-03-02
description: XDB entity + persistence + identity rules for deterministic Xpell apps and agents.
requires:
  - xpell-contract
  - xpell-node
---

# Prime directive (MANDATORY)

Apply this skill as a strict contract. Do not infer missing state.
If entity schema, storage wiring, or migration intent is unclear, require the relevant file or explicit instruction before changing persistence behavior.

## 1) Core identity

- XDB is the deterministic entity store used through `XDB` / `XDBEngine` adapters.
- `XDBEntity` owns schema, CRUD, indexing, and optional embedding hooks.
- XDB entities must be safe for multi-channel agent usage (`Telegram`, `WhatsApp`, `Facebook`, and similar connectors), so IDs and foreign keys must remain stable across channels, imports, and replays.
- Persistence is explicit and inspectable. XDB data is authoritative only when written through entity APIs and committed through the engine.

## 2) Non-negotiable identity rules (IMPORTANT)

- Canonical identity is `record._id` (GUID). Never use sequential IDs as identity.
- If a module needs a human-readable identifier, store it as a separate field such as `user_handle`, `slug`, or `external_label`.
- Human-readable identifiers are never authorization identity and never replace `record._id`.
- Never expose internal storage paths, filesystem layout, adapter internals, or kernel secrets in any record.
- For cross-entity references, always store GUID `_id` values, never indices, offsets, or array positions.
- Channel identifiers such as `telegram_chat_id`, `whatsapp_user_id`, or `facebook_psid` are linkage fields only. They are not primary identity.

## 3) Schema defaults

- Every entity schema MUST include `_id`, `_created_at`, and `_updated_at`.
- `_id` is the primary unique index.
- `_created_at` is immutable after insert.
- `_updated_at` is mutable and MUST be set on every update.
- If a schema author omitted these fields, the entity layer must inject them before use, consistent with `XDBEntity.setScheme()`.
- Default timestamps must be deterministic and explicit. Do not invent alternate audit fields unless the module contract requires them.

## 4) Persistence discipline

- `XData` is NOT persistence.
- Do not mirror persisted state into `XData` unless that mirror is explicitly documented as a cache with a single source of truth.
- All persistence changes happen through `XDBEntity` CRUD operations plus explicit `commit()`.
- No implicit migrations, silent repair, or auto-fixes.
- Schema changes, backfills, and data repairs are explicit operations, scripts, or documented migration steps.
- Do not mutate storage files directly when an entity API exists.

## 5) Indexing rules

- Primary and unique indexes must be declared in schema metadata, for example `_index: { _unique, _primary }`.
- Index data is derived state and can be rebuilt. Correctness takes priority over micro-performance.
- If code mutates an indexed field, index state must be rebuilt or updated deterministically.
- Use a canonical rebuild path such as `indexAll()` when correctness would otherwise be ambiguous.
- Do not rely on stale index snapshots, write-order assumptions, or partial in-memory fixes.

## 6) Embedding / semantic fields (stage aware)

- Embedding runs ONLY for fields explicitly marked `_embed`.
- Stage-1 "no-rag KB" flows do NOT embed content.
- In stage-1, store files or markdown as plain `File` / `String` fields and use deterministic lookup by explicit filters, indexes, or exact keys.
- If embedding is enabled, vector IDs must be tracked in `_entity_vectors_index`.
- On update or delete, all prior vector IDs for the record must be deleted or replaced deterministically.
- Do not embed fields implicitly and do not mix stage-1 deterministic lookup with undeclared semantic side effects.

## 7) Security / data minimization

- Never store access tokens in plaintext in XDB records.
- If a secret must exist, store it in `SettingsModule` with masking and explicit access control.
- Passwords and equivalent verifier fields must use `Hash` type (`bcrypt`); never store plaintext credentials.
- Persist only the minimum data required for the use case.
- Store channel linkage fields such as `telegram_chat_id`, `whatsapp_phone`, or `facebook_psid` only when needed for routing or reconciliation.
- Channel linkage fields never become the primary identity key and never replace `_id`.
- Do not persist internal stack traces, adapter file paths, or debug dumps in business records.

## 8) Recommended entity patterns (examples)

### Users entity

- `_id`: GUID
- `role`
- `display_name`
- `channel_links`: array of channel linkage objects or normalized GUID references
- `_created_at`
- `_updated_at`

### Conversations / Threads entity

- `_id`: GUID
- `participants`: array of `user_id` GUID values
- `channel_id`
- `external_thread_id`
- `_created_at`
- `_updated_at`

### Messages entity

- `_id`: GUID
- `thread_id`
- `author_user_id`
- `direction`: `in` / `out`
- `text`
- `_created_at`
- `_updated_at`

## 9) Checklist

- [ ] Entity schema includes `_id`, `_created_at`, and `_updated_at`
- [ ] `_id` is the canonical GUID identity and primary unique index
- [ ] No sequential IDs are used for identity or authorization
- [ ] Human-readable IDs are stored only as secondary fields
- [ ] Cross-entity references use GUID `_id` values
- [ ] `XData` is not used as authoritative persistence
- [ ] Writes happen only through `XDBEntity` CRUD and explicit `commit()`
- [ ] Secrets are stored only in `SettingsModule` with masking
- [ ] Password-like fields use `Hash` type and never plaintext
- [ ] Indexed field updates rebuild or update indexes deterministically
- [ ] Embedding runs only on `_embed` fields
- [ ] Stage-1 flows explicitly keep embedding off and use deterministic lookup
- [ ] Vector IDs are tracked in `_entity_vectors_index` and removed on update/delete
- [ ] Channel IDs are linkage fields only and not primary identity

## 10) Hard forbiddens

- Do not use auto-increment integers, row order, array position, or adapter-generated offsets as identity.
- Do not treat channel-specific IDs as canonical user identity.
- Do not persist secrets, tokens, or internal storage paths in entity records.
- Do not bypass entity CRUD with direct file edits or hidden storage writes.
- Do not run implicit migrations or silent data repair during normal reads or writes.
- Do not update indexed fields without deterministic index maintenance.
- Do not create embeddings for undeclared fields.
- Do not leave orphaned vectors after record update or delete.

## 11) Canonical implementation pattern

1. Define schema with `_id`, `_created_at`, `_updated_at`, and explicit `_index` metadata.
2. Inject missing defaults at entity construction time before any read or write path is used.
3. Create records with GUID `_id`, immutable `_created_at`, and initialized `_updated_at`.
4. Read and write only through `XDBEntity` CRUD methods.
5. After writes, call `commit()` to persist staged changes through `XDBEngine`.
6. If indexed fields changed, rebuild or deterministically update indexes before finishing the write flow.
7. If `_embed` fields changed, update `_entity_vectors_index` and delete replaced vectors in the same explicit write path.

## 12) Compatibility notes

- This skill inherits the `xpell-contract` rule that runtime behavior must be explicit, deterministic, and free of hidden inference.
- This skill inherits the `xpell-node` rule that persistence is explicit and adapter-driven, not `XData`-driven.
- When this skill and another product skill conflict, preserve deterministic XDB identity and persistence rules unless the user provides an explicit higher-priority repo-local contract.
