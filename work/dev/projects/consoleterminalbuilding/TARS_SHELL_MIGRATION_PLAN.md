# TARS Shell Migration Plan

## Purpose

This file defines the implementation order for moving from the old terminal shell into the photo-based TARS shell without losing the current working runtime.

It is not the shell spec.
It is not the DOM contract.
It is the transition plan.

---

## 1. Strategic rule

Do not continue polishing the old shell as if it is the destination.

Use the old shell as:
- bridge
- runtime donor
- logic source
- verification reference

Build the new shell as:
- the real chassis
- the new visible system
- the future stable surface

---

## 2. What stays true during migration

Keep these truths locked:

- Main CRT is the only primary payload surface
- Home is the default Main CRT state
- right monitor is machine condition / EWS / service signal
- loader bay is media ingress / egress
- footer command line is authoritative control truth
- buttons are fixed, meanings are live
- old runtime producers may stay temporarily if they can feed the new shell
- avoid shell-wide polling and heavy DOM churn

---

## 3. Migration posture

Prefer:
- thin bridge adapters
- renderer replacement
- hidden legacy sources
- one-directional migration
- small checkpoints

Avoid:
- giant rewrites with no bridge
- reintroducing laggy shell chrome
- multiple competing visible shells
- copying old UI furniture into the new chassis
- treating debug/dev panels as permanent first-class visible payload

---

## 4. Phase 1 — freeze authority

Goal:
lock the photo shell as chassis authority.

Tasks:
- freeze shell identity rules
- freeze zone map
- freeze input/control doctrine
- freeze accessibility guardrails
- store the contracts in repo/project files

Exit condition:
the shell rules are no longer chat-only.

Status:
completed in planning terms.

---

## 5. Phase 2 — static chassis prototype

Goal:
put the photo shell on page as the visible chassis with no major runtime migration yet.

Tasks:
- add shell art asset
- create `#tarsShell`
- create `#tarsChassis`
- position:
  - `#tarsMainCrt`
  - `#tarsSideMonitor`
  - `#tarsLoaderBay`
  - `#tarsControlDeck`
- add `#crtBadgePlate` with TARS branding
- keep old runtime sources hidden, not removed

Exit condition:
the page visually reads as the TARS machine even before deep behavior is wired in.

---

## 6. Phase 3 — CRT bridge

Goal:
move visible primary experience into the Main CRT.

Tasks:
- map `runsViewport` into `#crtPayload`
- map `homeSummary` into Home payload inside `#crtPayload`
- move old visible payload logic behind CRT renderers
- ensure payload scroll stays internal to CRT
- ensure chassis geometry does not resize with content

Exit condition:
the Main CRT becomes the only visible primary payload surface.

---

## 7. Phase 4 — side-monitor bridge

Goal:
move machine-state readout into the right monitor.

Tasks:
- map `statusStrip` into `#sideMonitorBody`
- create compact status rendering
- define monitor modes:
  - system
  - ews
  - debug
  - verify
- prevent this surface from becoming a second app

Exit condition:
right monitor shows machine condition without competing with the CRT.

---

## 8. Phase 5 — command-line renderer

Goal:
replace old action/nav rows with the footer command line.

Tasks:
- create `commandMap` renderer
- feed `#crtCommandLine` from shell state
- map old `actions` data into command-line truth temporarily
- ensure fixed slot order
- ensure short labels
- ensure text-entry mode does not leave misleading action text active

Exit condition:
the operator can read current button meaning from the footer command line.

---

## 9. Phase 6 — control deck wiring

Goal:
bind physical shell controls to the shared dispatcher.

Tasks:
- wire D-pad buttons
- wire A / B
- wire Select / Start / Alt / Esc
- unify button clicks with keyboard dispatch
- respect play mode vs text-entry mode
- respect overlay/dialog precedence

Exit condition:
all shell controls flow through one coherent dispatch layer.

---

## 10. Phase 7 — loader bay migration

Goal:
make the loader bay the true ingress/egress locus.

Tasks:
- render loader state
- render media presence
- surface:
  - Load
  - Repo Load
  - Import Files
  - Eject
- keep reader/runtime behavior out of the bay
- move old load/eject confusion into loader-scoped logic

Exit condition:
loading and ejecting feel like device/media actions, not page navigation.

---

## 11. Phase 8 — overlay / dialog / HUD layers

Goal:
move diagnostic density and temporary flows out of the main visible shell chrome.

Tasks:
- implement `#crtOverlayLayer`
- implement `#crtDialogLayer`
- implement `#crtHudLayer`
- place Layout Debug HUD here
- place confirm/eject dialogs here
- place service/inspect overlays here

Exit condition:
the CRT stays clean while advanced surfaces remain available.

---

## 12. Phase 9 — legacy chrome removal

Goal:
remove old visible shell furniture after bridge equivalence exists.

Tasks:
- retire visible old nav strip
- retire visible old action strip
- retire visible old panel layout
- keep only hidden bridge nodes if still needed
- remove hidden bridge nodes once new producers/consumers fully replace them

Exit condition:
the photo shell is not cosmetically wrapped around old visible terminal furniture.

---

## 13. Phase 10 — runtime cleanup

Goal:
simplify the codebase after the new shell is live.

Tasks:
- identify dead bridge paths
- remove duplicate renderers
- shrink state duplication
- keep event-driven updates
- preserve performance constraints
- validate after each cleanup step

Exit condition:
new shell runs on its own structure rather than on transitional scaffolding.

---

## 14. Validation rule during migration

For terminal work, prefer this order:
1. inspect relevant path/symbol/surface
2. make small surgical patch if possible
3. run terminal validation chain
4. use live smoke / deploy verification only when needed

Keep performance guardrails:
- no shell-wide polling
- no broad subtree observers unless strictly necessary
- no repeated full-screen rerenders during typing
- no decorative continuous animation across many nodes

---

## 15. Immediate implementation order

The immediate next build order is:

1. static photo-shell chassis
2. Main CRT payload bridge
3. right-monitor status bridge
4. footer command-line renderer
5. control deck dispatcher wiring
6. loader bay renderer
7. overlay/dialog/HUD layers
8. legacy visible chrome removal
9. cleanup pass

---

## 16. Do not do next

- do not drift back into old-shell micro-polish
- do not fix cosmetic old-shell issues unless they block the bridge
- do not treat the right monitor as a second full app
- do not bake dynamic behavior into raster art
- do not hide button meaning outside the footer command line
- do not make keyboard controls always-on
- do not reintroduce lag through shell-wide observation or polling

---

## 17. Success condition

Migration succeeds when:

- the page visibly reads as TARS
- the Main CRT is the only primary payload surface
- the right monitor reads as machine condition
- the loader bay owns load/eject meaning
- the control deck feels coherent
- the footer command line tells the truth
- runtime remains smooth
- old visible shell furniture is gone
- the new shell no longer depends on transitional bridge nodes for core behavior

---

## 18. Working rule for future sessions

When implementation resumes:
- start from the shell spec
- then DOM / zone contract
- then input / control contract
- then this migration plan

Do not restart from loose conceptual discussion unless the project intentionally changes direction.
