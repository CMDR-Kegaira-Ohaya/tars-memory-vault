"""Manual import tool (zip -> repo-native markdown).

Usage (run by GitHub Actions):
  python tools/manual_import.py ops/import/manual/<file>.zip

Safety:
- Blocks zip-slip (.., absolute paths)
- Blocks symlinks
- Extracts only under a temp dir, then copies into toolkit/manuals/tars-manual/...
"""

from __future__ import annotations

import argparse
import os
import re
import shutil
import tempfile
from pathlib import Path, PurePosixPath
from zipfile import ZipFile, ZipInfo

BASE = Path("toolkit/manuals/tars-manual")
DEFAULT_VERSION = 1
MAX_ZIP_BYTES = int(os.getenv("MANUAL_IMPORT_MAX_ZIP_BYTES", str(200 * 1024 * 1024)))  # 200 MB

SYMLINK_TYPE = 0o120000


def _is_symlink(info: ZipInfo) -> bool:
    # Unix mode is stored in the top 16 bits of external_attr.
    mode = (info.external_attr >> 16) & 0o170000
    return mode == SYMLINK_TYPE


def _is_safe_member(name: str) -> bool:
    # Normalize to POSIX-style paths
    name = name.replace("\\", "/")
    p = PurePosixPath(name)
    if p.is_absolute():
        return False
    parts = p.parts
    if any(part in ("..", "") for part in parts):
        return False
    # Windows drive-letter style paths (e.g. C:...) are suspicious in zips too
    if re.match(r"^[A-Za-z]:", parts[0]):
        return False
    return True


def _safe_extract(zip_path: Path, out_dir: Path) -> None:
    with ZipFile(zip_path, "r") as z:
        for info in z.infolist():
            name = info.filename
            if name.endswith("/"):
                continue

            if not _is_safe_member(name):
                raise ValueError(f"Unsafe path in zip: {name}")

            if _is_symlink(info):
                raise ValueError(f"Symlink entries are not allowed: {name}")

            rel = Path(name.replace("\\", "/"))
            dest = out_dir / rel
            dest.parent.mkdir(parents=True, exist_ok=True)

            with z.open(info, "r") as src, open(dest, "wb") as dst:
                shutil.copyfileobj(src, dst)


def _choose_extracted_root(extract_dir: Path) -> Path:
    # Ignore macOS metadata folder if present
    children = [p for p in extract_dir.iterdir() if p.name != "__MACOSX"]
    files = [p for p in children if p.is_file()]
    dirs = [p for p in children if p.is_dir()]

    # If there is exactly one directory and no root-level files, treat that as the root
    if len(dirs) == 1 and not files:
        return dirs[0]
    return extract_dir



def _parse_version(zip_stem: str) -> int:
    m = re.search(r"(?i)(?:^|[-_])v(\d+)(?:[-_|]|$)", zip_stem)
    if not m:
        return DEFAULT_VERSION
    try:
        return max(1, int(m.group(1)))
    except Exception:
        return DEFAULT_VERSION



def _ensure_markers(root: Path) -> None:
    # Minimal install marker
    toc = root / "TOC.md"
    if not toc.exists():
        raise ValueError("Import refused: TOC.md not found at extracted root.")
    # These are expected for this manual build; enforce for now.
    ch = root / "chapters"
    ap = root / "appendices"
    if not ch.exists() or not ch.is_dir():
        raise ValueError("Import refused: chapters/ folder not found at extracted root.")
    if not ap.exists() or not ap.is_dir():
        raise ValueError("Import refused: appendices/ folder not found at extracted root.")


def _archive_zip(zip_path: Path) -> Path:
    archive_dir = zip_path.parent / "archive"
    archive_dir.mkdir(parents=True, exist_ok=True)

    dest = archive_dir / zip_path.name
    if dest.exists():
        # Avoid overwriting; append a short timestamp
        import time

        ts = time.strftime("%Y%m%d-%H%M%S")
        dest = archive_dir / f"{zip_path.stem}-{ts}{zip_path.suffix}"
    zip_path.replace(dest)
    return dest



def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("zip", type=str, help="Path to the dropped zip (within ops/import/manual/)")
    args = ap.parse_args()

    zip_path = Path(args.zip)
    if not zip_path.exists():
        raise FileNotFoundError(f"Zip not found: {zip_path}")

    size = zip_path.stat().st_size
    if size > MAX_ZIP_BYTES:
        raise ValueError(f"Zip too large ({size} bytes). Max is {MAX_ZIP_BYTES} bytes.")

    zip_stem = zip_path.stem
    v = _parse_version(zip_stem)

    dest_root = BASE / f"v#{v}" / zip_stem
    dest_root.parent.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory() as td:
        extract_dir = Path(td) / "extracted"
        extract_dir.mkdir(parents=True, exist_ok=True)

        _safe_extract(zip_path, extract_dir)
        root = _choose_extracted_root(extract_dir)
        _ensure_markers(root)

        if dest_root.exists():
            shutil.rmtree(dest_root)

        shutil.copytree(root, dest_root)

    archived_to = _archive_zip(zip_path)

    print(f"Imported manual: {dest_root.as_posix()}")
    print(f"Archived zip: {archived_to.as_posix()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
