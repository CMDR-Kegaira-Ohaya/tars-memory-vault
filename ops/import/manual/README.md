# Manual import drop-zone

Drop a manual release zip here and the repo will unpack it into repo-native markdown.

## How to use

1) Upload a zip into this folder:

- `ops/import/manual/<something>.zip`

Example:
- `ops/import/manual/TARS-manual-v1-text-2026-03-04.zip`

2) Push to `main`.

3) GitHub Actions will:
- validate the zip (anti-zip-slip; no symlinks)
- extract it
- copy it into:

`toolkit/manuals/tars-manual/vN/>zip-stem/ `

Where `v` is inferred from the zip filename (e.g. `-v1-` -> `v1`).

4) The zip is then moved to:

- `ops/import/manual/archive/<zipname>.zip`

## Required zip structure (at extracted root)

- `TOC.md` (install marker)
- `chapters/`
- `appendices/`

If your zip wraps everything in a single top-level folder, that's fine. The importer will treat that folder as the root.

## Limits

- Default max zip size: 200 MB (override with `~MANUAL_IMPORT_MAX_ZIP_BYTES~` in workflow env if needed).
