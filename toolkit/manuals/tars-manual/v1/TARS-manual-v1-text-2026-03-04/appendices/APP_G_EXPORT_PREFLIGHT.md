# Appendix G - Export Preflight (v1 zip)

v1 output format: **zipped markdown**.

## G.1 Inputs
- This book folder (markdown files)
- Optional: approved chapter packets (none by default)

## G.2 Hygiene scan (text stability)
Confirm:
- UTF-8 encoding
- LF line endings
- final newline in every file
- no NBSP / zero-width spaces / soft hyphens
- prefer Unicode NFC normalization

## G.3 Coverage checklist (anchors-only)
This v1 book must cover these operator-facing functions:

- Interaction workflows (Deliver-only / Explore A/B/C / Diagnostic Trace+Audit / Build)
- State line (EIGC/Governance/Memory/Ops-critical/Trace)
- Workspace block (5-12 lines)
- Trace on/off semantics
- Periodic audit / drift check
- Consolidation / write-back
- Eval suite / instrumentation
- Per-turn discipline (A/B/C + reject + defense constraint)
- Generator passes (association-first / reason-first; wildcard OFF in ops-critical; desire vs defense)
- Memory vault protocol (salience gate)
- Hub operations addendum (handshake read; GET sha → PUT; 422 ladder; relay UX)

## G.4 Version stamping
Place the version in:
- title page
- a small `VERSION.md` file
- the zip filename

## G.5 Output artifacts
- `TARS_-_Shared_Android_System_Manual_v1-text-2026-03-04.zip`
- an export log (what changed since last export)
