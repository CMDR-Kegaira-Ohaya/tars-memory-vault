# REPO_BOOTSTRAP.md

## Status
Bootstrap placeholder only.  
Repo state: **Build State**  
Current branch model: **main only**

## Purpose
This file marks the initial bootstrap state of the repository as the repo-side support layer for TARS.

At this stage, the repository is intentionally minimal.
It exists to establish the first stable folder architecture and the first repo-manual spine.
No expanded runtime surface, branch workflow, or procedural authority should be assumed unless those things are explicitly added later.

## Current Condition
- Repository is in early construction
- Only `main` is being used
- The repo-side manual is not yet complete
- Procedures, workflows, and navigation layers are still being installed
- Any missing structure should be treated as not yet defined, not implicitly present

## Active Architecture
Current intended top-level shape:

```text
/
├─ README.md
├─ REPO_BOOTSTRAP.md
├─ repo-manual/
│  ├─ core/
│  ├─ navigation/
│  ├─ procedures/
│  ├─ workflows/
│  ├─ troubleshooting/
│  └─ refs/
├─ work/
│  ├─ op-a/
│  ├─ op-b/
│  ├─ shared/
│  └─ scratch/
├─ logs/
│  ├─ decisions/
│  └─ incidents/
└─ .github/
   └─ workflows/
