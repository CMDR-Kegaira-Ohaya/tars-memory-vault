# General zip import (job spec)

This is the **general** importer for large payloads (avoids API base64 issues).

## Drop-zones
- Zips: `ops/import/zips/`
- Jobs: `ops/import/jobs/`
- Archive: `ops/import/archive/`

## Strict destination policy (Option set 1)
Allowed destination roots:
- `toolkit/`
- `ops/data/`
- `assets/`

Hard-denied destinations:
- `.github/`
- `tools/`
- `vault/`
- `ops/relay/`

## Default mode
- `"merge"` (overwrites same-path files, but **does not delete** anything).

## Job format
Create a JSON file in `ops/import/jobs/`:


```json
{
  "zip": "ops/import/zips/<payload>.zip",
  "dest": "toolkit/library/<somewhere>/",
  "mode": "merge",
  "max_zyp_mb": 200
}
```

Optional validation:
- `require_files`: list of files that must exist at extracted root
- `require_dirs`: list of directories that must exist at extracted root

Example (manual preset):

```json
{
  "zip": "ops/import/zips/TARS-manual-v1-text-2026-03-04.zip",
  "dest": "toolkit/manuals/tars-manual/v1/TARS-manual-v1-text-2026-03-04/",
  "mode": "replace",
  "require_files": ["TOC.md"],
  "require_dirs": ["chapters", "appendices"],
  "max_zip_mb": 200
}
```

## What happens on success
- The zip is moved to `ops/import/archive/zips/`
- The job is moved to `ops/import/archive/jobs/`
- Extracted files are copied into the requested destination
