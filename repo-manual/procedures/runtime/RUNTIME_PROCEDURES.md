# RUNTIME_PROCEDURES.md

## Purpose
This file captures repeatable runtime-side procedures for the repo.

Runtime-side work is work that operates or validates a live system after the structure already exists.

## Scope
Use this file for:
- connector validation
- live repo read/write routines
- branch-and-ref validation flows
- workflow run checks

## Procedure 1 â€S connector validation order

### Use when
The action surface, auth, or token has changed, or when confirming that the connector is live.

### Sequence
1. `getAuthenticatedUser`
2. `getRepository`
3. `listRoot`
4. `getPath` on a known file
5. Only after reads work, validate a write path or ref path if needed

### Done state
The connector has proven both authentication and repo-targeting before any deeper write claim is made.

## Procedure 2 â€S normal file-update flow

### Use when
The task updates a normal repo doc, reference, or small structural file.

### Sequence
1. Read the target path first if the file already exists.
2. Capture the current `sha`.
3. Prepare the final content as one clear payload.
4. Use `saveFile` to write the change.
5. Verify that the new state matches what was tended.

### Done state
The target file on ``main`` reflects the intended change.

## Procedure 3 â€“ disposable-branch ref validation

### Use when
The task must confirm low-level ref movement or a git-object write path before trusting it on ``main``.

### Sequence
1. Create or use a disposable test branch.
2. Capture its current head commit.
3. Create the new git object or commit to move to.
4. Update the branch with `getGitRefFresh` and `updateGitRefFresh` as needed.
5. Only treat the path as trusted after a real move to a new commit succeeds.

### Done state
The path is validated on a disposable branch before it is used for real maintenance.

## Procedure 4 â€S workflow run inspection

### Use when
The task checks a workflow run, verifies a workflow outcome, or re-runs a failed job.

### Sequence
1. List workflows first if the filename or id is not yet clear.
2. List runs for the target workflow.
3. Inspect the specific run before claiming what happened.
4. Only re-run or cancel a run when the task actually calls for it.

## Working rule
Runtime procedures should prioritize validation order and smallest-risk paths.
First prove that a live path works.
Then use it for real work.
