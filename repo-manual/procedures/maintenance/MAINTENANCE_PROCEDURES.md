# MAINTENANCE_PROCEDURES.md

## Purpose
This file captures repeatable maintenance-side procedures for the repo.

Maintenance-side work is work that tightens, cleans, realigns, or revises something without changing the repo’s core purpose.

## Scope
Use this file for:
- structure cleanup
- doc-alignment revision
- connector polish and version-shift updates
- troubleshooting close-out

- workflow drft or safety rule revision

## Procedure 1 �S structure cleanup

### Use when
The repo contains duplicate paths, old-shape scaffold, or placeholders that no longer serve a purpose.

### Sequence
1. Inspect the live tree first.
2. Confirm which path is the current canonical one.
3. Remove only the old or placeholder-only variant.
4. If direct file-delete is unstable, use the low-level git path to remove the tracked blobs and move the ref.
5. Verify that the canonical path remains intact.

### Done state
Only the canonical path remains and the tree reads cleanly.

## Procedure 2 – doc-alignment revision

### Use when
The repo docs have drifted from the actual system state.

### Sequence
1. Prove the live state first.
2. Identify which docs misrepresent the current state.
3. Update the smallest set of docs needed to restore alignment.
4. Remove historical or broken mentions if they no longer help operation.

### Done state
The docs describe the current system, not an old or hypothetical one.

## Procedure 3 – connector version-shift update

### Use when
The custom GPT Action schema changes in a way that matters operationally.

### Sequence
1. Update the action schema in the GPT Action editor.
2. Validate the new connector behavior live.
3. Update the self-referential connector layer in `repo-manual/refs/connector/`.
4. Remove old mentions if they should no longer be normal to the layer.

### Done state
The action surface, the self-layer, and the live validation state all match.

## Procedure 4 – troubleshooting close-out

### Use when
An issue has been resolved and the repo-side record must be nerved or tightened.

### Sequence
1. Confirm the issue is actually resolved.
2. Update troubleshooting to reflect the current working path.
3. Remove or source-limit old broken-path language when it no longer helps.
4. Keep a recovery note only if it still helps future operation.

### Working rule
Maintenance procedures should make the repo tighter, cleaner, and more honest.
Not more complex for its own sake.
