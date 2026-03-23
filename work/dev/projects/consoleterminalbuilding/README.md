# CONSOLE TERMINAL WORKING BOARD

## Purpose

This is the single working board for building the terminal system.

It combines:
- terminal charter
- corrected shell model
- structural architecture
- current build direction
- current Boards-mode rules
- current Save / Export model

This board lives under:

`work/dev/projects/consoleterminalbuilding/`

so terminal design-and-build planning stays in project workspace, not inside the runtime-facing `terminal/` layer.

## Relationship to `terminal/`

`terminal/` remains the repo layer reserved for the terminal runtime itself.

This working board is intentionally outside `terminal/`:
 - to keep `terminal/` clean as a runtime-facing layer
- to keep planning and build orchestration in project workspace
- to let implementation grow later without mixing runtime surfaces and active design planning

## Core identity

Terminal is the repo’s user-facing shell and cartridge host.

It is not just a web page or a link hub.
It is the contained device-like interface through which the user loads, reads, runs, exports, and saves repo-contained or external cartridges.

Terminal should behave like:
- one persistent shell
- mode-based navigation
- mounted cartridges and modules
- persistent shell state
- bounded save behavior
- clear export behavior
- a clean separation between shell, content, and engines

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

### 4. Export is outbound, not persistence
Export is not Save.
Export lets the user take content out.
It does not create repo writes and does not imply terminal persistence.

### 5. Repo-true content roots
Terminal should mirror real repo domains where those domains already exist.

### 6. External cartridges stay external
Disk and drag-drop cartridges do not automatically become repo content.

### 7. Boards mode is live readout only
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
Shows current mount, recent saves, export availability, quick actions, and system context.

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

### Export rule in Boards mode
Boards may be exported.
Export is allowed because it does not modify workspace.
Save remains disabled.

### GUI behavior rule
In Boards mode:
- Save should be greyed out or disabled
- Export Source may stay enabled
- Export Output should appear as a greyed-out placeholder for later implementation
- selecting disabled Save may show an explanation popup

Suggested explanation:

^ Working boards are source files in workspace.  
^ Update them at their live path, not through terminal GUI.

### Status-strip rule
Boards mode should visibly identify itself as read-only live board display.

Example indicators:
- `MODE: BOARDS`
- `SOURCE: work/dev/projects/...`
- `STATE: READ-ONLY LIVE BOARD`
- `SAVE: DISABLED`
- `EXPORT SOURCE: AVAILABLE`
- `EXPORT OUTPUT: PLACEHOLDER`

## Terminal actions: Save and Export

Save and Export should sit next to each other in the shell, but they must mean different things.

### Save
Save = terminal-side persistence of allowed state.

Save:
- writes only into `terminal/saves/<tag>/`
- is used for state, progress, or terminal-bounded persistence
- does not mean “take a file out”

### Export
Export = outbound user grab / download / extract action.

Export:
- does not create repo writes
- does not require terminal save state
- lets the user take content out cleanly

### Export forms

#### Export Source
Take the mounted source file or declared package.

This is the first-priority export form for v1.
It supports the “grab a file from library” use case.

### Export Output
Take the rendered or transformed output form.

This should exist in the UI as a placeholder, but remain greyed out in early builds until implemented.

## Save / Export behavior by mode

### Collections
- Save: enabled when a cartridge supports state
- Export Source: enabled when the mounted item is exportable
- Export Output: greyed-out placeholder initially

### Boards
- Save: disabled
- Export Source: enabled
- Export Output: greyed-out placeholder

### Cartridges
- Save: depends on mounted cartridge
- Export Source: usually available when a source exists
- Export Output: placeholder initially

### Runs
- Save: depends on mounted cartridge or engine
- Export Source: depends on mounted item
- Export Output: placeholder initially

### Saves
- Save: not the action focus here; this is the management mode
- Export Source: export save package or slot data later
- Export Output: not primary

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
7. export if requested
8. resume or eject

### Board lifecycle
1. enumerate
2. select
3. mount
4. display live readout
5. export source if requested
6. refresh on source change
7. unmount or switch board

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
- save availability
- export-source availability
- export-output availability
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
  "save": "enabled",
  "exportSource": "available",
  "exportOutput": "placeholder",
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
  "save": "disabled",
  "exportSource": "available",
  "exportOutput": "placeholder",
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
- export behavior is visible and distinct from save
- Export Output may appear before implementation, but should be visibly placeholder / disabled
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
- Export Source for basic supported items
- Export Output visible as placeholder
- Boards mode live readout

### Phase 2
- collections-driven reading
- richer structured modules
- stronger save/resume behavior
- better board enumeration and board status UX
- broader export support

### Phase 3
- engine-backed modules
- game cartridges
- deeper identity and visual system
- richer runtime coordination
- real Export Output flows where useful

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

### Build target G — export controls
Implement:
- Export Source for supported mounted items
- greyed-out Export Output placeholder in the shell action set
- clear figural distinction between Save and Export

### Build target H — manifest system
Introduce manifest-driven cartridge selection for canonical repo cartridges.

### Build target I — boards-mode guardrails
Implement:
- greyed-out Save in Boards mode
- explanation popup for disabled Save
- read-only live-board status indicators
- Export Source enabled in Boards mode
- Export Output placeholder disabled in Boards mode

## Working rule

Terminal architecture must remain clear and bounded:
- broad read/load
- narrow write
- explicit cartridge model
- persistent shell
- repo-true content surfaces
- special-purpose board readout from approved work paths
- distinct Save vs Export behavior
- its own visual and behavioral identity

The terminal should become more coherent as it grows, not merely larger.
