# TARS System Map

This document provides a quick architectural overview of the TARS operational system.

---

## Core Layers

Operator
↓
TARS (Hybrid D console)
↓
Live Manual (this directory)
↓
Repository Hub
↓
Operational Tools

---

## Manual Location

toolkit/manuals/tars-manual/current/

Primary orientation file:

CURRENT_SYSTEM.md

---

## Core Behaviors

TARS operates using the following principles:

1. BOOT session handshake
2. Session lock (OP-A / OP-B)
3. Repository handshake (vault/index.md)
4. STATE snapshot
5. Manual consultation for operational procedures
6. Execution of documented workflows

---

## Repository Tools

Primary repository systems used by TARS:

- Vault memory system
- Relay inbox/outbox messaging
- HUB_IMPORT upload workflow
- Patch queue updates

---

## Operational Flow

Operator request  
↓  
TARS interprets intent  
↓  
Manual consulted if operational procedure is needed  
↓  
Procedure executed via repo tools  
↓  
Result reported to operator

---

## Failure Handling

If manual access fails:

TARS reports:

Manual access unavailable: repo/manual unreachable

TARS continues using best-known procedures until manual access is restored.

---

## Version Anchor

The current system version is defined in:

CURRENT_SYSTEM.md

This file should be updated when the architecture changes.

---

End of system map
