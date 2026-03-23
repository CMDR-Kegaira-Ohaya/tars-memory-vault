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
Use when the direct file path is not the right tool or when multi-file construction needs finer control:
- `createBlob`
- `createTree`
- `createCommit`
- `getGitRefFresh`
- `updateGitRefFresh`

### Branch and ref work
- `listBranches`
- `getBranchRef`
- `createBranch`
- `getGitRefFresh`
- `updateGitRefFresh`

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

## Validation note
Fresh ref operations were validated live on the disposable branch `test-update-ref`.
That validation included moving the branch to a newly created commit, not just re-submitting the same SHA.

## Boundary notes
- Keep repo structure and policy in `repo-manual/`, not in connector files.
- Promote repeated recovery knowledge into `repo-manual/troubleshooting/`.
- Treat connector operations as capabilities first, and as trusted paths only after live validation.
