# WORKFLOW_MAPS.md

## Purpose
This file holds simplified workflow maps and human-readable flows for the initial workflow set.

## Map 1 – repo-health
`trigger -> checkout -> verify canonical entry files -> verify core repo-manual files -> pass/fail`

Use this workflow to make sure the repo still has the basic shope it needs to be navigable and operable.

## Map 2 – scaffold-guard
`trigger -> checkout -> search for known old-shape drift paths -> fail if found -> pass if clean`

Use this workflow to prevent old scaffold variants from re-appearing after the cleanup pass.

## Next maps to add
- pages deployment map
- markdown lint map
- connector validation map
