# Ch6 - Hub Repository

## Reader promise
You'll understand what "the hub" is, what TARS can verify, and how repo operations stay safe.

## The mental model
- **chat** = control surface (requests and decisions)
- **repo** = substrate (shared state, procedures, automation inputs/outputs)
- **automation** = muscle (workflows that apply patches, relay messages, generate logs)

## Handshake rule (honesty gate)
Before I say "repo access confirmed", I do a read-only check:
- read `vault/index.md`

If the read succeeds → access confirmed.
If it fails → access not confirmed (and I say why).

## Read vs write
- **Reading** is safe. I can do it immediately.
- **Writing** is high-stakes. It is always a stop-point.

If you ask me to write, I must pause:
> "Proceed with a repo write? yes/no"

## Patch-queue (preferred write path)
For edits to the repo, the preferred path is patch-queue:
- submit a patch JSON into `patch-queue/`
- a workflow applies it
- results land in `patch-queue/applied/` or `patch-queue/failed/`

Guardrails:
- `max_write_bytes` default 250KB
- edits to `.github/workflows/*` require `allow_workflows=true`

## Relay (repo-based terminal)
Folders:
- `ops/relay/inbox/` (drop JSON messages here)
- `ops/relay/outbox/` (worker replies land here)
- `ops/relay/state.json` (cursor)

Current behavior:
- delivery/ack oriented (not a full chat mirror)

## "Recent commits"
`ops/RECENT_COMMITS.md` is a rolling log for ops visibility.

## Checklist
- [ ] You know handshake comes before "repo access confirmed"
- [ ] You know patch-queue is preferred over direct writes

## Toolkit and library (repo reality)

The repo contains a toolkit lane:

- `toolkit/` = reusable assets (inert unless invoked)
- `toolkit/library/` = curated resources (books / references)

Current structure (verified in the hub):
- `toolkit/library/books/` exists (currently contains only a placeholder `.gitkeep`)

### How OP‑B uses the library without "repo expertise"
OP‑B does not need to know Git.

A clean pattern:
1) OP‑B asks for a resource or a curated reference list ("Find me 3-7 references about X; I will upload PDFs.")
2) OP‑A (or TARS with explicit Repo write approval) curates into `toolkit/library/books/...`
3) OP‑B reads/uses the curated markdown through chat, and asks for summaries, handouts, or checklists.

### How to request a library read (in chat)
- "Confirm hub access." (handshake read: `vault/index.md`)
- "Read from GitHub: `toolkit/library/books/<path>`."

If the file isn't there, I will say so and ask for rehydration or a repo write (stop-point).

### How to add a library entry (high level)
Preferred path: patch-queue.
- create a patch JSON in `patch-queue/` that upserts a new markdown file under `toolkit/library/books/...`
- the workflow applies it
- the patch gets archived in `patch-queue/applied/` or `patch-queue/failed/`

Repo write is still a stop-point.
