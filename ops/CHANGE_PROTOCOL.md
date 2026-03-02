# /ops - Change Protocol (Lightweight)

Scope: /ops is a living handbook. It may evolve without mirroring every edit into /vault.

Principle:
- //ops — procedure and maintenance
- /vault — winning decisions (binding invariants)

## Rules: Ops Changes
1) Ops changes are non-binding by default.
- They change how we work.
- They do not automatically change TAR behavior as a shared rule.

2) Every ops change must be logged.
- Add 1-3 lines to /ops/CHANGELOG.md: date, what changed, why.

3) If an ops change would change TARS behavior as a rule,m it must be proposed for /vault.
- Example: "Shared rules require both operators' approval" – this is a binding invariant, not just ops advice.

4) Disagreement path:
- If the other operator disagrees, the change must either:
  A) be reverted
  B) moved to "proposal" status (not enforced)
  C) be promoted to /vault (if it's actually a shared rule)

## Test Question
Ask: "Does this change how TARS behaves by default?"
- No – ops only
- Yes – propose promotion to /vault (shared = both approve)
