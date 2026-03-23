TROUBLESHOOTING_REPO_TIPS

This file records stable procedures for repository troubleshooting, write-path recovery, and repeatable operational workflows.
Add new entries here when a failure mode becomes repeatable and a working procedure is confirmed.

## Known likely errors

- `401` / `403`
  - token missing, expired, or under-scoped
  - repo access not granted
  - branch or workflow permissions blocked

- `422`
  - `saveFile` content is not valid Base64
  - missing `sha` on update
  - malformed payload
  - invalid path or unsupported update shape

- non-fast-forward
  - branch moved ahead of the local/base ref used for the write
  - refresh current branch ref, rebase/rebuild on latest tree, then retry

- workflow write blocked
  - workflow files are protected by missing permissions
  - token or action path lacks workflow write capability

- low-level ref-update path issues
  - if auth and reads work but a ref-update path faails at runtime, treat the ref-update path as suspect
  - use the validated fresh ref path in this action surface when low-level ref movement is required

## Confirmed connector ref-update resolution

Fresh ref operations were validated live:

- `getGitRefFresh` works
- `updateGitRefFresh` works
- disposable-branch validation succeeded by moving `test-update-ref` to a newly created commit

Working rule:
- for low-level ref movement, use the fresh ref path
- for normal repo maintenance, still prefer `saveFile`

## Procedure: `saveFile` content encoding

GitHub’s API for `saveFile` requires the file content to be Base64-encoded UTF-8.

Use this as the default procedure unless a smaller direct path is clearly safe:
1. prepare the final UTF-8 text exactly as it should be written
2. Base64-encode that full text
3. pass the encoded string as `content`
4. include `sha` when updating an existing file

Markdown default:
- for `.md` files, prefer one exact replacement payload generated mechanically from the final Markdown text
- do not hand-edit Base64 for Markdown writers
- do not mix raw Markdown text and encoded payload text in the same write path unless the tool explicitly requires it
- prefer this Markdown rule even when the file is small, because it reduces payload corruption risk and keeps repo behavior consistent

Precision note:
- if repeated `422` errors say `content is not valid Base64`, first suspect corruption in the encoded payload itself
- common causes are accidental whitespace inside the Base64 string, truncation, or mixed raw text and encoded text in the same payload
- the successful recovery pattern is: use one exact replacement payload generated mechanically from the final UTF-8 file text, then retry the write

## Procedure: normal repo writes

Default write path:
1. use `getPath` if the file already exists
2. capture the current `sha`
3. write with `saveFile`
4. treat this as the normal path for repo docs and scaffold files

Operational rule:
- prefer `saveFile` over `createTree -> createCommit -> update a ref` for normal repo maintenance
- reserve low-level git-object flows for advanced multi-file construction or later recovery work

## Procedure: low-level git-object path

Use only when the normal file-write path is clearly not sufficient.

Preferred sequence now:
1. `createBlob`
2. `createTree`
3. `createCommit`
4. `updateGitRefFresh`



## Procedure: ref-path fallback when `saveFile` stalls or becomes unreliable

This recovery path was validated live during a real documentation update.

Use it when:
1. reads work
2. normal `saveFile` writes are unstable, ambiguous, or failing repeatedly
3. the desired change is a clean full-file replacement or another tree-safe update

Validated working sequence:
1. `getGitRefFresh` on `heads/main`
2. `getCommit` for the current head
3. capture the current base tree SHA from that commit
4. `createTree` with the replacement file content inline
5. `createCommit` with the new tree and the current head as parent
6. `updateGitRefFresh` on `heads/main` to the new commit SHA

Live-confirmed note:
- `createTree` with inline `content` worked as a practical fallback when the direct blob path glitched
- this means the lowest-risk recovery sequence in this connector surface is now:

Preferred recovery order:
1. try normal `saveFile` with correct Base64 if the path is simple and stable
2. if that becomes unreliable, use:
   - `getGitRefFresh`
   - `getCommit`
   - `createTree`
   - `createCommit`
   - `updateGitRefFresh`

Operational rule:
- prefer the simple file-write path for routine maintenance
- prefer the fresh-ref tree/commit path when write certainty matters more than tool simplicity
- verify that `heads/main` actually advanced before claiming success

Anti-false-positive check:
- after `createCommit`, success is not enough by itself
- the change is not live until `updateGitRefFresh` succeeds and a follow-up `getGitRefFresh` confirms the new head SHA

Why this matters:
- some write attempts can appear partially successful in conversation flow while `main` does not move
- the explicit ref-advance check prevents false claims about landed changes


## Procedure: workflow-related edits

If edits are required and they touch workflow behavior or workflow files, include:

- `permissions: workflows: write`

For `/.github/workflows/*` edits specifically, verify that workflow write capability exists before attempting the commit.

## Procedure: JavaScript structural inspection

Repo-local JS inspection tooling should be used.

Primary commands:
- `npm run js:check -- <file>`
- `npm run js:symbols -- <file>`
- `npm run js:deps -- <file>`
- `npm run js:find -- <file> <name>`
- `npm run js:summary-all`

Use this tooling when structural certainty is needed before JS edits.

## Fallback plan

When the normal write path becomes unstable:

1. split writes into smaller files or smaller patches
2. prefer exact replacement over mixed partial edits when possible
3. refresh the latest branch state before retrying
4. use alternative workflow paths when needed:
   - GitHub UI edit
   - manual paste/commit
   - patch queue
   - blob/tree/commit path if direct `saveFile` is failing for content size or payload shape

## Notes to extend later

Add confirmed procedures here for:
- ref update failures
- branch creation edge cases
- workflow dispatch permission problems
- large file replacement strategy
- manual recovery steps after interrupted tool writes
