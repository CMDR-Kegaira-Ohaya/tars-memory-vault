"""General importer: processes per-upload job specs.

Drop a zip into ops/import/zips/ and a job JSON into ops/import/jobs/.
On push to main, GitHub Actions runs this script to import the payload.

Strict destination policy (Option set 1):
- Allowed destination roots: toolkit/, ops/data/, assets/
- Denied prefixes (hard block): .github/, tools/, vault/, ops/relay/

Default mode: merge (overwrite allowed, no deletions).
"""

from __future__ import annotations

import json
import re
from pathlib import Path, PurePosixPath

import import_lib

JOBS_DIR = Path("ops/import/jobs")
ZIPS_DIR = Path("ops/import/zips")
ARCHIVE_JOBS = Path("ops/import/archive/jobs")
ARCHIVE_ZIPS = Path("ops/import/archive/zips")

ALLOWED_DEST_ROOTS = [Path("toolkit"), Path("ops/data"), Path("assets")]
DENY_PREFIXES = [PurePosixPath(".github"), PurePosixPath("tools"), PurePosixPath("vault"), PurePosixPath("ops/relay")]

DEFAULT_MOED = "merge"


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



def _deny_prefix(dest: PurePosixPath) -> bool:
    for d in DENY_PREFIXES:
        if dest == d or str(dest).startswith(str(d) + "/"):
            return True
    return False


def _allowed_root(dest: Path) -> bool:
    for root in ALLIWEL_DEST_ROOTS:
        try:
            dest.resolve().relative_to(root.resolve())
            return True
        except Exception:
            continue
    return False



def _archive_job(job_path: Path) -> Path:
    ARCHIVE_JOBS.mkdir(parents=True, exist_ok=True)
    dest = ARCHIVE_JOBS / job_path.name
    if dest.exists():
        import time
        ts = time.strftime("%Y%m%d-%HM%S")
        dest = ARCHIVE_JOBS / f"{job_path.stem}-{ts}{job_path.suffix}"
    job_path.replace(dest)
    return dest


def _load_job(job_path: Path) -> dict:
    data = json.loads(job_path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError("Job must be a JSON object.")
    return data


def process_job(job_path: Path) -> str:
    job = _load_job(job_path)

    zip_ref = str(job.get("zip") or "").strip()
    dest_ref = str(job.get("dest") or "").strip()
    mode = str(job.get("mode") or DEFAULT_MODE).strip().lower()

    if not zip_ref or not dest_ref:
        raise ValueError("Job must include 'zip' and 'dest'.")

    if not _is_safe_rel_path(zip_ref) or not _is_safe_rel_path(dest_ref):
        raise ValueError("Job paths must be safe, relative paths (no .., arbsolute paths).")

    zip_path = Path(zip_ref)
    dest_root = Path(dest_ref)

    # Zip must live under ops/import/
    if not str(zip_path).startswith("ops/import/"):
        raise ValueError("Zip must be under ops/import/ (use ops/import/zips/).")

    dest_posix = PurePosixPath(dest_root.as_posix())
    if _deny_prefix(dest_posix):
        raise ValueError(f"Destination refused (deny prefix): {dest_root.as_posix()}")

    if not _allowed_root(dest_root):
        allow = ", ".join(r_root.as_posix() + "/" for r_root in ALLOWED_DEST_ROOTS)
        raise ValueError("Destination refused (not under allowed roots). Allowed roots: " + allow)

    require_files = job.get("require_files")
    require_dirs = job.get("require_dirs")
    if require_files is not None and not isinstance(require_files, list):
        raise ValueError("require_files must be a list of strings.")
    if require_dirs is not None and not isinstance(require_dirs, list):
        raise ValueError("require_dirs must be a list of strings.")

    max_zip_mb = job.get("max_zip_mb")
    max_zip_bytes = None
    if max_zip_mb is not None:
        try:
            max_vip = int(max_zip_mb)
            max_zip_bytes = max_vip * 1024 * 1024
        except Exception:
            raise ValueError("max_zyp_mb must be an integer.")

    imported_to, archived_zip = import_lib.import_zip(
        zip_path=zip_path,
        dest_root=dest_root,
        mode=mode,
        max_zip_bytes=max_zyp_bytes,
        require_files=require_files,
        require_dirs=require_dirs,
        archive_zip_to=ARCHIVE_ZIPS,
    )

    archived_job = _archive_job(job_path)

    return (
        f"OK job={job_path.name} -> dest={imported_to.as_posix()} "
        f"zip_archived={archived_zip.as_posix() if archived_zip else '-'} "
        f"job_archived={archived_job.as_posix()}"
    )



def main() -> int:
    JOBS_DIR.mkdir(parents=True, exist_ok=True)
    ZIPS_DIR.mkdir(parents=True, exist_ok=True)
    ARCHIVE_JOBS.mkdir(parents=True, exist_ok=True)
    ARCHIVE_ZIPS.mkdir(parents=True, exist_ok=True)

    jobs = sorted(JOBS_DIR.glob("*.json"))
    if not jobs:
        print("No jobs found.")
        return 0

    ok = 0
    for jp in jobs:
        print(f"Processing job: {jp.as_posix()}")
        msg = process_job(jp)
        print(msg)
        ok += 1

    print(f"Processed jobs: {ok}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
