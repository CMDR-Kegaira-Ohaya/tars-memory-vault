# CONSOLE TERMINAL WORKING BOARD

## Purpose

This is the live working board for the terminal project.

It records:
- current repo truth
- current stable vs unstable state
- locked architecture rules
- the agreed naming model
- the current failure diagnosis
- the next repair path

This board is the implementation truth for fresh repo-side terminal work.
If chat continuity and this board diverge, this board wins.

---

## Current project state

### Current repo head
`a41c851997c3ce756e9078bfafa609ec5a4ee75c`

Commit:
`Show Dev surface selector in main screen`

### Current live condition of that head
Treat the current head as **unstable**.

Observed result:
- terminal can hang before entry
- user reported `RESULT_CODE_HUNG`

### Last clearly usable baseline before the Dev-selector pass
`996763999198d213b96cd27ec229ead37d46ac45`

That baseline included:
- workflow-doc sync fix
- systems-check strip pass
- earlier save-context and request-history/repo-verified fixes
- terminal stable enough for normal browsing

Do not describe the current head as stable until the hang is repaired and rechecked.

---

## Stable truths that remain locked

These stay true unless explicitly changed by the user or contradicted by the repo.

- terminal is meant to stay live, client-side, and device-like
- Debug Intake works in the stable baseline
- Import Bay works in the stable baseline
- Collections Explorer works in the stable baseline
- Import Bay fields keep cursor and focus while typing
- `/collections/` is the broad catalogue root
- `/collections/cartridges/` is the mountable cartridge family
- other collection families are browseable catalogue families, not cartridges by default
- browser terminal can stage locally and prepare repo-ready save requests
- direct authenticated in-browser repo ingestion into `/collections/` is still not the browser path
- authenticated repo-save handoff from terminal save-request output into `/collections/` has been proven externally through repo-side write flow
- `collections/books/test-drive-text-file/` exists as a real repo entry from that handoff path

---

## Current naming rule now locked

### Cartridge rule
**Cartridge = mountable**

That is now the clean naming rule.

Implications:
- mountable things are cartridges
- non-mountable catalogue entries are not cartridges by default
- Dev cartridges are valid cartridges
- Books, Entertainment, Various, and similar families stay collection families unless a specific entry gets a real mount path

### Collections rule
**Collections = broad catalogue**

Collections remain the browse root and should not be collapsed into cartridges.

### Dev rule
**Dev surfaces should become Dev cartridges when they are mountable in-terminal**

Approved examples:
- Request History
- Repo Verified
- Import Bay
- Collections Explorer
- Debug Intake

This is a UX and architecture rule, not yet a completed runtime implementation.

---

## Current architecture direction

### Shell direction
Keep the shell compact and screen-first.
Do not redesign the shell wholesale during the repair pass.

### Navigation direction
Main navigation should stay human-facing.
Operator/inspection surfaces should not compete with primary browsing navigation.

### Systems strip direction
The former shortcut/control row is better treated as a systems check / EWS strip.
It should read as status, not as the main way to move around.

### Dev direction
Dev should become a proper destination.
Inside Dev, the user should select one Dev surface and mount only that one surface into the main screen.

### Reader-first direction
The terminal still needs a true mounted content reader for note-like entries.
Mounting should eventually lead to reading, not only to state inspection.

---

## Current failure diagnosis

### What the current hang is most likely caused by
The current hang is **not** best explained by the root `index.html` redirect.

Confirmed repo structure:
- root `index.html` refreshes once to `./terminal/index.html`
- `terminal/index.html` does not redirect back

So this is not an HTML ping-pong loop.

### More likely cause
The likely cause is the current `browser-home-surface.js` Dev-selector wiring.

Most likely failure pattern:
- mutation observers watch multiple regions
- one watched region is `runsViewport`
- Dev-hub rendering prepends/removes DOM inside `runsViewport`
- the same file then reacts to that mutation and re-renders again
- the file also keeps a periodic `setInterval(refresh, 1500)`

Likely result:
- self-triggering DOM mutation loop
- repeated refresh pressure
- browser hang before normal use

### Operational conclusion
Treat the current problem as:
**observer + DOM mutation + interval refresh loop risk in `browser-home-surface.js`**

Do not spend time blaming the root redirect unless new evidence appears.

---

## Repair direction now locked

The preferred repair is **not** to keep stabilizing the current drawer/hub injection model.

The preferred repair is:

1. remove drawer/hub-driven Dev injection
2. stop observing `runsViewport`
3. remove interval-refresh fallback from `browser-home-surface.js`
4. treat Dev items as separate mountable units
5. reuse the cartridge selection/mount pattern if that is the easiest path
6. mount only one Dev cartridge at a time into the main screen

This means the safer final direction is:

- `Dev` in main nav
- Dev selector list visible in the normal selector area or main screen
- one active Dev cartridge at a time
- no hidden all-at-once Dev drawer dependency
- no hub DOM repeatedly injected into the same watched viewport

---

## Current implementation target order

### Immediate target
Repair the hang introduced by the Dev-selector pass without blind rollback logic.

### Preferred next sequence
1. patch out the self-triggering Dev-hub / observer loop
2. re-express Dev surfaces as separate mountable Dev cartridges
3. mount one Dev cartridge at a time
4. verify entry stability
5. only then continue UX cleanup

### Do not do next
- do not attempt another broad shell rewrite in one jump
- do not load all Dev surfaces at once
- do not blur Collections and Cartridges
- do not rename non-mountable collection families as cartridges
- do not redesign the shell before the hang is fixed
- do not treat runtime clicks as direct repo mutation

---

## Repo-save truth

The repo-save path is now split into two truths and both must be stated clearly.

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

## Files most relevant to the current repair

### Immediate code surface
- `terminal/app/browser-home-surface.js`

### Related runtime surfaces
- `terminal/app/browser-runs-surface.js`
- `terminal/app/browser-request-history-panel.js`
- `terminal/app/browser-repo-verified-panel.js`
- `terminal/app/browser-collections-bridge.js`
- `terminal/app/browser-cartridge-bay.js`

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
4. treat the current head as unstable until the hang is repaired
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

The terminal should get more coherent as it grows, not merely more layered.
