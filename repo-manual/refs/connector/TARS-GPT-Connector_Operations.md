# TARS-GPT-Connector_Operations.md

## Purpose
Practical use notes for the live GitHub connector surface.

## Recommended validation order
1. `getAuthenticatedUser`
2. `getRepository`
3. `listRoot`

Use this order to separate auth failures from repo-targeting failures.

## Common operation paths

### Inspect repo state
- `getRepository`
- `listRoot`
- `getPath`
- `listBranches`
- `getBranchRef`

### Create or update files
- `getPath` to read current file state
- `saveFile` to create or update content
- include `sha` when updating an existing file

### Delete files
- `getPath` to confirm target and current `sha`
- `deleteFile` with the current file `sha`

### Low-level git path
Use when the direct file path is unstable or when multi-file construction needs finer control:
- `createBlob`
- `createTree`
- `createCommit`
- `updateRef`

### Branch and ref work
- `listBranches`
- `getBranchRef`
- `getRef`
- `createBranch`
- `updateRef`

### Pull request flow
- `listPullRequests`
- `createPullRequest`
- `getPullRequest`
- `updatePullRequest`
- `mergePullRequest`

### Direct merge flow
- `mergeBranch`

### Workflow inspection and control
- `listWorkflows`
- `listWorkflowRuns`
- `getWorkflowRun`
- `rerunWorkflowRun`
- `cancelWorkflowRun`
- `dispatchWorkflow`

### Repository events
- `repositoryDispatch`

### Pages
- `getPagesSite`

## Boundary notes
- Keep repo structure and policy in `repo-manual/`, not in connector files.
- Promote repeated recovery knowledge into `repo-manual/troubleshooting/`.
- Treat connector operations as capabilities, not permissions guarantees.
