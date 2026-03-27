# Terminal next-chat handoff — 2026-03-27

## Purpose

Use this file to resume terminal work in a fresh chat without relying on the old long session.

The full working board lives here:
`work/dev/projects/consoleterminalbuilding/README.md`

---

## Current repo state

### Current head
`a41c851997c3ce756e9078bfafa609ec5a4ee75c`

Commit:
`Show Dev surface selector in main screen`

### Current condition
Treat the current head as **unstable**.

Observed user result:
- terminal entry can hang
- reported error: `RESULT_CODE_HUNG`

### Last clearly usable baseline
`996763999198d213b96cd27ec229ead37d46ac45`

Use that as the last clearly safe reference point for terminal behavior.

---

## What is still true

- terminal is meant to stay live, client-side, and device-like
- Debug Intake, Import Bay, and Collections Explorer were working on the stable baseline
- Import Bay fields preserve cursor/focus while typing
- `/collections/` is the broad catalogue root
- `/collections/cartridges/` is the mountable cartridge family
- other collection families are browseable catalogue families, not cartridges by default
- browser terminal stages locally and prepares repo-ready save requests
- authenticated repo write into `/collections/` exists as a separate repo-side handoff path, not as direct in-browser ingestion
- `collections/books/test-drive-text-file/` exists as a real repo entry from that path

---

## Newly locked naming rule

**Cartridge = mountable**

Therefore:
- Dev cartridges are valid cartridges
- Books / Entertainment / Various stay collection families unless a specific entry becomes mountable
- Collections remain the broad catalogue root

---

## Current failure diagnosis

Do **not** treat the hang as an HTML redirect loop.

Repo truth:
- root `index.html` refreshes once to `./terminal/index.html`
- `terminal/index.html` does not point back

Likely real cause:
- `browser-home-surface.js` introduced observer + DOM mutation + interval-refresh loop risk
- especially around `runsViewport`, Dev-hub rendering, and `setInterval(refresh, 1500)`

---

## Best next repair

Patch through from the current understanding, not by repeating a broad shell rewrite.

Preferred next steps:
1. remove drawer/hub-driven Dev injection
2. stop observing `runsViewport`
3. remove interval refresh from `browser-home-surface.js`
4. treat Dev surfaces as separate mountable Dev cartridges
5. reuse the cartridge selection/mount pattern if easiest
6. mount only one Dev cartridge at a time

---

## Do not do next

- do not redesign the whole shell again in one pass
- do not load all Dev surfaces together
- do not collapse Collections into Cartridges
- do not rename non-mountable collection families as cartridges
- do not describe the current head as stable

---

## Most relevant files next

- `terminal/app/browser-home-surface.js`
- `terminal/app/browser-runs-surface.js`
- `terminal/app/browser-request-history-panel.js`
- `terminal/app/browser-repo-verified-panel.js`
- `terminal/app/browser-collections-bridge.js`
- `terminal/app/browser-cartridge-bay.js`
- `work/dev/projects/consoleterminalbuilding/README.md`

---

## Short bootstrap summary

- current head is unstable and can hang
- stable baseline exists before the Dev-selector pass
- cartridge now means mountable only
- Dev cartridges are valid cartridges
- next repair should reuse one-at-a-time mount logic, not all-at-once Dev injection
