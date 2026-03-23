# 00_ORIENTATION.md

## Purpose
Primary human and system entry point for the repo-side layer.

## What this repo is
This repository is the private repo-side support layer for TARS.
It holds canonical repo guidance, active work areas, content collections, and operational history.

## Current state
- Repo state: Build State
- Branch model: main only
- Manual maturity: partial but installed
- Connector reference home: `repo-manual/refs/connector/`
- Troubleshooting home: `repo-manual/troubleshooting/`

## Read order
1. `REPO_BOOTSTRAP.md`
2. `repo-manual/core/01_SYSTEM_MAP.md`
3. `repo-manual/core/10_ROUTER.md`
4. `repo-manual/core/11_PIPELINES.md`

## Working rule
Use:
- `work/` for unstable drafts and in-progress material
- `repo-manual/` for stable repo guidance
- `collections/` for subject/content holdings
- `logs/` for decisions and incidents
- `.github/workflows/` for executable workflow files

## Important connector note
The connector is live and useful for normal reads and direct file writes.
For now, prefer `saveFile` over low-level ref movement for ordinary repo changes.
