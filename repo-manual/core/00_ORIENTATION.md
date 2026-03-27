## Purpose
Primary human and system entry point for the repo-side layer.

## What this repo is
This repository is the private repo-side support layer for TARS.
It holds canonical repo guidance, active work areas, content collections, the terminal runtime, GPT-side reference installs, and operational history.

## Current state
- Repo state: Build State
- Branch model: main only
- Manual maturity: partial but installed
- Connector reference home: `repo-manual/refs/connector/`
- Terminal reference home: `repo-manual/refs/terminal/`
- GPT-side reference home: `repo-manual/refs/gpt/`
- Troubleshooting home: `repo-manual/troubleshooting/`

## Read order
1. `REPO_BOOTSTRAP.md`
2. `repo-manual/core/01_SYSTEM_MAP.md`
3. `repo-manual/core/10_ROUTER.md`
4. `repo-manual/core/11_PIPELINES.md`

## Working rule
Use:
- `work/` for unstable drafts and in-progress material
- `repo-manual/` for stable repo guidance and reference installs
- `terminal/` for the live terminal shell and browser runtime
- `collections/` for subject/content holdings
- `logs/` for decisions and incidents
- `.github/workflows/` for executable workflow files

## Terminal and self-referential anchors
When the task is about terminal behavior, terminal UX, terminal shell surgery, terminal verification, or terminal operator routing, do not rediscover the repo from scratch.
Start from:
- `repo-manual/refs/terminal/TARS_TERMINAL_REFERENCE.md`
- `repo-manual/refs/terminal/TARS_TERMINAL_OPERATOR_GUIDE.md`
- `tools/terminal_ops/OPERATOR_NOTE.md`
- `work/dev/projects/consoleterminalbuilding/README.md`

## Repo surgery and validation defaults
Current preferred tooling:
- anchored text surgery: `tools/repo_patch/safe_repo_patch.py`
- terminal GUI/code validation: `python tools/terminal_ops/terminal_validate_chain.py`
- terminal operator/tool split reference: `tools/terminal_ops/README.md`
- terminal live deploy/workflow truth: `.github/workflows/terminal-live-verify.yml`

Working preference:
- prefer anchored/surgical edits over blunt whole-file rewrites when the target is small
- prefer dry-run/report/audit modes before mutation when the tooling supports them
- for terminal work, validate before and after meaningful GUI structure changes

## Important connector note
The connector is live and useful for normal reads and direct file writes.
For now, prefer `saveFile` over low-level ref movement for ordinary repo changes.
