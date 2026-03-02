import json
import shutil
from pathlib import Path

PATCH_DIR = Path("patch-queue")
APPLIED_DIR = PATCH_DIR / "applied"

def apply_patch(patch: dict):
    mode = patch.get("mode", "upsert")
    rel_path = patch["path"].lstrip("/")
    target = Path(rel_path)
    target.parent.mkdir(parents=True, exist_ok=True)

    if mode == "delete":
        if target.exists():
            target.unlink()
        return

    content = patch.get("content", "")
    target.write_text(content, encoding="utf-8")

def main():
    PATCH_DIR.mkdir(parents=True, exist_ok=True)
    APPLIED_DIR.mkdir(parents=True, exist_ok=True)

    for p in sorted(PATCH_DIR.glob("*.json")):
        data = json.loads(p.read_text(encoding="utf-8"))
        apply_patch(data)
        shutil.move(str(p), str(APPLIED_DIR / p.name))

if __name__ == "__main__":
    main()
