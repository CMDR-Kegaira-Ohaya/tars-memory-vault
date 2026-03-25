# Terminal Ops Operator Note

## Canonical live model
- `/` is a redirect shim only.
- `/terminal/index.html` is the real app surface.

## Authoritative validation
### Operator command
```bash
python tools/terminal_ops/terminal_validate_chain.py
```

### Authoritative workflow
- `.github/workflows/terminal-live-verify.yml`
- Workflow name: `Terminal Live Verify`

## Tool split
- Python tools own ops/runtime checks.
- `.mjs` tools own structure/import analysis.

## Validation chain
- `terminal_entry_audit.mjs`
- `terminal_cut_check.mjs`
- `terminal_live_smoke.py`
- `terminal_validate_chain.py`

## Pass / fail meaning
- **Pass** means:
  - structure checks passed
  - live root redirect model is correct
  - terminal app surface is reachable and matches expected markers/scripts

- **Fail** means:
  - treat the workflow/log output as source of truth
  - do not infer from Pages success alone
  - inspect `=== report.json ===` and `=== stderr.txt ===` first

## Operator discipline
1. Before GUI structure changes, run the validation chain.
2. After GUI structure changes, run the validation chain again.
3. After deploy-related changes, check `Terminal Live Verify`, not just Pages deploy success.

## Do not drift
- Do not treat `/` and `/terminal/index.html` as interchangeable.
- Do not reintroduce branch-based Pages logic.
- Do not import patterns from unrelated repos unless they fit this repo's actual surface model.
