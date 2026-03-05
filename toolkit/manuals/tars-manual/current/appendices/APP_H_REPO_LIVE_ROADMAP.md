# Appendix H - Repo Live Manual (CURRENT operations)

This is an **instruction set** (v2). It replaces the roadmap framing.

## H.1 Scope boundary
- v1 is an immutable snapshot kept off-repo by OP‑A (HDD).
- The repo hosts **one operational manual surface**: CURRENT.
- TARS should consult the repo manual **self‑referentially** during operation.

## H.2 Where CURRENT lives
Repo path:

- `toolkit/manuals/tars-manual/current/`

The tool reads from this location only.

What “CURRENT-only” means:
- No citations/rollbacks to deprecated manual snapshots from inside TARS.
- A “version” exists only as a **live ID**, not a browsable history.

## H.3 Live version ID (plain counter)
The live manual keeps a rolling identifier:

- `toolkit/manuals/tars-manual/current/VERSION.md`

Rule:
- **first line only** is the ID, e.g. `v2-live-0001`.
- increment the counter **manually at packaging time**.

`manual: versions` returns this ID only.

## H.4 How updates happen (zip → importer → CURRENT replace)

### Why this is the default
- avoids GitHub Content API base64/sha failure classes for bulk uploads
- preserves folder structure reliably
- importer has guardrails against common zip attacks

### The update steps
1) Prepare the new manual folder (markdown).
2) Bump the live ID in `VERSION.md` (first line).
3) Create a zip with one top-level folder (clean root).
4) Create an importer job with mode `replace` targeting CURRENT.
5) Push zip + job JSON to `main`.
6) Verify the Actions run succeeded.
7) Run manual smoke tests via relay (toc/search/cite/open).

### Denied destinations (never propose)
Do not import to:
- `.github/`
- `tools/`
- `vault/`
- `ops/relay/`

### Allowed destination roots (Option set 1)
- `toolkit/`
- `ops/data/`
- `assets/`

## H.5 “No junk folders” stance
Importer archives inputs automatically:
- `ops/import/archive/zips/`
- `ops/import/archive/jobs/`

Treat these as audit history, not as a working directory.

## H.6 Verification rule (epistemic clarity)
At time of implementation, do not assume.
Verify the live surface directly:

- `manual: versions` (confirm live ID)
- `manual: toc` (structure)
- `manual: search` (indexing sanity)
- `manual: cite` (citation behavior)
- `manual: open` (path discipline)

If a statement in the snapshot conflicts with CURRENT, prefer CURRENT.

