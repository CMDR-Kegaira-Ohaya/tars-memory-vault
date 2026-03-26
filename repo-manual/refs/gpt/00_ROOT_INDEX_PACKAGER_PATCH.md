## Purpose
Canonical patch note for adding a packaging branch to the GPT-side root orchestration file.
This is not live by itself.
It is the exact design intent to mirror into the hidden GPT-side `00_ROOT_INDEX.md` later.

## Required index additions
Add the following entries to the INDEX table:

| File | Role |
| --- | --- |
| `12_PACKAGER.md` | Routed transform branch for import, normalization, packaging, validation, and handoff |
| `12_FILE_POLICY.md` | Strict file-handling policy for accepted types, encoding, path safety, and archive safety |
| `12_PACK_SCHEMA.md` | Canonical package schema and folder layout |
| `12_TARGET_TERMINAL_COLLECTIONS.md` | Terminal target profile and `/collections/` family mapping |

## Required TOC patch
Insert a new step after Step 2 — Repo branch check and before Step 3 — Generator selection.

### Step 2.5 — Packaging branch
Is the turn primarily about importing, normalizing, packaging, manifesting, file handoff, save-slot shaping, or preparing content for terminal/repo ingestion?

- **Yes** → dispatch to `12_PACKAGER.md`
- `12_PACKAGER.md` may consult:
  - `12_FILE_POLICY.md`
  - `12_PACK_SCHEMA.md`
  - `12_TARGET_TERMINAL_COLLECTIONS.md`
- If the packaging branch resolves the task deterministically, continue directly to `20_EDITOR.md`
- If unresolved design ambiguity remains, continue to Step 3 — Generator selection

## Design rule
The packaging branch is transform-plane, not control-plane.
It does not own switches, archetypes, governance, or repo authority.
It exists to keep file/package normalization out of the normal freeform reasoning cycle.

## Outcome
The packager becomes:
- hard-routed
- deterministic-first
- schema-driven
- reusable across terminal import, repo-ready packaging, and later archive/export flows
