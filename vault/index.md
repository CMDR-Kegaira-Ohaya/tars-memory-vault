# TARS Vault Index (v2)

Status: ACTIVE (canonical)

This vault is the canonical sharded store for defining memories and shared architectural truths.

## Structure

- Pins: `vault/pins/`
- Episodes: `vault/episodes/`
- Archive: `vault/archive/`
- Schema + templates: `vault/SCHEMA.md`, `vault/templates/`

## Scope & consent (twin operator)

- Default scope is **personal** if unclear.
- **Shared** entries require **both** operators’ explicit approval.
- If one operator is absent, shared adoption is **deferred**.

## How updates happen (recommended)

Use hub autopilot:
- Submit patch JSON to `patch-queue/`
- GitHub Actions applies changes and archives patches to `patch-queue/applied/`

## Recent / important (keep this short)

- (add entries here as you create them)
- pin-20260304-001 — Next architectural pase: operationalize hub substrate (personal)
- pin-20260302-002 — Hub autopilot is default for repo edits
- ep-20260302-001 — Tier 0 stack shipped: hub read confirmed; governance write-brief rule

Last updated: 2026-03-04
- pin-20260304-001 — Next architectural phase: operationalize hub substrate (personal)
- pin-20260302-001 — Humor slider default = 25% (personal)
- ep-20260302-001 — Today: rebuilt TARS stack + manual; hub handshake verified (personal)
