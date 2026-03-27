# CONSOLE TERMINAL WORKING BOARD

## Purpose

This is the live working board for the terminal project.

It records:
- current repo truth
- stable baseline vs current integration head
- locked architecture rules
- the agreed machine model
- known regressions
- next implementation priority

This board is the implementation truth for fresh repo-side terminal work.
If chat continuity and this board diverge, this board wins.

---

## Current repo state

### Stable baseline
`e67dd6a79d1364c311b5ecdaa594c818e43e51c9`

Commit:
`Replace shell polling with event-driven chrome updates`

Why it still matters:
- terminal was smooth
- terminal was usable
- Firefox no longer hung globally
- event-driven shell updates proved safer than polling-driven shell churn

### Current integration head
`8c456b01ebe170ebca8e453013c1fb08158354b2`

Commit:
`Make Repo Load click directly load into Home`

Current verification state:
- partly verified
- Repo Load now directly loads into Home
- Home content becomes visible for repo text entries
- user confirmed steps 1 to 6 of the direct-load flow
- `Eject` still does not render after a successful load

Operational truth:
- do **not** treat the current head as the new fully stable baseline yet
- use it as the active integration head with one known runtime/UI regression: missing `Eject`

### Previous known unstable head`
`a41c851997c3ce756e9078bfafa609ec5a4ee75c`

Commit:
`Show Dev surface selector in main screen`

Why it stays documented:
- it introduced hang risk
- it produced `RESULT_CODE_HUNG`
- it increased live DOM churn in Firefox

---

## Locked machine model

### Main screen rule
**Main screen = the monitor**

There is one main display surface.
The system should be understood like an old computer, not like a modern multi-page app.

### Home rule
**Home = the Main screen's default payload**

Home is not a separate place to navigate to.
Home is what the Main screen shows when no alternate payload is active.

### Cartridge rule
**Cartridges = mountable media**

Best mental model:
- diskettes in an old 286
- or media on an Amstrad CPC 6128

Cartridges are media candidates, not rooms.
They are selected from a bay and then loaded into the machine.

### Collections rule
**Collections = broad catalogue**

Collections stay the broad repo catalogue.
Collections are not the same thing as cartridges.
Non-mountable catalogue families should not be renamed as cartridges by default.

### Load rule
**Load = ingress**

User-facing load options:
- `Repo Load` = browse repo-backed Collections files, excluding cartridges
- `Import Files` = bring in external or local files

`Repo Load` is task-oriented entry into repo file browsing.
It is not a cartridge path.

### Boards rule
**Boards = selectable sources**

Boards are also source-side selectors.
They should not become their own runtime room.

### Runtime rule
**Select elsewhere, experience in the Main screen**

Source surfaces select.
The Main screen displays the active payload.

This means:
- load a book -> read it in the Main screen
- mount a cartridge -> use it in the Main screen
- open a board -> view it in the Main screen

### Eject rule
**Eject = action, not screen**

Frontend meaning:
- one visible action
- clear the active thing

Backend may still distinguish:
- unmount mounted item
- clear imported transient state
- clear staged transient import state

Frontend should not expose that distinction.
`Eject` returns the Main screen to default Home state.

---

## Locked UI rules

### Systems check / EWS strip
The former shortcut/control row is status only.
It should read as systems check / EWS, not as the main way to move around.

### Primary navigation
Primary navigation should stay human-facing and compact.
Avoid reintroducing control-board overload.

### Dev surfaces
Dev surfaces should continue moving into Dev cartridge form when they are truly mountable in-terminal.
Mount one Dev cartridge at a time.

Current live Dev cartridges:
- Request History
- Repo Verified

Approved next Dev cartridges:
- Import Bay
- Collections Explorer
- Debug Intake

### Layout Debug HUD
Approved concept:
- dev utility / dev cartridge behavior
- invoked as an overlay over the **Main screen's current payload**
- not a separate routed destination

\nRequired functions:
- layout report
- toggle outlines
- copy layout report

\nImportant framing:
- it inspects the live composed page
- it overlays whatever the Main screen is currently showing
- it is not "opened from Home"; Home is just one possible current payload

---

## Stable truths that remain locked

- terminal should stay live, client-side, and device-like
- event-driven shell updates are safer than polling-driven shell churn
- `/collections/` is the broad catalogue root
- `/collections/cartridges/` is the mountable cartridge family
- browser-side staging is not the same thing as authenticated repo write
- runtime clicks are not implicit repo mutation
- one mounted surface at a time is safer than all-surface injection
- `collections/books/test-drive-text-file/` exists as a real repo entry
- direct Repo Load now goes to Home content instead of remaining selection-only

---

## Known current regression

### Missing Eject after successful direct load
Current observed behavior at `8c456b01ebe170ebca8e453013c1fb08158354b2`:
- clicking `Test Drive Text File` from Repo Load now loads it
- Home content is shown
- pathing behaves correctly
- `Eject` still is nowhere to be found

This is the immediate next repair target.

---

## Immediate next implementation order

1. fix `Eject` visibility/state binding after successful load
2. verify `Eject` returns the Main screen to default Home state
3. add Layout Debug HUD as Main-screen overlay tooling
4. continue Dev-cartridge conversion path
5. continue improving real mounted reader/runtime behavior

---

## Do not do next

- do not reintroduce shell-wide polling
- do not reintroduce drawer/hub-driven Dev injection
- do not treat Home as a routed room separate from Main screen
- do not treat cartridges as rooms
- do not blur Collections and Cartridges
- do not expose staging jargon in frontend UX
- do not claim a head is stable when a core control is still missing

---

## Files most relevant now

### Core runtime
- `terminal/app/browser-runtime.js`
- `terminal/app/browser-collections-browser.js`
- `terminal/app/browser-collections-bridge.js`
- `terminal/app/browser-home-surface.js`
- `terminal/app/browser-runs-surface.js`
- `terminal/app/browser-cartridge-bay.js`

### Project continuity
- `work/dev/projects/consoleterminalbuilding/README.md`
- `work/dev/projects/consoleterminalbuilding/NEXT_CHAT_HANDOFF_2026-03-26.md`

---

## Fresh-chat operator guidance

When resuming in a fresh chat:
1. start from this working board
2. treat `e67dd6a79d1364c311b5ecdaa594c818e43e51c9` as the last clearly stable baseline
3. treat `8c456b01ebe170ebca8e453013c1fb08158354b2` as the current integration head
4. preserve the DOS-style machine model above
5. repair `Eject` before claiming the current line fully stable
