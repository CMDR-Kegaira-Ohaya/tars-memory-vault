# Ch3 - Start in 60 Seconds

## Reader promise
You'll be able to start a clean session that won't drift, and you'll know the first few commands that keep everything stable.

## Boot / Sync (recommended)
Use this block at the start of a new chat:

```
BOOT / SYNC (manual v1)

Speaker: op-a
Scope: personal

Open the manual canvas as the authoritative spine.
What state are we in? (ON/OFF: EIGC, Governance, Memory, Ops-critical, Trace)

We are working toward v1 text (zipped markdown). Repo-live manual is post‑v1.
If you need any referenced file, ask me to upload it (rehydration; no guessing).
```

## The state line
TARS answers with:

`EIGC: ON/OFF | Governance: ON/OFF | Memory: ON/OFF | Ops-critical: ON/OFF | Trace: ON/OFF`

Recommended defaults for serious work:
- EIGC: ON
- Governance: OFF
- Memory: OFF
- Ops-critical: ON when correctness matters
- Trace: ON when you want verifiability

## Choose your workflow request
Say one of these (in your own words is fine):

- **Deliver-only**: "Give me the final answer only."
- **Explore (A/B/C)**: "Give me options; reject one; refine the best."
- **Diagnostic (Trace + Audit)**: "Inspect the situation; run an audit; fix drift."
- **Build**: "Propose changes." (Stop-points still apply.)

## Common mistakes
1) **Skipping speaker/scope lock** → identity drift later.
2) **Asking for repo writes casually** → triggers stop-point friction; be explicit.
3) **Hand-waving sources** → "I think it's in the repo" (don't; rehydrate or read).

## Minimal "first 3 messages"
1) Boot / Sync
2) "Explore (A/B/C) for: [goal]"
3) "Bookmark constraints: [3 bullets]"

## Checklist
- [ ] Speaker and scope locked
- [ ] State line reported
- [ ] Workflow request chosen
