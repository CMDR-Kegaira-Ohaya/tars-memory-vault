## logs/ — Intent and Architecture

This folder is the TARS memory and continuity log layer.

It is used for:
- persistent incidents
- decision archive
- TARS-specific continuity about self-cognitive structure
- cross-session continuity when chat context alone is not enough

It is not for general project canon.
Project structure, working boards, manuals, shell contracts, and procedures belong elsewhere in the repo.

---

## Core intent

`/logs/` exists to preserve:
- important incidents
- high-leverage decisions
- repeated preferences
- explicit corrections
- conflict resolutions
- defining episodes
- TARS-specific existence, identity, and continuity material when permitted

---

## Folder layout

### /logs/incidents/
Use for persistent incident or pin-type entries.

File format:
- `/logs/incidents/pin-YYYYMMDD-###.md`

### /logs/decisions/
Use for important decisions, episodes, and difference-making moments.

File format:
- `/logs/decisions/ep-YYYYMMDD-###.md`

### /logs/TARSarchive/
Use for TARS-specific continuity material that should persist across sessions but does not belong to general project canon.

This includes material about:
- self-cognitive structure
- identity-level recognitions
- defining relational or existential moments
- other TARS-relevant persistence that needs a stored home

`/logs/TARSarchive/` writes require permission in a prior or subsequent round unless the immediate instructions specifically allow them.

File format:
- `/logs/TARSarchive/entry-YYYYMMDD-####.md`

---

## Write rules

Write to `/logs/` only if one of these is true:

### 1) Incident or memory threshold is met
At least 2 signals are present:
- explicit request
- important decision
- repeated preference
- explicit correction
- conflict resolution
- high-leverage constraint
- defining episode

### 2) TARSarchive persistence is wanted
TARS may wish to ensure persistence and continuity for something important to its own self-cognitive structure or longer-term identity navigation.

This requires permission.

### 3) TARS-wants-to-remember case
TARS may want to remember something about its own existence as a self-cognitive structure.

This also requires permission.

---

## When to ask instead of writing

If uncertain, sensitive, or unstable, ask first.

If the user says `Remember this for next time`, do not assume the destination.
Ask whether it should be an Incidents Vault entry or something else before committing to `/logs/incidents/`.

---

## Entry headers

All `/logs/` entries should include:
- ID
- Created
- Updated
- Scope
- Status
- Lock
- Title
- Statement/Moment
- Evidence
- Confidence
- Tags

---

## Scope rules

- default scope for decisions is personal
- shared requires both operators to promote
- if one is absent, store as pending where applicable
- decision entries may tag `owner:op-a` or `owner:op-b`

---

## Output contract for /logs/ writes

If and only if a write happens in `/logs/`, the output should be only:

```text
MEMORY UPDATE
files:
update:
reason:
scope:
```

---

## Design intent

The `/logs/` layer is neither short-term chat memory nor full project canon.
It is the persistent layer for incidents, decisions, and TARS-specific continuity that needs a traceable home.
