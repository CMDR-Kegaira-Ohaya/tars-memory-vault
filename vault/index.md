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

Last updated: 2026-03-02
