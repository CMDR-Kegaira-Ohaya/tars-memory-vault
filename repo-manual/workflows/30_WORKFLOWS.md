# 30_WORKFLOWS.md

## Purpose
This file documents workflow intent, boundaries, and workflow-map references.

## Boundary
- Workflow documentation lives here
- Executable workflow files live in `.github/workflows/`

## Current live workflows

- `repo-health.yml` — positive structure and entry-surface check
- `repo-health-diagnostic.yml` — manual diagnostic sweep for expected repo surfaces
- `scaffold-guard.yml` — negative drift guard for known old-shape scaffold paths
- `doc-sync.yml — keeps workflow files and workflow docs aligned
- `connector-self-sync.yml — keeps the connector self-layer aligned with the current connector profile
- `pages-readiness.yml` — checks Pages readiness only after a Pages surface is introduced
- `deploy-pages.yml` — deploys the terminal surface to GitHub Pages
- `terminal-live-verify.yml` — runs the terminal validation chain after a successful Pages deploy
- `internal-link-guard.yml` — checks internal markdown links under `repo-manual/`

## Workflow runtime baseline
- Node 24 is the workflow runtime baseline for this repo.
- Keep workflow maintenance aimed at the latest action versions that run on Node 24.
- Do not treat Node 20 warnings by themselves as a rollback trigger.
- Current transition markers recorded in the self layer:
  - Node 20 EOL: April 2026
  - GitHub-hosted runners default JavaScript actions to Node 24: June 2, 2026
  - Node 20 removal later in fall 2026
- Self-hosted caveats matter only if the repo later depends on:
  - macOS 13.4 or lower
  - ARM32 self-hosted runners

## Workflow intent

### repo-health.yml
Use to confirm that the repo still has the key canonical entry surfaces and core spine files we expect.

This workflow should fail if the spine is accidentally removed or broken.

### repo-health-diagnostic.yml
Use to run a manual diagnostic pass that prints expected repo surfaces one by one.

This workflow should fail if any required repo surface is missing from the current tree.

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

### deploy-pages.yml
Use to publish the current terminal surface to GitHub Pages from `main`.

This workflow should fail if the Pages deployment path cannot package or deploy the repo surface.

### terminal-live-verify.yml
Use to run the terminal validation chain after a successful Pages deployment, or on manual dispatch.

This workflow should fail if the terminal validation chain reports a live-surface validation error.

### internal-link-guard.yml
Use to confirm that internal markdown links under `repo-manual/` still resolve.

This workflow should fail if internal documentation links drift out of date.

## Next workflow options
- Markdown lint workflow
- Connector validation or self-sync expansion workflow

## Working rule
Add a workflow only when it enforces a real status, protects the repo, or saves meaningful manual work.
Do not add workflows only to make the repo look busier.
