# Ch9 - Troubleshooting (Fix Ladders)

## Reader promise
You’ll fix the common failure classes fast, without turning the session into drama.

## The golden rule
When stuck:
- open the failing run/log
- paste the last error lines
- diagnose the class
- apply the smallest fix

---

## Importer ladders (zip → repo)

### Fix ladder: “job JSON invalid / missing fields”
**Symptom**
- workflow fails early
- error mentions JSON parse, missing `zip`/`dest`, or unknown `mode`

**Fix**
1) Paste the job JSON here.
2) Ensure required keys exist:
   - `zip` (path under `ops/import/zips/`)
   - `dest` (allowed root: `toolkit/`, `ops/data/`, `assets/`)
   - `mode` (`merge_no_overwrite` / `merge` / `replace`)
3) Re-run.

### Fix ladder: “denied destination root”
**Symptom**
- importer refuses with a message about forbidden/denied paths

**Fix**
- Choose an allowed destination root:
  - `toolkit/` or `ops/data/` or `assets/`
- Never target:
  - `.github/`, `tools/`, `vault/`, `ops/relay/`

### Fix ladder: “zip-slip / unsafe path in zip”
**Symptom**
- importer fails complaining about `..`, absolute paths, or drive letters

**Fix**
- Rebuild the zip from a clean folder.
- Ensure archive entries are normal relative paths (no `../`, no absolute paths).
- Prefer one top-level folder inside the zip (clean packaging).

### Fix ladder: “symlinks are not allowed”
**Symptom**
- importer refuses: “Symlinks are not allowed in zip …”

**Fix**
- Remove symlinks before zipping.
- Replace them with real files or real directories.

### Fix ladder: “zip too large / uncompressed payload too large”
**Symptom**
- importer refuses due to size limits

**Fix**
- Split into multiple zips (sharded imports).
- Remove unnecessary large binaries.
- Put large media under `assets/` if that is the intent.

### Fix ladder: “workflow green but files not where expected”
**Symptom**
- Actions run succeeded, but you can’t find the imported files

**Fix**
1) Verify the job `dest` path.
2) Verify `mode`:
   - `merge_no_overwrite` will not clobber existing files.
   - `replace` will delete-and-reinstall the dest root.
3) Check the archive folders:
   - `ops/import/archive/zips/`
   - `ops/import/archive/jobs/`

---

## GitHub API ladders (only when doing direct writes)

### Fix ladder: “sha wasn’t supplied”
**Symptom**
- GitHub Content API rejects an update: missing sha

**Fix**
1) GET the file first
2) extract `sha`
3) PUT update including that `sha`

### Fix ladder: 422 “content is not valid Base64”
**Symptom**
- 422 error that can appear intermittent

**Fix (better ladder)**
1) If you’re moving folders or many files → use the **Importer** instead.
2) If you’re editing small text → prefer **patch-queue**.
3) If you must use direct API:
   - keep payloads very small
   - ensure content is correct base64 (no whitespace corruption)
   - include sha on updates

---

## Workflow edits blocked
**Symptom**
- refusing to allow a GitHub App to create/update workflow without permission

**Fix**
- ensure the workflow has:
  - `permissions: contents: write`
  - `permissions: workflows: write` (only if it modifies workflows)

## Non-fast-forward / “fetch first”
**Symptom**
- push fails because main moved

**Fix**
- add `git pull --rebase origin main` before `git push` (in workflows that push)

## Patch-queue “text not found”
**Symptom**
- replace_text fails even though the text looks identical

**Fix**
1) suspect hidden characters (NBSP/ZWSP/smart quotes)
2) rehydrate the source
3) sanitize and retry
4) if still stuck, use quarantine marker:
   `[[QUARANTINE: hidden character suspected]]`

---

## Ops-critical recovery stance
When repo ops are failing:
- set Ops-critical: ON
- set Trace: ON (so we can see what changed)
- do minimal diffs

## What to paste when asking for help
- repo path
- failing workflow name
- last 10–20 lines of the failing step
- what you were trying to do
- if importer: the job JSON and zip name

## Checklist
- [ ] You can identify the failure class quickly
- [ ] You default to importer for bulk uploads
- [ ] You default to patch-queue for small edits
- [ ] You avoid direct API writes unless necessary

