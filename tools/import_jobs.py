"""General importer: processes per-upload job specs.

Drop a zip into ops/import/zips/ and a job JSON into ops/import/jobs/.
On push to main, GitHub Actions runs this script to import the payload.

Design goals
- Avoid Contents API base64 issues for large payloads
- Strict destination policy (Option set 1): only write under toolkit/, ops/data/, assets/
- Deny prefixes: .github/, tools/, vault/, ops/relay/
- Safe zip handling: zip-slip + symlink blocking + size caps (handled by import_lib)

Job JSON schema (minimum)
{
  "zip": "ops/import/zips/<payload>.zip",
  "dest": "toolkit/library/<topic>/",
  "mode": "merge_no_overwrite",
  "max_zip_mb": 200,
  "require_files": ["README.md"],
  "require_dirs": ["systems", "campaigns"]
}
"""

from __future__ import annotations

import json
import re
import shutil
from pathlib import Path, PurePosixPath

import import_lib


JOBS_DIR = Path("ops/import/jobs")
ZIPS_DIR = Path("ops/import/zips")
ARCHIVE_JOBS = Path("ops/import/archive/jobs")
ARCHIVE_ZIPS = Path("ops/import/archive/zips")

ALLOWED_ROOTS = (
    PurePosixPath("toolkit"),
    PurePosixPath("assets"),
    PurePosixPath("ops/data"),
)

DENY_PREFIXES = (
    PurePosixPath(".github"),
    PurePosixPath("tools"),
    PurePosixPath("vault"),
    PurePosixPath("ops/relay"),
)

DEFAULT_MODE = "merge"


def _is_safe_rel_path(p: str) -> bool:
    p = p.replace("\\", "/")
    pp = PurePosixPath(p)
    if pp.is_absolute():
        return False
    if any(part in ("..", "") for part in pp.parts):
        return False
    if pp.parts and re.match(r"^[A-Za-z]:", pp.parts[0]):
        return False
    return True


def _has_prefix(p: PurePosixPath, prefix: PurePosixPath) -> bool:
    return p == prefix or str(p).startswith(str(prefix) + "/")


def _is_denied_dest(dest_posix: PurePosixPath) -> bool:
    return any(_has_prefix(dest_posix, d) for d in DENY_PREFIXES)


def _is_allowed_dest(dest_posix: PurePosixPath) -> bool:
    return any(_has_prefix(dest_posix, a) for a in ALLOWED_ROOTS)


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


def _load_job(job_path: Path) -> dict:
    data = json.loads(job_path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError("Job must be a JSON object.")
    return data


def _validate_list_of_strings(x, field_name: str) -> list[str] | None:
    if x is None:
        return None
    if not isinstance(x, list) or any(not isinstance(i, str) for i in x):
        raise ValueError(f"{field_name} must be a list of strings.")
    return [s.strip() for s in x if s.strip()]


def process_jobs() -> int:
    JOBS_DIR.mkdir(parents=True, exist_ok=True)
    ZIPS_DIR.mkdir(parents=True, exist_ok=True)

    jobs = sorted(JOBS_DIR.glob("*.json"))
    if not jobs:
        print("No jobs found.")
        return 0

    # Phase 1: validate + import (no archiving)
    used_jobs: list[Path] = []
    used_zips: list[Path] = []

    for job_path in jobs:
        print(f"Processing job: {job_path.as_posix()}")
        job = _load_job(job_path)

        zip_ref = str(job.get("zip") or "").strip()
        dest_ref = str(job.get("dest") or "").strip()
        mode = str(job.get("mode") or DEFAULT_MODE).strip().lower()

        if not zip_ref or not dest_ref:
            raise ValueError("Job must include 'zip' and 'dest'.")

        if not _is_safe_rel_path(zip_ref) or not _is_safe_rel_path(dest_ref):
            raise ValueError("Job paths must be safe, relative paths (no '..', no absolute paths).")

        zip_path = Path(zip_ref)
        dest_root = Path(dest_ref)

        # Zip must live under ops/import/
        if not zip_path.as_posix().startswith("ops/import/"):
            raise ValueError("Zip must be under ops/import/ (use ops/import/zips/).")

        dest_posix = PurePosixPath(dest_root.as_posix().replace("\\", "/"))
        if _is_denied_dest(dest_posix):
            raise ValueError(f"Destination refused (deny prefix): {dest_root.as_posix()}")

        if not _is_allowed_dest(dest_posix):
            allowed = ", ".join(a.as_posix() + "/" for a in ALLOWED_ROOTS)
            raise ValueError(f"Destination refused (not under allowed roots). Allowed roots: {allowed}")

        require_files = _validate_list_of_strings(job.get("require_files"), "require_files")
        require_dirs = _validate_list_of_strings(job.get("require_dirs"), "require_dirs")

        max_zip_mb = job.get("max_zip_mb")
        max_zip_bytes = None
        if max_zip_mb is not None:
            try:
                max_zip_bytes = int(max_zip_mb) * 1024 * 1024
            except Exception as e:
                raise ValueError("max_zip_mb must be an integer.") from e

        # Import into working tree (no archive yet)
        import_lib.import_zip(
            zip_path=zip_path,
            dest_root=dest_root,
            mode=mode,
            max_zip_bytes=max_zip_bytes,
            require_files=require_files,
            require_dirs=require_dirs,
            archive_zip_to=None,  # two-phase: archive only after all jobs succeed
        )

        used_jobs.append(job_path)
        used_zips.append(zip_path)

    # Phase 2: archive inputs (only if all succeeded)
    ARCHIVE_JOBS.mkdir(parents=True, exist_ok=True)
    ARCHIVE_ZIPS.mkdir(parents=True, exist_ok=True)

    for zp in used_zips:
        if zp.exists():
            archived = _archive_to(zp, ARCHIVE_ZIPS)
            print(f"Archived zip: {archived.as_posix()}")

    for jp in used_jobs:
        if jp.exists():
            archived = _archive_to(jp, ARCHIVE_JOBS)
            print(f"Archived job: {archived.as_posix()}")

    print(f"Processed jobs: {len(used_jobs)}")
    return 0


def main() -> int:
    return process_jobs()


if __name__ == "__main__":
    raise SystemExit(main())
