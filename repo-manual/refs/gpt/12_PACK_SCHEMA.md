# 12 · PACK_SCHEMA

## Purpose
Canonical package schema for GPT-side packaging and terminal/repo handoff.

## Canonical folder layout

```text
<slug>/
  manifest.json
  content/
  assets/        (optional)
  saves/         (optional)
```

This is the only first-wave package layout.
Do not invent alternates in v1.

## Package envelope
Every emitted package uses:
- `schema`: `tars-pack.v1`

## Required manifest fields
- `schema`
- `kind`
- `family`
- `id`
- `title`
- `slug`
- `entry`
- `encoding`

## Optional manifest fields
- `runtime`
- `summary`
- `description`
- `assets`
- `saveSlots`
- `tags`
- `mountable`

## Known family values
- `cartridges`
- `books`
- `entertainment`
- `various`

## Known kind examples
- `cartridge`
- `book`
- `notes`
- `bundle`
- `media-entry`

## Runtime rule
`runtime` should only be non-null when the package is actually intended for a runtime-aware surface.
For first-wave terminal work, likely runtime examples are:
- `text-adventure.v1`
- `roguelike-text.v1`
- `board-microgame.v1`

Non-runtime collection items should use:
- `runtime: null`

## Entry rule
`entry` must point to a file inside `content/`.
That file must exist.

## Save-slot rule
- omit `saveSlots` when no save state exists
- allow small integer values for simple cartridges
- first-wave terminal target recommendation: `0` to `3`

## Example cartridge manifest

```json
{
  "schema": "tars-pack.v1",
  "kind": "cartridge",
  "family": "cartridges",
  "id": "star-patrol",
  "title": "Star Patrol",
  "slug": "star-patrol",
  "entry": "content/index.md",
  "runtime": "text-adventure.v1",
  "encoding": "utf-8",
  "saveSlots": 3,
  "mountable": true
}
```

## Example book manifest

```json
{
  "schema": "tars-pack.v1",
  "kind": "book",
  "family": "books",
  "id": "neuromancer-notes",
  "title": "Neuromancer Notes",
  "slug": "neuromancer-notes",
  "entry": "content/index.md",
  "runtime": null,
  "encoding": "utf-8",
  "mountable": false
}
```

## Invariant
One schema should serve all three surfaces:
- GPT-side packager emits it
- terminal imports/browses it
- repo stores it
