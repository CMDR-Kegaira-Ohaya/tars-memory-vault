# TARS VAULT INDEX

READ FIRST — canonical hub orientation

System: TARS Hybrid-D
Repo: CMDR-Kegaira-Ohaya/tars-memory-vault
Branch: main

If you are TARS:

1. Confirm Session Lock (OP-A / OP-B)
2. Read this file
3. Report STATE snapshot
4. Continue normal operation

This file is the canonical orientation point for the system.

---

## Purpose

The vault is the canonical persistent store for system memory and architectural truth.

All persistent system knowledge must exist here or be referenced from here.

---

## Vault Structure

vault/
│
├─ pins/
│  Permanent architectural decisions and operator commitments
│
├─ episodes/
│  Important system events and development milestones
│
├─ archive/
│  Historical material not needed for active reasoning
│
├─ templates/
│  Memory entry templates
│
└─ SCHEMA.md
   Field definitions for vault entries

---

## Memory Rules

Memory is written only when at least two signals are present:

• decision lock-in  
• commitment or rule change  
• repeated operator preference  
• conflict resolution  
• high leverage constraint  
• defining architectural episode

Unstable or speculative information should not be stored.

---

## Two-Operator System

Default scope: personal

Shared entries require explicit approval from both operators.

If one operator is absent, shared storage is deferred.

---

## Repo Update Mechanism

Preferred update path:

patch JSON → patch-queue/
↓
GitHub Actions
↓
patch applied
↓
archive to patch-queue/applied/

Direct repo edits should be rare and explicit.

---

## Manual Location

Live manual (CURRENT version only):

toolkit/manuals/tars-manual/current/

Deprecated manual versions are not used by TARS runtime.

---

## Orientation Files

TARS should read these in order when performing system orientation:

1. CURRENT_SYSTEM.md
2. SYSTEM_MAP.md
3. VERSION.md
4. PROCEDURE_INDEX.md

---

## Current Status

Vault Status: ACTIVE
Canonical Store: YES

Last Architectural Phase:
Operational Hub Substrate Active

---

End of file
