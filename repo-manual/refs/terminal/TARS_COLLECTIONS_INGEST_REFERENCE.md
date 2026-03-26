## Purpose

Reference for the authenticated repo-side collections ingest path that turns terminal staged save-request output into canonical `/collections/` entries.

## Core rule

The browser terminal still stages locally and prepares the repo-ready request.

The authenticated repo-side handoff is the step that may create or update canonical repo content under:

`collections/<family>/<slug>/`

This is separate from terminal save-state writes under:

`terminal/saves/<tag>/`

## Current split

### Terminal-side staging
Use the terminal to:
- import in **Import Bay**
- shape family / slug / title / kind / runtime
- stage locally
- prepare the repo-ready request envelope

### Authenticated repo-side ingest
Use the authenticated handoff to:
- validate the staged request
- validate family and slug
- validate canonical package root
- write the package into `collections/<family>/<slug>/`
- update `collections/<family>/index.v1.json`
- update `collections/index.v1.json`
- write response/history sidecars under `terminal/saves/<saveTag>/`

## Canonical package target

Current canonical target shape for collections ingest:

```text
collections/<family>/<slug>/
  manifest.json
  content/
  assets/        (optional)
  saves/         (optional later, if applicable)
```

## Operator surfaces

### Import Bay
Use this to bring the file in and prepare the request.

### Collections Explorer
Use this to confirm the canonical repo entry appears as a repo-indexed entry after ingest.

### Request History
Use this to inspect the request chain.
The history sidecar remains under:

`terminal/saves/<saveTag>/request-history-index.v1.json`

### Repo Verified
Use this to inspect the authenticated ingest response.
The verified response sidecar remains under:

`terminal/saves/<saveTag>/repo-write-response.v1.json`

## Guardrails

- terminal local staging is not itself a repo write
- Boards are not collections-ingest targets
- canonical content lands under `/collections/`
- response/history sidecars stay under `/terminal/saves/` for stable operator inspection
- success claims require landed-state verification on the repo head
