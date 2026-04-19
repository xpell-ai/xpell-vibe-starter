---
name: VIBE Client Contract
id: vibe-client
version: 1.1.0
updated: 2026-04-17
description: >
  Product skill for xpell-vibe-starter client (@xpell/ui). JSON-first XUI/XVM client for
  real-time app mutation. Uses Wormholes v2 through @xpell/ui, loads app structure from
  server-xvm, supports preview/apply flow, forbids JSX/frameworks/timers, and keeps UI
  state deterministic and data-first.
requires:
  - xpell-contract
  - xpell-ui
  - server-xvm
---

# Applies on top of: xpell-contract + xpell-ui + server-xvm

## Purpose

This skill defines the client-side contract for **xpell-vibe-starter**.

The client is responsible for:

- connecting through Wormholes
- loading app/views from the server
- rendering via XVM/XUI
- previewing prompt-driven changes in memory
- applying confirmed changes through the server

This is a **starter client**, not the full old VIBE product.

---

## Non-negotiables

- No React / Vue / Angular
- No JSX
- No hooks
- No virtual DOM
- No timers (`setInterval`, `setTimeout`)
- No manual WebSocket implementation
- No manual fetch-based app transport for core logic

---

## App model

- App structure is loaded from the server, not hardcoded as the source of truth
- `server-xvm` is authoritative for persisted app/view state
- Client preview state is temporary and must not be treated as persisted state
- Preview ≠ Persist

---

## UI rules

- Use XVM/XUI
- Prefer JSON-first views and app definitions
- Use `_type`, `_children`, `_on_*`, `_data_source`
- Custom UI classes may extend `XUIObject` when needed
- Do not require custom `XUIObject` classes when JSON composition is sufficient

---

## Data flow

- Wormholes is the ingress boundary
- UI consumes data via `_data_source`, `_on_data`, and XVM/XUI runtime flow
- New UI code MUST NOT write to `_xd._o[...]`
- Server remains the source of truth for persisted state

---

## Wormholes v2 client usage

- Use `Wormholes.open(...)` and `Wormholes.sendXcmd(...)`
- Do NOT implement manual ws/fetch transport for core app behavior
- App-level events may use `_xem`

---

## Starter flow

The client must support this flow:

1. load current app/view state from server
2. user enters prompt
3. receive preview payload
4. apply preview in memory only
5. user confirms
6. send apply request to server
7. receive updated persisted state/event

If a feature does not support this flow, it should not be added to this starter.

---

## Styling

- No hardcoded colors
- Use CSS tokens `var(--x-*)`

---

## Scope exclusions

Do NOT add:

- chatbot UI
- agent runtime UI
- onboarding flows
- voice UI
- admin product surface
- SaaS multi-tenant UX

---

## Output format (when generating code)

1. Short explanation
2. Types (if any)
3. View JSON / XVM app structure / XUIObject class only if needed
4. Minimal bootstrap or integration snippet