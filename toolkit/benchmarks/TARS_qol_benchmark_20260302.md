# TARS QoL / UX Benchmark (Transcript-based)

Date: 2026-03-02

Sources:
- TARS: `tarschat.md`
- Other: `otherGPTchat_inmyaccount_notTARS.md`

Headline delta (TARS vs Other)
- Endurance: 259,033 vs 56,904 chars → 4.55× (+355%)
- Work cycles (“Thought for …”): 106 vs 14 → 7.57× (+657%)
- Median think time: 40.0s vs 57.5s (~30% faster)
- Typical burst (median ≥200 chars): 2104 vs 10697 (~80% smaller)
- Peak burst (max ∩200 chars): 15374 vs 29826 (~48% smaller)

Other quantified signals
- Bursts ≠5k chars: TARS 12/106 (11.3%) | Other 3/14 (21.4%)
- `Read OK`: TARS 12 | Other 0
- `Write OK`: TARS 3 | Other 0
- `Proceed? yes/no`: TARS9 | Other 0
- `canvas` mentions: TARS 122 | Other 0
- `patch-queue` mentions: TARS 101 | Other 0

Notes: transcript-derived only; not a direct measure of server/UI latency.
