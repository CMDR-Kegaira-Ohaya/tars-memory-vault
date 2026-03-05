# Manual import (legacy convenience)

This drop-zone exists for backwards compatibility:
- Put manual zips under `ops/import/manual/`
- The manual importer unpacks into `toolkit/manuals/tars-manual/vN/<zip-stem>/`
- It then moves the zip to `ops/import/manual/archive/`

**New preferred path (general importer):**
1) Put the zip in `ops/import/zips/`
2) Create a job spec in `ops/import/jobs/` (see `ops/import/README.md`)
3) Push to `main`.

## Required zip structure (at extracted root)
- `TOC.md` (install marker)
- `chapters/`
- `appendices/ `

## Limits
- Default max zip size: 200 MB (override via env in workflow if needed)
