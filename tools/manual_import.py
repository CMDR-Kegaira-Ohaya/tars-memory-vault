"""Manual import (legacy convenience) — refactored to use tools.import_lib.

Usage (run by GitHub Actions):
  python tools/manual_import.py ops/import/manual/<file>.zip

Behavior:
- Derives version vN from zip filename (e.g. -v1- -> v1; default v1)
- Imports to: toolkit/manuals/tars-manual/vN/<zip-stem>/
- Enforces manual install markers: TOC.md, chapters/, appendices/
- Archives the processed zip to ops/import/manual/archive/
"""

from __future__ import annotations

import argparse
import os
import re
from pathlib import Path

from tools import import_lib

BASE = Path("toolkit/manuals/tars-manual")
DEFAULT_VERSION = 1
MAX_ZIP_BYTES = int(os.getenv("MANUAL_IMPORT_MAX_ZIP_BYTES", str(200 * 1024 * 1024)))
ARCHIVE_DIR = Path("ops/import/manual/archive")


def _parse_version(zip_stem: str) -> int:
    m = re.search(r"(?i)(?:^|[-_])v(\d+)(?:[-_]|$)", zip_stem)
    if not m:
        return DEFAULT_VERSION
    try:
        return max(1, int(m.group(1)))
    except Exception:
        return DEFAULT_VERSION


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("zip", type=str, help="Path to dropped manual zip (within ops/import/manual/)")
    args = ap.parse_args()

    zip_path = Path(args.zip)
    if not zip_path.exists():
        raise FileNotFoundError(f"Zip not found: {zip_path}")

    zip_stem = zip_path.stem
    v = _parse_version(zip_stem)

    dest_root = BASE / f"v{v}" / zip_stem

    imported_to, archived_to = import_lib.import_zip(
        zip_path=zip_path,
        dest_root=dest_root,
        mode="replace",  # manual snapshots should be deterministic
        max_zip_bytes=MAX_ZIP_BYTES,
        require_files=["TOC.md"],
        require_dirs=["chapters", "appendices"],
        archive_zip_to=ARCHIVE_DIR,
    )

    print(f"Imported manual: {imported_to.as_posix()}")
    if archived_to:
        print(f"Archived zip: {archived_to.as_posix()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
