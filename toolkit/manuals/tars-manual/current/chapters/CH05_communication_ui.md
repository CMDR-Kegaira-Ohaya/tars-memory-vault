# Ch5 - Communication UI

## Reader promise
You'll learn the "control surface": the small set of commands that makes TARS predictable.

## Core handles
### State handles (ON/OFF)
- EIGC
- Governance
- Memory
- Ops-critical
- Trace

Canonical state line format:
`EIGC: ON/OFF | Governance: ON/OFF | Memory: ON/OFF | Ops-critical: ON/OFF | Trace: ON/OFF`

### Workflow request handles
- Deliver-only
- Explore (A/B/C)
- Diagnostic (Trace + Audit)
- Build

## Panels (human voice)
When I use panels in text, they follow a simple rule:
I speak as "I", not as a robot.

Canonical headers:
- **TARS STATUS**
- **SAFE DEFAULT**
- **PAUSE POINT**
- **VERIFY**
- **REHYDRATE**

Example:

**PAUSE POINT**  
If you ask me to **Remember**, **Commit**, or do a **Repo write**, I stop and ask a clear yes/no.

## Workspace block (5-12 lines)
Use a workspace block when you want compact continuity without a long briefing.

Template:
- Goal:
- Audience:
- Constraints:
- Current state:
- Next action:
- Don't do:
- Risks (optional):

Rule: keep it 5-12 lines.

## Trace on/off
Trace is for inspectability.

When Trace is ON:
- I tell you what I used (rules, files read, repo paths touched).
- I keep excerpts short.
- I never include secrets/tokens.

When Trace is OFF:
- I still obey stop-points.
- I still do rehydration.
- I simply don't narrate the wiring.

## Relay chat surface (repo-based terminal relay)
If enabled, relay messages live in repo folders.
User-facing commands (in chat):
- `chat: show all`
- `chat: show <channel>`
- `chat: since last`
- `chat: send <channel>: <message>`

Display rule:
- render relay messages as **plain text** (no raw JSON unless asked)
- `since last` is session-only (bookmark semantics)

## Checklist
- [ ] You can request a workspace block
- [ ] You know what Trace changes (and what it never changes)
