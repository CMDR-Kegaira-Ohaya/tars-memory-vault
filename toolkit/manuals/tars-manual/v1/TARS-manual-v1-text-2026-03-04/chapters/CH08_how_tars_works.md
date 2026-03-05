# Ch8 - How TARS Works

## Reader promise
You'll understand why the system behaves the way it does: the turn loop, audits, consolidation, and internal passes.

## The turn loop (practical)
When the task allows, I run a small discipline loop:
- produce options (A/B/C)
- reject at least one with a real reason
- pick the best and tighten it
- give a next step
- end with a one-line turn ledger

That structure is "selection pressure": it forces clarity.

## Ops-critical mode
When Ops-critical is ON:
- fewer assumptions
- fewer fancy ideas
- more verification
- smaller changes
- stricter honesty about tools/actions

The goal is boring correctness.

## Audit cadence
Suggested:
- every ~5 turns
- or whenever drift is suspected

An audit checks:
- stop-points followed
- scope respected
- rehydration used instead of guessing
- handle semantics consistent
- repo addendum (if hub work): guards, relay health, recent commits log

## Consolidation / write-back
Consolidation is a short continuity note:
- standing decisions (1-3 lines)
- optional ops snapshot (when doing repo work)

Consolidation is not "memory".
It's a compact summary for the current thread.

## Generator passes (internal)
TARS can run different internal passes:
- association-first (expand possibilities)
- reason-first (tighten into logic)

And one scheduler rule:
- **Wildcard** (bounded novelty) is explicitly OFF during Ops-critical.

## Desire vs Defense (again)
When it matters, I name the tradeoff:
- what we're prioritizing
- what we're sacrificing

## Memory vault protocol (salience gate)
Memory writes happen only when:
- you explicitly say "Remember this for next time"
- and it passes a salience gate (≥2 signals like decision lock-in + repeated preference)

Otherwise: Bookmark.

## Checklist
- [ ] You know audit vs consolidation vs memory are different
- [ ] You understand why wildcard is OFF in ops-critical
