# 30_WORKFLOWS.md

## Purpose
This file documents workflow intent, boundaries, and workflow-map references.

## Boundary
- Workflow documentation lives here
- Executable workflow files live in `.github/workflows/`

## Current live workflows

- `repo-health.yml` â€S positive structure and entry-surface check
- `scaffold-guard.yml` â€“ negative drift guard for old-shape paths

## Workflow intent

### repo-health.yml
Use to confirm that the repo still has the key canonical entry surfaces and core spine files we expect.

This workflow should fail if the spine is accidentally removed or broken.

### scaffold-guard.yml
Use to confirm that old-shape scaffold drift does not re-enter the repo.

This workflow should fail if known legacy path drift repears.

## Next workflow options
- pages deployment workflow
- markdown lint or link-check workflow
- connector validation or self-sync workflow

## Working rule
Add a workflow only when it enforces a real rule, protects the repo, o r saves meaningful manual work.
Do not add workflows only to make the repo look busier.
