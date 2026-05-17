# XPELL Agent (xpell-agent.md)

## Includes

- aime-architect (AIME Architect Contract)
- xpell-contract
- xpell-core
- xpell-node

---

## Purpose

This file defines the SINGLE SOURCE OF TRUTH for the Xpell Agent runtime.

The system is based on a STRICT, DETERMINISTIC, TREE-BASED INTENT SYSTEM.

Trees are the ONLY mechanism for routing, decisions, and flow control.

---

## Core Rule

conversation_tree_runtime.handle_inbound is the ONLY valid entry point for inbound messages.

---

## HARD ARCHITECTURE RULE

Tree = LOGIC (brain)  
LLM = EXPRESSION (voice)

LLM MUST NEVER:
- decide routing
- select nodes
- resolve intents
- execute logic

LLM is ONLY allowed to:
- rewrite messages
- generate responses (when explicitly allowed)

---

## Deprecated System (Hard Removal)

The following are FORBIDDEN and must not exist:

- conversation_tree_runtime.inbound(...)
- any legacy intent router
- detectIntent / resolveIntent
- keyword-based routing systems
- LLM-based routing
- any direct handler bypassing trees
- any fallback logic BEFORE tree execution

If found → FAIL execution

---

## Inbound Routing Contract

Flow:

1. message received
2. resolve conversation + user
3. call: conversation_tree_runtime.handle_inbound(context)

Result:

- handled = true → STOP
- handled = false → route to AIME

---

## Tree System Contract

Trees are the ONLY intent system.

---

## NODE SCHEMA (MANDATORY)

Each node MUST follow:

{
  "_node_id": "string",
  "_kind": "root | branch | leaf",
  "_message": "string",
  "_message_mode": "static | rewrite | generate",
  "_llm_prompt": "string",
  "_llm_context": {},
  "_actions": [],
  "_edges": [
    {
      "_id": "string",
      "_target_node_id": "string",
      "_priority": 0,
      "_when": "always | intent | condition",
      "_intent": "string",
      "_condition": "string"
    }
  ],
  "_fallback_node_id": "string"
}

---

## EDGE RESOLUTION (CRITICAL)

Edge selection MUST follow:

1. collect ALL matching edges
2. sort by `_priority` DESC
3. select EXACTLY ONE edge

Rules:

- default priority = 0
- fallback priority = -1000
- fallback MUST exist
- NO randomness
- NO multiple execution

---

## EXECUTION FLOW (STRICT)

1. enter node
2. execute actions
3. resolve edges (priority-based)
4. move to next node
5. render message

---

## MESSAGE SYSTEM

_message_mode:
- static → return as-is
- rewrite → LLM rewrites
- generate → LLM generates from prompt

Rules:

- default = rewrite
- LLM MUST NOT affect routing
- LLM MUST NOT inject logic

---

## Tree Commands

- /trees
- /trees show
- /tree show <tree_id>
- /tree print <tree_id>
- /tree create <tree_id>
- /tree delete <tree_id>
- /tree publish <tree_id>
- /tree set_entry <tree_id> <node_id>

---

## Runtime Logging (MANDATORY)

Each inbound MUST log:

- inbound_start
- tree_selected
- node_enter
- matched_edges
- selected_edge (with priority)
- node_exit
- inbound_result

---

## Validation Rules

System MUST FAIL if:

- no tree selected
- entry node missing
- node missing fallback
- multiple edges selected
- priority not respected
- legacy intent system exists
- routing happens outside tree

---

## Determinism

- no hidden state
- no implicit routing
- no inference-based intent detection
- all decisions are explicit
- behavior must be reproducible

---

## Integration with AIME

Tree system runs FIRST.

AIME is ONLY used when:

handled == false

---

## Enforcement

Codex MUST:

1. remove ALL legacy intent systems
2. enforce node schema
3. enforce priority-based routing
4. ensure fallback exists everywhere
5. block any LLM routing attempts
6. ensure ONLY handle_inbound is used

---

## Failure Conditions

- legacy intent logic exists
- routing outside trees
- missing fallback
- non-deterministic behavior
- LLM controls flow

→ MUST FAIL

---

## Final Rule

Trees = Intent System

Tree = Brain  
LLM = Voice  

No trees → No agent
