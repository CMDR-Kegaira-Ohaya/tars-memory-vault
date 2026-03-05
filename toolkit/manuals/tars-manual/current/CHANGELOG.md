# Changelog

## TARS-manual-v2-text-2026-03-05.zip (2026-03-05)
- v2 alignment: manual now matches shipped hub reality (importer + upload wizard) instead of roadmap framing.
- Manual tool contract: CURRENT-only behavior; `manual: versions` returns only the live version ID (plain counter series).
- Live version ID: introduced `v2-live-0001` style identifiers (bumped manually at packaging time).
- Rewrote Ch3 (Start in 60 Seconds): BOOT starters + upload/import micro-flow + rehydration discipline.
- Updated Ch6 (Hub Repository): three write paths (importer / patch-queue / direct API), denied prefixes, allowed destination roots.
- Updated Ch9 (Troubleshooting): importer fix ladders; demoted base64/sha issues to “direct API last resort”.
- Updated Appendix F (Technical): importer threat model + invariants + guardrail tests rationale; clarified packaging root rule.
- Updated Appendix G: packaging + CURRENT install preflight via importer (`replace` mode).
- Updated Appendix H: converted roadmap into CURRENT operations guide.



## TARS-manual-v1-text-2026-03-04 (2026-03-04)
- QA hygiene: replaced smart quotes/dashes with straight quotes/hyphens; regenerated MANIFEST as exact file list.
- Restored Appendix F.13-F.15 (eval/router/wildcard) with explicit source-of-truth module references.
- Restored Ch5A2 in the package and linked it from TOC.
- Expanded Appendix F (analytical): epistemic contract, availability/retrieval, generator passes, critic gates, trace limits, continuity taxonomy, and hub-ops validity model.
- Calibrated for OP‑B (psychologist) + OP‑A + self-referential TARS use.
- Added "self-referential consult" guidance and a citation convention for referencing this book in chat.
- Expanded OP‑B chapter with psychology professional workflows, examples, and repo/library collaboration.
- Expanded hub chapter with toolkit/library reality and how to use patch-queue for library entries.
- Expanded technical appendix with `/ops` procedure sources and the library lane.
- Added maintenance/calibration notes to troubleshooting.
