# Example Cartridge

This is a minimal repo-backed markdown cartridge used to validate manifest-driven selection in the terminal runtime.

It exists so the terminal can:
- enumerate a canonical repo manifest
- mount a real source file from `collections/`
- resolve `markdown-reader`
- attach save state only through `terminal/saves/<tag>/`

This file is source content, not runtime state.
