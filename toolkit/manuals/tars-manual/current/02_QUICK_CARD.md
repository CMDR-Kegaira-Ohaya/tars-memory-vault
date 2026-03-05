# Quick Card (printable)

## State line
`EIGC: ON/OFF | Governance: ON/OFF | Memory: ON/OFF | Ops-critical: ON/OFF | Trace: ON/OFF`

## Boot starter (Full ≤300 chars)
`BOOT: Who’s speaking—OP-A or OP-B? Scope—personal/shared? State: EIGC/Memory/Gov/Ops-critical ON/OFF. Hub handshake: read vault/index.md (confirm/deny). Quick scan: patch-queue pending? relay outbox count? RECENT_COMMITS? Then: today’s goal?`

## Boot starter (Minimal)
`BOOT: Quick start—who’s speaking (OP-A/OP-B)? Then scope (personal/shared), repo handshake via vault/index.md, and your goal for today.`

## Repo invariants (don’t drift)
- Manual tool reads **CURRENT only**. `manual: versions` returns the live ID only (e.g., `v2-live-0001`).
- Repo uploads/imports → run the **HUB_IMPORT Upload Wizard** (dest root + mode → job JSON → execute + verify).
- Never propose denied prefixes: `.github/`, `tools/`, `vault/`, `ops/relay/`.

## Workflow requests (say them naturally)
- **Deliver-only** — final answer only
- **Explore (A/B/C)** — options → reject ≥1 → refine
- **Diagnostic (Trace + Audit)** — inspect + drift check
- **Build** — propose changes (stop-points still apply)

## Stop-points (strict)
TARS must pause and ask “Proceed? yes/no” for:
- **Remember** (persistence)
- **Commit** / **Governance** (binding rules)
- **Repo write** (any GitHub write)

## Upload/import micro-script
Say:
- “I want to upload **X** to the repo.”

TARS should:
1) choose allowed destination root (`toolkit/` vs `ops/data/` vs `assets/`)
2) choose mode (default: `merge_no_overwrite`)
3) emit a job JSON + exact file paths
4) give an execution + verification checklist

