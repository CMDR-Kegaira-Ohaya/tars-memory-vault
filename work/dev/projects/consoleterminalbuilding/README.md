# CONSOLE TERMINAL WORKING BOARD

## Purpose

This file is the single working board for building the terminal system.

It combines:
- the terminal charter
- the corrected shell model
- the structural architecture
- the current build direction
- the current board-mode rules

This board lives under:

`work/dev/projects/consoleterminalbuilding/`

so the terminal design-and-build plan is kept in project work space, not inside the runtime-facing `terminal/` layer itself.

## Relationship to `terminal/`

`terminal/` remains the repo layer reserved for the terminal system itself.

This working board is moved out of `terminal/` on purpose:
- to keep `terminal/` clean as a runtime-facing layer
- to keep planning and build orchestration in project work space
- to let the implementation grow later without mixing runtime surfaces and active design planning

## Core identity

Terminal is the repo’s user-facing shell and cartridge host.

It is not just a web page or a link hub.
It is the contained device-like interface through which the user loads, reads, runs, and saves repo-contained or external cartridges.

Terminal should behave like:
- one persistent shell
- mode-based navigation
- mounted cartridges and modules
- persistent shell state
- bounded save behavior
- a clear separation between shell, content, and engines

The terminal should become its own thing.
The old “device shell” idea is a functional reference, not a stylistic limit.

## Non-negotiable rules

### 1. Persistent shell
The shell stays present while content changes inside it.

### 2. Typed cartridges
Terminal loads intentional, typed cartridges.
It should not treat arbitrary files as equal to cartridges.

### 3. Broad read, narrow write
Terminal may read and load broadly.
It may write only under:

`terminal/saves/<tag>/`

### 4. Repo-true content roots
Terminal should mirror real repo domains where those domains already exist.

### 5. External cartridges stay external
Disk and drag-drop cartridges do not automatically become repo content.

### 6. Boards mode is live readout only
Working boards are read at source and displayed in terminal.
They are not saved through terminal GUI and do not use `terminal/saves/`.

## First canonical repo cartridge root

The first canonical repo cartridge root is:

`collections/`

This is the normal repo-facing content surface for terminal v1.

Within `collections/`, terminal should surface:
- `collections/books/`
- `collections/entertainment/`
- `collections/various/`

## Non-default repo surfaces

These are real repo surfaces, but they are not normal terminal content roots in v1:
- `repo-manual/`
- `logs/`
- `work/`

They may be surfaced later through system, admin, or special-purpose views if explicitly desired.

## Approved board roots

Boards mode is the deliberate exception for workspace readout.

The first approved board root is:

`work/dev/projects/`

Boards mode may enumerate and mount working boards from approved project paths under that root.

Example live board:
- `work/dev/projects/consoleterminalbuilding/README.md`

This does not turn `work/` into a normal user-content root.
It only creates a special-purpose readout path for working boards.

## v1 shell modes

### Home
Shell overview.
Shows current mount, recent saves, quick actions, and system context.

### Collections
The main repo-facing content mode.
Maps directly to `collections/`.

### Boards
Special-purpose mode for loading approved working boards from workspace paths.

Boards mode should:
- enumerate approved working boards
- let the user choose one
- mount the selected board
- display its live contents on the console screen through the markdown reader

Boards mode should not:
- create terminal save slots for boards
- write back to boards through terminal GUI
- duplicate boards into terminal-owned storage

### Cartridges
The load bay.
Used for mounting cartridges from:
- repo
- disk
- drag-and-drop

### Runs
The active viewport.
Mounted cartridges or boards are rendered or run here.

### Saves
Save-slot management.
All terminal persistence routes through this mode except boards, which never use it.

### System
Diagnostics, cartridge metadata, board metadata, shell state, renderer or engine info, settings.

## Boards mode rule set

Boards mode is live readout only.

The source-of-truth board remains where it actually lives in workspace.
Terminal only mounts and displays the latest readout.

### Board update rule
When work progresses and a working board changes, that change happens at the source file.
The terminal screen updates its readout from the live source.

### Save rule in Boards mode
Boards never write to `terminal/saves/`.

### GUI behavior rule
In Boards mode:
- Save should be greyed out or disabled
- selecting Save may show an explanation popup

Suggested explanation:

> Working boards are source files in workspace.
> Update them at their live path, not through terminal GUI.

### Status-strip rule
Boards mode should visibly identify itself as read-only live board display.

Example status indicators:
- `MODE: BOARDS`
- `SOURCE: work/dev/projects/...`
- `STATE: READ-ONLY LIVE BOARD`

## Cartridge source classes

### Repo cartridge
Canonical and repo-curated.

### Disk cartridge
Loaded from local disk.

### Drag-and-drop cartridge
Loaded from drop input.

### Board cartridge
A special approved repo-readout class for working boards.

A board may technically route through the markdown reader, but it is not a normal save-capable cartridge.
It has a different behavioral contract.

External cartridges are external input.
They are not automatically installed into repo content.

## Early cartridge types

Supported first:
- markdown
- text
- json

Later:
- book
- interactive module
- tool
- game
- engine-backed application

Board readout can use the markdown reader, but boards remain a separate terminal role from ordinary content cartridges.

## Manifest v0 direction

Terminal should prefer manifest-driven loading over scattered path hardcoding.

Each canonical cartridge should eventually be selectable through a small descriptor.

Example:

```json
{
  "id": "books-example-001",
  "title": "Example Cartridge",
  "type": "markdown",
  "source": "repo",
  "entry": "collections/books/example.md",
  "renderer": "markdown-reader",
  "save": {
    "enabled": true,
    "tag": "books-example-001"
  },
  "meta": {
    "description": "Optional short description",
    "author": "Optional",
    "tags": ["book", "reader"]
  }
}
```

### Required v0 fields
- `id`
- `title`
- `type`
- `source`
- `entry`
- `renderer`
- `save.enabled`
- `save.tag`

### Optional v0 fields
- `meta.description`
- `meta.author`
- `meta.tags`

### Board descriptor note
Boards may later use a lighter descriptor or approved-root enumeration instead of ordinary save-capable cartridge manifests.

## Cartridge and board lifecycle

### Normal cartridge lifecycle

1. detect
2. classify
3. resolve
4. mount
5. render or run
6. save if applicable
7. resume or eject

#### Detect
Input arrives from repo, disk, or drag-drop.

#### Classify
Terminal determines:
- source class
- cartridge type
- trust class
- supported or unsupported status

#### Resolve
Terminal selects the correct renderer or engine.

#### Mount
The cartridge becomes the active mounted unit in shell state.

#### Render or run
The cartridge is displayed or executed inside `Runs`.

#### Save
If the cartridge supports persistence, it writes only into its dedicated save slot.

#### Resume or eject
The cartridge can be resumed from saved state or cleanly ejected.

### Board lifecycle

1. enumerate
2. select
3. mount
4. display live readout
5. refresh on source change
6. unmount or switch board

Boards do not have a save step in terminal.

## Renderer and engine model

Renderers display content.
Engines run behavior.

### Early renderers
- `markdown-reader`
- `text-reader`
- `json-player`

### Later engines
- `book-engine`
- `tool-engine`
- `game-engine`
- `module-runtime`

The renderer or engine decision should come from cartridge type plus manifest routing, not from scattered special cases.

Boards can use `markdown-reader` initially, but their mode behavior stays distinct from ordinary content cartridges.

## Save boundary

This is a hard rule.

Terminal may read and load broadly.
It may write only under:

`terminal/saves/<tag>/`

No cartridge may write directly into:
- `collections/`
- `repo-manual/`
- `logs/`
- `work/`
- `.github/`
- any other repo surface

Boards are explicitly outside terminal save behavior and never write through the GUI.

## Save model

Recommended structure:

```text
terminal/
  saves/
    books-example-001/
      state.json
      session.json
    local-drop-a1b2c3/
      state.json
```

### Save slot rule
Save slots must be tag-based and disciplined, not random.

### Repo cartridge saves
Use stable manifest-derived tags.

### External cartridge saves
Use runtime-generated or safely declared tags, but still remain external cartridges.

External cartridges do not become repo content merely because they are loaded or saved.

## Shell state model

The shell should always know:
- current mode
- mounted cartridge id or mounted board id
- source path
- source class
- cartridge or board type
- active renderer or engine
- active save tag if applicable
- dirty or saved state if applicable
- read-only live-board state when in Boards mode

Conceptually:

```json
{
  "mode": "Collections",
  "mountedCartridgeId": "books-example-001",
  "source": "repo",
  "type": "markdown",
  "renderer": "markdown-reader",
  "saveTag": "books-example-001",
  "dirty": false
}
```

Boards-mode conceptually:

```json
{
  "mode": "Boards",
  "mountedBoardId": "consoleterminalbuilding",
  "source": "work/dev/projects/consoleterminalbuilding/README.md",
  "sourceClass": "repo-board",
  "type": "markdown-board-readout",
  "renderer": "markdown-reader",
  "saveTag": null,
  "dirty": null,
  "state": "read-only-live-board"
}
```

## UI behavior rules

Terminal should follow these behavioral rules:
- the shell stays present while content changes
- mode switching is explicit
- cartridges are mounted, not merely opened
- boards are mounted as live readouts, not copied into terminal state
- active state is always visible somewhere in the shell
- save behavior is visible and bounded
- eject and resume are first-class operations where applicable
- board readout visibly communicates read-only status

## Preliminary terminal directory direction

This is not a fixed build map yet, but the likely direction is:

```text
terminal/
  .gitkeep
  saves/
  app/
  loaders/
  renderers/
  engines/
  manifests/
  assets/
```

### Likely roles
- `.gitkeep` — preserve the root while the runtime layer is still being built
- `saves/` — the only terminal write root
- `app/` — shell/page implementation
- `loaders/` — repo/disk/drop loading logic
- `renderers/` — markdown/text/json display layer
- `engines/` — terminal-specific runtimes later
- `manifests/` — canonical cartridge descriptors
- `assets/` — shell assets

## Phase model

### Phase 1
- persistent shell
- v1 modes
- repo/disk/drop loading
- markdown/text/json cartridge handling
- bounded save model
- boards mode live readout

### Phase 2
- collections-driven reading
- richer structured modules
- stronger save/resume behavior
- more complete shell state
- better board enumeration and board status UX

### Phase 3
- engine-backed modules
- game cartridges
- deeper identity and visual system
- richer runtime coordination

## Immediate build board

### Build target A — shell spine
Create the persistent shell frame and mode-switching model.

### Build target B — collections browser
Surface `collections/` cleanly inside terminal.

### Build target C — boards browser
Surface approved working boards from `work/dev/projects/` and mount them as live readouts.

### Build target D — cartridge bay
Support:
- mount from repo
- mount from disk
- mount from drag-and-drop

### Build target E — runs viewport
Create the main render/run viewport.

### Build target F — save manager
Route all allowed writes only into `terminal/saves/<tag>/`.

### Build target G — manifest system
Introduce manifest-driven cartridge selection for canonical repo cartridges.

### Build target H — boards-mode guardrails
Implement:
- greyed-out Save in Boards mode
- explanation popup for disabled save
- read-only live-board status indicators

## Working rule

Terminal architecture must remain clear and bounded:
- broad read/load
- narrow write
- explicit cartridge model
- persistent shell
- repo-true content surfaces
- special-purpose board readout from approved work paths
- its own visual and behavioral identity

The terminal should become more coherent as it grows, not merely larger.
