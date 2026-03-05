# Appendix H - Repo-live Publishing (post‑v1)

This section is a roadmap, not an instruction set.

## Scope boundary
- v1 is a frozen text snapshot (zipped markdown).
- repo-live manual publishing happens after v1 stabilizes.

## Verification rule
At time of implementation:
- verify repo paths and workflows against current repo state
- do a handshake read first
- prefer patch-queue for edits

## Publishing model (recommended)
- small, sharded markdown files
- ASCII filenames
- Greek content inside files
- patch-queue for updates

## Safety gates
- Repo write remains a strict stop-point.
- workflow edits require explicit allow_workflows.

## Migration note
Move from canvas-first authoring to repo-first publishing only after v1 text is stable.
