# terminal_ops

Focused tooling for safe terminal GUI surgery and post-deploy verification.

## Tools
- `terminal_live_smoke.py` — loads live Pages URLs and reports JS load failures, missing DOM targets, and whether key surfaces render.
- `terminal_entry_audit.py` — audits `terminal/index.html` for loaded CSS/JS entrypoints, import graph under `ui-v3/`, and duplicate ownership warnings.
- `terminal_cut_check.py` — checks for missing import targets, deleted files still referenced, duplicate render ownership, and dead enhancer paths.
- `terminal_slice.py` — given a file and symbol, prints the function body, direct callees, direct callers, imported deps, and exported surface.
- `terminal_rewrite.py` — narrow codemod for import removal, symbol retargeting, and call-site deletion.
- `terminal_repo_diff.py` — focused repo-state diff inspector between refs.
- `terminal_pages_artifact_verify.py` — validates Pages/deploy workflow state and deployed tree expectations.
- `terminal_force_redeploy.py` — emits a tiny Pages redeploy marker or dispatches a workflow.
- `terminal_validate_chain.py` — runs cut-check + entry-audit + optional live-smoke as a closed loop.

## Design rules
- narrow scope over cleverness
- explain what changed
- fail hard on ambiguity
- prefer dry-run / report modes first
