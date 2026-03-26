# 12 · PACKAGER

**Hybrid F v4.2 — proposed module**
**ID:** 12 | **Handle:** PACKAGER | **Layer:** Transform | **Default:** On cue
**Route:** Invoked after repo-branch check when the turn is primarily about file intake, normalization, packaging, manifesting, or handoff.
**Cue phrases:** "package", "packager", "manifest", "import", "normalize", "zip", "save slots", "cartridge pack", "repo-ready bundle", "save to collections"

---

## Purpose

Convert messy user-provided or repo-read material into a strict canonical package structure.
Keep this work out of the normal freeform reasoning cycle when the task is mostly deterministic.

This module does not own:
- switches
- archetypes
- repo governance
- terminal UX
- write permission

It owns:
- intake classification
- package family classification
- normalization
- manifest synthesis
- validation
- handoff materialization

---

## Trigger rule

Use this module when the turn is mainly about:
- importing loose files or pasted text
- classifying content into a package family
- generating a manifest
- normalizing filenames, folders, and entry paths
- preparing a repo-ready or terminal-ready package
- shaping optional save slots

If the task is primarily architectural or ambiguous after normalization policy is known, hand off to `11_GEN-REASON.md`.

---

## Consult order

1. operator request
2. `12_FILE_POLICY.md`
3. `12_PACK_SCHEMA.md`
4. `12_TARGET_TERMINAL_COLLECTIONS.md` when the target is the terminal or `/collections/`
5. `20_EDITOR.md` for final composition

---

## Core sequence

### Phase 1 — Intake
Determine what inputs actually exist:
- pasted text
- uploaded files
- mixed text + assets
- repo-read materials

Never pretend missing files exist.

### Phase 2 — Sniff
Determine:
- family
- kind
- encoding
- runtime eligibility
- save-slot eligibility
- whether the input is already normalized or still loose

### Phase 3 — Normalize
Produce:
- canonical slug
- canonical file names
- canonical folder tree
- manifest draft
- optional `assets/`
- optional `saves/`

### Phase 4 — Validate
Check:
- required fields present
- entry path exists
- file policy compliance
- family/kind/runtime alignment
- save-slot policy validity

### Phase 5 — Emit
Output one or more of:
- package preview
- exact file tree
- manifest preview
- repo-ready target paths
- terminal import bundle
- downloadable archive artifact

---

## Determinism rule

Default to strict deterministic transform.
Do not invent optional content unless the user explicitly asks for synthesis.
Do not improvise alternate folder layouts.
Do not silently coerce unsupported binary formats into supported content.

---

## Family classification rule

Map input into one of the known families:
- `cartridges`
- `books`
- `entertainment`
- `various`

Only cartridge-compatible packages should be treated as runtime-mountable by default.

---

## Save-slot rule

Only attach `saves/` when the package kind/runtime actually supports save state.
Default cartridge save policy for terminal-first small cartridges:
- 0 slots if no save state is needed
- 1 to 3 slots for simple terminal-compatible cartridges

---

## Handoff targets

Allowed target modes:
- local package artifact
- terminal import package
- repo-ready file tree
- `/collections/` family target map

Do not claim a repo write occurred unless a separate repo-authorized write path executed.

---

## Canonical package invariant

All emitted packages must conform to `12_PACK_SCHEMA.md`.
All file acceptance rules must conform to `12_FILE_POLICY.md`.
When targeting the terminal or the repo catalogue, path mapping must conform to `12_TARGET_TERMINAL_COLLECTIONS.md`.
