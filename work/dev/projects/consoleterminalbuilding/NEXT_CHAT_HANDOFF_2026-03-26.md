# Terminal next-chat handoff — 2026-03-26

## Purpose

Use this file to resume work in a fresh chat without relying on the old long session.

This is a concise current-state handoff for the terminal project.

The full long-form working board still lives here:
`work/dev/projects/consoleterminalbuilding/README.md`

## Current overall state

The terminal is live, usable, and smooth again.

Stable now:
- no longer laggy
- no more flashing screen
- no more vanishing buttons
- Debug Intake works
- Import Bay works
- Collections Explorer works
- Import Bay fields no longer lose cursor focus while typing

The live terminal should be treated as stable for the current pass.

## Live terminal

- Direct path: `terminal/index.html`
- Pages root redirects to terminal
- Browser testing ended up working in Chrome and Firefox

- it was confirmed that Firefox was a big part of an earlier perceived lag issue, but the code-side lag and blinking bugs were also real and were fixed

## Current design direction (locked for now)

The terminal is now screen-first and device-like.

Current shell direction:
- compact header
- fixed dominant main screen
- control legend below the screen
- selector rail below the control legend
- main screen does not resize with content
- long content scrolls inside the screen
- visual palette = dark base, lilac structure, subtle teal-cyan glow
- content text stays easy bright grey, not high-saturation gui color

Do not redesign the shell unless explicitly asked.

## Current screen contexts

- Home
- Cartridges
- Collections
- Boards
- Request History
- Repo Verified
- Debug Intake
- Import Bay
- Collections Explorer

## Current import + catalogue model

Current v1 works:
- terminal can import local UTF-8 `.json`, `.md`, `.txt`
- user can drag/drop or use file picker in Import Bay
- terminal can stage the imported item locally
- terminal can show a repo-ready save-request envelope
- terminal can copy or download that request envelope
- Collections Explorer can browse:
  - repo indexed entries
  - locally staged entries

## Honest boundary (still true)

The browser terminal does not yet directly write into the repo ``/collections/`` tree.

Current version only:
- stages locally
- prepares the save request envelope
- leaves actual repo write for a future authenticated path

## Leaving-0ff point on GPT-side packaging

The GPT-side packager design was agreed and installed as a repo-reference install, not as a live hidden-stack mutation.

Installed reference set:
- `repo-manual/refs/gpt/README.md`
- `repo-manual/refs/gpt/00_ROOT_INDEX_PACKAGER_PATCH.md`
- `repo-manual/refs/gpt/12_PACKAGER.md`
- `repo-manual/refs/gpt/12_FILE_POLICY.md`
- `repo-manual/refs/gpt/12_PACK_SCHEMA.md`
- `repo-manual/refs/gpt/12_TARGET_TERMINAL_COLLECTIONS.md`

Key decision:
 - packaging should be a hard-routed transform branch
 - file handling should be strict
 - terminal target assumptions should be separate from generic file policy

## Current `collections/` rule (locked)

- `collections/` = shared catalogue root
- `collections/cartridges/` = mountable cartridge family
- `collections/books/`, `collections/entertainment/`, `collections/various/` = broader catalogue families
- do not collapse all collection families into "cartridges"

## Current canonical package shape (locked)

```text
<slug>/
  manifest.json
  content/
  assets/        (optional)
  saves/        (optional)
```

Schema: `tars-pack.v1`

## Most recent stable code head
- `1ebbf69e4a698552de45b86ab7c57c462374ecc6`
- commit message: `Preserve import bay cursor while typing`

## Recent important commits for this pass

- `1ebbf69e4a698552de45b86ab7c57c462374ecc6` — fixed Import Bay caret /cursor disappearing while typing
- `51277356fdb090c6fd55db6ed29e1948c9ae4989` — added Import Bay, Collections Explorer, and `collections/*/index.v1.json`
- `2977c1919bf813e722de4cbd862a82b3979ab0e5` — added GPT-side packager reference install
- `837d6f59bb020a38edd0bfcef7d3f1a19997429a` — stable Debug Intake cleanup
- `204c318ea29d1179ae3d34767b830114e1975d70` — stabilized Debug Intake and added terminal reference layer

## Files most likely to be touched next

### Terminal code
- `terminal/app/browser-boards-bridge.js`
- `terminal/app/browser-runs-surface.js`
- `terminal/app/browser-repo-verified-panel.js`

### Catalogue data
- `collections/index.v1.json`
- `collections/books/index.v1.json`
- `collections/cartridges/index.v1.json`
- `collections/entertainment/index.v1.json`
- `collections/various/index.v1.json`

### GPT-side packaging references
- `repo-manual/refs/gpt/*


## Best next step (strongest not yet done)

Implement the real repo-save path from terminal save request into `/collections/` through a proper authenticated handoff.

That means:
- the user stages or imports in Import Bay
- terminal prepares the repo-ready save request
- the system writes the package into the correct `collections/<family>/<slug>/` path
- Collections Explorer then sees it as a repo entry, not just a local stage

## First non-goal for the next chat

Do not redesign the shell.
Do not blow up the Import Bay or Explorer UX into a machine before the repo-save path exists.
Do not collapse `/collections/` families into one super-cartridge idea.

## Good opening instruction for a new chat

When resuming, start from:
- `this handoff` file
- `work/dev/projects/consoleterminalbuilding/README.md`
- `repo-manual/refs/terminal/TARS_TERMINAL_REFERENCE.md`
- `repo-manual/refs/gpt/*` if the turn touches packaging or file handling

## Operator note

If the next chat only needs a quick bootstrap, the short summary is:

- Terminal is stable and smooth
- Import Bay / Collections Explorer are live
- staging works locally
- repo save path is the next major implementation target
- `collections/` remains the broad catalogue root
- `collections/cartridges/` remains the mountable cartridge family
