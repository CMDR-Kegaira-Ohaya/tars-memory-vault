## Purpose
Repo-side operating map for future sessions.
Use this file so the assistant can quickly regain orientation in the repo without asking the user to steer low-level repo structure.

## First lookup order
When resuming repo work, start from:
1. `REPO_BOOTSTRAP.md`
2. `repo-manual/core/00_ORIENTATION.md`
3. `repo-manual/core/01_SYSTEM_MAP.md`
4. this file
5. task-specific refs or working board

## Current repo landmarks

### Terminal runtime
- live runtime root: `terminal/`
- main entry: `terminal/index.html`
- browser/runtime logic: `terminal/app/`
- manifests: `terminal/manifests/`
- save-state path: `terminal/saves/`

### Collections catalogue
- shared catalogue root: `collections/`
- family indexes:
  - `collections/index.v1.json`
  - `collections/books/index.v1.json`
  - `collections/cartridges/index.v1.json`
  - `collections/entertainment/index.v1.json`
  - `collections/various/index.v1.json`

Important current rule:
- `collections/cartridges/` = mountable cartridge family
- other collection families remain catalogue families, not mountable cartridges by default

### Terminal self-reference
- `repo-manual/refs/terminal/TARS_TERMINAL_REFERENCE.md`
- `repo-manual/refs/terminal/TARS_TERMINAL_OPERATOR_GUIDE.md`

### GPT-side packaging reference install
- `repo-manual/refs/gpt/README.md`
- `repo-manual/refs/gpt/00_ROOT_INDEX_PACKAGER_PATCH.md`
- `repo-manual/refs/gpt/12_PACKAGER.md`
- `repo-manual/refs/gpt/12_FILE_POLICY.md`
- `repo-manual/refs/gpt/12_PACK_SCHEMA.md`
- `repo-manual/refs/gpt/12_TARGET_TERMINAL_COLLECTIONS.md`

### Terminal working continuity
- long board: `work/dev/projects/consoleterminalbuilding/README.md`
- short handoff: `work/dev/projects/consoleterminalbuilding/NEXT_CHAT_HANDOFF_2026-03-26.md`

## Current terminal reality
The terminal is not just a static page anymore.
It now includes active screen-native operator surfaces and import/catalogue capability.

Current notable terminal screens:
- Home
- Cartridges
- Collections
- Boards
- Request History
- Repo Verified
- Debug Intake
- Import Bay
- Collections Explorer

## Current user-facing capability baseline
Working now:
- terminal is smooth and stable again
- Import Bay accepts local UTF-8 `.json`, `.md`, `.txt`
- Collections Explorer shows repo-indexed plus local staged entries
- terminal can create repo-ready save request envelopes
- Debug Intake works for structured relay/debug
- Request History and Repo Verified are real dev/operator inspection surfaces

Not yet fully implemented:
- direct authenticated repo ingestion from terminal into `/collections/`

## Current repo-touching habits that are validated
For routine file writes through the connector:
- prefer `saveFile`
- read the current file first when updating
- include the current `sha` when updating existing files

For lower-level multi-file or exact-tree work:
- use blob/tree/commit/ref flow only when needed

## Workflow notes
Current workflow baseline should prefer Node 24.
Do not preserve Node 20 just to quiet transition warnings.

Relevant workflow area:
- `.github/workflows/`

Relevant workflow/manual support:
- `repo-manual/workflows/`
- `repo-manual/troubleshooting/`

## Pages / live runtime notes
Pages is active and the terminal is the live front-end target.
Repo root now redirects into terminal runtime instead of acting as a dead landing page.

Relevant files:
- root `index.html`
- `.github/workflows/deploy-pages.yml`
- `.github/workflows/terminal-live-verify.yml`
- `.github/workflows/pages-readiness.yml`

## How future sessions should choose the right source

### If the task is “how does the terminal work?”
Start with:
- terminal reference
- terminal operator guide
- handoff file
- then terminal code only if needed

### If the task is “how do I continue the current terminal project?”
Start with:
- handoff file
- working board
- terminal reference

### If the task is “how should files/packages/imports behave?”
Start with:
- GPT-side packaging refs
- terminal reference
- collections indexes and current terminal code

### If the task is “how do I guide the user inside terminal?”
Start with:
- terminal operator guide

### If the task is “where do I write in repo?”
Start with:
- system map
- this file
- task-specific subtree

## Working rule for future sessions
Do not make the user carry repo wayfinding.
Use these files as the assistant’s orientation layer first.
The assistant should guide the user, not require the user to reconstruct the repo architecture from memory.
