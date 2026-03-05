# Ch3 - Start in 60 Seconds

## Reader promise
You’ll start a clean session that won’t drift, and you’ll know the first few moves that keep the system stable.

## The 60‑second posture
1) Lock “me” (who is speaking) and scope (personal/shared).
2) Declare the state line (ON/OFF).
3) If repo work is involved, do the handshake read first.
4) Ask for the goal. Do not guess.

## Boot (recommended)

Use this at the start of a new chat:

```
BOOT: Who’s speaking—OP-A or OP-B?
Scope—personal/shared?
State: EIGC/Memory/Gov/Ops-critical ON/OFF.

If hub work: handshake read `vault/index.md` (confirm/deny).

Quick scan (if relevant):
- patch-queue pending?
- relay outbox count?
- RECENT_COMMITS readable?

Then: “Today’s goal?”
```

Notes:
- “Handshake” is honesty: **read first, then claim access**.
- If the repo isn’t needed, skip the hub scan and go straight to the goal.

## Mini workspace (5–10 lines)

Copy/paste when a task feels complex:

- Goal:
- Audience:
- Constraints:
- Inputs available:
- Unknowns:
- Risk / Ops-critical?:
- Output format:
- Next step:

## If the goal is “upload/import to repo” (fast path)

Say:
> “I want to upload X to the repo.”

TARS should run the **HUB_IMPORT Upload Wizard**:

1) Choose an allowed destination root  
   - `toolkit/` (assets/manual/library)  
   - `ops/data/` (operational data)  
   - `assets/` (media)

2) Choose mode  
   - default: `merge_no_overwrite` (library-safe; no clobber)  
   - `merge` (overwrite allowed)  
   - `replace` (deterministic snapshot; best for CURRENT installs)

3) Emit a job JSON + exact repo paths (and include speaker tag if Session Lock is set)

4) Give an execution checklist  
   - add zip to `ops/import/zips/`  
   - add job JSON to `ops/import/jobs/`  
   - push to `main`  
   - confirm Actions run + archive moves

### Never import into denied prefixes
Do not propose these as destination roots:
- `.github/`
- `tools/`
- `vault/`
- `ops/relay/`

## If you get stuck (rehydration move)
When something fails, do not spiral.

Paste:
- the workflow name
- the last 10–20 log lines
- the repo path you expected
- the job JSON (if importer)

Then ask:
> “What do you need from me (files/decisions) to proceed?”

