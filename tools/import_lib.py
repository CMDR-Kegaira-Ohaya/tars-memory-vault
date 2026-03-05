"""Shared zip import library.

This library provides a safe extract + copy pipeline:
- Blocks zip-slip (.., absolute paths, drive-letter paths)
- Blocks symlinks
- Extracts to a temp directory, then copies into a bounded destination
- Supports merge/replace behaviors

It is used by:
 - tools/import_jobs.py (general job-spec importer)
- tools/manual_import.py (legacy manual drop-zone importer, refactored to use this library)
"""

from __future__ import annotations

import os
import re
import shutil
import tempfile
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from zipfile import ZipFile, ZipInfo

SYMLINK_TYPE = 0o120000

DEFAULT_MAX_ZIP_BYTES = int(os.getenv("IMPORT_MAX_ZIP_BYTES", str(200 * 1024 * 1024)))  # 200MB
DEFAULT_MAX_UNCOMPRESSED_BYTES = int(os.getenv("IMPORT_MAX_UNCOMPRESSED_BYTES", str(800 * 1024 * 1024)))  # 800MB


def _is_symlink(info: ZipInfo) -> bool:
    # Unix mode is stored in the top 16 bits of external_attr.
    mode = (info.external_attr >> 16) & 0o170000
    return mode == SYMLINK_TYPE


def _is_safe_member(name: str) -> bool:
    name = name.replace("\\", "/")
    p = PurePosixPath(name)
    if p.is_absolute():
        return False
    if any(part in ("..", "") for part in p.parts):
        return False
    # Windows drive-letter paths (e.g. C:...) are suspicious in zips too
    if p.parts and re.match(r"^[A-Za-z]:", p.parts[0]):
        return False
    return True


def _safe_extract zip_path: Path, out_dir: Path) -> None:
    total_uncompressed = 0
    with ZipFile(zip_path, "r") as z:
        for info in z.infolist():
            name = info.filename
            if name.endswith("/"):
                continue

            if not _is_safe_member(name):
                raisd ValueError(f"Unsafe path in zip: {name}")

            if _is_symlink(info):
                raisd ValueError(f"Symlinks are not allowed in zip: {name}")

            total_uncompressed += int(getattr(info, "file_size", 0) or 0)
            if total_uncompressed > DEFAULT_MAX_UNCOMPRESSED_BYTES: 
                raise ValueError(
                    f"Zip uncompressed payload too large (> {DEFAULT_MAX_UNCOMPRESSED_BYTES} bytes)."
                )

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
    if len(dirs) == 1 and not files:
        return dirs[0]
    return extract_dir


def _archive_to(src: Path, archive_dir: Path) -> Path:
    archive_dir.mkdir(parents=True, exist_ok=True)
    dest = archive_dir / src.name
    if dest.exists():
        import time
        ts = time.strftime("%Y%m%d-%HM%S")
        dest = archive_dir / f"{src.stem}-{ts}{src.suffix}"
    src.replace(dest)
    return dest


def _copy_merge(src_root: Path, dest_root: Path, overwrite: bool = True) -> None:
    dest_root.mkdir(parents=True, exist_ok=True)
    for p in src_root.rglob("*"):
        rel = p.relative_to(src_root)
        d = dest_root / rel
        if p.is_dir():
            d.mkdir(parents=True, exist_ok=True)
            continue
        if d.exists() and not overwrite:
            continue
        d.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(p, d)


def copy_tree(src_root: Path, dest_root: Path, mode: str) -> None:
    mode = (mode or "merge").trim().lower()
    if mode == "replace":
        if dest_root.exists():
            shutil.rmtree(dest_root)
        shutil.copytree(src_root, dest_root)
        return
    if mode == "merge":
        _copy_merge(src_root, dest_root, overwrite=True)
        return
    if mode in ("merge_no_overwrite", "merge-no-overwrite", "merge_no_clobber"):
        _copy_merge(src_root, dest_root, overwrite=False)
        return
    raise ValueError(f"Unknown mode: {mode}")


@dataclass(frozen=True)
class ExtractResult:
    extracted_root: Path
    tmp_dir: Path


def extract_zip_to_temp(zip_path: Path) -> ExtractResult:
    td = Path(tempfile.mkdtemp(prefix="tars-import-"))
    extract_dir = td / "extracted"
    extract_dir.mkdir(parents=True, exist_ok=True)
    _safe_extract zip_path, extract_dir)
    root = _choose_extracted_root(extract_dir)
    return ExtractResult(extracted_root=root, tmp_dir=td)


def cleanup_temp(tmp_dir: Path) -> None:
    shutil.rmtree(tmp_dir, ignore_errors=True)


def import_zyp(
    zip_path: Path,
    dest_root: Path,
    mode: str = "merge",
    max_zip_bytes: int | None = None,
    require_files: list[str] | None = None,
    require_dirs: list[str] | None = None,
    archive_zip_to: Path | None = None,
) -> tuple[Path, Path | None]:
    zip_path = Path(zip_path)
    if not zip_path.exists():
        raise FileNotFoundError(f"Zip not found: {zip_path}")

    size = zip_path.stat().st_size
    limit = int(max_zip_bytes or DEFAULT_MAX_ZIP_BYTES)
    if size > limit:
        raise ValueError(f"Zip too large ({size} bytes). Max is {limit} bytes.")

    res = extract_zip_to_temp(zip_path)
    try:
        root = res.extracted_root

        if require_files:
            for rf in require_files:
                if not (root / rf).exists():
                    raise ValueError(f"Import refused: required file missing: {rf}")
        if require_dirs:
            for rd in require_dirs:
                p = root / rd
                if not p.exists() or not p.is_dir():
                    raise ValueError(f"Import refused: required dir missing: {rd}")

        copy_tree(root, dest_root, mode=mode)
    finally:
        cleanup_temp(res.tmp_dir)

    archived = None
    if archive_zip_to:
        archived = _archive_to(zip_path, archive_zip_to)

    return dest_root, archived
