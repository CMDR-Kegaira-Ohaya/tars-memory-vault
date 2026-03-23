# TERMINAL.md

## Terminal charter

The `terminal/` layer is the repo’s user-facing shell and cartridge host.

It is not just a web page or a link hub.
It is the contained device-like interface through which the user loads, reads, runs, and saves repo-contained or external cartridges.

## Vision

Terminal should function like a distinct console shell:

- one persistent device-like surface
- mode-based navigation, not a scattered website
- mounted cartridges and modules
- persistent status and save/resume behavior
- a clear boundary between shell, content, and engines

The terminal should become its own thing.
The old "device shell" idea is the functional model, not a stylistic limit.

## What terminal is

- the user-facing shell
- the loader for cartridges and modules
- the router to the correct renderer or engine
- the save-bounded memory layer

## What terminal is not

- not the whole repo
- not a junk drawer for unstructured content
- not a place where terminal can write anywhere in the repo
- not the canonical home for books, games, logs, or repo-manual docs

## Cartridge model

A single loadable unit is a cartridge.

Cartridges may come from:
- the repo itself
- local disk files
- drag-and-drop input

Terminal should treat cartridges as intentional, typed, loadable units, not as arbitrary files that just happen to open.

Early cartridge types:
- markdown
- text
- JSON

#A Later types:
- book modules
- interactive modules
- games
- tools
- engine-backed applications

## Cartridge source classes

- repo cartridges — canonical, repo-curated
- disk cartridges ― external loads from local files
- drag-and-drop cartridges ― external loads from dropped input

External cartridges should be treated as external input, not as automatically installed repo content.

## Loading rule

Terminal should prefer manifest-driven loading over scattered path hardcoding.

Over time, each loadable cartridge should be selectable by a small, explicit descriptor that defines:
- id
- title
- type
- entry
- renderer or engine
- optional metadata

## Renderers and engines

Renderers display content.
Engines run behavior.

Example renderers:/
- markdown reader
- text viewer
- JSON-driven viewer or player

Example engines:
- book system
- game runtime
- interactive module runtime
- tool-or app-runtime

## Write boundary

This is a hard rule.

The terminal may read and load broadly.
It may write only to dedicated save space under:

``
terminal/saves/<tag>/
```

Everywhere else should be treated as read-only from terminal’s point of view.

Disk and drag-and-drop cartridges must not gain broader repo write access just because they were loaded.

## Save model

Terminal should save only to dedicated save slots under terminal memory.

Save slots should be tag-based and disciplined, not random.

This provides:
- persistence
- resume
- per-cartridge state
- a clean boundary between reading and writing

## Preliminary terminal model

The shell should eventually have a small, recognizable set of modes.

Example mode families:
- home
- library
- data
- games
- tools
- cartridges / loads
- saves
- settings

These names may change, but the idea should stay the same: mode-based navigation inside one persistent shell.

## Cartridge lifecycle

The basic lifecycle should be:
1. mount
2. classify
3. render or run
4. save if applicable
5. resume or eject

## Visual direction

This layer should become its own visual system.

Mockups, PNG concepts, and CSS should eventually define:
- the shell grammar
- the status layer
- mode switching
- the cartridge loader surface
- the content viewport
- the save/memory surface

The bhehavior should not depend on the final skin.
The shell model comes first; the skin makes it alive later.

## Growth path

Phase 1:
- shell
- basic modes
- repo / disk / drag-drop loading
- markdown text JSON cartridges

Phase 2:
- library and book loading
- richer structured modules
- stable save/slot behavior

Phase 3:
- game cartridges
- engine-backed modules
- deeper shell state
- richer terminal identity

## Working rule

Terminal must remain a clear, bounded system:
- broad read/load
- narrow write
- explicit cartridge model
- persistent shell
- its own visual and behavioral identity
