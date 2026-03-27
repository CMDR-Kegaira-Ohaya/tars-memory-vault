## CONSOLE TERMINAL WORKING BOARD

## Purpose

This is the live working board for the TARS terminal/shell project.

It records:
- current repo truth
- last clearly stable terminal code baseline
- the current strategic shift
- locked machine/body rules
- control doctrine
- self-referential tooling defaults
- next implementation order

This board is the implementation truth for fresh repo-side terminal work.
If chat continuity and this board diverge, this board wins.

---

## Current repo state

### Last clearly stable terminal code baseline
`e67dd6a79d1364c311b5ecdaa594c818e43e51c9`

Commit:
`Replace shell polling with event-driven chrome updates`

Why it still matters:
- terminal was smooth
- terminal was usable
- Firefox no longer hung globally
- event-driven shell updates proved safer than polling-driven shell churn

### Last live terminal integration head
`a1cb1498245f37c4271393193bc9f2023575af8f`

Commit:
`Unify Home runtime state with loaded main-screen content`

Observed user result:
- site works
- site is not laggy
- the runtime loop behaves better
- the ONLY confirmed old-shell remainder is missing `Eject`

### Current repo head
`ab408d68dfeea88a3d08717342a20e4d5913567b`

What this head mainly reflects:
- repo-manual self-referential updates
- terminal ops / surgery defaults documented
- tooling anchors now present in the manual

This is the current repo head, but it is not the same thing as a fully-new TARS shell prototype yet.

---

## Strategic shift - current direction

The project is no longer primarily about piecemeal polishing the old web-terminal chrome.

The project is now about:
- building a real physical-looking TARS body
- making the shell the face of TARS
- keeping chat as the voice of TARS
- keeping the mind distributed across runtime + repo + procedures

The photo-shell is carrying the new authority now.
The HTML mockup is a bridge artifact, not the final destination.

---

## Locked identity contract

### TARS identity
This is not a skinned web app.
It is a machine body for TARS.

Identity here:
- Body = retro handmade-coding homage
- Face = shell
- Voice = chat
- Mind = distributed across runtime, repo, procedures, and working state
- Tone = explicit, engineered, legible

### Brand rule
The badge/plate area under the main screen should become TARS branding, not Amstrad/CPC branding.

---

## Locked machine model

### Zone map
**1. Main CRT** = the only true primary payload surface.  
**2. Footer command line** = the authoritative control truth strip for the current state.  
**3. Right monitor** = machine condition, EWS, service, debug signals.  
**4. Loader bay** = media ingress/egress locus.  
**5. Control deck** = operator command grammar.

### Main screen rule
**Main CRT = Main screen**

It shows:
- Home by default
- loaded books
- mounted cartridges
- boards/readouts
- overlays, dialogs, and HUDs when active

### Home rule
**Home = the Main CRT's default payload**

Home is not a separate place to navigate to.
Home is what the Main CRT shows when no alternate payload is active.

### Loader rule
**Loader bay = media ingress/egress**

The loader handles:
- Load
- Repo Load
- Import Files
- media presence
- Eject

It does not become a primary reader.

### Right monitor rule
**Right monitor = machine condition, not a second full app**

It should show:
- EWS signals
- machine-condition status
- service/debug indicators
- compact telemetry

It should not be overloaded with full app density.

### Runtime rule
**One primary payload at a time**

This means:
- select elsewhere
- experience in the Main CRT
- mount one active thing at a time
- move old high-density dev subfaces into overlays, service modes, or secondary surfaces

---

## Control doctrine

### Hardware set
In the new shell, the fixed hardware set is:
- D-pad
- A
- B
- Select
- Start
- Alt
- Esc

### Control truth rule
**Buttons are fixed; meanings are live; footer command line declares current truth.**

The footer command line inside the CRT is:
- persistent when interactive
- short-verb based
- authoritative
- the place the operator looks to know what the buttons do *right now*

Example style:
`A Open   B Back   Start Mount   Select System   Alt More   Esc Close`

### Soft rules
- D-pad usually navigates focus/selection
- A/B/Start are highly context-driven
- Select/Alt/Esc remain semi-systemic but still declared by the footer line
- no hidden static button lore should override the footer command line

---

## Locked design rules

Keep:
- sparse, legible CRT payload
- strong hierarchy
- tactile body identity
- explicit state/control truth
- engineered presence, not generic sci-fi chrome

Avoid:
- cluttering the CRT with old web-panel density
- treating the photo as a raster to bake behavior into
- hidden control meanings
- right monitor as a full second app
- generic sci-fi dashboard language
- mystical AI imagery

### Presentation calibration
The shell should read like:
- retro-machine homage outside
- structured cognition architecture inside

This is not cute retro cosplay.
This is not a generic ai-core/dashboard.
This is TARS in a device body.

---

## Old shell status - what is now demoted

The old shell is still usable as a bridge and reference base.

Current observed truth:
- the site works
- it is not laggy
- the main regression still observed there is missing `Eject`

### Decision about `Eject`
`Eject` remains a real issue in the old shell.
But it is no longer the primary strategic target unless the old shell must be retained as a longer-term production surface.

### Decision about minor typhos
Purely cosmetic or low-impact typo fixes in the old shell are deferred unless they block the current bridge use.

---

## Self-referential tooling defaults

For future terminal surgery, do not start with blunt whole-file rewrites when a small anchored change will do.

Preferred order of operation:
1. inspect the relevant surface, symbol, or path
2. use `tools/repo_patch/safe_repo_patch.py` for small anchored edits when possible
3. run `python tools/terminal_ops/terminal_validate_chain.py`
4. use live smoke / deploy verification only when needed

Canonical anchors that now exist in the repo-manual:
- `repo-manual/core/00_ORIENTATION.md`
- `repo-manual/refs/terminal/TARS_TERMINAL_REFERENCE.md`
- `repo-manual/refs/terminal/TARS_TERMINAL_OPERATOR_GUIDE.md`
- `tools/terminal_ops/OPERATOR_NOTE.md`

### Tools worth remembering
- `tools/repo_patch/safe_repo_patch.py`
- `tools/terminal_ops/terminal_entry_audit.py`
- `tools/terminal_ops/terminal_cut_check.py`
- `tools/terminal_ops/terminal_slice.py`
- `tools/terminal_ops/terminal_rewrite.py`
- `tools/terminal_ops/terminal_live_smoke.py`
- `tools/terminal_ops/terminal_validate_chain.py`
- `tools/terminal_ops/terminal_pages_artifact_verify.py`
- `tools/terminal_ops/terminal_repo_diff.py`
- `tools/terminal_ops/terminal_force_redeploy.py`

---

## Immediate next implementation order

### Next phase = first live TARS shell prototype
1. write the DOM/zone contract for the photo-based shell
2. build the first live shell prototype over the shell geometry
3. bind the Main CRT payload to the existing runtime surface
4. add the footer command-line renderer
5. add the right-monitor status renderer
6. add the loader-bay state renderer
7. move old dev/rawpanel density into overlays, service modes, or secondary surfaces

### Bridge rule
Until the new shell prototype exists, the current HTML mockup and the existing terminal logic connections remain the bridge layer.

---

## Do not do next

- do not continue piecemeal polish of the old shell as if it were the final destination
- do not bake functional text or dynamic control truth into a raster image
- do not treat the right monitor as a second full app
- do not clutter the CRT with always-visible dev panels
- do not reintroduce shell-wide polling
- do not realign button meanings as hidden global lore that overrides the footer command line
- do not collapse collection families into cartridges by default

---

## Files most relevant now

### Core runtime / current bridge
- `terminal/index.html`
- `terminal/app/browser-runtime.js`
- `terminal/app/browser-home-surface.js`
- `terminal/app/browser-runs-surface.js`
- `terminal/app/browser-collections-bridge.js`
- `terminal/app/browser-collections-browser.js`
- `terminal/app/browser-cartridge-bay.js`


### Manual / self-reference
- `repo-manual/core/00_ORIENTATION.md`
- `repo-manual/refs/terminal/TARS_TERMINAL_REFERENCE.md`
- `repo-manual/refs/terminal/TARS_TERMINAL_OPERATOR_GUIDE.md`
- `tools/terminal_ops/OPERATOR_NOTE.md`


### Project continuity
- `work/dev/projects/consoleterminalbuilding/README.md`
- `work/dev/projects/consoleterminalbuilding/NEXT_CHAT_HANDOFF_2026-03-26.md`


---

## Fresh-chat operator guidance

When resuming in a fresh chat:
1. start from this working board
2. treat `e67dd6a79d1364c311b5ecdaa594c818e43e51c9` as the last clearly stable terminal code baseline
3. treat `a1cb1498245f37c4271393193bc9f2023575af8f` as the last live terminal integration head
4. treat `ab408d68dfeea88a3d08717342a20e4d5913567b` as the current repo head with manual/self-referential updates
5. do not rediscover the old terminal metaphor from scratch
6. proceed toward the photo-based TARS shell prototype, not back into minor old-shell polishing
