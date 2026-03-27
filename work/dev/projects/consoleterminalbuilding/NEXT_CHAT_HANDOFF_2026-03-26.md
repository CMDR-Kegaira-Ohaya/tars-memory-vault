# Terminal next-chat handoff — 2026-03-27

## Purpose

Use this file to resume terminal work in a fresh chat without relying on the old long session.

The full working board lives here:
`work/dev/projects/consoleterminalbuilding/README.md`

---

## Current truth

### Last clearly stable terminal code baseline
`e67dd6a79d1364c311b5ecdaa594c818e43e51c9`

### Last live terminal integration head
`a1cb1498245f37c4271393193bc9f2023575af8f`

Observed result there:
- site works
- site is not laggy
- old-shell runtime loop behaves better
- only confirmed old-shell remainder is missing `Eject`

### Current repo head
`ab408d68dfeea88a3d08717342a20e4d5913567b`

This head mainly reflects:
- repo-manual self-reference updates
- terminal surgery/tool defaults documented
- better future-session anchors

---

## Strategic shift

Do not continue as if the old web-terminal chrome is the destination.

Current direction:
- photo shell is the new chassis authority
- HTML mockup is a bridge artifact
- next phase is the first live TARS shell prototype

Identity split now locked:
- shell = face
- chat = voice
- runtime + repo + procedures = mind

---

## Locked shell truths

- Main CRT = only primary payload surface
- Home = default Main CRT state
- right monitor = machine condition / EWS / service signals
- loader bay = media ingress/egress
- footer command line = authoritative button meaning display
- control deck = D-pad, A, B, Select, Start, Alt, Esc
- plate branding should become TARS branding

Buttons are fixed.
Meanings are live.
Footer command line tells the operator what is true now.

---

## Self-reference and tooling defaults

For repo-side terminal surgery, prefer:
1. inspect the relevant surface/path/symbol
2. use `tools/repo_patch/safe_repo_patch.py` for small anchored edits
3. run `python tools/terminal_ops/terminal_validate_chain.py`
4. use live smoke / deploy verification only when needed

Canonical anchors:
- `repo-manual/core/00_ORIENTATION.md`
- `repo-manual/refs/terminal/TARS_TERMINAL_REFERENCE.md`
- `repo-manual/refs/terminal/TARS_TERMINAL_OPERATOR_GUIDE.md`
- `tools/terminal_ops/OPERATOR_NOTE.md`

---

## Best next implementation path
1. write the DOM/zone contract for the photo-based shell
2. build the first live shell prototype over the shell geometry
3. bind Main CRT payload to current runtime
4. add footer command-line renderer
5. add right-monitor status renderer
6. add loader-bay state renderer
7. move old dev/raw-panel density into overlays or service modes

---

## Do not do next

- do not keep polishing the old shell as if it is the destination
- do not bake dynamic control text into raster art
- do not treat the right monitor as a second full app
- do not clutter the CRT with permanent dev density
- do not reintroduce shell-wide polling
- do not override footer-declared button truth with hidden lore

---

## Most relevant files next

- `terminal/index.html`
- `terminal/app/browser-runtime.js`
- `terminal/app/browser-home-surface.js`
- `terminal/app/browser-runs-surface.js`
- `terminal/app/browser-collections-bridge.js`
- `terminal/app/browser-collections-browser.js`
- `terminal/app/browser-cartridge-bay.js`
- `work/dev/projects/consoleterminalbuilding/README.md`

---

## Bootstrap summary

- old shell is usable but demoted
- photo shell is the new authority
- current task is the first live TARS shell prototype
- use repo_patch + terminal_ops defaults instead of blunt rewrites
