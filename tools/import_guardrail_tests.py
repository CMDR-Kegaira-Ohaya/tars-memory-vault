from __future__ import annotations

import json
import os
import tempfile
from pathlib import Path
from zipfile import ZipFile, ZipInfo

import import_jobs


def _write_job(path: Path, obj: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2) + "\n", encoding="utf-8")


def _write_zip(path: Path, items: dict[str, bytes]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(path, "w") as z:
        for name, data in items.items():
            z.writestr(name, data)


def _write_symlink_zip(path: Path, name: str) -> None:
    # Create a symlink entry by setting unix mode bits in external_attr.
    zi = ZipInfo(name)
    zi.create_system = 3  # unix
    zi.external_attr = (0o120777 << 16)  # symlink + perms
    path.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(path, "w") as z:
        z.writestr(zi, b"target")


def _expect_error(fn, needle: str) -> None:
    try:
        fn()
    except Exception as e:
        msg = str(e)
        if needle not in msg:
            raise AssertionError(f"Expected error containing '{needle}', got: {msg}") from e
        return
    raise AssertionError(f"Expected error containing '{needle}', but no error was raised.")


def _make_tmp() -> Path:
    td = Path(tempfile.mkdtemp(prefix="tars-import-guardrails-"))
    (td / "ops/import/jobs").mkdir(parents=True, exist_ok=True)
    (td / "ops/import/zips").mkdir(parents=True, exist_ok=True)
    return td


def _run_in(td: Path, fn):
    prev = Path.cwd()
    os.chdir(td)
    try:
        return fn()
    finally:
        os.chdir(prev)


def t_deny_policy() -> None:
    td = _make_tmp()

    def run():
        _write_zip(Path("ops/import/zips/deny.zip"), {"PAYLOAD/README.md": b"ok\n"})
        _write_job(
            Path("ops/import/jobs/deny.json"),
            {"zip": "ops/import/zips/deny.zip", "dest": "tools/nope/", "mode": "merge", "max_zip_mb": 5},
        )
        _expect_error(lambda: import_jobs.process_jobs(), "deny prefix")
        assert Path("ops/import/jobs/deny.json").exists()
        assert Path("ops/import/zips/deny.zip").exists()

    _run_in(td, run)


def t_zip_slip_blocked() -> None:
    td = _make_tmp()

    def run():
        _write_zip(Path("ops/import/zips/slip.zip"), {"../evil.txt": b"nope\n"})
        _write_job(
            Path("ops/import/jobs/slip.json"),
            {"zip": "ops/import/zips/slip.zip", "dest": "toolkit/library/slip-test/", "mode": "merge", "max_zip_mb": 5},
        )
        _expect_error(lambda: import_jobs.process_jobs(), "Unsafe path")
        assert Path("ops/import/jobs/slip.json").exists()
        assert Path("ops/import/zips/slip.zip").exists()

    _run_in(td, run)


def t_symlink_blocked() -> None:
    td = _make_tmp()

    def run():
        _write_symlink_zip(Path("ops/import/zips/symlink.zip"), "PAYLOAD/link")
        _write_job(
            Path("ops/import/jobs/symlink.json"),
            {
                "zip": "ops/import/zips/symlink.zip",
                "dest": "toolkit/library/symlink-test/",
                "mode": "merge",
                "max_zip_mb": 5,
            },
        )
        _expect_error(lambda: import_jobs.process_jobs(), "Symlinks are not allowed")
        assert Path("ops/import/jobs/symlink.json").exists()
        assert Path("ops/import/zips/symlink.zip").exists()

    _run_in(td, run)


def t_merge_overwrite() -> None:
    td = _make_tmp()

    def run():
        _write_zip(
            Path("ops/import/zips/a.zip"),
            {"RPG/README.md": b"A\n", "RPG/systems/dnd5e/rules.md": b"RULES_V1\n"},
        )
        _write_zip(
            Path("ops/import/zips/b.zip"),
            {"RPG/README.md": b"B\n", "RPG/systems/dnd5e/rules.md": b"RULES_V2\n"},
        )
        _write_job(
            Path("ops/import/jobs/01-a.json"),
            {
                "zip": "ops/import/zips/a.zip",
                "dest": "toolkit/library/merge-test/",
                "mode": "merge",
                "require_files": ["README.md"],
                "max_zip_mb": 5,
            },
        )
        _write_job(
            Path("ops/import/jobs/02-b.json"),
            {
                "zip": "ops/import/zips/b.zip",
                "dest": "toolkit/library/merge-test/",
                "mode": "merge",
                "require_files": ["README.md"],
                "max_zip_mb": 5,
            },
        )

        rc = import_jobs.process_jobs()
        assert rc == 0

        rules = Path("toolkit/library/merge-test/systems/dnd5e/rules.md").read_text(encoding="utf-8")
        assert "RULES_V2" in rules

        # Inputs should be archived after success.
        assert not list(Path("ops/import/jobs").glob("*.json"))
        assert not list(Path("ops/import/zips").glob("*.zip"))
        assert list(Path("ops/import/archive/jobs").glob("*.json"))
        assert list(Path("ops/import/archive/zips").glob("*.zip"))

    _run_in(td, run)


def t_replace_snapshot() -> None:
    td = _make_tmp()

    def run():
        dest = Path("toolkit/library/replace-test")
        (dest / "old").mkdir(parents=True, exist_ok=True)
        (dest / "old/old.txt").write_text("old\n", encoding="utf-8")

        _write_zip(Path("ops/import/zips/r.zip"), {"PAYLOAD/new/new.txt": b"new\n"})
        _write_job(
            Path("ops/import/jobs/r.json"),
            {"zip": "ops/import/zips/r.zip", "dest": "toolkit/library/replace-test/", "mode": "replace", "max_zip_mb": 5},
        )

        rc = import_jobs.process_jobs()
        assert rc == 0

        assert (dest / "new/new.txt").exists()
        assert not (dest / "old/old.txt").exists()

    _run_in(td, run)


def main() -> int:
    tests = [
        ("deny", t_deny_policy),
        ("slip", t_zip_slip_blocked),
        ("symlink", t_symlink_blocked),
        ("merge", t_merge_overwrite),
        ("replace", t_replace_snapshot),
    ]
    for name, fn in tests:
        fn()
        print("PASS", name)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
