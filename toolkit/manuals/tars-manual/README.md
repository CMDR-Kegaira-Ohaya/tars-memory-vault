# TARS Manual (repo tool, CURRENT-only)

This folder makes the manual **queryable** inside the hub repo via the relay worker (`tools/relay_worker.py`).

## Structure (CURRENT-only)

- `current/` — the **live** manual used by operators and by TARS self-referentially
  - `TOC.md` — table of contents
  - `VERSION.md` — **first line** is the live version ID (plain counter), e.g. `v2-live-0001`
  - `chapters/` and `appendices/` — book content

> Deprecated snapshots (e.g. `v1/`) are **not** part of the tool surface.  
> OP-A keeps an immutable v1 off-repo (HDD). If `v1/` exists in git during migration, the relay tool will ignore it.

## Installing/updating CURRENT

Preferred: use the general importer (zip → repo) with `mode: "replace"` targeting:

- `toolkit/manuals/tars-manual/current/`

Bump `current/VERSION.md` **manually at packaging time** (`v2-live-0002`, `v2-live-0003`, …).

## Using the manual via relay

Send a relay inbox message with `channel: "manual"` and a body like:

- `manual: help`
- `manual: versions`  → returns the live ID (e.g. `v2-live-0001`)
- `manual: toc`
- `manual: search ops-critical`
- `manual: cite stop-point`
- `manual: open chapters/CH05A2_opb_tandem_switchboard.md --lines 80`

### Deprecated version tokens

If a user includes a legacy token like `v1`:

- `manual: toc v1`

The worker responds explicitly:

- `Deprecated versions not available; using current. (ignored: v1)`

…and then proceeds using CURRENT.

## Safety

The relay worker will only read files **under**:

- `toolkit/manuals/tars-manual/current/`

It refuses path traversal and any paths outside CURRENT.
