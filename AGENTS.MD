AGENTS.md

Project

This is xpell-vibe-starter.

Goal:
Create a minimal Xpell 2 starter app for real-time vibe coding.

This repository is based on the vibe-server and Xpell contracts, but stripped down to a focused starter. It is not a SaaS platform.

⸻

Foundation

Follow these repo-local skills from skills/:
	•	xpell-contract
	•	xpell-core
	•	xpell-node
	•	xpell-ui
	•	server-xvm
	•	vibe-server
	•	vibe-client
	•	xpell-app

These skills are authoritative for architecture, transport, persistence, UI rules, and code generation.

⸻

Scope

This starter focuses only on:
	•	loading an app from the server
	•	previewing prompt-driven UI/app changes
	•	applying and persisting confirmed changes
	•	minimal demo data (users)

This project intentionally excludes:
	•	multi-tenant SaaS logic
	•	payments
	•	chatbot / agent flows
	•	onboarding systems
	•	admin systems
	•	voice features
	•	external channel APIs
	•	product analytics / billing

Do NOT introduce these features.

⸻

Stack
	•	TypeScript (ESM, NodeNext)
	•	@xpell/node
	•	@xpell/ui
	•	Wormholes v2
	•	built-in ServerXVMModule
	•	optional XDB filesystem storage for demo entities

⸻

Architecture

Server
	•	Entry: server/src/main.ts
	•	Uses XNode.start()
	•	Wormholes is handled by XNode / XWebServer internally
	•	ServerXVMModule is already loaded by XNode — do NOT reimplement or duplicate it

Server modules in this starter:
	•	users → simple demo data
	•	vibe → prompt → preview/apply flow

Client
	•	Uses XVM / XUI
	•	Loads app structure from the server
	•	Uses JSON-defined app/views
	•	Uses Wormholes for client ↔ server communication
	•	No React / Vue / JSX

⸻

Core Flow
	1.	Client loads current app from server-xvm
	2.	User writes a prompt
	3.	Server generates updated JSON
	4.	Client previews the change in memory only
	5.	User confirms
	6.	Server persists through server-xvm

This repo must preserve the distinction:
	•	preview = temporary, client-side/in-memory
	•	apply = persisted, authoritative

⸻

Server Rules (STRICT)

Base these on the vibe-server contract  ￼
	•	All externally visible behavior must flow through _x.execute(xcmd)
	•	Use XModule as the only extension point
	•	Expose operations via _op_* methods only
	•	No transport logic inside modules
	•	No persistence logic in constructors
	•	No timers, polling, or autonomous background loops
	•	Params must use _snake_case
	•	Use structured errors
	•	Use _xlog, never console.log
	•	Never log secrets

⸻

Persistence Rules

Use the vibe-server persistence style, simplified for the starter  ￼
	•	Use repository + codec boundaries where persistence is needed
	•	Module ops call repos
	•	Repos never call modules
	•	App/view persistence goes through server-xvm
	•	Business/demo data may use XDB filesystem storage

Do NOT add:
	•	tenant-aware storage
	•	multi-instance storage orchestration
	•	hidden persistence
	•	direct manual mutation of authoritative app state outside server-xvm

⸻

Transport Rules
	•	Wormholes v2 is the canonical transport
	•	Do NOT manually implement Wormholes gateway code in this repo
	•	Do NOT add Express endpoints for core app logic
	•	Transport is untrusted
	•	Server-controlled context must remain authoritative

⸻

UI Rules
	•	Client UI must be JSON-first
	•	Use XUI/XVM conventions
	•	No JSX
	•	No inline persisted JS handlers
	•	Use Nano-Commands v2 compatible data forms for persisted behavior
	•	No direct server logic inside UI components

⸻

Minimal Domain Model

Keep the starter very small.

Allowed starter entities/modules:
	•	users
	•	app/views through server-xvm

Optional later, but NOT now:
	•	products
	•	conversations
	•	messages
	•	outbox

These exist in the original vibe-server scope, but they are not needed for this starter  ￼

⸻

Coding Guidelines
	•	Keep code deterministic and small
	•	Prefer simple, auditable modules
	•	No hidden state
	•	No framework assumptions
	•	Use ESM imports only
	•	Keep names stable
	•	Keep the repo easy for coding agents to understand

⸻

Feature Rule

Every feature in this repo must support this path:

prompt → preview → apply → persist

## Output Rules (for coding agents)

- Keep output as short as possible
- DO NOT print code
- When modifying files:
  → output ONLY changed filenames + 1-line description per file
- Avoid repeating unchanged information
- Keep explanations minimal (1–3 lines)

If code is absolutely required:
→ ask for confirmation before printing

Goal: minimize tokens while preserving correctness

If a feature does not support that flow, do not add it.