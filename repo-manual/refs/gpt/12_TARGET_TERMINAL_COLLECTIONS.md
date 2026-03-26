# 12 · TARGET_TERMINAL_COLLECTIONS

## Purpose
Target profile for packages intended for the terminal runtime and the repo catalogue under `collections/`.

## Core rule
`collections/` is the shared catalogue root.
The terminal may browse this root broadly.
Only cartridge-compatible entries should be treated as mountable runtime cartridges by default.

## Family mapping
- `cartridges` → `collections/cartridges/<slug>/`
- `books` → `collections/books/<slug>/`
- `entertainment` → `collections/entertainment/<slug>/`
- `various` → `collections/various/<slug>/`

## Mountability rule
Default mountability should be derived from:
- `family`
- `kind`
- `runtime`

Recommended first-wave rule:
- `family=cartridges` and valid non-null `runtime` → `mountable: true`
- everything else → `mountable: false` unless a later adapter/profile says otherwise

## Terminal assumptions
The terminal should be able to:
- import a package
- preview it
- classify it
- browse saved collection families
- mount cartridge-compatible packages
- browse non-cartridge collection families without pretending they are runtime cartridges

## Explorer implications
Collections Explorer should show at least:
- title
- family
- kind
- entry path
- mountable true/false
- summary if present

## Save-slot implications
`saveSlots` is meaningful only for runtime-capable cartridge packages.
Do not attach save-slot semantics to books or other browse-only families.

## Handoff modes
This profile supports three honest handoff targets:
- terminal import package
- repo-ready file tree under `/collections/`
- local archive artifact for later import

A package can be prepared for `/collections/` without claiming a repo write happened.
Repo writes still require a separate authorized path.
