TARS Shell Spec v0.1
1. Identity contract

This is not a skinned web app. It is a machine body for TARS.

Body: retro handmade-coding homage
Face: shell
Voice: chat
Mind: distributed across runtime, repo, procedures, and working state
Tone: explicit, engineered, legible

Brand plate under the CRT should become TARS branding, not Amstrad/CPC branding.

2. Physical zone map

A. Main CRT
The only true primary payload surface.

Shows:

Home by default
loaded books
mounted cartridges
boards/readouts
overlays/dialogs/HUD when active

B. Footer command line
Lives inside the CRT at the bottom edge.

Shows the current meaning of:

D-pad
A
B
Select
Start
Alt
Esc

This strip is the authoritative control truth.

C. Right monitor
Secondary machine-state surface only.

Shows:

EWS / systems check
machine condition
service/debug indicators
compact status, not full apps

D. Loader bay
Media ingress/egress locus.

Handles:

Load
Repo Load
Import Files
media presence
Eject

It does not become a reader.

E. Control deck
Physical command grammar.

Hardware set:

D-pad
A
B
Select
Start
Alt
Esc
3. Core doctrine
One primary payload at a time
Main CRT owns experience
Right monitor owns machine condition
Loader owns media handling
Control deck owns command entry
Footer command line declares current control meaning
Cartridges are media/runtime, not rooms
Home is the default Main-screen state, not a separate place
4. Control model

The buttons are physically fixed.
Their current meaning is declared by the footer command line.

Stable order:
D-pad | A | B | Select | Start | Alt | Esc

Soft rule:

D-pad usually navigates focus/selection
everything else is context-declared by footer

Example footer:
A Open B Back Start Mount Select System Alt More Esc Close

This gives versatility without hidden meanings.

5. Screen-state model

Idle / Home

CRT: shell default
right monitor: calm machine state
loader: ready

Load mode

CRT: selection/readable target
loader: active source context
footer: open / import / mount / back

Mounted runtime

CRT: active cartridge/book/board
right monitor: health/status
footer: runtime actions

Overlay / HUD

CRT: overlay over current payload
right monitor: supporting state if needed
footer: close / inspect / copy / alt

Service mode

right monitor becomes more important
CRT remains primary but can host diagnostics
never devolves into raw dev-panel sprawl by default
6. Mapping from the current terminal

Current terminal pieces should map like this:

runsViewport → Main CRT payload
homeSummary → Home/default CRT state
statusStrip → right monitor summary source
nav / actions → no longer raw web strips; translated into shell controls/footer truth
Import Bay / Collections / Boards → loader + CRT flows
Request History / Repo Verified / Debug Intake → service surfaces, overlays, or right-monitor-linked tools
7. Design rules

Keep:

sparse CRT
strong hierarchy
visible machine logic
explicit control truth
tactile shell identity

Avoid:

dashboard clutter
many always-visible dev panels
generic sci-fi styling
hidden button meanings
treating the right monitor like a second full app
8. First prototype implementation order
photo-based shell geometry
live HTML overlay zones on top of the shell
CRT payload binding
footer command-line renderer
right monitor status renderer
loader state renderer
move old dev density into overlays/service modes
9. Immediate lock decisions

Locked now:

photo shell as chassis authority
TARS logo plate
Main CRT = only primary payload
footer command line = control truth
right monitor = machine state
loader bay = media ingress/egress
buttons = D-pad, A, B, Select, Start, Alt, Esc
