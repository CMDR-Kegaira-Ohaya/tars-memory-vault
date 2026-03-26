## Purpose
Canonical self-referential reference for the terminal layer.
Use this file first when the task is about terminal behavior, terminal UX, terminal workflows, screen contexts, cartridges, or operator-facing terminal functions.

## Terminal home
- Live page: `terminal/index.html`
- Runtime/browser layer: `terminal/app/`
- Terminal reference home: `repo-manual/refs/terminal/`

## Current terminal model
The terminal is a screen-first browser runtime.
It is not a loose dashboard anymore.

### Shell model
- compact header
- fixed dominant main screen
- control legend below the screen
- selector rail below the control legend
- dev surfaces quieter than the main path

### Presentation rules
- void/dark base
- lilac structure
- teal-cyan signal
- bright grey readable content text
- subtle static cyan screen-edge glow only
- metallic/pearlescent shell finish allowed only lightly

### Main screen rule
The main screen should stay visually fixed in size.
If content is larger than the screen, the screen scrolls internally.
Content should not resize the shell.

## Current screen contexts
Primary or live contexts now include:
- Home
- Cartridges
- Collections
- Boards
- Request History
- Repo Verified
- Debug Intake

Request History and Repo Verified are dev-facing contexts.
Debug Intake is a local operator relay/debug surface.

## Control semantics
Default control meanings:
- Up / Down = move within the current selector list
- Left / Right = move between contexts or tabs
- A = confirm / open / handoff / mount depending on current context
- B = back / home depending on current context

Footer labels must state the current local meaning explicitly.

## Catalogue and cartridge model
`collections/` is the shared catalogue root.
The terminal may eventually browse this root broadly.

Current content-family rule:
- mountable/runtime cartridges belong under `collections/cartridges/`
- other families such as `collections/books/` remain part of the broader catalogue but are not mountable cartridges unless they later gain a cartridge adapter/runtime shape

Do not collapse all collection families into “cartridges.”
Keep the distinction explicit.

## Terminal workflows
### 1. Normal browse/mount flow
1. choose screen context
2. select item in the rail
3. inspect/resolve on the main screen
4. confirm with A only when the context says so

### 2. Raw inspection flow
Use raw previews and dev contexts to inspect state.
These are operator-facing inspection surfaces.
They are not remote-control or live file-system browsing surfaces.

### 3. Debug relay flow
Use Debug Intake when a structured payload helps.
Current Debug Intake functions:
- capture current terminal state into one payload
- paste/edit local text or JSON
- drop local text/json/md files
- copy payload out for relay into chat

Debug Intake is local-only.
It does not sync remotely and it does not give the assistant direct browser control.

## Performance rules
Terminal work must prefer explicit event-driven updates.
Avoid:
- broad subtree observers on the whole shell
- frequent polling loops
- repeated full-screen rerenders while typing
- decorative effects that animate continuously across many elements

Prefer:
- local targeted rerenders
- explicit user actions
- narrow observers only when strictly needed
- one active emphasis point at a time

## Current operator truths
- raw preview panels help the operator inspect state and relay it
- the assistant still cannot directly manipulate the user’s browser tab
- the terminal is a host environment for future cartridges, not a finished cartridge lab yet
- text adventures, tiny roguelikes, and strict low-power cartridge formats are valid first-class target scopes

## Working rule for future sessions
When asked about the terminal, do not rediscover it from scratch.
Start from this file, then inspect the live terminal code only for changes or uncertainty.
