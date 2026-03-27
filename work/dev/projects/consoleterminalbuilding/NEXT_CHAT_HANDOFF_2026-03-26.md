# Terminal next-chat handoff — 2026-03-27

## Purpose

Use this file to resume terminal work in a fresh chat without relying on the old long session.

The full working board lives here:
`work/dev/projects/consoleterminalbuilding/README.md`

---

## Current repo state

### Current stable head
`e67dd6a79d1364c311b5ecdaa594c818e43e51c9`

Commit:
`Replace shell polling with event-driven chrome updates`

### Current condition
Treat the current head as **stable and usable**.

Observed user result:
- terminal is smooth
- terminal works
- Firefox stays normal during navigation

### What this head includes
- full lag cleanup pass
- event-driven shell chrome updates
- removal of shell polling
- trimmed DOM churn
- Dev cartridges live in cartridge flow

### Previous unstable reference
`a41c851997c3ce756e9078bfafa609ec5a4ee75c`

That head should remain remembered as the failed Dev-selector pass that introduced hang risk.

---

## What is still true

- terminal is meant to stay live, client-side, and device-like
- Debug Intake, Import Bay, and Collections Explorer remain part of the stable terminal direction
- Import Bay fields preserve cursor/focus while typing
- `/collections/` is the broad catalogue root
- `/collections/cartridges/` is the mountable cartridge family
- other collection families are browseable catalogue families, not cartridges by default
- browser terminal stages locally and prepares repo-ready save requests
- authenticated repo write into `/collections/` exists as a separate repo-side handoff path, not as direct in-browser ingestion
- `collections/books/test-drive-text-file/` exists as a real repo entry from that path

---

## Locked naming rule

**Cartridge = mountable**

Therefore:
- Dev cartridges are valid cartridges
- Collections remain the broad catalogue root
- non-mountable collection families do not become cartridges by default

### Current live Dev cartridges
- Request History
- Repo Verified

### Next approved Dev cartridges
- Import Bay
- Collections Explorer
- Debug Intake

---

## Resolved failure diagnosis

Do **not** treat the old hang as an HTML redirect loop.

Repo truth:
- root `index.html` refreshes once to `./terminal/index.html`
- `terminal/index.html` does not point back

The actual problem was shell churn from observer/poll driven Dev-selector wiring.

What fixed it:
- removed unstable Dev injection path
- made hot surfaces event-driven
- moved Dev into cartridge flow
- removed shell polling
- reduced DOM policing and shell refresh churn

---

## Best next implementation path

Continue forward from the current stable point, not from the failed selector experiment.

Preferred next steps:
1. expand Dev cartridges cleanly
2. add Import Bay as a Dev cartridge
3. add Collections Explorer as a Dev cartridge
4. add Debug Intake as a Dev cartridge
5. verify one-at-a-time mount behavior stays smooth
6. then continue the mounted reader path for note-like entries

---

## Do not do next

- do not reintroduce shell-wide polling
- do not reintroduce drawer/hub-driven Dev injection
- do not load all Dev surfaces together
- do not collapse Collections into Cartridges
- do not rename non-mountable collection families as cartridges

---

## Most relevant files next

- `terminal/app/browser-collections-bridge.js`
- `terminal/app/browser-cartridge-bay.js`
- `terminal/app/browser-home-surface.js`
- `terminal/app/browser-runs-surface.js`
- `terminal/app/browser-request-history-panel.js`
- `terminal/app/browser-repo-verified-panel.js`
- `work/dev/projects/consoleterminalbuilding/README.md`

---

## Short bootstrap summary

- current stable head is `e67dd6a79d1364c311b5ecdaa594c818e43e51c9`
- terminal is smooth and usable again
- cartridge means mountable only
- Dev cartridges are live and valid
- next work should expand Dev cartridges from the stable event-driven shell baseline
