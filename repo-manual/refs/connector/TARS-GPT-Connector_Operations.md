# TARS-GPT-Connector_Operations.md

## Purpose
Practical use notes for the live GitHub connector surface.

## Current self profile
- Connector title: `TARS GitHub Repo Connector`
- Connector version: `1.3.0`
- Auth model: `API Key -> Bearer`
- PAT model: fine-grained GitHub token stored in the GPT Action editor
- Ref model: fresh ref path only

## Current permission baseline
- Metadata: read
- Actions: read/write
- Actions variables: read/write
- Code: read/write
- Commit statuses: read/write
- Custom properties for repositories: read/write
- Deployments: read/write
- Pages: read/write
- Pull requests: read/write
- Workflows: read/write

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

## Workflow maintenance note
- Use Node 24 as the workflow runtime baseline.
- Prefer current action versions that run on Node 24.
- Do not preserve Node 20 as a repo baseline just to silence transition warnings.
- Revisit self-hosted caveats only if this repo later depends on macOS 13.4-or-lower runners or ARM32 self-hosted runners.

## Validation note
Fresh ref operations were validated live on the disposable branch `test-update-ref`.
That validation included moving the branch to a newly created commit, not just re-submitting the same SHA.

## Permission note
The current permission profile is not just theoretical.
It matches the live connector behavior already validated through:
- private repo reads
- direct file writes
- branch creation
- fresh ref reads
- fresh ref updates

## Boundary notes
- Keep repo structure and policy in `repo-manual/`, not in connector files.
- Promote repeated recovery knowledge into `repo-manual/troubleshooting/`.
- Treat connector operations as capabilities first, and as trusted paths only after live validation.
