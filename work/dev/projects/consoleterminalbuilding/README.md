# CONSOLE TERMINAL WORKING BOARD

## Purpose

This is the live working board for the terminal project.

It records:
- current repo truth
- current stable vs unstable state
- locked architecture rules
- the agreed naming model
- the resolved failure path
- the next implementation path

This board is the implementation truth for fresh repo-side terminal work.
If chat continuity and this board diverge, this board wins.

---

## Current project state

### Current stable repo head
`e67dd6a79d1364c311b5ecdaa594c818e43e51c9`

Commit:
`Replace shell polling with event-driven chrome updates`

### Current live condition of that head
Treat the current head as **stable and usable** for continued terminal work.

Observed user result:
- terminal is smooth
- terminal works
- Firefox no longer hangs or drags globally

### Stability notes
This stable point includes the full lag cleanup pass after the failed Dev-selector experiment.
It is the new reference point for further terminal work.

### Previous unstable head that caused the hang
`a41c851997c3ce756e9078bfafa609ec5a4ee75c`

Commit:
`Show Dev surface selector in main screen`

That head should remain documented as the failed Dev-selector pass that introduced hang risk.

---

## Stable truths that remain locked

These stay true unless explicitly changed by the user or contradicted by the repo.

- terminal is meant to stay live, client-side, and device-like
- Debug Intake works in the stable terminal lineage
- Import Bay works in the stable terminal lineage
- Collections Explorer works in the stable terminal lineage
- Import Bay fields keep cursor and focus while typing
- `/collections/` is the broad catalogue root
- `/collections/cartridges/` is the mountable cartridge family
- other collection families are browseable catalogue families, not cartridges by default
- browser terminal can stage locally and prepare repo-ready save requests
- direct authenticated in-browser repo ingestion into `/collections/` is still not the browser path
- authenticated repo-save handoff from terminal save-request output into `/collections/` has been proven externally through repo-side write flow
- `collections/books/test-drive-text-file/` exists as a real repo entry from that handoff path

---

## Locked naming rule

### Cartridge rule
**Cartridge = mountable**

That remains the clean naming rule.

Implications:
- mountable things are cartridges
- non-mountable catalogue entries are not cartridges by default
- Dev cartridges are valid cartridges
- Books, Entertainment, Various, and similar families stay collection families unless a specific entry gets a real mount path

### Collections rule
**Collections = broad catalogue**

Collections remain the browse root and should not be collapsed into cartridges.

### Dev rule
**Dev surfaces become Dev cartridges when they are mountable in-terminal**

Current live Dev cartridges:
- Request History
- Repo Verified

Approved next Dev cartridges:
- Import Bay
- Collections Explorer
- Debug Intake

---

## Current architecture direction

### Shell direction
Keep the shell compact and screen-first.
Do not redesign the shell wholesale unless there is a strong reason.

### Navigation direction
Main navigation should stay human-facing.
Operator and inspection surfaces should not compete with primary browsing navigation.

### Systems strip direction
The former shortcut/control row is better treated as a systems check / EWS strip.
It should read as status, not as the main way to move around.

### Dev direction
Dev surfaces should continue moving into the cartridge model.
Mount only one Dev cartridge at a time into the main screen.
Do not return to drawer or hub injection patterns.

### Reader-first direction
The terminal still needs a true mounted content reader for note-like entries.
Mounting should eventually lead to reading, not only to state inspection.

---

## Resolved failure path

### What failed
The failed Dev-selector pass in `browser-home-surface.js` introduced a high-risk pattern:
- mutation observers watching multiple regions
- self-triggering DOM mutation loops
- interval-based refresh pressure
- large shell churn under Firefox

That path produced:
- `RESULT_CODE_HUNG`
- laggy entry
- global Firefox slowdown

### What was confirmed not to be the cause
The root redirect was not the cause.

Confirmed repo structure:
- root `index.html` refreshes once to `./terminal/index.html`
- `terminal/index.html` does not redirect back

So this was not an HTML ping-pong loop.

### What fixed it
The stable fix came from reducing live refresh pressure and shell churn.

Key repair outcomes:
- removed unstable Dev-hub / drawer injection from the hot path
- made `browser-home-surface.js` event-driven instead of observer/poll driven
- moved Dev surfaces into cartridge flow instead of all-at-once Dev injection
- trimmed Dev-cartridge DOM hooks
- replaced shell polling with event-driven shell chrome updates in `browser-collections-bridge.js`
- removed shell-wide `setInterval(renderShellChrome, 1500)`
- removed bridge mutation-observer churn

Operational conclusion:
**event-driven shell updates are the safe baseline**

---

## Current live runtime shape

### Shell
- shell chrome is event-driven
- shell no longer relies on global polling for chrome refresh
- shell no longer relies on the earlier high-churn Dev selector experiment

### Cartridge flow
- cartridge bay is still the main mountable selector path
- Dev cartridges now appear inside the cartridge flow
- current live Dev cartridges are:
  - Request History
  - Repo Verified

### Collections truth
- Collections remain the broad browse catalogue
- Cartridges remain mountable things only
- Dev cartridges are valid cartridges under that rule

---

## Current implementation target order

### Immediate next target
Expand the Dev-cartridge path cleanly from the current stable baseline.

### Preferred next sequence
1. convert Import Bay into a Dev cartridge path
2. convert Collections Explorer into a Dev cartridge path
3. convert Debug Intake into a Dev cartridge path
4. verify one-at-a-time mount behavior stays smooth
5. then continue the mounted reader path for note-like entries

### Do not do next
- do not reintroduce shell-wide polling
- do not reintroduce drawer/hub-driven Dev injection
- do not load all Dev surfaces at once
- do not blur Collections and Cartridges
- do not rename non-mountable collection families as cartridges
- do not treat runtime clicks as direct repo mutation

---

## Repo-save truth

The repo-save path is split into two truths and both must stay explicit.

### Browser-side truth
Inside the browser terminal, the user can:
- import or stage content
- generate a repo-ready save request
- inspect save-side status surfaces

### Repo-write truth
The actual authenticated repo write into `/collections/` is a separate handoff path.
It is not the same thing as direct authenticated in-browser write.

This distinction must stay explicit in future work.

---

## Files most relevant now

### Core runtime files
- `terminal/app/browser-collections-bridge.js`
- `terminal/app/browser-cartridge-bay.js`
- `terminal/app/browser-home-surface.js`
- `terminal/app/browser-runs-surface.js`
- `terminal/app/browser-request-history-panel.js`
- `terminal/app/browser-repo-verified-panel.js`

### Runtime shell entry
- `terminal/index.html`
- `index.html`

### Project continuity
- `work/dev/projects/consoleterminalbuilding/README.md`
- `work/dev/projects/consoleterminalbuilding/NEXT_CHAT_HANDOFF_2026-03-26.md`

---

## Fresh-chat operator guidance

When resuming in a fresh chat:

1. start from this working board
2. then read the handoff file
3. then read the terminal reference files if needed
4. treat `e67dd6a79d1364c311b5ecdaa594c818e43e51c9` as the current stable reference point
5. do not rediscover the architecture from scratch
6. preserve the locked rules above

---

## Working rule

Keep the terminal coherent by preserving these distinctions:

- Collections = browseable catalogue
- Cartridges = mountable things only
- Dev cartridges = valid mountable cartridges
- Systems strip = status, not primary navigation
- Runtime interaction = not implicit repo mutation
- Browser staging = not the same as authenticated repo write
- One mounted surface at a time is safer than all-surface injection
- Event-driven updates are safer than polling-driven shell churn

The terminal should get more coherent as it grows, not merely more layered.
