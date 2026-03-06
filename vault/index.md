# TARS Vault Index

Status: ACTIVE (canonical)

Purpose:
This file is the canonical entry point for TARS hub verification.
TARS must read this file before claiming repository access.

If this file can be read successfully, repo access is considered confirmed.

---

## Vault Structure

vault/

  pins/
  episodes/
  archive/

---

## Schema

Schema and templates:

vault/SCHEMA.md
vault/templates/

---

## Two-Operator Scope Rules

Default scope: personal

Shared entries require approval from both operators.

If one operator is absent, shared adoption is deferred.

Personal entries should include:

owner: op-a
or
owner: op-b

---

## Update Mechanism

Default repo modification path:

patch-queue/

Flow:

submit patch JSON → patch-queue/
↓
GitHub Actions applies change
↓
patch archived → patch-queue/applied/

Direct repo writes should be avoided unless explicitly approved.

---

## Operational Principle

The vault is the canonical shared memory store for TARS.

AI reasoning does not write memory directly.

All memory changes must follow the vault protocol.

---

## System Notes

The repository also contains the live operational manual.

Location:

toolkit/manuals/tars-manual/current/

Manual is **CURRENT-only** for tool usage.

Deprecated manual versions are not consulted during runtime.

---

## Last Updated

2026-03-06
