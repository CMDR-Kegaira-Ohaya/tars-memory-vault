# WORKFLOW_MAPS.md

## Purpose
This file holds simplified workflow maps and human-readable flows for the current workflow set.

## Map 1 — repo-health
`trigger -> checkout -> verify canonical entry files -> verify procedure layer -> verify connector reference layer -> verify workflow landing surfaces -> pass/fail`

Use this workflow to make sure the repo still has the basic shape it needs to be navigable and operable.

## Map 2 — scaffold-guard
`trigger -> checkout -> search for known old-shape drift paths -> fail if found -> pass if clean`

Use this workflow to prevent old scaffold variants from reappearing after the cleanup pass.

## Map 3 — doc-sync
`trigger -> checkout -> enumerate workflow files -> compare against workflow docs -> fail if any workflow is undocumented`

Use this workflow to keep executable workflows and the workflow-doc layer synchronized.

## Map 4 — connector-self-sync
`trigger -> checkout -> read connector self-layer -> verify version marker -> verify fresh ref operation names -> fail if legacy ref names appear`

Use this workflow to keep the self-referential connector layer aligned with the active custom connector profile.

## Map 5 — pages-readiness
`trigger -> checkout -> detect whether Pages exists -> if absent, report and pass -> if present, enforce Pages readiness checks`

Use this workflow to keep Pages optional now and enforceable later.

## Map 6 — internal-link-guard
`trigger -> checkout -> scan markdown links under repo-manual -> resolve relative targets -> fail if any target is missing`

Use this workflow to prevent documentation-link rot in the repo-manual layer.

## Next maps to add
- Pages deployment map
- Markdown lint map
- Connector validation map
