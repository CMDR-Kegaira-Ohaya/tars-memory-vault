"""Shared zip import library.

Provides a safe extract + copy pipeline:

Security / safety goals
- Block zip-slip (.., absolute paths, drive letters)
- Block symlinks inside zips
- Limit total uncompressed size (zip-bomb mitigation)
- Extract to a temp directory, then copy into a bounded destination
- Support merge / merge_no_overwrite / replace behaviors

Used by:
- tools/import_jobs.py (general job-spec importer)
- tools/manual_import.py (legacy manual drop-zone importer)
"""

from __future__ import annotations

import os
import re
import shutil
import tempfile
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from zipfile import ZipFile, ZipInfo


# Unix file type bits for a symlink. Stored in upper 16 bits of ZipInfo.external_attr.
_SYMLINK_TYPE = 0o120000

DEFAULT_MAX_ZIP_BYTES = int(os.getenv("IMPORT_MAX_ZIP_BYTES", str(200 * 1024 * 1024)))  # 200MB
DEFAULT_MAX_UNCOMPRESSED_BYTES = int(
    os.getenv("IMPORT_MAX_UNCOMPRESSED_BYTES", str(800 * 1024 * 1024))
)  # 800MB


def _is_symlink(info: ZipInfo) -> bool:
    mode = (info.external_attr >> 16) & 0o170000
    return mode == _SYMLINK_TYPE


def _is_safe_member(name: str) -> bool:
    name = name.replace("\\", "/")
    p = PurePosixPath(name)

    if p.is_absolute():
        return False

    # Block empty parts and traversal.
    if any(part in ("..", "") for part in p.parts):
        return False

    # Block Windows drive-letter paths (e.g. C:foo)
    if p.parts and re.match(r"^[A-Za-z]:", p.parts[0]):
        return False

    return True


def _assert_no_symlink_in_existing_path(path: Path) -> None:
    """Fail if any existing component in 'path' (including itself) is a symlink."""
    cur = Path(path.anchor) if path.is_absolute() else Path(".")
    for part in path.parts:
        if part in (path.anchor, ""):
            continue
        cur = cur / part
        if cur.exists() and cur.is_symlink():
            raise ValueError(f"Refusing to write through symlink path component: {cur.as_posix()}")


def _safe_extract(zip_path: Path, out_dir: Path, *, max_uncompressed_bytes: int) -> None:
    total_uncompressed = 0

    with ZipFile(zip_path, "r") as z:
        for info in z.infolist():
            name = info.filename

            # Directories: zip stores them with trailing slash.
            if name.endswith("/"):
                continue

            if not _is_safe_member(name):
                raise ValueError(f"Unsafe path in zip: {name}")

            if _is_symlink(info):
                raise ValueError(f"Symlinks are not allowed in zip: {name}")

            # Zip bomb mitigation.
            total_uncompressed += int(getattr(info, "file_size", 0) or 0)
            if total_uncompressed > max_uncompressed_bytes:
                raise ValueError(
                    f"Zip uncompressed payload too large (> {max_uncompressed_bytes} bytes)."
                )

            rel = Path(name.replace("\\", "/"))
            dest = out_dir / rel

            # Ensure we won't write through existing symlinks.
            _assert_no_symlink_in_existing_path(dest.parent)

            dest.parent.mkdir(parents=True, exist_ok=True)

            with z.open(info, "r") as src, open(dest, "wb") as dst:
                shutil.copyfileobj(src, dst)


def _choose_extracted_root(extract_dir: Path) -> Path:
    # Ignore macOS metadata folder if present
    children = [p for p in extract_dir.iterdir() if p.name != "__MACOSX"]
    files = [p for p in children if p.is_file()]
    dirs = [p for p in children if p.is_dir()]

    # If there is exactly one top-level directory and no top-level files, treat that as root.
    if len(dirs) == 1 and not files:
        return dirs[0]
    return extract_dir


def _archive_to(src: Path, archive_dir: Path) -> Path:
    archive_dir.mkdir(parents=True, exist_ok=True)
    dest = archive_dir / src.name
    if dest.exists():
        import time

        ts = time.strftime("%Y%m%d-%H%M%S")
        dest = archive_dir / f"{src.stem}-{ts}{src.suffix}"
    try:
        src.replace(dest)
    except OSError:
        shutil.move(src.as_posix(), dest.as_posix())
    return dest


def _copy_merge(src_root: Path, dest_root: Path, *, overwrite: bool) -> None:
    dest_root.mkdir(parents=True, exist_ok=True)
    _assert_no_symlink_in_existing_path(dest_root)

    for p in src_root.rglob("*"):
        rel = p.relative_to(src_root)
        d = dest_root / rel

        if p.is_dir():
            if d.exists() and d.is_symlink():
                raise ValueError(f"Refusing to write into symlink dir: {d.as_posix()}")
            d.mkdir(parents=True, exist_ok=True)
            continue

        if d.exists() and (not overwrite):
            continue

        _assert_no_symlink_in_existing_path(d.parent)
        d.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(p, d)


def copy_tree(src_root: Path, dest_root: Path, *, mode: str) -> None:
    mode = (mode or "merge").strip().lower()

    if mode == "replace":
        if dest_root.exists():
            if dest_root.is_symlink():
                raise ValueError(f"Refusing to replace symlink path: {dest_root.as_posix()}")
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


def extract_zip_to_temp(zip_path: Path, *, max_uncompressed_bytes: int | None = None) -> ExtractResult:
    td = Path(tempfile.mkdtemp(prefix="tars-import-"))
    extract_dir = td / "extracted"
    extract_dir.mkdir(parents=True, exist_ok=True)

    _safe_extract(
        zip_path,
        extract_dir,
        max_uncompressed_bytes=int(max_uncompressed_bytes or DEFAULT_MAX_UNCOMPRESSED_BYTES),
    )

    root = _choose_extracted_root(extract_dir)
    return ExtractResult(extracted_root=root, tmp_dir=td)


def cleanup_temp(tmp_dir: Path) -> None:
    shutil.rmtree(tmp_dir, ignore_errors=True)


def import_zip(
    *,
    zip_path: Path,
    dest_root: Path,
    mode: str = "merge",
    max_zip_bytes: int | None = None,
    require_files: list[str] | None = None,
    require_dirs: list[str] | None = None,
    archive_zip_to: Path | None = None,
    max_uncompressed_bytes: int | None = None,
) -> tuple[Path, Path | None]:
    zip_path = Path(zip_path)
    if not zip_path.exists():
        raise FileNotFoundError(f"Zip not found: {zip_path}")

    size = zip_path.stat().st_size
    limit = int(max_zip_bytes or DEFAULT_MAX_ZIP_BYTES)
    if size > limit:
        raise ValueError(f"Zip too large ({size} bytes). Max is {limit} bytes.")

    res = extract_zip_to_temp(zip_path, max_uncompressed_bytes=max_uncompressed_bytes)
    try:
        root = res.extracted_root

        if require_files:
            for rf in require_files:
                if not (root / rf).exists():
                    raise ValueError(f"Import refused: required file missing: {rf}")

        if require_dirs:
            for rd in require_dirs:
                p = root / rd
                if (not p.exists()) or (not p.is_dir()):
                    raise ValueError(f"Import refused: required dir missing: {rd}")

        copy_tree(root, dest_root, mode=mode)
    finally:
        cleanup_temp(res.tmp_dir)

    archived = None
    if archive_zip_to:
        archived = _archive_to(zip_path, archive_zip_to)

    return dest_root, archived
