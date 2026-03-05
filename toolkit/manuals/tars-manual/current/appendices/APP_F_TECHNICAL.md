# Appendix F - Technical (wiring + verification)

This appendix is for verification and maintenance. It is not required for day-to-day use, but it prevents “myth drift”.

The goal is **epistemic clarity**:
- what exists in the system
- what is guaranteed by guardrails
- what is merely a convention

## F.1 Hub handshake honesty (hard rule)
Before claiming repo access, do a read-only check:

- `vault/index.md`

If the read succeeds → access confirmed.  
If it fails → access not confirmed (and say why).

This rule exists to prevent “phantom authority”: sounding confident about a substrate you didn’t actually touch.

---

## F.2 Repo write paths (three lanes) + their guardrails

Repo writes are always a stop-point. After “yes”, choose the lane that fits the payload:

### F.2.1 Importer lane (zip → repo) — for folders and bulk

**Used by**
- `tools/import_jobs.py` (general job-spec importer)
- `tools/manual_import.py` (legacy manual drop-zone importer)

**Mechanism**
- zip drop: `ops/import/zips/`
- job drop: `ops/import/jobs/`
- workflow: `.github/workflows/import_jobs.yml`
- shared library: `tools/import_lib.py`

**Core safety properties (why it exists)**
1) **Blocks zip-slip**  
   Refuses unsafe paths such as `../`, absolute paths, or drive-letter paths.

2) **Blocks symlinks inside zips**  
   Refuses zip entries whose external attributes indicate symlinks.

3) **Zip-bomb mitigation (size caps)**  
   - zip file size limit (default 200MB)
   - uncompressed payload limit (default 800MB)  
   These can be controlled by environment variables, but the defaults are set to be sane.

4) **Two-phase pipeline**  
   Extract to a temp directory first, then copy into a bounded destination path.

**Root selection rule (packaging matters)**
Importer chooses the “root” like this:
- If the zip contains exactly **one** top-level directory and no top-level files → treat that directory as root.
- Otherwise → treat the extraction directory itself as root.

Practical implication:
- For deterministic installs, package zips with a single top-level folder (clean root).
- Avoid mixing “top-level files + one folder”, because that would copy the folder itself into destination.

**Copy modes**
- `merge_no_overwrite` (default library-safe mode): never clobber existing files
- `merge`: overwrite allowed
- `replace`: delete destination root, then copy fresh (deterministic snapshot)

For installing the live manual to CURRENT, prefer:
- `replace`

**Destination policy**
Hard denied prefixes (do not propose as import destinations):
- `.github/`, `tools/`, `vault/`, `ops/relay/`

Allowed destination roots (Option set 1):
- `toolkit/`, `ops/data/`, `assets/`

**Archiving**
Importer moves processed inputs into:
- `ops/import/archive/zips/`
- `ops/import/archive/jobs/`

This is audit history, not a working directory.

**Guardrail tests**
A dedicated test workflow exists to prevent regressions:
- zip-slip cases
- symlink entries
- mode semantics (merge/replace)
- deny-policy enforcement

If importer starts behaving “too permissively”, assume a regression and run the guardrail tests.

---

### F.2.2 Patch-queue lane — for small, controlled edits

Patch queue lives in:
- `patch-queue/` (incoming patch JSON files)
- `patch-queue/applied/`
- `patch-queue/failed/`

Supported modes (repo tool reality):
- upsert
- append
- delete
- replace_text
- move

Guards (repo tool reality):
- `max_write_bytes` default 250KB
- edits to `.github/workflows/*` require `allow_workflows=true`

Why this lane exists:
- predictable diffs
- small blast radius
- compatible with review habits

---

### F.2.3 Direct API lane — last resort

Direct writes to GitHub contents APIs have two classic failure classes:
- “sha wasn’t supplied”
- 422 “content is not valid Base64”

Operational stance:
- If you are uploading folders/many files → use importer.
- If you are editing small text → use patch-queue.
- Use direct API only when unavoidable.

---

## F.3 Relay reality (repo-based terminal)
Folders:
- `ops/relay/inbox/`
- `ops/relay/outbox/`
- `ops/relay/state.json`

Current behavior:
- delivery/ack oriented (not a full chat mirror)

Verification note:
- the relay worker may run with “no changes” often (that’s normal).
- a green tick means “worker executed”, not “it did something”.

---

## F.4 Ops troubleshooting canon (integrated)
Rule:
- one canonical troubleshooting section (Ch9) + supporting appendix ladders
- source material may exist elsewhere, but is not included verbatim

Terminology note:
- internal carry-forward may say “playbook”
- in the manual use: “troubleshooting canon” / “fix ladders”

---

## F.5 Trace rules
When Trace is ON:
- show what I used (key rules applied, files read/written, workflows touched)
- keep excerpts short
- never include secrets/tokens

Trace is not “show everything”, it’s “show enough to verify process integrity”.

---

## F.6 Audit checklist (periodic)
Audit checks:
- stop-points followed
- scope respected
- handle semantics consistent
- rehydration used instead of guessing

Hub addendum:
- importer deny-policy intact
- importer guardrail tests still green
- patch-queue guards intact
- relay health
- `ops/RECENT_COMMITS.md` readable

---

## F.7 Memory vault protocol (repo-aligned)
Canonical store:
- `/vault/` (sharded: pins, episodes, archive)

Legacy pointer:
- `TARSmemories.md` points to the vault and legacy snapshot.

---

## F.8 Repo-safe text hygiene (Greek-safe, patch-safe)
Rules:
- ASCII filenames/paths; Greek inside content
- UTF‑8, LF, final newline
- prefer Unicode NFC normalization
- avoid invisible characters (NBSP, ZWSP, soft hyphen, directional marks)
- prefer straight quotes where possible (especially in code)

Quarantine marker:
`[[QUARANTINE: hidden character suspected]]`

---

## F.9 Hub operations addendum (common classes)
- SHA-aware updates: GET → sha → PUT
- non-fast-forward: pull --rebase before push
- workflow edits: require workflows:write permissions
- 422 base64 class: avoid by using importer/patch-queue first

---

## F.10 Toolkit stance
- toolkit assets are candidates, not defaults
- activation requires explicit Governance + scope
- if toolkit conflicts with manual surface, the manual surface wins until updated

---

## F.11 Ops documents in the hub (procedures)
Practical implication:
- If you ask “what is the official procedure?”, the answer lives in `/ops`.
- If you ask for a binding rule, that belongs in `/vault` (and requires explicit Governance + scope).

---

## F.12 Library lane (curated resources)
By rule:
- curated resources live under `toolkit/library/`

Recommended usage:
- `toolkit/library/<topic>/<slug>.md`
- Keep entries small and sharded.
- Include: summary, key claims, practical takeaways, and “what to verify”.

Reminder:
- library edits/imports are **Repo write** stop-points.

---

## F.13 Evaluation suite (instrumentation)
Source-of-truth: builder stack module `40_EVAL_SUITE_METRICS.md` (rehydrate to verify).

Purpose: a repeatable way to test whether the layered engine is behaving as designed (not just producing nice text).

The system is graded on **process integrity**:
- stop-point compliance
- source honesty (handshake first)
- scope discipline
- rehydration discipline (ask, don’t guess)

