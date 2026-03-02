# Autopilot (Hub Patch Queue)

Default rule: **hub edits go through the patch queue**.

Why:
- phone-friendly
- reliable
- avoids brittle monolithic writes
- creates an audit trail

## How to apply a change

1) Create a patch JSON in `patch-queue/` with:
   - `mode`: `upsert` | `append` | `delete`
   - `path`: repo file path to change
   - `content`: text to write (for upsert/append)

2) Push/commit.

3) GitHub Actions:
   - applies the patch via `tools/apply_patch_queue.py`
   - moves it to `patch-queue/applied/` (or `patch-queue/failed/` if malformed)

## Guardrails

- Never commit empty patch files.
- Prefer small, sharded files over large monolithic documents.
- Shared defaults still require explicit Governance + mutual approval (human rule), regardless of automation.

---
ASP Explorer Log (optional)
“Queue the patch. Let the ship do the work.”
