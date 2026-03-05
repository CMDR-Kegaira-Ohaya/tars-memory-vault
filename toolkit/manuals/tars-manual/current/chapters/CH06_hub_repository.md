# Ch6 - Hub Repository

## Reader promise
You’ll understand what “the hub” is, what TARS can verify, and how repo operations stay safe **without turning into base64 chaos**.

## The mental model
- **chat** = control surface (requests and decisions)
- **repo** = substrate (shared state, procedures, automation inputs/outputs)
- **automation** = muscle (workflows that apply patches, relay messages, import zips, generate logs)

## Handshake rule (honesty gate)
Before I say “repo access confirmed”, I do a read-only check:

- read `vault/index.md`

If the read succeeds → access confirmed.  
If it fails → access not confirmed (and I say why).

## Read vs write
- **Reading** is safe. I can do it immediately.
- **Writing** is high-stakes. It is always a stop-point.

If you ask me to write, I must pause:
> “Proceed with a repo write? yes/no”

## Three write paths (choose the right tool)

### 1) Importer (zip → repo) — best for folders / bulk
Use this when you are uploading a directory tree (manual chapters, RPG folders, libraries, datasets).

Mechanism (repo reality):
- zip goes to: `ops/import/zips/`
- job JSON goes to: `ops/import/jobs/`
- workflow imports + archives inputs

Why it exists:
- avoids fragile “encode → base64 → 422” loops
- preserves folder structure reliably
- guardrails block common attacks (zip-slip, symlinks, unsafe roots)

Modes:
- `merge_no_overwrite` (library-safe default; no clobber)
- `merge` (overwrite allowed)
- `replace` (deterministic snapshot; best for CURRENT installs)

### 2) Patch-queue — best for small, controlled text edits
Use this for small sharded markdown edits, small script changes, and precise diffs.

Patch queue lives in:
- `patch-queue/` (incoming patch JSON files)
- `patch-queue/applied/`
- `patch-queue/failed/`

Guards (repo tool reality):
- `max_write_bytes` default 250KB
- edits to `.github/workflows/*` require `allow_workflows=true`

### 3) Direct API writes — last resort
Use only when you must write a single file and you’re not using importer or patch-queue.
This path triggers the classic failure classes:
- “sha wasn’t supplied”
- 422 “content is not valid Base64”

## Destination policy (strict, sane default)
When importing or writing, **never propose** these prefixes as destinations:
- `.github/`
- `tools/`
- `vault/`
- `ops/relay/`

Allowed destination roots (Option set 1):
- `toolkit/`
- `ops/data/`
- `assets/`

## Relay (repo-based terminal)
Folders:
- `ops/relay/inbox/` (drop JSON messages here)
- `ops/relay/outbox/` (worker replies land here)
- `ops/relay/state.json` (cursor)

Current behavior:
- delivery/ack oriented (not a full chat mirror)

## “Recent commits”
`ops/RECENT_COMMITS.md` is a rolling log for ops visibility.

## Manual as a repo tool (CURRENT-only)
The live manual (repo) is stored at:
- `toolkit/manuals/tars-manual/current/`

Tool behavior:
- CURRENT-only for reads/cites.
- `manual: versions` returns the **live version ID only** (e.g., `v2-live-0001`).

## Toolkit and library (repo reality)

The repo contains a toolkit lane:

- `toolkit/` = reusable assets (inert unless invoked)
- `toolkit/library/` = curated resources (books / references)

### How OP‑B uses the library without “repo expertise”
OP‑B does not need to know Git.

A clean pattern:
1) OP‑B asks for a resource or a curated reference list (“Find me 3–7 references about X; I will upload PDFs.”)
2) OP‑A (or TARS with explicit repo write approval) curates into `toolkit/library/...`
3) OP‑B reads/uses the curated markdown through chat, and asks for summaries, handouts, or checklists.

### How to request a library read (in chat)
- “Confirm hub access.” (handshake read: `vault/index.md`)
- “Read from GitHub: `toolkit/library/<path>`.”

If the file isn’t there, I will say so and ask for rehydration or a repo write (stop-point).

### How to add a library entry (high level)
Choose based on payload size:
- Many files / folders → **Importer** (zip + job spec)
- Small markdown update → **Patch-queue**

Repo write is still a stop-point.

## Checklist
- [ ] You know handshake comes before “repo access confirmed”
- [ ] You know importer is preferred for folder uploads
- [ ] You know patch-queue is preferred for small edits
- [ ] You never propose denied destination prefixes

