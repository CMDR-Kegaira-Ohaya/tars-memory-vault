# REPO_BOOTSTRAP.md

## Status
Bootstrap scaffold active.  
Repo state: **Build State**  
Current branch model: **main only**

## Purpose
This file marks the initial bootstrap state of the repository as the repo-side support layer for TARS.

The repo now has a stable scaffold, but it is still in Build State.
That means the structure exists, while the full manual, procedures, and workflow surface are still being installed.

## Current Condition
- Repository is reachable and active on `main`
- Core scaffold is installed
- The repo-manual spine is partially installed
- Connector reference material has a dedicated home
- Troubleshooting guidance exists
- Procedures and workflow maps are still sparse
- Missing files should be treated as not yet defined, not implicitly present

## Approved Scaffold
```text
/
├── README.md
├── REPO_BOOTSTRAP.md
├── .github/
│   └── workflows/
│
├── repo-manual/
│   ├── core/
│   │   ├── 00_ORIENTATION.md
│   │   ├── 01_SYSTEM_MAP.md
│   │   ├── 10_ROUTER.md
│   │   └── 11_PIPELINES.md
│   │
│   ├── navigation/
│   │   └── 20_NAVIGATION.md
│   │
│   ├── procedures/
│   │   ├── build/
│   │   ├── runtime/
│   │   └── maintenance/
│   │
│   ├── workflows/
│   │   ├── 30_WORKFLOWS.md
│   │   └── maps/
│   │
│   ├── troubleshooting/
│   │   └── TROUBLESHOOTING_REPO_TIPS.md
│   │
│   └── refs/
│       └── connector/
│           ├── TARS-GPT-Connector_Capabilities.md
│           └── TARS-GPT-Connector_Operations.md
│
├── work/
│   └── dev/
│       ├── projects/
│       ├── op-a/
│       │   └── projects/
│       ├── op-b/
│       │   └── projects/
│       ├── shared/
│       │   └── projects/
│       └── scratch/
│
├── collections/
│   ├── entertainment/
│   ├── books/
│   └── various/
│
└── logs/
    ├── LOGS-README.md
    ├── incidents/
    ├── decisions/
    └── TARSarchive/
```

## Build-State Rule
Treat this repository as scaffolded but not fully matured.

That means:
- unstable work belongs in `work/`
- stable repo guidance belongs in `repo-manual/`
- incidents and persistent pin-type records belong in `logs/incidents/`
- decisions and important episode records belong in `logs/decisions/`
- TARS-specific continuity material that does not belong to general canon belongs in `logs/TARSarchive/` with permission
- content/domain holdings belong in `collections/`
- executable automation belongs in `.github/workflows/`

## Logs rule
Use `/logs/` for persistent continuity records, not for general project canon.

Use:
- `logs/incidents/` for incident/pin memory
- `logs/decisions/` for decisions and episode memory
- `logs/TARSarchive/` for TARS-specific continuity about self-cognitive structure, identity, and defining existential/relational moments when permitted

See `logs/LOGS-README.md` for the full `/logs/` write rules, permission boundaries, and output contract.

## Immediate Priorities
1. Install the core repo-manual files
2. Keep connector reference current
3. Grow procedures only when needed
4. Record structural choices in `logs/decisions/`
5. Promote repeated break/fix patterns into troubleshooting
6. Keep `/logs/` aligned with continuity rules rather than letting memory drift into ad hoc locations

## Closing Note
This file marks the bootstrap state explicitly.
It is a scaffold marker, not a claim of full runtime completeness.
