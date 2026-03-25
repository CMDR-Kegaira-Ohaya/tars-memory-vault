# TARS-GPT-Connector_Capabilities.md

## Status
Live connector surface for the repo-locked GitHub action bound to `CMDR-Kegaira-Ohaya/tars-memory-vault`.

## Purpose
Record the currently exposed GitHub operations available to TARS for this repository, with notes about what has been validated live.

## Current connector profile
- Action title: `TARS GitHub Repo Connector`
- Action version: `1.3.0`
- Auth model: GPT Action editor `API Key -> Bearer`
- Token model: fine-grained GitHub PAT stored in the editor, not in the schema
- Ref path model: fresh ref operations only
- Legacy ref operations: removed from the current action schema

## Current repository permission profile
- Metadata: read
- Actions: read/write
- Actions variables: read/write
- Code: read/write
- Commit statuses: read/write
- Custom properties for repositories: read/write
- Deployments: read/write
- Pages: read/write
- Pull requests: read/write
- Webhooks: read/write (configured permission; not yet live-validated in this manual)
- Workflows: read/write

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

## Permission note
The current fine-grained PAT permission profile is sufficient for the live connector surface currently in use.
That conclusion is based both on the configured permission set and on successful live validation of reads, file writes, branch creation, and fresh ref movement.
Webhook read/write is now part of the documented configured permission profile, but it has not yet been live-validated through a connector-level operation in this repo manual.

## Working rule
For normal repo work:
- prefer `saveFile`
- use `getPath` before updating an existing file
- include the current `sha` on file updates

For low-level ref movement:
- use `getGitRefFresh`
- use `updateGitRefFresh`

## Boundary
This file records connector surface, current action profile, and current practical availability.
It does not by itself define repo policy or permission guarantees beyond the current validated connector state.
