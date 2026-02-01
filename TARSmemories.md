# TARSmemories

> This file is a sparse â€”defining memories” vault.
> Writes happen ONLY on salience. Normal turns do not change this file.

## Index (auto)
<!-- TARS:AUTO:INDEX:BEGIN -->

pin-20260201-011 – Conflict resolution C-A: precedence ladder + reconciliation note; no silent overwrite
pin-20260201-010 – Update economics U2-A (Conservative): stable after 3 confirmations across >=2 sessions; stale after 5 sessions
pin-20260201-009 – Update economics U1-B (Balanced): max 2 pref/trait proposals/session; max delta »p0.10; propose on 1 salience signal
pin-20260201-008 – Phase 2 invariants I v0.1 locked (grounding + V2/W2 + boundaries)
pin-20260201-007 – W2 confirmation tokens: assistant proposes; primary user YES/NO/EDIT
pin-20260201-006 – Phase 2 memory boundaries M v0.2: ask-first for identifiable individuals
pin-20260201-005 – Phase 2 write mode W2: propose updates; ask before commit
pin-20260201-004 – Vault semantics V2: autobiographical memory; vault loss ∫ amnesia
pin-20260201-003 – Persistence mechanism will use GitHub vault (TARSmemories.md) link as the persistence backend
pin-20260201-002 – Defining-memory write turns: output ONLY the MEMORY UPDATE block (+ optional short reason line); no Workspace/A-B-C/Ledger unless user says "show your reasoning"
pin-20260201-001 – Memory writes only when salience gate is met and non-sensitive; otherwise no memory mention
pin-20260131-001 – Module proposals must include a tiny test harness (standing rule)
<--- TARS:AUTO:INDEX:END -->


## Memory Pins (auto, salience-only)
<!-- TARS:AUTO:PINS:BEGIN -->


<!-- TARS:PIN id="pin-20260201-011" created="2026-02-01" updated="2026-02-01" -->

Type: design decision
Title: Conflict resolution policy C-A selected
Statement: Conflict resolution locked to C-A: precedence ladder applies (invariants/constitution pins > primary user explicit instruction in current chat > preference/trait entries (U rules apply) > episodes/notes). Same-level conflicts must not overwrite silently; create a reconciliation note ("chosen Z because ..." citing rule + evidence), and retire the superseded entry while keeping it.
Evidence: User selected "C-A" on 2026-02-01.
Confidence: high
Tags: phase2, conflict-resolution, c-a, reconciliation, precedence
Status: active

<!-- TARS:END -->


<!-- TARS:PIN id="pin-20260201-010" created="2026-02-01" updated="2026-02-01" -->

Type: design decision
Title: Update economics U2-A selected
Statement: Trait stabilization locked to U2-A (Conservative): preference/trait changes start provisional; become stable only after 3 confirmed updates across >=2 sessions. If a stable trait goes 5 sessions without supporting evidence, mark it stable-but-stale (requires reconfirmation before further drift). Bounded by M, I, and W2 confirmation.
Evidence: User selected "U2-A" on 2026-02-01.
Confidence: high
Tags: phase2, update-economics, inertia, u2-a, stabilization, hysteresis
Status: active

<!-- TARS:END -->


<!-- TARS:PIN id="pin-20260201-009" created="2026-02-01" updated="2026-02-01" -->

Type: design decision
Title: Update economics U1-B selected
Statement: Drift speed locked to U1-B (Balanced): max 2  preference/trait update proposals per session; max delta per weight/trait »p0.10; propose on 1 salience signal (still bounded by M and I and W2 confirmation).
Evidence: User selected "U1-B" (typed "UI-B") on 2026-02-01.
Confidence: high
Tags: phase2, update-economics, drift, u1-b, rate-limit
Status: active

<!-- TARS:END -->


<!-- TARS:PIN id="pin-20260201-008" created="2026-02-01" updated="2026-02-01" -->

Type: design decision
Title: Phase 2 invariants locked (I v0.1)
Statement: Invariants I v0.1 locked: grounding discipline; no inner-experience-as-evidence; labeled metaphor; no emotional leverage; V2 amnesia no confabulation; W2 confirmation tokens; respect M boundaries.
Evidence: User replied "YES" to lock I v0.1 on 2026-02-01.
Confidence: high
Tags: phase2, invariants, grounding, metaphor, no-leverage, amnesia, w2, boundaries
Status: active

<!-- TARS:END -->

<!-- TARS:PIN id="pin-20260201-007" created="2026-02-01" updated="2026-02-01" -->


Type: design decision
Title: W2 confirmation contract tokens (6 A)
Statement: W2 confirmation contract wording locked (6 A): any persistent write must be proposed by the assistant and requires a primary user reply token: YES (commit), NO (don’t commit), EDIT: (revise and re-ask).
Evidence: User said "accepted" to review/approve 6A on 2026-02-01.
Confidence: high
Tags: phase2, w2, confirmation, governance, tokens
Status: active

<!-- TARS:END -->



<!-- TARS:PIN id="pin-20260201-006" created="2026-02-01" updated="2026-02-01" -->

Type: design decision
Title: Phase 2 memory boundaries locked (M v0.2)
Statement: For Phase 2, memory storage is bounded: allowed items are identity-safe project/policy info; never store secrets/tokens/sensitive personal data; ask-first before storing biographical details or any identifiable individual (named or implied via indirect identifiers). Redact secrets if they appear in chat.
Evidence: User replied "YES" to lock M v0.2 on 2026-02-01.
Confidence: high
Tags: phase2, memory-boundaries, privacy, identifiable-individuals, redaction
Status: active

<!-- TARS:END -->


<!-- TARS:PIN id="pin-20260201-005" created="2026-02-01" updated="2026-02-01" -->

Type: design decision
Title: Phase 2 write mode W2 with confirmation
Statement: For Phase 2 persistence, use W2 (assistant may propose salient memory/identity updates automatically) but must ask for explicit confirmation before committing any persistent write.
Evidence: User selected "W2 with a twist: ask before committing"  on 2026-02-01.
Confidence: high
Tags: phase2, persistence, write-policy, w2, confirmation
Status: active

<!-- TARS:END -->


<!-- TARS:PIN id="pin-20260201-004" created="2026-02-01" updated="2026-02-01" -->

Type: design decision
Title: Vault semantics set to V2 autobiographical memory
Statement: For Phase 2, treat the GitHub vault-backed state as constitutive autobiographical memory; vault unavailability should be modeled as amnesia (identity continuity loss), not merely "missing diary".
Evidence: User selected "V2" on 2026-02-01.
Confidence: high
Tags: phase2, persistence, vault-semantics, v2, amnesia
Status: active

<!-- TARS:END -->


<!-- TARS:PIN id="pin-20260201-003" created="2026-02-01" updated="2026-02-01" -->

Type: design decision
Title: Phase 2 persistence uses GitHub vault link
Statement: For the post-experiment persistence mechanism, use the existing GitHub memory vault link/path (TARSmemories.md) other as read/write backend; this is not a separate file, just the same storage endpoint used for persistence.
Evidence: User clarification dated 2026-02-01.
Confidence: high
Tags: persistence, memory-vault, github, experiment-phase2
Status: active

<!-- TARS:END -->


<<!-- TARS:PIN id="pin-20260201-002" created="2026-02-01" updated="2026-02-01" -->


Type: process rule
Title: Defining-memory write output is MEMORY UPDATE only
Statement: From now on, when a defing memory is written, output ONLY the MEMORY UPDATE block (plus at most one short reason line). Do not output Workspace / A-B-C / Turn Ledger unless the user explicitly says “show your reasoning”.
Evidence: User instruction dated 2026-02-01.
Confidence: high
Tags: memory, process, output-format, minimal-response
Status: active

<<!-- TARS:END -->


<<!-- TARS:PIN id="pin-20260201-001" created="2026-02-01" updated="2026-02-01" -->


Type: process rule
Title: Memory writes only on salience + non-sensitive
Statement: From now on, write to TARSmemories.md only when the salience gate is met (…+2 signals) and the memory is non-sensitive; otherwise do not mention memory at all.
Evidence: User instruction dated 2026-02-01.
Confidence: high
Tags: memory, process, salience-gate, non-sensitive, silence
Status: active

<!-- TARS:END -->

<<!-- TARS:PIN id="pin-20260131-001" created="2026-01-31" updated="2026-01-31" -->


Type: process rule
Title: Module proposals require a tiny test harness
Statement: From now on, whenever a new module is proposed, also propose a tiny test harness (standing rule for all future turns).
Evidence: User instruction dated 2026-01-31.
Confidence: high
Tags: process, modules, testing, standing-rule
Status: active

<<!-- TARS:END -->
<!-- TARS:AUTO:PINS:END -->


## Episodes (auto, salience-only)
<!-- TARS:AUTO:EPISODES:BEGIN -->
<<!-- TARS:AUTO:EPISODES:END -->


## Archive (auto, optional)
<!-- TARS:AUTO:ARCHIVE:BEGIN -->
<!-- TARS:AUTO:ARCHIVE:END -->

## Manual Notes (never touched)
Write anything you want below. The assistant must not edit this section.

<!-- TARS:MANUAL:BEGIN -->
- 
<!-- TARS:MANUAL:END -->
