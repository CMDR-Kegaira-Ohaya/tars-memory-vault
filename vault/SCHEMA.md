# Vault Schema (v2)

This folder is the canonical SHARDED store for defining memories and shared architectural truths.

## Directories
- vault/pins/      - durable rules, invariants, high-leverage preferences
- vault/episodes/  - defining moments ("we learned this the hard way")
- vault/archive/   - retired/superseded entries and legacy snapshots
- vault/templates/ - starter templates (non-binding)

## Naming
- Pins:     pin-YYYYMMDDD-###.md
- Episodes: ep-YYYMMDDD-###.md

## Required header fields (top of each entry file)
ID: pin-YYYYMMDDD-### or ep-YYYMMDDD-###
Created: YYYY-MM-DD
Updated: YYYY-MM-DD
Scope: personal|shared
Status: active|retired
Lock: false|true
Title: <short>
Statement/Moment: <crisp>
Evidence: <why this is real>
Confidence: low|medium|high
Tags: <comma-separated>

## Scope rule (twin-operator)
- Default to personal if unclear.
- Shared requires explicit approval by BOTH operators.
- If one operator is absent, shared adoption is deferred; store as inactive proposal or personal-only.

## Recommended write path
Use hub autopilot:
- submit a patch JSON to patch-queue/
- GitHub Actions applies it and archives the patch to patch-queue/applied/
