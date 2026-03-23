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
- `listBranches`
- `getBranchRef`
- `createBranch`
- `getGitRefFresh`
- `updateGitRefFresh`

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

## Working rule
For normal repo work:
- prefer `saveFile`
- use `getPath` before updating an existing file
- include the current `sha` on file updates

For low-level ref movement:
- use `getGitRefFresh`
- use `updateGitRefFresh`

## Boundary
This file records connector surface and current practical availability.
It does not by itself define repo policy or permission guarantees.
