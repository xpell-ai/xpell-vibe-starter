# Xpell Node (xnode) Contract Checklist

Use this checklist before merging transport, module, settings, or persistence changes.

- [ ] Prefer `XNode` / `XWebServer` bootstrap by default.
- [ ] If using host-owned server transport, MUST use `createWormholesRestRouter` + `createWormholesWSServer` and MUST NOT re-implement envelope plumbing.
- [ ] Production MUST set `_require_auth: true` on REST and WS gateways and MUST enforce `_sid` after auth.
- [ ] Never ship `_require_auth: false` without an explicit DEV/local flag and loud warning logs.
- [ ] Always validate envelopes (`parseEnvelope`/`assertEnvelope`) before gateway execution.
- [ ] Always inject server context into command params (`_wid`, `_sid`, `_from`, `_to`) before module execution.
- [ ] Always route external REQ execution to `_x.execute`.
- [ ] Never let modules depend on raw transport objects (`Express req/res`, `WebSocket`).
- [ ] Never persist authoritative state via XData (`_xd`).
- [ ] Never log secrets (tokens, auth headers, private keys, raw credentials).
- [ ] No background timers/polling inside modules.
- [ ] No direct UI logic or DOM/browser API usage in xnode runtime code.
- [ ] Keep Wormholes trust boundary explicit (`_require_auth`, `_authorize_req`, transport parsing).
- [ ] Keep persistence explicit via adapters (`IXDBStorage` / file-backed settings / ServerXVM files).
- [ ] Keep first-run setup deterministic (`.xpell-initialized`, settings file seeding, public folder setup).
- [ ] Keep ServerXVM persisted JSON data-only (no function values in app/view payloads).
