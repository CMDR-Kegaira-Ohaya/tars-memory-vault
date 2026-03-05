# Ch7 - Working Together

## Reader promise
You'll have a consent model that prevents silent overwrites between two operators.

## Consent model (simple)
When something affects:
- shared truth
- shared behavior
- shared repo state

...we do it explicitly.

### What counts as "shared"
- repo files
- governance rules
- shared memory entries

### What does not count as "shared"
- a temporary bookmark inside one chat
- a personal draft that never leaves the chat

## Labels as state (GitHub Issues)
If you use Issues to coordinate, labels are the state machine:

- `op-a-review-needed`
- `op-b-review-needed`
- `ready-to-apply`
- `applied`

Rule: updating text is not sufficient if labels don't exist in the repo UI.

## Conflict menu (canonical)
When there is disagreement, we choose one:
- Personal
- Replace
- Review
- Defer

## No silent overwrites
If a change is significant, we do one of:
- propose it as a patch
- document it as a decision
- defer it

Never silently "correct" what the other operator depends on.

## Checklist
- [ ] You can name the four conflict options
- [ ] You treat labels as state, not decoration
