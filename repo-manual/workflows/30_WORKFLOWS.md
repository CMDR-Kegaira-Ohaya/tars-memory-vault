# 30_WORKFLOWS.md

## Purpose
This file documents workflow intent, boundaries, and workflow-map references.

## Boundary
- Workflow documentation lives here
- Executable workflow files live in `.github/workflows/`

## Current live workflows

- `repo-health.yml` — positive structure and entry-surface check
- `scaffold-guard.yml` — negative drift guard for known old-shape scaffold paths
- `doc-sync.yml` — keeps workflow files and workflow docs aligned
- `connector-self-sync.yml` — keeps the connector self-layer aligned with the current connector profile
- `pages-readiness.yml` — checks Pages readiness only after a Pages surface is introduced
- `internal-link-guard.yml` — checks internal markdown links under `repo-manual/`

## Workflow intent

### repo-health.yml
Use to confirm that the repo still has the key canonical entry surfaces and core spine files we expect.

This workflow should fail if the spine is accidentally removed or broken.

### scaffold-guard.yml
Use to confirm that old-shape scaffold drift does not re-enter the repo.

This workflow should fail if known legacy path drift reappears.

### doc-sync.yml
Use to confirm that executable workflows are still represented in the workflow docs layer.

This workflow should fail if a workflow file exists in `.github/workflows/` but is not named in `repo-manual/workflows/30_WORKFLOWS.md`.

### connector-self-sync.yml
Use to confirm that the connector self-layer still reflects the current custom connector profile.

This workflow should fail if the connector reference layer loses the current version marker, loses the fresh ref operations, or regains legacy ref-operation names.

### pages-readiness.yml
Use to guard the future Pages installation path.

Before Pages exists, this workflow stays permissive and reports that Pages has not been introduced yet.
After a Pages surface appears, it enforces the basic Pages readiness checks.

### internal-link-guard.yml
Use to confirm that internal markdown links under `repo-manual/` still resolve.

This workflow should fail if internal documentation links drift out of date.

## Next workflow options
- Pages deployment workflow
- Markdown lint workflow
- Connector validation or self-sync expansion workflow

## Working rule
Add a workflow only when it enforces a real rule, protects the repo, or saves meaningful manual work.
Do not add workflows only to make the repo look busier.
