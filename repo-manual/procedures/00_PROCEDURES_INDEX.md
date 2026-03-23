# 00_PROCEDURES_INDEX.md

## Purpose
This file is the entry point for the repo-side procedure layer.

The procedure layer exists to capture stable, repeatable, work that should be performed the same way each time.

## Operating principle
- Write a procedure only when the steps are repeatable.
- Keep the procedure small, clear, and actionable.
- If it is still experimental, keep it out of canonical procedures.


## Procedure classes

### Build
`repo-manual/procedures/build/BUILD_PROCEDURES.md`
Use for how to install, introduce, or construct something in the repo.

### Runtime
`repo-manual/procedures/runtime/RUNTIME_PROCEDURES.md`
Use for how to operate a live flow or perform validation after the system exists.

### Maintenance
`repo-manual/procedures/maintenance/MAINTENANCE_PROCEDURES.md`
Use for how to tighten, revise, clean, or align something over time.

## Read order
1. Read this index first
2. Go to the correct class of procedure
3. Follow the smallest procedure that fits the task

## Promotion rule
Promote work into this layer only when a method has:
- a clear start condition
- a clear sequence
- a clear done state
- a high chance of being reused

## Current installed procedure landings- `build/BUILD_PROCEDURES.md`
- `runtime/RUNTIME_PROCEDURES.md`
- `maintenance/MAINTENANCE_PROCEDURES.md`

## Relationship to workflows
Procedures explain how to do work.
Workflows execute automated work.

First write the procedure if the method must be clear to humans.
Then add or revise a workflow if the method should be automated.
