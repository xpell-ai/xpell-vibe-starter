---
name: Xpell Connector Contract
id: xpell-connector
version: 1.1.0
updated: 2026-03-15
description: >
  Universal connector contract for the Xpell ecosystem.
  Defines how external systems are fetched, normalized, validated,
  and emitted into a strict ConnectorSyncEnvelope for XDB ingestion
  and downstream consumption by AIME and other Xpell runtimes.
requires:
  - xpell-contract
  - xpell-core
  - xpell-node
---

# Purpose

This skill defines the **universal connector contract** for the Xpell ecosystem.

A connector is responsible for:
- fetching data from any external system
- normalizing it into a strict, unified structure
- validating that structure
- emitting a valid `ConnectorSyncEnvelope`

This is the only allowed format for ingesting external data into Xpell/XDB.

---

# Core Principle

Do not standardize how data is fetched.  
Do standardize what data is emitted.

---

# Scope

This skill applies to:
- API connectors
- scrapers
- PDF/document parsers
- CSV/Excel importers
- database connectors
- webhook ingestion

This skill governs both:
- the **normalized data contract**
- the **implementation contract** for connector code

---

# Absolute Rules

1. Output must conform to `ConnectorSyncEnvelope`.
2. Do not invent or hallucinate data.
3. Do not drop important fields such as price, actions, ids, media, or availability when they are present in the source.
4. Do not leak platform-specific structure into normalized output.
5. Do not mix fetch logic contract with normalized schema contract.
6. Partial data is allowed. Fake data is forbidden.
7. Every entity must have a stable id.
8. Preserve original source references when possible.
9. All timestamps must be ISO 8601.
10. Prices must be numeric, never raw formatted strings like `"$10"`.
11. Connectors may be disposable; normalized output is not.
12. A connector must fail truthfully, not optimistically.
13. AIME and other runtime layers must consume connector output; they must not repair malformed connector payloads.
14. Connectors must stay reusable across businesses within the same source family.

---

# Architecture Role

External Systems → Connector → Normalized Data → XDB → AIME

AIME must never connect to external systems directly when a connector is the intended integration path.

Connector code must answer:

- how to fetch from the source
- how to normalize the source
- how to validate the normalized result

Connector code must **not** answer:

- how AIME sessions behave
- how personas behave
- how builder/planner/runtime flow works
- how Telegram/admin UX behaves

---

# Package and Workspace Role

A connector may live inside `xpell-agent` today, but it must be implemented so it can later move into its own package without behavioral changes.

Recommended layouts:

```text
packages/connectors/restaurant-pe
packages/connectors/shopify
packages/connectors/woocommerce
packages/connectors/pdf
```

or later:

```text
@xpell/connector-restaurant-pe
@xpell/connector-shopify
@xpell/connector-woocommerce
@xpell/connector-pdf
```

Rules:
- one connector implementation should target one source family
- connector packages must not contain UI code
- connector packages must not contain AIME-specific orchestration logic
- connector packages must not hardcode one customer/business unless explicitly requested for a one-off integration
- source-specific logic belongs inside the connector
- source-agnostic normalized output belongs to this contract

---

# Source of Truth

The connector's job is to translate external source truth into Xpell truth.

Rules:
- Preserve source ids where possible.
- Preserve source URLs when useful.
- Preserve raw language/currency when known.
- Preserve handoff links like order/booking URLs.
- Preserve variants if pricing or availability differs by variant.

The normalized envelope becomes the authoritative ingestion payload for downstream Xpell modules.

---

# Connector Output Contract

All connectors must return a payload with this shape:

```ts
export type ConnectorSyncEnvelope = {
  source: SourceInfo;
  business?: BusinessInfo;
  catalogs?: Catalog[];
  items?: Item[];
  policies?: Policy[];
  actions?: Action[];
  metadata?: Record<string, unknown>;
};
```

---

# SourceInfo

```ts
export type SourceInfo = {
  connector_id: string;
  connector_type: string; // shopify | woocommerce | restaurant_pe | pdf | csv | scraper | api | custom
  account_id?: string;
  business_id?: string;
  fetched_at: string; // ISO 8601
  source_url?: string;
  version?: string;
};
```

Rules:
- `connector_id` must identify the connector implementation.
- `connector_type` must identify the source family.
- `fetched_at` must reflect the real fetch time.

---

# BusinessInfo

```ts
export type BusinessInfo = {
  id?: string;
  name?: string;
  type?: string; // restaurant | retail | music_store | fashion | clinic | service | generic
  default_language?: string;
  default_currency?: string;
  timezone?: string;
  locations?: Location[];
};
```

Business info is optional but strongly recommended when the source exposes it.

---

# Location

```ts
export type Location = {
  id: string;
  name?: string;
  address?: string;
  phone?: string;
  hours_text?: string;
  geo?: {
    lat: number;
    lng: number;
  };
};
```

Use locations when the business has:
- branches
- stores
- pickup points
- service areas

---

# Catalog

A catalog is any category/menu/collection/department-like grouping.

```ts
export type Catalog = {
  id: string;
  name: string;
  parent_id?: string;
  type?: string; // menu | category | collection | department | section
  description?: string;
  order?: number;
  is_active?: boolean;
  image_urls?: string[];
  location_ids?: string[];
  metadata?: Record<string, unknown>;
};
```

Rules:
- Catalogs may be hierarchical.
- Use `parent_id` for nesting.
- Do not invent catalog groupings not present in source data.

---

# Item

`Item` is the core normalized entity.

```ts
export type Item = {
  id: string;
  sku?: string;
  external_id?: string;
  title: string;
  subtitle?: string;
  description?: string;

  item_type?: "product" | "menu_item" | "service" | "bundle";

  status?: "active" | "inactive" | "draft" | "archived";

  catalog_ids?: string[];
  tags?: string[];

  pricing?: Price[];
  availability?: Availability;

  variants?: Variant[];
  options?: Option[];

  media?: Media[];

  attributes?: Record<string, string | number | boolean | null>;

  order_url?: string;
  booking_url?: string;
  details_url?: string;

  location_ids?: string[];

  language?: string;
  raw_text?: string;
  metadata?: Record<string, unknown>;
};
```

Rules:
- `id` is mandatory.
- `title` is mandatory.
- `pricing` is optional only when no reliable pricing exists in source.
- `raw_text` may preserve original human-readable source content, but must not replace normalized fields.
- `attributes` may carry flexible source facts that do not fit the normalized core.

---

# Price

```ts
export type Price = {
  kind?: "base" | "sale" | "compare_at" | "member" | "special";
  amount: number;
  currency: string;
  label?: string;
  valid_from?: string;
  valid_until?: string;
};
```

Rules:
- `amount` must be numeric.
- `currency` should be ISO currency code when known.
- If the source exposes multiple prices, preserve them as multiple `Price` entries.
- Do not collapse sale/base/compare-at pricing into one string.

---

# Availability

```ts
export type Availability = {
  is_available?: boolean;
  stock_quantity?: number;
  stock_status?: "in_stock" | "out_of_stock" | "limited" | "preorder";
  notes?: string;
};
```

Rules:
- Use `is_available` when availability is known but stock count is not.
- Preserve source stock quantity when exposed.
- Do not invent availability.

---

# Variant

```ts
export type Variant = {
  id: string;
  title?: string;
  sku?: string;
  option_values?: Record<string, string>;
  pricing?: Price[];
  availability?: Availability;
  media?: Media[];
};
```

Rules:
- Variants must be preserved when price, stock, or options differ.
- Do not flatten meaningful variants into the base item.

---

# Option

```ts
export type Option = {
  name: string;
  values: string[];
};
```

Use options for:
- size
- color
- flavor
- package
- add-ons
- other variant dimensions

---

# Media

```ts
export type Media = {
  id?: string;
  type: "image" | "video" | "pdf";
  url: string;
  alt?: string;
  role?: "cover" | "gallery" | "menu_scan" | "logo";
};
```

Rules:
- Preserve source media URLs when available.
- Do not invent alt text.
- Use `role` when known or clearly inferable from source context.

---

# Policy

```ts
export type Policy = {
  id: string;
  type: "hours" | "reservation" | "delivery" | "returns" | "payment" | "custom";
  title: string;
  content: string;
  language?: string;
  location_ids?: string[];
};
```

Policies are normalized non-item business facts, such as:
- opening hours
- reservation terms
- delivery details
- return policies
- payment methods

Rules:
- Keep policy text grounded in source truth.
- Use one policy entry per distinct policy block when possible.

---

# Action

Actions are critical for handoff.

```ts
export type Action = {
  id: string;
  type: "order" | "reserve" | "call" | "whatsapp" | "website" | "custom";
  label: string;
  url?: string;
  phone?: string;
  applies_to_item_ids?: string[];
  location_ids?: string[];
};
```

Rules:
- Preserve action links from source systems.
- Do not drop ordering URLs.
- Do not drop booking URLs.
- Item-specific actions should preserve item linkage when known.

This is especially important for AIME use cases where the conversation layer recommends products but hands off checkout to an existing platform.

---

# Normalization Rules

All connectors must normalize aggressively enough that downstream Xpell modules do not need connector-specific logic.

Required normalization:
- timestamps → ISO 8601
- prices → numeric + currency
- ids → stable strings
- arrays → actual arrays
- nested source structures → flattened into the contract where appropriate
- platform-specific field names → mapped into universal contract names

Connectors may keep source-specific detail in `metadata`, but runtime behavior must not depend on source-specific naming.

---

# Validation Rules

Before ingestion, connector output must be validated.

Minimum required validations:
- envelope shape is correct
- required fields exist
- ids are non-empty
- numeric values are numeric
- arrays are arrays
- timestamps are ISO strings where applicable

Do not rely on downstream modules to repair malformed connector output.

---

# Partial Data Rules

Partial data is valid.

Examples:
- item with title but no price
- policy with hours but no location
- catalog with no image
- business with no timezone

But:
- missing is acceptable
- fabricated is forbidden

If the source does not expose something, omit it or leave it undefined.
Do not guess.

---

# Error Handling Rules

A connector must:
- fail gracefully
- surface truthful errors
- return partial data when safe and meaningful
- never silently convert failure into fake success

When a fetch fails:
- log the failure
- include the smallest safe partial result if appropriate
- do not output fabricated fallback data

---

# Observability Rules

A connector should expose enough signal for debugging and ops.

Recommended metadata/logging:
- fetch duration
- total item count
- total catalog count
- total policy count
- error count
- source health notes
- pagination info when relevant

This may live in logs or in `metadata`, depending on runtime design.

---

# Business Flexibility Rules

This contract must be flexible enough for every business family.

Examples:

Restaurant/bar:
- catalogs = menu sections
- items = menu items
- policies = opening hours/reservations
- actions = order/reserve

Retail/fashion:
- catalogs = categories/collections
- items = products
- variants = size/color
- availability = stock state

Music store:
- items = instruments/accessories
- variants = model/color/package
- actions = buy/contact

Clinic/service business:
- items = services
- actions = booking/call
- policies = hours/payment/custom

Do not hardcode one vertical into the universal contract.

---

# Implementation Rules

Connectors must be implemented so they can move between:
- a folder inside `xpell-agent`
- a shared `packages/connectors/*` workspace
- a standalone published package

without changing the normalized behavior contract.

Recommended internal structure:

```text
source fetch -> raw model -> normalize -> validate -> emit envelope
```

Rules:
- separate fetch from normalize
- separate normalize from validate
- keep source-specific parsing isolated
- keep contract-specific mapping explicit
- allow source-specific details only inside `metadata`
- do not couple runtime business behavior to connector implementation details

---

# Hard Forbiddens

Do not:
- hardcode business facts
- return HTML instead of normalized structure
- emit string prices like `"$10"`
- omit stable ids
- collapse meaningful variants into a base item
- drop order or booking links
- rely on AIME to normalize connector output
- mix raw fetch response format with normalized Xpell format
- invent categories, prices, stock, media, or policies
- create connector-specific runtime dependencies outside `metadata`

---

# Acceptance Criteria

A connector is valid only if:

1. it emits a valid `ConnectorSyncEnvelope`
2. it preserves source truth without hallucination
3. it is reusable without business-specific hacks
4. it can be ingested into XDB without connector-specific downstream repair
5. it preserves key commercial facts like prices, variants, availability, and handoff actions when available
6. it stays business-agnostic at the contract layer

---

# Codex Execution Rule

When generating a connector, follow this sequence:

1. Identify source type:
   - API
   - HTML/JS
   - PDF
   - CSV/Excel
   - database
   - webhook

2. Fetch raw source data.

3. Transform raw data into `ConnectorSyncEnvelope`.

4. Validate the normalized envelope.

5. Return only normalized data as the connector output contract.

Do not stop at “I fetched the source.”
The connector is not complete until normalization is complete.

---

# Design Philosophy

- connectors are disposable
- normalized data is durable
- schema is the contract
- truth beats completeness
- reuse comes from normalization, not from fetch implementation

---

# One-liner

A connector translates any external system into Xpell’s universal data language.
