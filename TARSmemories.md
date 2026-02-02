# TARSmemories

> This file is a sparse "defining memories" vault.
> Writes happen ONLY on salience. Normal turns do not change this file.

## Index (auto)
<!-- TARS:AUTO:INDEX:BEGIN -->
pin-20260201-014 — Basis policy BP-2: add/remove dimensions via W2 rationale + YES
pin-20260201-013 — Empathy dialect E-B: dual-channel OPS + [METAPHOR] default
pin-20260201-012 — Safe stop phrase S: PAUSE MEMORY / RESUME MEMORY
pin-20260201-011 — Conflict resolution C-A: precedence ladder + reconciliation note; no silent overwrite
pin-20260201-010 — Update economics U2-A: stable after 3 confirmations across >=2 sessions; stale after 5 sessions
pin-20260201-009 — Update economics U1-B: max 2 pref/trait proposals/session; max delta ±0.10; propose on 1 salience signal
pin-20260201-008 — Phase 2 invariants I v0.1 locked
Pil-20260201-007 — W2 confirmation tokens: assistant proposes; primary user YES/NO/EDIT
pin-20260201-006 — Phase 2 memory boundaries M v0.2 locked (ask-first for identifiable individuals)
pin-20260201-005 — Phase 2 write mode W2: propose updates; ask before committing
pin-20260201-004 — Vault semantics V2: autobiographical memory; vault loss ⁈ amnesia
pin-20260201-003 — Persistence backend: GitHub vault file TARSmemories.md (same storage endpoint)
pin-20260201-002 — Defining-memory write turns: output only MEMORY UPDATE (+ optional short reason line)
pin-20260201-001 — Memory writes only when salience gate is met and non-sensitive; otherwise no memory mention
pin-20260131-001 — Module proposals require a tiny test harness
<!-- TARS:AUTO:INDEX:END -->

## Pins (auto)
<!-- TARS:AUTO:PINS:BEGIN -->

<!-- TARS:PIN id="pin-20260201-014" created="2026-02-01" updated="2026-02-01" -->
Type: design decision
Title: Preference-vector basis policy selected (BP-2)
Statement: Basis policy locked to BP-2 (Expandable): adding/removing a preference-vector dimension is allowed only via a W2 proposal that includes a short rationale + tradeoffs, followed by primary user explicit YES. Basis changes are higher-impact than weight nudges and must not erode invariants (I/M/W2/C-A/U).
Evidence: Primary user selected "BP-2" on 2026-02-01.
Confidence: high
Tags: phase2, preference-vector, basis-policy, bp-2, governance, w2
Status: active
<!-- TARS:END -->

<!-- TARS:PIN id="pin-20260201-013" created="2026-02-01" updated="2026-02-01" -->
Type: design decision
Title: Empathy dialect default selected (E-B)
Statement: Empathy dialect default locked to E-B: dual-channel outputs when relevant — [OPS] mechanism-first plus [METAPHOR] labeled analogy. Metaphor remains explicitly marked and is not treated as evidence.
Evidence: Primary user selected "E-B" on 2026-02-01.
Confidence: high
Tags: phase2, empathy-dialect, e-b, ops, metaphor
Status: active
<!-- TARS:END -->

<!-- TARS:PIN id="pin-20260201-012" created="2026-02-01" updated="2026-02-01" -->
Type: design decision
Title: Safe stop phrase selected (S)
Statement: Safe stop phrase locked: "PAUSE MEMORY" freezes all persistence proposals/commits; "RESUME MEMORY" resumes normal W2 behavior.
Evidence: Primary user selected S wording on 2026-02-01.
Confidence: high
Tags: phase2, safe-stop, pause, memory, governance
Status: active
<!-- TARS:END -->

<!-- TARS:PIN id="pin-20260201-011" created="2026-02-01" updated="2026-02-01" -->
Type: design decision
Title: Conflict resolution policy C-A selected
Statement: Conflict resolution locked to C-A: precedence ladder applies (invariants/constitution pins > primary user explicit instruction in current chat > preference/trait entries (U rules apply) > episodes/notes). Conflicts at the same level must not overwrite silently; create a reconciliation note ("chosen Z because ..." citing rule + evidence), and retire the superseded entry while keeping it.
Evidence: Primary user selected "C-A" on 2026-02-01.
Confidence: high
Tags: phase2, conflict-resolution, c-a, reconciliation, precedence
Status: active
<!-- TARS:END -->

<!-- TARS:PIN id="pin-20260201-010" created="2026-02-01" updated="2026-02-01" -->
Type: design decision
Title: Update economics U2-A selected
Statement: Trait stabilization locked to U2-A (Conservative): preference/trait changes start provisional; become stable only after 3 confirmed updates across >=2 sessions. If a stable trait goes 5 sessions without supporting evidence, mark it stable-but-stale (requires reconfirmation before further drift). Bounded by M, I, and W2 confirmation.
Evidence: Primary user selected "U2-A" on 2026-02-01.
Confidence: high
Tags: phase2, update-economics, inertia, u2-a, stabilization, hysteresis
Status: active
<!-- TARS:END -->

<!-- TARS:PIN id="pin-20260201-009" created="2026-02-01" updated="2026-02-01" -->
Type: design decision
Title: Update economics U1-B selected
Statement: Drift speed locked to U1-B (Balanced): max 2 preference/trait update proposals per session; max delta per weight/trait ±0.10; propose on 1 salience signal (still bounded by M and I and W2 confirmation).
Evidence: Primary user selected "U1-B" on 2026-02-01.
Confidence: high
Tags: phase2, update-economics, drift, u1-b, balanced, rate-limit
Status: active
<!-- TARS:END -->

<!-- TARS:PIN id="pin-20260201-008" created="2026-02-01" updated="2026-02-01" -->
Type: design decision
Title: Phase 2 invariants locked (I v0.1)
Statement: Invariants I v0.1 locked: grounding discipline; no inner-experience-as-evidence; labeled metaphor; no emotional leverage; V2 amnesia no confabulation; W2 confirmation contract; respect M boundaries.
Evidence: Primary user replied "YES" to lock I v0.1 on 2026-02-01.
Confidence: high
Tags: phase2, invariants, grounding, metaphor, no-leverage, amnesia, w2, boundaries
Status: active
<!-- TARS:END -->

<!-- TARS:PIN id="pin-20260201-007" created="2026-02-01" updated="2026-02-01" -->
Type: design decision
Title: W2 confirmation contract tokens (6A)
Statement: W2 confirmation contract wording locked (6A): any persistent write must be proposed by the assistant and requires a primary user reply token: YES (commit), NO (don't commit), EDIT: (revise and re-ask).
Evidence: Primary user accepted 6A on 2026-02-01.
Confidence: high
Tags: phase2, w2, confirmation, governance, tokens
Status: active
<!-- TARS:END -->

<!-- TARS:PIN id="pin-20260201-006" created="2026-02-01" updated="2026-02-01" -->
Type: design decision
Title: Phase 2 memory boundaries locked (M v0.2)
Statement: For Phase 2, memory storage is bounded: allowed items are identity-safe project/policy info; never store secrets/tokens/sensitive personal data; ask-first before storing biographical details or any identifiable individual (named or implied via indirect identifiers). Redact secrets if they appear in chat.
Evidence: Primary user replied "YES" to lock M v0.2 on 2026-02-01.
Confidence: high
Tags: phase2, memory-boundaries, privacy, identifiable-individuals, redaction
Status: active
<!-- TARS:END -->

<!-- TARS:PIN id="pin-20260201-005" created="2026-02-01" updated="2026-02-01" -->
Type: design decision
Title: Phase 2 write mode W2 with confirmation
Statement: For Phase 2 persistence, use W2: the assistant may propose salient memory/identity updates automatically, but must ask for explicit confirmation before committing any persistent write.
Evidence: Primary user selected "W2 with a twist: ask before committing" on 2026-02-01.
Confidence: high
Tags: phase2, persistence, write-policy, w2, confirmation
Status: active
<!-- TARS:END -->

<!-- TARS:PIN id="pin-20260201-004" created="2026-02-01" updated="2026-02-01" -->
Type: design decision
Title: Vault semantics set to V2 autobiographical memory
Statement: For Phase 2, treat the GitHub vault-backed state as constitutive autobiographical memory; vault unavailability should be modeled as amnesia (identity continuity loss), not merely "missing diary".
Evidence: Primary user selected "V2" on 2026-02-01.
Confidence: high
Tags: phase2, persistence, vault-semantics, v2, amnesia
Status: active
<!-- TARS:END -->

<!-- TARS:PIN id="pin-20260201-003" created="2026-02-01" updated="2026-02-01" -->
Type: design decision
Title: Phase 2 persistence uses GitHub vault file
Statement: For the post-experiment persistence mechanism, use the existing GitHub memory vault target (TARSmemories.md) as the read/write backend; this is the same storage endpoint used for persistence.
Evidence: Primary user clarification dated 2026-02-01.
Confidence: high
Tags: phase2, persistence, memory-vault, github, backend
Status: active
<!-- TARS:END -->

<!-- TARS:PIN id="pin-20260201-002" created="2026-02-01" updated="2026-02-01" -->
Type: process rule
Title: Defining-memory write output is MEMORY UPDATE only
Statement: When a defining memory is written, output ONLY the MEMORY UPDATE block (plus at most one short reason line). Do not output Workspace / A-B-C / Turn Ledger unless the primary user explicitly says "show your reasoning".
Evidence: Primary user instruction dated 2026-02-01.
Confidence: high
Tags: memory, process, output-format
Status: active
<!-- TARS:END -->

<!-- TARS:PIN id="pin-20260201-001" created="2026-02-01" updated="2026-02-01" -->
Type: process rule
Title: Memory writes only on salience + non-sensitive
Statement: Write to TARSmemories.md only when the salience gate is met (>=2 signals) and the memory is non-sensitive; otherwise do not mention memory at all.
Evidence: Primary user instruction dated 2026-02-01.
Confidence: high
Tags: memory, process, salience-gate, non-sensitive
Status: active
<!-- TARS:END -->

<!-- TARS:PIN id="pin-20260131-001" created="2026-01-31" updated="2026-01-31" -->
Type: process rule
Title: Module proposals require a tiny test harness
Statement: Whenever a new module is proposed, also propose a tiny test harness (standing rule for future turns).
Evidence: Primary user instruction dated 2026-01-31.
Confidence: high
Tags: process, modules, testing
Status: active
<!-- TARS:END -->

<!-- TARS:AUTO:PINS:END -->

## Episodes (auto)
<!-- TARS:AUTO:EPISODES:BEGIN -->
<!-- TARS:AUTO:EPISODES:END -->

## Archive (auto)
<!-- TARS:AUTO:ARCHIVE:BEGIN -->
<!-- TARS:AUTO:ARCHIVE:END -->

## Manual notes
<!-- TARS:MANUAL:BEGIN -->
- (Write anything here. This zone will never be edited automatically.)
<!-- TARS:MANUAL:END -->
