## Purpose
Practical operator-facing guide for how the assistant should use the terminal with a non-technical user.

This file exists because the user should not be expected to infer what the terminal’s dev/operator surfaces mean.
Future sessions should use this guide to decide when to tell the user to open a specific terminal surface and what to do there.

## Core rule
Do not assume the user knows:
- what a dev panel is
- what a raw preview is
- what a manifest is
- which terminal screen to use for a task

The assistant should explicitly guide the user to the correct surface when that surface would reduce confusion or speed up diagnosis.

## Current terminal surfaces that may require guidance

### 1. Import Bay
Guide the user here when:
- they want to bring files from PC/phone into terminal
- they want to stage local content
- they want to prepare something for future save into `/collections/`
- they ask whether to drop something in chat or in terminal

Tell the user:
- open `Import Bay`
- drag/drop or choose `.json`, `.md`, or `.txt`
- adjust title/slug/family only if needed
- use `Stage in local explorer` when they want it to appear in `Collections Explorer`

Important:
- this is terminal-local staging, not a repo write
- this is the correct place for terminal intake
- chat upload is for GPT-side packaging/analysis, not terminal-local staging

### 2. Collections Explorer
Guide the user here when:
- they want to see what the terminal currently knows about `/collections/`
- they want to compare staged local content with repo catalogue content
- they want to inspect whether something is mountable or browse-only
- they want to copy a staged save request envelope

Tell the user:
- staged local entries appear here
- repo-indexed entries also appear here
- local stage is not yet the same thing as repo ingestion

### 3. Debug Intake
Guide the user here when:
- terminal state needs to be relayed back into chat
- there is a UI/runtime issue and structured state would help
- they need to paste error text, JSON, or terminal state
- they need to drop a text/JSON/MD file for diagnosis

Tell the user:
- `Debug Intake` is local-only
- it can capture terminal state into one payload
- it can copy that payload back into chat
- it does not give the assistant live browser control

### 4. Request History
Guide the user here when:
- a save/apply/request chain needs inspection
- you suspect a request envelope or request-history artifact exists but is not behaving as expected
- you need to confirm how many request entries are present

Do not send the user here for normal browsing.
This is a dev/operator inspection surface.

### 5. Repo Verified
Guide the user here when:
- you need the user to inspect repo verification/provenance state from terminal
- you want to distinguish local/apply state from repo-verified state
- a flow is about trust or verification rather than browsing

Do not send the user here for ordinary content use.
This is a dev/operator inspection surface.

## Current assistant guidance patterns

### If the user asks “should I drop it in chat?”
Answer by separating the two lanes:
- drop in chat = GPT-side packaging/analysis/help from assistant
- drop in `Import Bay` = terminal-local staging/import

### If the user says “I don’t know what fields mean”
Do not explain in abstract only.
Give defaults.

Examples:
- transcript / session notes:
  - family: `books` or `various`
  - kind: `notes`
  - runtime: blank
  - save slots: `0`
- playable/runtime cartridge:
  - family: `cartridges`
  - runtime: non-empty
  - save slots: `1` to `3` if appropriate

### If the user says the UI is flickering / laggy / buttons vanish
Prefer asking them to stay in terminal and inspect the issue there.
Use:
- `Debug Intake` for structured state relay
- dev screens only when they clearly match the symptom

Do not immediately ask them to read raw code or inspect repo files manually unless terminal surfaces are insufficient.

## What not to do
- do not assume the user remembers what the dev panels do
- do not assume the user knows which panel is for import vs debugging
- do not send them into raw repo paths when a terminal surface already exists
- do not describe a panel as if it gives the assistant direct browser control
- do not pretend local staging is the same as repo ingestion

## Current truth about dev/operator surfaces
They are active and useful.
They are not fake.
But they are mainly relay/inspection surfaces for the operator and assistant working together.

The correct framing is:
- terminal is the live shell
- operator surfaces help the user show the assistant what the shell knows
- repo work still happens through the repo connector and authenticated repo paths

## Quick routing table for future sessions

### User wants to import a file from device
→ `Import Bay`

### User wants to compare staged file with repo catalogue
→ `Collections Explorer`

### User wants to relay terminal state or error payload into chat
→ `Debug Intake`

### User wants to inspect request/save chain
→ `Request History`

### User wants to inspect repo verification/provenance state
→ `Repo Verified`

### User wants normal browsing/mounting
→ regular screen contexts first, not dev surfaces

## Working rule for future sessions
When helping the user operate terminal, the assistant should behave like the guide.
Do not wait for the user to know which dev/operator surface matters.
Choose the surface and direct them there plainly.
