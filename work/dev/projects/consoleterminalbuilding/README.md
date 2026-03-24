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
- anti-drift handoff guidance for fresh implementation chats
- Pages runtime strategy
- GPT-side relationship boundary
- live interaction boundary for runtime state vs repo behavior

This board lives under:

`work/dev/projects/consoleterminalbuilding/`

so terminal design-and-build planning stays in project workspace, not inside the runtime-facing `terminal/` layer.

## Fresh-session implementation note

A fresh chat instance should be able to continue terminal implementation from this file alone.
That is a design goal.

This file is meant to carry enough structure, rationale, and boundary logic that a new instance does not need hidden chat continuity in order to scaffold and implement the terminal safely.

If future work depends on a rule, boundary, or rationale, that rule should be written into this file rather than left only in chat memory.

## Implementation authority for fresh instances

When implementing terminal work from a fresh chat:

1. Treat this file as the terminal implementation source of truth.
2. Do not redesign the architecture unless the user explicitly asks for redesign.
3. Prefer implementing the locked decisions already written here.
4. If something is not specified here, choose the smallest non-drifting implementation that preserves the current architecture.
5. If an implementation choice would weaken a listed boundary, stop and ask.

## Terminal build workflow note

Short-lived branches may be used as implementation scaffolding for terminal work, but they are not part of terminal architecture.

Workflow rule:
- `main` remains the single canonical runtime and contract truth
- use one short-lived branch per bounded terminal build slice when branching is needed
- verify repo state on the branch before merge
- merge back quickly after verification
- do not let long-lived terminal branches drift into parallel design lanes
- do not make branches part of terminal content structure, mounting logic, or user-facing repo architecture

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

## Pages runtime strategy

The terminal delivered through Pages should be a live client-side runtime shell.
It must not be implemented as a static mock page.

Pages is the runtime delivery surface for the terminal front end.
It is not the planning layer, and it does not replace GPT-side orchestration.

The intended model is:
- live browser shell
- user-clickable runtime interaction
- client-side mode switching
- mounted content readout and runtime state
- terminal-owned save state
- export controls distinct from save
- repo behavior preserved unless an allowed terminal save write occurs

## GPT-side relationship boundary

The Pages terminal does not take the place of the GPT-side.

Locked relation:
- GPT-side = planning, repo work, implementation guidance, orchestration
- Pages terminal = user-facing runtime shell
- working board = implementation source of truth for terminal build direction
- Boards mode = live readout only, not a planning surface

Therefore the terminal should be:
- live
- interactive
- runtime-facing
- bounded

And it should not become:
- a GPT replacement
- a second planning brain
- a hidden repo authoring surface
- a collapse of runtime and orchestration into one layer

## Live interaction strategy

The user must be able to interact with the terminal without changing repo behavior by default.

Examples of allowed runtime interaction:
- turn pages in mounted reading content
- navigate collections and mounted cartridges
- write notes for terminal save state
- resume progress from terminal save state
- later play engine-backed content or games inside the shell

These interactions are runtime-state actions unless an explicit allowed save path is used.
They do not imply edits to repo source files.

Runtime interaction is allowed to be rich.
Repo mutation remains narrow.

## Anti-drift implementation rules

These rules exist specifically to prevent redesign drift in future implementation work.

### 1. Do not turn `terminal/` into a planning folder
`terminal/` is the runtime root, not the project-board root.
Planning boards live under project workspace.

### 2. Do not turn `work/` into normal content navigation
`work/` is not a standard user-content domain.
Boards mode is a special-purpose readout exception, not a license to treat all work paths as normal content surfaces.

### 3. Do not collapse Boards into ordinary save-capable cartridges
Boards may use the markdown reader technically, but behaviorally they are not normal cartridges.
Boards are live readout only.
They do not save through terminal GUI.

### 4. Do not collapse Export into Save
Save persists state inward.
Export takes content outward.
They may sit next to each other in UI, but they must remain distinct actions.

### 5. Do not let convenience break the write boundary
Terminal may read broadly, but terminal writes stay limited to `terminal/saves/<tag>/`.
Boards are outside even that save behavior.

### 6. Do not let the shell disappear into page-hopping
The shell stays present while content changes inside it.
Implementation should preserve a device-shell feel, not devolve into scattered pages.

### 7. Do not invent parallel names where repo names already work
Use `Collections` because the repo already has `collections/`.
Do not invent a fake top-level `Library` abstraction unless explicitly requested later.

### 8. Do not let a live terminal runtime become a GPT substitute
The runtime shell may be interactive and stateful.
It must not become the planning authority, implementation authority, or orchestration layer.

### 9. Do not treat runtime interaction as implicit repo authoring
Page turns, notes, gameplay state, bookmarks, local progress, and similar clicks are terminal-state operations unless an explicit repo-safe write path is introduced later.

## Why these boundaries exist

These boundaries are not arbitrary.
They exist to preserve:
- clean runtime vs planning separation
- one source of truth for working boards
- low-drift fresh-chat handoff
- a console-shell feel instead of a website feel
- safe terminal write behavior
- live interaction without hidden repo mutation
- long-horizon project continuity without mixing lanes

If a future implementation feels easier by weakening these boundaries, it is likely a drift move rather than a real improvement.

## Locked decisions vs open decisions

### Locked now
The following are considered active design truth unless explicitly changed by the user:
- `terminal/` stays a clean runtime root
- the working board lives at `work/dev/projects/consoleterminalbuilding/README.md`
- v1 mode set includes `Boards`
- `Collections` maps directly to `collections/`
- first canonical repo cartridge root is `collections/`
- first approved board root is `work/dev/projects/`
- Boards mode is live readout only
- Boards never save through terminal GUI
- Boards never use `terminal/saves/`
- Save and Export remain distinct actions
- Export Source is the first export priority
- Export Output exists as a greyed-out placeholder initially
- Pages terminal is a live client-side runtime, not a static mock
- Pages terminal does not replace GPT-side planning or repo work
- runtime interaction does not change repo behavior by default
- notes are terminal save-state data unless explicitly exported later
- future games or engines may run inside terminal without becoming repo authoring

### Open later
The following are still open design space:
- final visual language
- exact shell layout details
- exact renderer implementation details
- exact manifest location/shape refinements beyond v0
- final export packaging details beyond v1 source export
- animation and motion behavior
- deeper engine architecture after basic shell exists
- optional remote or API paths beyond bounded terminal save behavior

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

### 8. Live runtime does not equal repo mutation
Interactive actions may be live and stateful while source files remain untouched.

### 9. Live runtime does not replace GPT-side authority
Terminal runtime behavior may expand over time, but GPT-side remains the planning and implementation authority unless explicitly changed by the user.

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

> Working boards are source files in workspace.
> Update them at their live path, not through terminal GUI.

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
- is used for state, progress, notes, bookmarks, or terminal-bounded persistence
- does not mean “take a file out”
- does not edit mounted repo source files

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

#### Export Output
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

## Live interaction model

Terminal interaction should be live, but bounded.

### Allowed live interactions in v1 and later
- page turns in documents
- scroll and navigation state
- bookmarks and reading position
- notes attached to terminal save state
- shell navigation and mode switching
- mounted runtime resume state
- later engine-backed interactions such as games or tools

### Interaction rule
The default interpretation of user interaction is runtime state, not repo mutation.

### Notes rule
Notes are terminal-owned state.
By default they persist only through terminal save paths.
They do not edit source documents.

### Page-turn rule
Changing page or reading position updates runtime state only.
It does not alter source content.

### Game / engine rule
Later game or engine-backed runtime behavior is allowed inside terminal.
Game progress remains terminal state unless a future explicit export or external sync path is defined.

### Repo behavior rule
Clicks, page turns, notes, play state, and resume state do not change repo behavior unless they go through the allowed terminal save path.

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
      notes.json
    local-drop-a1b2c3/
      state.json
      session.json
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
- current runtime position or interaction state when applicable

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
  "dirty": false,
  "interaction": {
    "page": 12,
    "scroll": 0.42,
    "notes": true
  }
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
- live user interaction should feel real, not like a static mock page
- runtime interaction must not blur into repo authoring

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
- `app/` — shell / page runtime contracts and implementation
- `loaders/` — repo / disk / drag-drop loading logic
- `renderers/` — markdown / text / json display layer
- `engines/` — terminal-specific runtimes later
- `manifests/` — canonical cartridge descriptors
- `assets/` — shell assets

## Phase model

### Phase 1
- persistent shell
- v1 modes
- repo / disk / drag-drop loading
- markdown / text / json cartridge handling
- bounded save model
- Export Source for basic supported items
- Export Output visible as placeholder
- Boards mode live readout
- Pages terminal live runtime shell
- notes and reading state treated as terminal save data, not repo edits

### Phase 2
- collections-driven reading
- richer structured modules
- stronger save / resume behavior
- better board enumeration and board status UX
- broader export support
- more explicit runtime interaction state handling

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

### Collections browser v1 interaction contract

Selection and mounting are two distinct steps.
When a user selects a manifest entry in the Collections browser, the terminal should enter a resolved state before mounting:

- read the manifest descriptor
- pre-populate and display the shell state preview (title, type, renderer, save tag, save availability)
- wait for explicit mount confirmation

Mounting happens only after explicit user action.
This keeps the interaction consistent with the system's broader principle: reading is cheap and reversible, mounting has state consequences. A user selecting a cartridge should be able to see what they're choosing before the shell commits to it.

The resolved-but-not-mounted state is not a new mode. It is a transitional display state within Collections mode before mount completes.

### Build target C — boards browser
Surface approved working boards from `work/dev/projects/` and mount them as live readouts.

### Boards browser v1 interaction contract

Selection and mounting are two distinct steps.
When a user selects an approved board entry in the Boards browser, the terminal should enter a resolved state before mounting:

- read the board enumeration entry
- pre-populate and display the shell state preview (title, source path, source class, read-only state, save disabled, export source availability)
- wait for explicit mount confirmation

Mounting happens only after explicit user action.
This keeps Boards behavior aligned with the broader shell principle: reading is cheap and reversible, mounting has state consequences even when the mounted surface is read-only.

The resolved-but-not-mounted state is not a new mode. It is a transitional display state within Boards mode before mount completes.

### Build target D — cartridge bay
Support:
- mount from repo
- mount from disk
- mount from drag-and-drop

### Build target E — runs viewport
Create the main render / run viewport.

### Build target F — save manager
Route all allowed writes only into `terminal/saves/<tag>/`.

### Build target G — export controls
Implement:
- Export Source for supported mounted items
- greyed-out Export Output placeholder in the shell action set
- clear visual distinction between Save and Export

### Build target H — manifest system
Introduce manifest-driven cartridge selection for canonical repo cartridges.

### Build target I — boards-mode guardrails
Implement:
- greyed-out Save in Boards mode
- explanation popup for disabled Save
- read-only live-board status indicators
- Export Source enabled in Boards mode
- Export Output placeholder disabled in Boards mode

### Build target J — Pages live runtime contract
Implement the terminal as a live client-side shell on the Pages surface, not a static mock.

### Build target K — runtime interaction boundary
Implement interaction contracts for:
- page turns
- notes
- reading progress
- later engine state

without changing repo behavior except through allowed terminal save paths.

### Build target L — GPT-side boundary clarity
Keep runtime implementation explicitly separate from GPT-side planning, repo work, and orchestration.

## Fresh-chat bootstrap for implementation

Use this file as the implementation source of truth.
Do not redesign the architecture unless explicitly asked.
Build the smallest implementation that preserves the listed boundaries.
Do not move the working board back into `terminal/`.
Do not make Boards save-capable.
Do not blur Save and Export.
Do not let a live Pages terminal be mistaken for GPT-side authority.
If a build choice threatens those rules, stop and ask.

## Working rule

Terminal architecture must remain clear and bounded:
- broad read / load
- narrow write
- explicit cartridge model
- persistent shell
- repo-true content surfaces
- special-purpose board readout from approved work paths
- distinct Save vs Export behavior
- live runtime interaction without implicit repo mutation
- runtime shell separate from GPT-side planning and repo work
- its own visual and behavioral identity

The terminal should become more coherent as it grows, not merely larger.
