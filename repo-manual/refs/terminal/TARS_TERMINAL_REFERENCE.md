## Purpose
Canonical self-referential reference for the terminal layer.
Use this file first when the task is about terminal behavior, terminal UX, terminal workflows, screen contexts, cartridges, import/catalogue flows, or operator-facing terminal functions.

## Terminal home
- Live page: `terminal/index.html`
- Runtime/browser layer: `terminal/app/`
- Terminal reference home: `repo-manual/refs/terminal/`
- Working board: `work/dev/projects/consoleterminalbuilding/README.md`
- Short handoff: `work/dev/projects/consoleterminalbuilding/NEXT_CHAT_HANDOFF_2026-03-26.md`

## Current terminal model
The terminal is a screen-first browser runtime.
It is not a loose dashboard.
It is a persistent shell with a fixed dominant screen, bounded operator surfaces, and catalogue/import behavior.

### Shell model
- compact header
- fixed dominant main screen
- control legend below the screen
- selector rail below the control legend
- screen remains visually fixed in size
- long content scrolls inside the screen
- operator/dev surfaces stay subordinate to the main screen

### Presentation rules
- dark/void base
- lilac structural tone
- subtle teal-cyan signal/glow only
- readable bright grey content text
- shell finish may use subtle metallic/pearlescent treatment only

## Current screen contexts
Primary or live contexts now include:
- Home
- Cartridges
- Collections
- Boards
- Request History
- Repo Verified
- Debug Intake
- Import Bay
- Collections Explorer

### Context roles
- `Home` = shell summary and status
- `Cartridges` = runtime/load surface for mountable cartridge material
- `Collections` = catalogue-facing content path
- `Boards` = approved live board readout path
- `Request History` = dev-facing request/save chain inspection
- `Repo Verified` = dev-facing repo verification/provenance inspection
- `Debug Intake` = local structured relay/debug surface
- `Import Bay` = local file intake, package shaping, save-request preparation
- `Collections Explorer` = browse repo-indexed catalogue entries plus local staged entries

## Current operator/dev surfaces
These are real and active, but they are not remote-control surfaces.
They help the operator inspect or relay state.

### Debug Intake
Current functions:
- capture current terminal state into one payload
- paste/edit local text or JSON
- drop local `.txt`, `.json`, or `.md` files
- copy payload back into chat for diagnosis

Boundary:
- local only
- does not give the assistant direct browser control
- does not sync remotely by itself

### Request History
Use for:
- seeing save/request chain status
- inspecting request-history material for mounted save contexts
- checking whether request artifacts exist and how many entries are present

### Repo Verified
Use for:
- seeing repo-verified state and trust/provenance markers
- checking whether a save/request flow was marked repo-verified
- inspecting verified-head/path data without digging into raw files immediately

### Import Bay
Use for:
- local intake from PC/phone files
- drag/drop or file-picker import
- draft package shaping
- local staging into explorer
- preparing a repo-ready save request envelope

Current accepted import types:
- `.json`
- `.md`
- `.txt`

All are treated as UTF-8 text in v1.

### Collections Explorer
Use for:
- browsing repo-indexed `/collections/` entries
- browsing locally staged entries from Import Bay
- comparing repo material with staged local material
- copying a staged local save request envelope

## Control semantics
Default control meanings:
- Up / Down = move within current selector list
- Left / Right = move between contexts or tabs
- A = confirm / open / handoff / mount depending on current context
- B = back / home depending on current context

Footer labels must state the current local meaning explicitly.

## Catalogue and cartridge model
`collections/` is the shared catalogue root.
The terminal may browse this root broadly.

Current family rule:
- mountable/runtime cartridges belong under `collections/cartridges/`
- other families such as `collections/books/`, `collections/entertainment/`, and `collections/various/` belong to the broader catalogue but are not mountable cartridges by default

Do not collapse all collection families into “cartridges”.
Keep the distinction explicit.

## Current collection index files
- `collections/index.v1.json`
- `collections/books/index.v1.json`
- `collections/cartridges/index.v1.json`
- `collections/entertainment/index.v1.json`
- `collections/various/index.v1.json`

These are the current catalogue bridge into terminal browsing.

## Current import + packaging model
The terminal now supports a local-first import/stage flow.

### Current Import Bay flow
1. open `Import Bay`
2. drop local `.json`, `.md`, or `.txt` files, or use file picker
3. terminal creates a local draft
4. operator may adjust family/title/slug/kind/runtime/save slots
5. terminal shows a canonical package preview and repo-ready save request envelope
6. operator may stage locally into `Collections Explorer`
7. operator may copy/download the save request envelope

### Honest boundary
The browser terminal does not yet directly write into repo `/collections/`.
Current v1:
- stages locally
- previews canonical structure
- prepares repo-ready save request data
- leaves actual repo write for a separate authenticated path

## Canonical package shape currently aligned with terminal work
```text
<slug>/
  manifest.json
  content/
  assets/        (optional)
  saves/         (optional)
```

Schema target:
- `tars-pack.v1`

See also:
- `repo-manual/refs/gpt/12_PACKAGER.md`
- `repo-manual/refs/gpt/12_FILE_POLICY.md`
- `repo-manual/refs/gpt/12_PACK_SCHEMA.md`
- `repo-manual/refs/gpt/12_TARGET_TERMINAL_COLLECTIONS.md`

## Current code surfaces most likely to matter
- `terminal/app/browser-boards-bridge.js`
- `terminal/app/browser-runs-surface.js`
- `terminal/app/browser-repo-verified-panel.js`
- `terminal/app/browser-collections-browser.js`
- `terminal/app/browser-cartridge-bay.js`
- `terminal/index.html`

## Performance rules
Terminal work must prefer explicit event-driven updates.
Avoid:
- broad subtree observers on the whole shell
- frequent polling loops when not necessary
- repeated full-screen rerenders while typing
- decorative effects that animate continuously across many elements

Prefer:
- local targeted rerenders
- explicit user actions
- narrow observers only when strictly needed
- one active emphasis point at a time

## Operator truths
- raw preview/dev panels help the operator inspect and relay state
- the assistant still cannot directly manipulate the user’s browser tab
- the terminal is a host environment for future cartridges, not just a static page
- text adventures, tiny roguelikes, and low-power cartridge formats remain valid first-class target scope

## Working rule for future sessions
When asked about the terminal, do not rediscover it from scratch.
Start from:
1. this file
2. `repo-manual/refs/terminal/TARS_TERMINAL_OPERATOR_GUIDE.md`
3. `work/dev/projects/consoleterminalbuilding/NEXT_CHAT_HANDOFF_2026-03-26.md`
4. live terminal code only for changes or uncertainty
