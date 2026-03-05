from __future__ import annotations
import json, os, tempfile
from pathlib import Path
from zipfile import ZipFile, ZipInfo

import import_jobs

def b(msg: str):
    raise AssertionError(msg)

def wjob(p: Path, obj: dict):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(obj, indent=2) + "\n", encoding="utf-8")

def wzip(p: Path, items: dict[str, bytes]):
    p.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(p, "w") as z:
        for name, data in items.items():
            z.writestr(name, data)

def wzip_symlink(p: Path, name: str):
    zi = ZipInfo(name)
    zi.create_system = 3
    zi.external_attr = (0o120777 << 16)
    p.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(p, "w") as z:
        z.writestr(zi, b"target")

def expect_err(fn, needle: str):
    try:
        fn()
    except Exception as e:
        if needle not in str(e):
            b("wanted %r got %r" % (needle, str(e)))
        return
    b("expected error %r" % needle)

def tmp() -> Path:
    td = Path(tempfile.mkdtemp(prefix="tars-import-guardrails-"))
    os.chdir(td)
    Path("ops/import/jobs").mkdir(parents=True, exist_ok=True)
    Path("ops/import/zips").mkdir(parents=True, exist_ok=True)
    return td

def t_deny():
    tmp()
    wzip(Path("ops/import/zips/deny.zip"), {"PAYLOAD/README.md": b"ok\n"})
    wjob(Path("ops/import/jobs/deny.json"), {"zip":"ops/import/zips/deny.zip","dest":"tools/nope/","mode":"merge","max_zip_mb":5})
    expect_err(lambda: import_jobs.process_jobs(), "deny prefix")

def t_slip():
    tmp()
    wzip(Path("ops/import/zips/slip.zip"), {"../evil.txt": b"nope\n"})
    wjob(Path("ops/import/jobs/slip.json"), {"zip":"ops/import/zips/slip.zip","dest":"toolkit/library/slip-test/","mode":"merge","max_zip_mb":5})
    expect_err(lambda: import_jobs.process_jobs(), "Unsafe path")

def t_symlink():
    tmp()
    wzip_symlink(Path("ops/import/zips/symlink.zip"), "PAYLOAD/link")
    wjob(Path("ops/import/jobs/symlink.json"), {"zip":"ops/import/zips/symlink.zip","dest":"toolkit/library/symlink-test/","mode":"merge","max_zip_mb":5})
    expect_err(lambda: import_jobs.process_jobs(), "Symlinks are not allowed")


def t_merge():
    tmp()
    wzip(Path("ops/import/zips/a.zip"), {"RPG/README.md": b"A\n","RPG/systems/dnd5e/rules.md": b"V1\n"})
    wzip(Path("ops/import/zips/b.zip"), {"RPG/README.md": b"B\n","RPG/systems/dnd5e/rules.md": b"V2\n"})
    wjob(Path("ops/import/jobs/01.json"), {"zip":"ops/import/zips/a.zip","dest":"toolkit/library/merge-test/","mode":"merge","require_files":["README.md"],"max_zip_mb":5})
    wjob(Path("ops/import/jobs/02.json"), {"zip":"ops/import/zips/b.zip","dest":"toolkit/library/merge-test/","mode":"merge","require_files":["README.md"],"max_zip_mb":5})
    rc = import_jobs.process_jobs()
    if rc != 0: b("merge rc %r" % rc)
    txt = Path("toolkit/library/merge-test/systems/dnd5e/rules.md").read_text(encoding="utf-8")
    if "V2" not in txt: b("merge did not overwrite")


def t_replace():
    tmp()
    dest = Path("toolkit/library/replace-test")
    (dest/"old").mkdir(parents=True, exist_ok=True)
    (dest/"old/old.txt").write_text("old\n", encoding="utf-8")
    wzip(Path("ops/import/zips/r.zip"), {"PAYLOAD/new/new.txt": b"new\n"})
    wjob(Path("ops/import/jobs/r.json"), {"zip":"ops/import/zips/r.zip","dest":"toolkit/library/replace-test/","mode":"replace","max_zip_mb":5})
    rc = import_jobs.process_jobs()
    if rc != 0: b("replace rc %r" % rc)
    if not (dest/"new/new.txt").exists(): b("replace missing new")
    if (dest/"old/old.txt").exists(): b("replace did not delete old")


def main() -> int:
    for name, fn in [("deny",t_deny),("slip",t_slip),("symlink",t_symlink),("merge",t_merge),("replace",t_replace)):
        fn()
        print("PASS", name)
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
