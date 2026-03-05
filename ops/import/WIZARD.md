# Import Wizard Protocol (Repo)

This repo supports **general payload uploads** using a safe zip importer + per-upload job specs.

## What this is for
- Upload *any* folder tree (projects, libraries, assets, datasets) as **one zip**
- Avoid GitHub Contents API base64 limits/errors for big multi-file payloads
- Install content into a **bounded destination root** in the repo via GitHub Actions

## Allowed destination roots (strict policy)
The importer will only write under:
- `toolkit/`
- `ops/data/`
- `assets/`

It will refuse destinations under:
- `.github/`
- `tools/`
- `vault/`
- `ops/relay/`

## The 6-question wizard (how to use with TARS)
When you tell TARS: “I want to upload X”, TARS should ask:
1) Destination class: `toolkit/` vs `ops/data/` vs `assets/`
2) Destination path under that root
3) Mode:
   - `merge_no_overwrite` (default library mode; never clobbers)
   - `merge` (overwrites same-path files; no deletions)
   - `replace` (deletes destination first; snapshot mode)
4) Optional guards: `require_dirs`, `require_files`
5) Zip naming and size cap
6) Output: exact repo paths + ready-to-paste job JSON

## Mechanics (what you do)
1) Create a zip locally (keep the internal structure as you want it installed).
2) Upload zip to: `ops/import/zips/<payload>.zip`
3) Add a job spec: `ops/import/jobs/<job>.json`
4) Push to `main`

GitHub Actions runs `.github/workflows/import_jobs.yml` and:
- safely extracts the zip
- copies into the destination
- archives the zip + job under `ops/import/archive/...`
- commits the installed files back to `main`

## Job spec format
Required:
- `zip`: repo path to zip (must be under `ops/import/`)
- `dest`: destination path (must be under an allowed root)

Optional:
- `mode`: `merge` | `merge_no_overwrite` | `replace`
- `max_zip_mb`: default is 200MB if omitted
- `require_files`: list of files that must exist in the extracted root
- `require_dirs`: list of dirs that must exist in the extracted root

### Example (library mode; no clobber)
```json
{
  "zip": "ops/import/zips/rpg-library.zip",
  "dest": "toolkit/library/rpg/",
  "mode": "merge_no_overwrite",
  "require_dirs": ["systems", "campaigns"],
  "max_zip_mb": 200
}
```

### Example (snapshot mode; deterministic)
```json
{
  "zip": "ops/import/zips/snapshot.zip",
  "dest": "toolkit/snapshots/mything/",
  "mode": "replace",
  "max_zip_mb": 200
}
```

## Manual policy note
The **v1 manual snapshot is immutable**. Operational improvements (like this importer) should be documented in repo docs immediately, and integrated into the manual only via a **post‑v1 addendum release** (e.g. `v1.1/` or `v2/`).
