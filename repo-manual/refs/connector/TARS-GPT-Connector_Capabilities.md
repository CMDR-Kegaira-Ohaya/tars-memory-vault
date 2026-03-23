# TARS-GPT-Connector_Capabilities.md

## Status
Live connector surface for the repo-locked GitHub action bound to `CMDR-Kegaira-Ohaya/tars-memory-vault`.

## Purpose
Record the currently exposed GitHub operations available to TARS for this repository, with notes about what has been validated live.

## Capability groups

### Auth
- `getAuthenticatedUser`

### Repo
- `getRepository`

### Contents
- `listRoot`
- `getPath`
- `saveFile`
- `deleteFile`

### Branches and refs
Legacy ref operations:
- `getRef`
- `updateRef`

Fresh validated ref operations:
- `getGitRefFresh`
- `updateGitRefFresh`

Other branch/ref operations:
- `listBranches`
- `getBranchRef`
- `createBranch`

### Git objects
- `getTree`
- `createBlob`
- `createTree`
- `getCommit`
- `createCommit`

### Pull requests and merges
- `listPullRequests`
- `createPullRequest`
- `getPullRequest`
- `updatePullRequest`
- `mergePullRequest`
- `mergeBranch`

### Actions
- `listWorkflows`
- `listWorkflowRuns`
- `getWorkflowRun`
- `rerunWorkflowRun`
- `cancelWorkflowRun`
- `dispatchWorkflow`

### Dispatch
- `repositoryDispatch`

### Pages
- `getPagesSite`

## Count
30 operations total in the intended action surface.

## Runtime note
The connector is working for:
- authentication
- private repo reads
- root and path reads
- direct file writes through `saveFile`
- branch creation
- low-level git object creation
- live ref reads through `getGitRefFresh`
- live ref movement through `updateGitRefFresh`

## Legacy vs fresh ref status
Legacy ref path:
- `getRef` and especially `updateRef` should be treated as legacy behavior
- legacy `updateRef` was the unstable path during earlier validation

Fresh ref path:
- `getGitRefFresh` is validated live
- `updateGitRefFresh` is validated live
- disposable-branch validation succeeded by moving `test-update-ref` to a newly created commit

## Working rule
For normal repo work:
- prefer `saveFile`
- use `getPath` before updating an existing file
- include the current `sha` on file updates

For low-level ref movement:
- use the fresh ref operations
- treat the legacy ref operations as historical and non-preferred

## Boundary
This file records connector surface and current practical availability.
It does not by itself define repo policy or permission guarantees.
