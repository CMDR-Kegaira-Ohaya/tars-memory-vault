# PROCEDURE: EXPORT_PREFLIGHT

PROCEDURE: EXPORT_PREFLIGHT
CATEGORY: release
SYSTEM: manual-export
TRIGGER: export manual / build pdf
TOOLS: pandoc, checksum pipeline
INPUTS: manual markdown files
OUTPUTS: PDF + SHA256SUMS
SAFETY: read-only repo operation

# Appendix G - Packaging + Install Preflight (v2 CURRENT)

This manual is authored as **zipped markdown** first (to avoid lag), then optionally rendered to PDF.

## G.1 Inputs

- The v2 manual folder (markdown files)
- Optional: `SHA256SUMS.txt` for the zip artifact
- The target install destination (CURRENT):
  - `toolkit/manuals/tars-manual/current/`

## G.2 Hygiene scan (text stability)

Confirm:

- UTF‑8 encoding
- LF line endings
- final newline in every file
- no NBSP / zero‑width spaces / soft hyphens
- prefer Unicode NFC normalization
- avoid “smart quotes” in code blocks

If a hidden character is suspected:
`[[QUARANTINE: hidden character suspected]]`

## G.3 Version stamping (plain counter, CURRENT-only)

Rule:

- `VERSION.md` **first line** is the live version ID (plain counter series):
  - `v2-live-0001`, then `v2-live-0002`, …

This bump is **manual at packaging time** (no automation).

Recommended places to repeat the version:

- `00_TITLEPAGE.md` (human-readable)
- `CHANGELOG.md` (what changed)

## G.4 Packaging rule (zip structure)

Importer chooses the extracted root like this:

- if the zip contains exactly **one** top-level folder and no top-level files → that folder is treated as root.

So package as:

- `TARS-manual-v2-text-2026-03-05.zip`
  - `TARS-manual-v2-text-2026-03-05/`
    - `00_TITLEPAGE.md`
    - `TOC.md`
    - `chapters/`
    - `appendices/`
    - …

Avoid extra top-level files in the zip.

## G.5 Install preflight: importer job spec (replace)

For installing the manual to CURRENT, use **mode: `replace`** (deterministic snapshot).

Example job JSON:

```json
{
  "zip": "ops/import/zips/TARS-manual-v2-text-2026-03-05.zip",
  "dest": "toolkit/manuals/tars-manual/current/",
  "mode": "replace",
  "max_zip_mb": 200,
  "require_files": ["TOC.md", "VERSION.md"]
}
```

Execution checklist:

1) Add the zip to `ops/import/zips/`
2) Add the job JSON to `ops/import/jobs/`
3) Push to `main`
4) Confirm Actions run succeeded
5) Confirm `ops/import/archive/...` has the archived zip + job

Verification checklist (operator-facing):

- `manual: versions` returns `v2-live-0001`
- `manual: toc` renders correctly
- `manual: search <query>` works
- `manual: cite <query>` returns references
- `manual: open <path>` opens a real file under CURRENT
