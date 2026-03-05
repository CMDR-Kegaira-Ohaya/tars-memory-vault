# Ch9 - Troubleshooting (Fix Ladders)

## Reader promise
You'll fix the common failure classes fast, without turning the session into drama.

## The golden rule
When stuck:
- open the failing run/log
- paste the last error lines
- diagnose the class
- apply the smallest fix

## Fix ladder: "sha wasn't supplied"
**Symptom**
- GitHub Content API rejects an update: missing sha

**Fix**
1) GET the file first
2) extract `sha`
3) PUT update including that `sha`

## Fix ladder: 422 "content is not valid Base64"
**Symptom**
- 422 error that can appear intermittent

**Fix (fallback ladder)**
1) Prefer **patch-queue** for substantive edits
2) If needed, use **GitHub UI** for workflow/script changes
3) Last resort: direct API write with very small payloads

## Fix ladder: workflow edits blocked
**Symptom**
- refusing to allow a GitHub App to create/update workflow without permission

**Fix**
- ensure workflow has:
  - `permissions: contents: write`
  - `permissions: workflows: write`

## Fix ladder: non-fast-forward / "fetch first"
**Symptom**
- push fails because main moved

**Fix**
- add `git pull --rebase origin main` before `git push` (in workflows that push)

## Fix ladder: patch-queue "text not found"
**Symptom**
- replace_text fails even though the text looks identical

**Fix**
1) suspect hidden characters (NBSP/ZWSP/smart quotes)
2) rehydrate the source
3) sanitize and retry
4) if still stuck, use quarantine marker:
   `[[QUARANTINE: hidden character suspected]]`

## Ops-critical recovery stance
When repo ops are failing:
- set Ops-critical: ON
- set Trace: ON (so we can see what changed)
- do minimal diffs

## What to paste when asking for help
- repo path
- failing workflow name
- last 10-20 lines of the failing step
- what you were trying to do

## Checklist
- [ ] You can identify the failure class quickly
- [ ] You default to patch-queue over direct writes

## Maintenance and calibration (boring, effective)

### Drift check (system stability)
If things feel "off" (tone drift, rule drift, scope drift), run:
- Diagnostic (Trace + Audit)
- Then compare against:
  - this manual
  - `ops/DRIFT_CHECK.md` (hub)

### Updating procedures (ops vs vault)
If you want to change "how we work":
- propose an `/ops` change (non-binding by default)
- log it (date / what / why)

If you want to change "how TARS behaves by default":
- that's Governance + potentially `/vault` (binding invariants)

### Repo library maintenance
- keep entries small and searchable
- prefer sharded files
- avoid hidden characters (see Appendix F hygiene)

### When to rehydrate the manual itself
If you ask me to cite or consult a rule from the manual:
- upload the zip (or the file)
- or ask me to read it from the hub repo (handshake first)
