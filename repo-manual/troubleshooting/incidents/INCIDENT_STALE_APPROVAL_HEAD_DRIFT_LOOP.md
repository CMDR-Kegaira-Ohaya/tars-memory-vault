# INCIDENT — stale approval / head-drift loop during repo write flow

Status: observed incident note only, not a formal recovery procedure yet.

## What happened

A repo write sequence entered a stale approval / state-mismatch loop:

- a tool approval prompt for a repo write remained active in the UI
- a prepared patch existed in chat state
- `main` moved underneath that prepared patch
- subsequent chat replies started mixing:
  - prepared commit state
  - current live `main`
  - stopped / paused state

That created circular status reporting and made the chat surface unreliable as a source of truth for the latest write state.

## Symptoms

- pending tool approval appears to still be actionable even after repo state has moved
- prepared commit SHA and live `main` SHA diverge
- assistant replies start alternating between:
  - "prepared"
  - "not landed"
  - "stopped"
  - "maybe pending"
- user and assistant can end up circling around whether a write is real, pending, or stale

## Safe interpretation

When this happens:

- treat live repo state as authoritative over chat continuity
- treat stale approval prompts and stale prepared commits as non-authoritative until re-verified
- do not claim success from the chat/tool flow alone
- do a fresh read-only check of live `main` and the relevant repo files before deciding whether recovery is needed

## Safe immediate response

1. stop further writes
2. dismiss or deny stale approval prompts
3. read live `main`
4. verify whether the intended change is already present in repo
5. only then decide between:
   - resume from live repo state
   - rebuild the patch on current `main`
   - discard the stale patch entirely

## Follow-up to build later

This incident should later become a proper troubleshooting / recovery procedure for:

- stale approval prompts
- prepared commit vs live head drift
- false-positive "landed" claims after interrupted write flow
- repo-first re-baselining after circular tool state
