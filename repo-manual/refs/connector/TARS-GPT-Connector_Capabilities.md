# TARS-GPT-Connector_Capabilities.md

## Status
Live connector surface for the repo-locked GitHub action bound to `CMDR-Kegaira-Ohaya/tars-memory-vault`.

## Purpose
Record the currently exposed GitHub operations available to TARS for this repository.

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
- `listBranches`
- `getBranchRef`
- `getRef`
- `updateRef`
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
30 operations total.

## Runtime note
The connector is working for:
- authentication
- private repo reads
- root and path reads
- direct file writes through `saveFile`

A current low-level limitation remains:
- `updateRef` is exposed, but in live use it has not behaved reliably through this connector path

## Working rule
For normal repo work:
- prefer `saveFile`
- use `getPath` before updating an existing file
- include the current `sha` on file updates
- reserve low-level git-object flows for special cases or later troubleshooting

## Boundary
This file records connector surface and current practical availability.
It does not by uself define repo policy or permission guarantees.
