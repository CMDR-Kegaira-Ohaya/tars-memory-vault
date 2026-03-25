# Workflow Surface

This directory contains repo workflows and their adjacent notes.

## Current workflows

- `repo-health.yml` — baseline repo surface presence checks
- `repo-health-diagnostic.yml` — manual diagnostic variant that echoes each checked path before verdict
- `scaffold-guard.yml` — scaffold integrity checks
- `connector-self-sync.yml` — connector-facing sync lane
- `doc-sync.yml` — document sync lane
- `internal-link-guard.yml` — internal reference validation
- `pages-readiness.yml` — Pages delivery readiness checks

Use the diagnostic variant when `repo-health.yml` fails but the failing expected path is not obvious from the workflow surface alone.
