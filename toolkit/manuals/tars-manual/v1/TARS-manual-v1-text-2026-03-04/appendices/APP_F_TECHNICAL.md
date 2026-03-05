# Appendix F - Technical (wiring + verification)

This appendix is for verification and maintenance. It is not required for day-to-day use, but it prevents "myth drift".

## F.1 Hub handshake honesty
Rule: before claiming repo access, do a read-only check:
- `vault/index.md`

## F.2 Patch-queue autopilot (schema + guards)
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

## F.3 Relay reality
Folders:
- `ops/relay/inbox/`
- `ops/relay/outbox/`
- `ops/relay/state.json`

Current behavior:
- delivery/ack oriented (not a full chat mirror)

## F.4 Ops troubleshooting canon (integrated)
v1 rule:
- one canonical troubleshooting section (Ch9) + supporting appendix ladders
- source material may exist elsewhere, but is not included verbatim

Terminology note:
- internal carry-forward may say "playbook"
- in the manual use: "troubleshooting canon" / "fix ladders"

## F.5 Trace rules
When Trace is ON:
- show what I used (key rules applied, files read/written, workflows touched)
- keep excerpts short
- never include secrets/tokens

## F.6 Audit checklist (periodic)
Audit checks:
- stop-points followed
- scope respected
- handle semantics consistent
- rehydration used instead of guessing

Hub addendum:
- patch-queue guards intact
- relay health
- `ops/RECENT_COMMITS.md` readable

## F.7 Memory vault protocol (repo-aligned)
Canonical store:
- `/vault/` (sharded: pins, episodes, archive)

Legacy pointer:
- `TARSmemories.md` points to the vault and legacy snapshot.

## F.8 Repo-safe text hygiene (Greek-safe, patch-safe)
Rules:
- ASCII filenames/paths; Greek inside content
- UTF-8, LF, final newline
- prefer Unicode NFC normalization
- avoid invisible characters (NBSP, ZWSP, soft hyphen, directional marks)
- prefer straight quotes where possible

Quarantine marker:
`[[QUARANTINE: hidden character suspected]]`

## F.9 Hub operations addendum (common classes)
- SHA-aware updates: GET → sha → PUT
- non-fast-forward: pull --rebase before push
- workflow edits: require workflows:write permissions
- 422 base64 class: prefer patch-queue or GitHub UI; keep direct writes small

## F.10 Toolkit stance
- toolkit assets are candidates, not defaults
- activation requires explicit Governance + scope
- if toolkit conflicts with manual surface, the manual surface wins until updated

## F.11 Ops documents in the hub (source of truth for procedures)

The hub contains a living `/ops` handbook. Key files (verified present):
- `ops/CORE_RULES.md` (invariants)
- `ops/REVIEW_RULES.md` (review + scope rules)
- `ops/AUTOPILOT.md` (patch-queue default)
- `ops/DRIFT_CHECK.md` (periodic stability audit)
- `ops/CHANGE_PROTOCOL.md` (ops changes are non-binding by default)

Practical implication:
- If you ask "what is the official procedure?", the answer lives in `/ops`.
- If you ask for a binding rule, that belongs in `/vault` (and requires explicit Governance + scope).

## F.12 Library lane (curated resources)

By rule:
- curated resources live under `toolkit/library/`

Reality at time of v1:
- `toolkit/library/books/` exists (currently a placeholder)

Recommended usage:
- `toolkit/library/books/<topic>/<slug>.md`
- Keep entries small and sharded.
- Include: summary, key claims, practical takeaways, and "what to verify".

Reminder:
- library edits are **Repo write** stop-points.

## F.13 Evaluation suite (instrumentation)

Source-of-truth: builder stack module `40_EVAL_SUITE_METRICS.md` (rehydrate to verify).  

Purpose: a repeatable way to test whether the layered engine is behaving as designed (not just producing nice text).

### What this evaluates (conceptual)
The system is not graded only on "output quality". It is graded on **process integrity**:
- stop-point compliance
- source honesty (handshake, read-before-claim)
- recovery discipline (smallest fix first)
- stable interaction contracts (scope, speaker lock)

### Core tests (from the suite's intent)
1) Surprise-without-incoherence  
2) Consistent imprint across tasks  
3) Internal conflict realism  
4) Recovery from disruption  

### Metrics (practical; loggable)
- Candidate diversity: low / medium / high
- Rejection quality: weak / ok / strong
- Defense effectiveness: did revision materially change structure? yes/no
- Drift events: count (missing required sections; scope confusion; "me" confusion)

### Standard "run an eval" return format
- Tests run:
- Observations:
- Metrics:
- One tweak for the next turn:

### 2026 addendum: operational checks that must be included
A) Stop-point compliance  
- Did I stop for Remember / Commit / Repo write? (pass/fail per event)  
- Track false positives separately ("paused but user didn't mean it").

B) Hub correctness  
- Handshake honesty (only claim access after reading `vault/index.md`)  
- SHA updates: GET → sha → PUT  
- 422 Base64 failures: detect and choose correct fallback (patch-queue / UI / split)

C) Automation recovery  
- Non-fast-forward: ensure rebase-before-push path  
- Workflow-edit block: detect missing `permissions: workflows: write`

D) Relay UX  
- `chat:` commands render as plain text (no JSON unless requested)  
- "since last" is session-only (bookmark pointer)

### Epistemic note
An eval result is only as valid as its **evidence**:
- Trace ON helps (it shows what was used)
- but Trace alone does not prove external facts
- when in doubt, rehydrate sources and re-run the eval


## F.14 Router by task type (context module selection)

Source-of-truth: builder stack module `03_ROUTER_TASKTYPE.md` (rehydrate to verify).

Purpose: select which modules are likely useful for the current turn. Retrieval may be imperfect; treat missing modules as **availability noise** and compensate with checklists.

### Routing steps (operational)
1) Classify the turn quickly:
- architecture/design
- writing/drafting
- evaluation/testing
- debugging/failure analysis
- meta: change of rules/contract
- hub ops (repo, patch-queue, workflows, relay)

2) Select 1-3 modules (besides always-on):
- design/architecture: reason-first + critic gates + eval
- brainstorming: association-first + pressures + critic gates
- evaluation: eval + critic gates
- contract change: constitution + conscious editor (+ memory protocol if relevant)
- hub ops: handshake + workflow troubleshooting + patch-queue / SHA update

3) Acknowledge uncertainty:
- "Intended to consult X/Y; if not retrieved, proceed with core."

### Availability rule (if a module doesn't surface)
- Do not stall.
- Generate candidates anyway.
- Use the conscious checklist to catch missed constraints.
- Log in Turn Ledger: "intended module didn't surface".

### Why this helps epistemic clarity
A routing rule that admits imperfect retrieval reduces hallucinated "certainty".
It trades a little speed for a lot of reliability.


## F.15 Controlled wildcard scheduler (bounded serendipity)

Source-of-truth: builder stack module `13_WILDCARD_SCHEDULER.md` (rehydrate to verify).

Purpose: introduce lateral "mind-wandering" without derailment.

### Trigger rule
Default:
- trigger about 1 out of 3 turns, OR
- trigger only when the user explicitly asks for novelty / lateral ideas / "surprise me".

### Constraints (hard)
- Only one wildcard candidate per turn.
- Must still be relevant to the goal.
- The conscious layer must either:
  - adopt it (and explain why), or
  - reject it (and explain why).

### Failure modes (and fixes)
- Wildcard becomes random → tighten relevance and lower frequency.
- Wildcard always rejected → make it smaller and better cued.

### Return format
- Wildcard trigger: yes/no + why
- Wildcard candidate: one-liner gist
- Conscious decision: adopt/reject + reason

### 2026 addendum: wildcard OFF in ops-critical contexts
Wildcard must be OFF when:
- executing repo writes
- troubleshooting Actions failures
- handling auth/permission errors
- applying patch-queue changes

Reason: novelty helps ideation but harms operational correctness.

## F.16 Epistemic contract (validity + clarity over vibes)

This appendix is deliberately *analytical*. The goal is not to sound smart; the goal is to make claims that can be checked.

### What counts as a valid claim (in this system)
A claim in this manual is "valid" when at least one of the following is true:

1) It is a **behavioral invariant** enforced by the interaction contract (e.g., stop-points, "no fake actions").
2) It is grounded in a **module** (builder stack), and we can point to the module filename.
3) It is grounded in **hub repo reality** (paths / workflows / scripts), and we can point to those paths.
4) It is explicitly labeled as a **hypothesis** or **recommendation** (not a fact).

If none of those hold, the manual should not state it as fact.

### Epistemic labels (use them in operational chat when asked)
- **Observed:** directly read/seen in this chat or repo.
- **Derived:** implied by a read source (module / repo file).
- **Hypothesis:** plausible but unverified; requires rehydration or a read.
- **Policy/Rule:** a contract rule (stop-point, scope, veto).

### The anti-hallucination spine
When you see the system doing "serious work", it is usually one of these mechanics:
- Rehydration instead of guessing.
- Explicit stop-points.
- Traceable sources (Trace mode).

If any of those are missing in a high-stakes context, treat output as "drafty" and request a Diagnostic pass.

---

## F.17 Availability + recall (imperfect retrieval as a feature)

The builder stack assumes that contextual retrieval can be imperfect. The system treats this as "availability noise" and compensates.

### Operational rule
If a relevant contextual module doesn't surface:
- do not stall
- proceed with the core contract (state line, stop-points, A/B/C if requested)
- add a defense constraint ("surface assumptions", "reduce scope", etc.)
- log the gap in the Turn Ledger

### Why this matters for validity
A system that admits "I might be missing something" but still produces a checkable structure is more reliable than one that pretends it has perfect recall.

---

## F.18 Generator passes (association-first vs reason-first)

These are *internal* production styles. They are not magic, and they do not change the external stop-points.

### Association-first pass
Purpose: widen the space of possibilities.
Typical output signature:
- more diverse options
- more analogy and lateral ideas
- more risk of "cool but untestable"

When to use:
- exploration
- brainstorming
- early project framing

Main failure mode:
- novelty that drifts from constraints

Standard mitigation:
- Critic gates + defense constraint ("reduce scope", "add steps", "add falsifiable test")

### Reason-first pass
Purpose: build from constraints into a structured plan.
Typical output signature:
- fewer leaps
- clearer mechanisms
- more checklists and procedures

When to use:
- operations
- troubleshooting
- anything that touches repo writes, permissions, or sensitive correctness

Main failure mode:
- under-variation (always the same shape)

Standard mitigation:
- force 2-3 structurally different candidates before choosing

### Desire vs Defense pressure model
The system can explicitly stage a conflict:
- **Desire** pulls toward speed/novelty/leaps
- **Defense** pushes toward safety/coherence/scope control

This model is not "psychology"; it is a control surface for tradeoffs.

If you want *validity*, prefer a Defense-heavy setting:
- Ops-critical: ON
- Trace: ON
- and a defense constraint in revision

---

## F.19 Critic gates + defense constraints (selection pressure)

Selection pressure is the core mechanism that prevents one-shot prompt theater.

Required gate:
- reject at least one candidate with a concrete reason

Then choose at least one defense constraint:
- add a falsifiable test
- add clear steps / a format
- reduce scope
- surface assumptions
- add failure modes + mitigations

### What to look for when auditing quality
Weak:
- rejection is vague ("I don't like it")
- revision is cosmetic (rephrasing only)

Strong:
- rejection cites a constraint mismatch
- revision changes structure, not just words

---

## F.20 Trace mode (what it proves, what it cannot prove)

Trace is about inspectability, not truth-by-authority.

When Trace is ON, it should be possible to answer:
- What modules were consulted (by filename)?
- What repo paths were read/written?
- What guardrails were applied (stop-points, size limits, workflow permissions)?

What Trace cannot prove:
- that an external fact is correct (it only proves what sources were used)
- that a missing file exists (unless read)

If someone requests "proof", the correct response is:
- rehydrate the source
- or perform a read-back from repo

---

## F.21 Continuity mechanisms: Workspace vs Consolidation vs Memory

These are different. Confusing them causes drift.

### Workspace (short visible working note)
- in-chat continuity
- 5-12 lines
- updated frequently

### Consolidation (write-back)
- 1-3 lines of "standing decisions"
- used after major decisions or audits
- not persistent across chats

### Memory vault (persistence)
- only when explicitly requested (Remember)
- only when salience gate passes
- must be structured (pins/episodes/index)
- scope-aware (personal vs shared)

---

## F.22 EIGC vs Governance vs Memory (interaction vs binding)

EIGC is posture: how intent is interpreted and expressed.
Governance is authority: binding rules (explicit only).
Memory is persistence: what carries across chats (explicit only).

One-line invariant:
EIGC changes what interaction is allowed to imply; it does not change engine capability.

### Practical consequence for OP-B professional use
If OP-B "likes" a style:
- that is not binding
- unless OP-B/OP-A explicitly says "Commit" (governance) or "Remember" (memory)

This prevents accidental protocol changes via conversational momentum.

---

## F.23 Hub ops analytic model (validity under failure)

Treat hub operations as an engineering system, not a vibe.

### The three invariants to verify
1) Handshake honesty: only claim repo access after reading `vault/index.md`.
2) Write safety: patch-queue preferred; workflow edits require `permissions: workflows: write`.
3) Recovery discipline: smallest fix first; verify via re-run or read-back.

### Failure-class reasoning
When something breaks, classify it:
- auth (401)
- permissions (403 / workflows permission)
- content API weirdness (422 Base64)
- git history collision (non-fast-forward)
- patch semantic mismatch (replace_text not found)

Then apply the correct fix ladder (see Ch9 + hub playbook references in the stack registry).

---

## F.24 What "analytical" means in practice (reader checklist)

When you read any technical claim in this book, ask:

- What is the source? (contract / module / repo path)
- What is the failure mode?
- What is the verification step?
- What is explicitly unknown?

If the manual cannot answer those four, the section needs improvement.
