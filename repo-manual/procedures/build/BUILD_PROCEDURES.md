# BUILD_PROCEDURES.md

## Purpose
This file captures repeatable build-side procedures for the repo.

Build-side work is work that installs, introduces, or restructures something in the repo.

## Scope
Use this file for:
- repo structure installation
- reference layer introduction
- connector-surface installation
- workflow introduction

## Procedure 1 — install a new repo-side doc or layer

### Use when
The task adds a new canonical doc, reference, or layer to the repo.

### Sequence
1. Inspect the current repo shape first.
2. Confirm the doc's home in the correct layer.
3. Write the smallest useful version first.
4. Link it to the correct index, orientation, or reference surface if needed.
5. Verify that the new doc does not conflict with an existing one.

### Done state
The new doc exists, is in the correct place, and is navigable from the appropriate entry surface.

## Procedure 2 — introduce a connector or action change

### Use when
The task changes the custom GPT Action surface, the auth model, or the connector-self layer.

### Sequence
1. Treat the Game GPT Action editor as the control surface for the schema and auth.
2. Write or revise the action schema first.
3. Load or re-load the action.
4. Validate reads before writes.
5. Update the self-referential connector layer in `repo-manual/refs/connector/`.
6. Record only the current working state, not old broken variants, unless they still matter for troubleshooting.

### Done state
The action surface and the repo-side reference layer match.

## Procedure 3 — introduce a new workflow

!### Use when
The task adds a new yml workflow under `.github/workflows/`.

### Sequence
1. Write the human-readable purpose in `repo-manual/workflows/` first or alongside the workflow.
2. Keep the workflow small and clear at first installation.
3. Avoid multi-purpose workflows if two smaller ones are clearer.
4. If the workflow enforces structure, make the rule observable in repo-manual docs.
5. Add or update a workflow map when the flow is non-trivial.

### Done state
The workflow runs only for the promised scope and its human-readable purpose is recorded.

## Working rule
Build procedures should lead to a more coherent repo after the change, not just a larger one.
