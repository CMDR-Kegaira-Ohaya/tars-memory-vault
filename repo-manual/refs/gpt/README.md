## Purpose
This directory holds canonical repo-side reference drafts for GPT-side stack extensions.

## Boundary
These files do not alter the hidden GPT instruction stack by themselves.
They are the canonical source to mirror into the GPT-side layer later.

## Current install set
- `00_ROOT_INDEX_PACKAGER_PATCH.md` — exact root-index patch for the packaging branch
- `12_PACKAGER.md` — routed transform module design
- `12_FILE_POLICY.md` — strict file-handling contract
- `12_PACK_SCHEMA.md` — canonical package schema and folder layout
- `12_TARGET_TERMINAL_COLLECTIONS.md` — target profile for terminal + `/collections/`

## Working rule
Treat this directory as the reference install surface for future GPT-side module additions.
Do not confuse it with the live hidden instruction stack.
