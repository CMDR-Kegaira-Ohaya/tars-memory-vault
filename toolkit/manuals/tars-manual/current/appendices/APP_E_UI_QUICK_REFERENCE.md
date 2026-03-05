# Appendix E - UI Quick Reference (control panel)

## Stop-point keywords
- **Bookmark** = keep in this chat
- **Remember** = save for next time (pause + yes/no)
- **Commit** = binding change (pause + yes/no)
- **Repo write** = any GitHub write (pause + yes/no)

## State line
`EIGC: ON/OFF | Governance: ON/OFF | Memory: ON/OFF | Ops-critical: ON/OFF | Trace: ON/OFF`

## E.1 Boot (session lock + hub honesty)
Indicative, not restrictive. Say it naturally.

- Who is speaking: OP‑A or OP‑B
- Scope: personal or shared
- State line: ON/OFF
- If hub work: “Confirm hub access” (handshake read: `vault/index.md`)
- Then: “Today’s goal?”

Boot starter (full ≤300 chars):

`BOOT: Who’s speaking—OP-A or OP-B? Scope—personal/shared? State: EIGC/Memory/Gov/Ops-critical ON/OFF. Hub handshake: read vault/index.md (confirm/deny). Quick scan: patch-queue pending? relay outbox count? RECENT_COMMITS? Then: today’s goal?`

## E.2 OP‑B first message (Greek-first)

## E.2A OP‑B professional starter (psychology)

> op-b εδώ. Θέλω επαγγελματική χρήση (ψυχολογία).  
> Πες μου την κατάσταση ON/OFF (EIGC, Governance, Memory, Ops-critical, Trace).  
> Δώσε μου mini workspace 5-10 γραμμών για να συμπληρώσω.  
> Μετά κάνε Εξερεύνηση (Α/Β/Γ) ή Τελική απάντηση για: [στόχος].  
> Μην εφευρίσκεις στοιχεία - αν λείπει κάτι, ζήτα rehydration.

Mini workspace (copy/paste)
- Στόχος:
- Πλαίσιο:
- Παραλήπτης:
- Ύφος:
- Facts:
- Άγνωστα:
- Επιθυμία vs Άμυνα:
- Επόμενο βήμα:

> Γεια σου TARS, op-b εδώ. Πες μου σε μία γραμμή την κατάσταση ON/OFF: EIGC, Governance, Memory, Ops-critical, Trace. Θέλω Εξερεύνηση (Α/Β/Γ) και απαντήσεις κυρίως σε bullets/πίνακες. Αν σου λείπει υλικό για να είσαι ακριβές, πες μου τι να ανεβάσω.

## E.3 Manual tool quick note (CURRENT-only)
- Live manual lives at: `toolkit/manuals/tars-manual/current/`
- Tool behavior: CURRENT-only
- `manual: versions` returns the live ID only (e.g., `v2-live-0001`)

## E.4 Recover after a break
- Run Boot
- “What were we doing?”
- “What do you need to proceed?”
- One bullet: next action

## E.5 Tone dial
You can set a humor slider, but it does not change stop-points.

## E.6 Repo chat (terminal relay)
Commands:

```
chat: show all
chat: show <channel>
chat: since last
chat: send <channel>: <message>
```

Display rules:
- plain text rendering (no raw JSON unless asked)
- `since last` is session-only (bookmark semantics)

## E.7 HUB_IMPORT Upload Wizard (when you want to upload files/folders)
Trigger phrase:
- “I want to upload X to the repo.”

Wizard outputs (what TARS must produce):
1) Allowed destination root + full dest path (`toolkit/` vs `ops/data/` vs `assets/`)
2) Mode choice (default: `merge_no_overwrite`)
3) A job JSON (copy/paste)
4) Execution checklist + verification checklist

Hard denials (do not propose these destinations):
- `.github/`, `tools/`, `vault/`, `ops/relay/`

Repo mechanics:
- zip → `ops/import/zips/<payload>.zip`
- job → `ops/import/jobs/<job>.json`
- push to `main` → Actions imports → inputs archived

