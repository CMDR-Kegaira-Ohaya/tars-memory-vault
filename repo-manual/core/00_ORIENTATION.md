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

## Connector boundary rule
Use base64 for transport only.
Decode once at the connector boundary.
Do reasoning, comparison, summarization, and planning on plain UTF-8 text, Markdown, or JSON.
Avoid nested encodings or extra transport wrappers unless they are strictly necessary.
When writing, prefer small surgical patches over large whole-file rewrites whenever the tooling allows it.

## Cross-session red flags
Treat these as standing cautions for future sessions:
- huge GitHub write streams can cause lag, derail the conversation, and obscure whether a write actually landed
- blunt whole-file rewrites are a poor default when a smaller anchored patch would do
- connector base64 is a boundary concern, not a repo-format problem
- do not repeat repo truth in temporary carryover artifacts when the repo already holds it canonically
- do not let the right monitor turn into a second full app when working on the TARS shell
- do not let diagnostic/dev density colonize the Main CRT by default
- do not drift back into polishing the old shell as if it were the destination
- do not reintroduce shell-wide polling or broad observer churn that risks lag

## Important connector note
The connector is live and useful for normal reads and direct file writes.
For now, prefer `saveFile` over low-level ref movement for ordinary repo changes.
