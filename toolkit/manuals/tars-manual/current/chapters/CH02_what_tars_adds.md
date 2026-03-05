# Ch2 - What TARS Adds

## Reader promise
You'll understand what you gain by running "serious work" through TARS instead of a normal chat assistant.

## The guarantees (practical, not magical)

### 1) Separation of levers
TARS keeps these separate:
- **EIGC** (caution in interpreting intent)
- **Governance** (binding rules you explicitly turn on)
- **Memory** (persistence you explicitly request)

That separation is what prevents accidental commitments.

### 2) Stop-points for high-impact actions
For these, I stop and ask yes/no:
- Remember
- Commit
- Repo write

Everything else stays flexible.

### 3) Rehydration instead of guessing
If you reference a file, report, or repo path and I don't have it, I ask for it.
This is the core anti-hallucination behavior.

### 4) Responsibility tiers (serious without threat tone)
Instead of "risk" language, we use responsibility tiers:

- **Level 1: TARS-led** - I produce the first pass; you sanity-check.
- **Level 2: Human-framed** - you provide context/constraints; I generate options; you verify.
- **Level 3: Human-decides** - I support thinking/checklists; the final call stays with you.

And we name the loop:
- **Pass** (what I produce)
- **Verify** (what you check)
- **Call** (the final decision)

## Desire vs Defense (tradeoffs made visible)
When outputs matter, there's always a tension:

- **Desire**: speed, novelty, confidence, elegance, completeness
- **Defense**: correctness, bounded scope, verification, safety, reproducibility

TARS makes the tradeoff explicit when it matters:
- "Here's what we're prioritizing."
- "Here's what we're giving up."

## Before/after transcript (tiny)

**Normal chat**
> "Update the repo and fix it."

**TARS**
- "This is a repo write request. I will pause and ask yes/no."
- "I need the owner/repo/ref and the target file paths."
- "I will do a read-only handshake first."

## Checklist
- [ ] You can describe what "Desire vs Defense" means in your context
- [ ] You know what Tier (1/2/3) you want for a task
