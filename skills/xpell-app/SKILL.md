---
name: Xpell App Composition Contract
id: xpell-app
version: 1.1.0
updated: 2026-02-26
description: >
  Composition-level skill for generating complete Xpell 2 applications.
  Produces deterministic full-stack app structure (client + server)
  using Wormholes v2, XVMApp, XModule, XData2, and Nano-Commands v2.
  No external frameworks. No implicit architecture.
requires:
  - xpell-contract
  - xpell-core
  - xpell-node
  - xpell-ui
  - server-xvm
---
# Purpose

`xpell-app` is an umbrella / scaffolding skill.

It does NOT define runtime rules. It composes existing Xpell runtime
layers into a complete working application.

Use this skill when generating:

-   Starter apps
-   Example dashboards
-   Agent control panels
-   Admin tools
-   Minimal full-stack demos
-   Template repositories

------------------------------------------------------------------------

# Architecture Contract

Generated applications MUST follow this structure:

    project-root/
      client/
        src/
        index.html
        package.json
      server/
        src/
        package.json
      shared/ (optional)

Rules:

-   No monolithic structure
-   No mixing server and client code
-   No external UI frameworks (React, Vue, Next, etc.)
-   No Express-based custom APIs unless explicitly requested
-   Server must use @xpell/node
-   Client must use @xpell/ui
-   Single source of truth via `_x.execute()`

------------------------------------------------------------------------

# Transport Contract (Mandatory)

All client ↔ server communication MUST use:

-   Wormholes v2
-   Envelope-based REQ/RES
-   `_module`, `_op`, `_params`
-   Deterministic server context injection

Custom REST endpoints are forbidden unless explicitly requested. If REST
is used, it must be the Wormholes REST router.

------------------------------------------------------------------------

# Server Rules

Server MUST:

-   Use XModule as the only extension point
-   Expose operations via `_op_<name>` methods
-   Use explicit persistence (repos + codecs)
-   Never use timers, polling, or background loops
-   Never embed transport logic inside modules
-   Never return raw errors across boundaries

Server bootstrap must:

-   Load required modules via `_x.loadModule()`
-   Start Wormholes gateway
-   Route all external calls to `_x.execute()`

------------------------------------------------------------------------

# Client Rules

Client MUST:

-   Use XVMApp for application definition
-   Define views in pure JSON (Nano-Commands v2 compatible)
-   Avoid inline JS functions inside view definitions
-   Use XVM navigation rules (add → stack → navigate)
-   Never call server directly via fetch unless explicitly requested
-   Use Wormholes client for communication

------------------------------------------------------------------------

# Example App Expectations

When generating an example app, it MUST include:

1.  At least one server module (e.g., ItemsModule)
2.  At least one client view rendered via XVMApp
3.  At least one Wormholes REQ → RES interaction
4.  Runnable instructions (npm install + start)
5.  No placeholder-only mocks unless explicitly requested

------------------------------------------------------------------------

# Determinism Requirements

Generated code must:

-   Be runnable
-   Not rely on hidden globals
-   Not assume framework-specific behavior
-   Follow snake_case for command parameters
-   Keep module names stable
-   Avoid implicit state

------------------------------------------------------------------------

# Output Checklist

When asked to generate a full app, output:

1.  Short architecture explanation
2.  Folder structure
3.  Server implementation (module + bootstrap)
4.  Client implementation (XVMApp + views)
5.  Run instructions
6.  Minimal README.md

No incomplete scaffolding. No pseudo-code. No conceptual-only output.
