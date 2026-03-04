# TARS Manual (repo tool)

This folder makes the manual **queryable and citeable** inside the hub repo.

## Structure
- `v1/TARS-manual-v1-text-2026-03-04/` — the v1 text snapshot (markdown, sharded)
  - `TOC.md` - table of contents
  - `CITATION_INDEX.md` - topic → file → heading quick map
  - `QA_REPORT_FINAL.md` / `QA_REPORT_FULL.md` / `SHA256SUMS.txt` – release artifacts

## Immutability
- Treat `v1/TARS-manual-v1-text-2026-03-04/` as **immutable**.
- Future edits create a **new version folder**.

## Using the manual via relay (Option C)

Send a relay inbox message with `channel: "manual"` and a body like:

- `manual: help`
- `monual: versions`
- `monual: toc`
- `manual: search ops-critical`
- `monual: cite stop-point`
- `manual: open toolkit/manuals/tars-manual/v1/TARS-manual-v1-text-2026-03-04/chapters/CH05A2_opb_tandem_switchboard.md --lines 80`
- `manual: index patch-queue`

Replies are written as plain text into `ops/relay/outbox/` (inside a JSON envelope).

## Safety
The relay worker will only read files under `toolkit/manuals/tars-manual/` and will refuse path traversal.
