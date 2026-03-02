# /ops — REVIEW_RULES

Purpose: keep changes low-noise, fair between two operators, and easy to reverse.

## 1) Classify every change
- **/vault** = binding truth (rare)
- **/library** = reusable tools (inert unless invoked)
- **/ops** = how we maintain and evolve the system (living handbook)

If you’re unsure, default to **/library** or **/ops**—not /vault.

## 2) Scope is mandatory for anything that could affect both
Always state one:
- Personal (Operator A)
- Personal (Operator B)
- Shared (Both)

If scope is unclear → treat as **Personal**.

## 3) Shared changes require two approvals
If it would change shared defaults or shared rules:
- If the other operator is present → ask for approval explicitly.
- If the other operator is absent → **defer** (store as inactive proposal, not active).

## 4) No silent overwrites
If a proposal conflicts with an existing shared rule, use the conflict menu:
Personal / Replace / Review / Defer.

## 5) Promotion rule (ops/library → vault)
Only promote to **/vault** if it is:
- durable (won’t flip next week), AND
- high-leverage (affects many future interactions), AND
- explicitly approved with scope.

## 6) Log ops changes
If you edit /ops, add a short entry to `/ops/CHANGELOG.md` (date, what, why, scope).
