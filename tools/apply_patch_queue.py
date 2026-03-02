import json
import shutil
from pathlib import Path

PATCH_DIR = Path("patch-queue")
APPLIED_DIR = PATCH_DIR / "applied"

def apply_patch(patch: dict):
    mode = patch.get("mode", "upsert")
    path = patch.get("path")
    if not path:
        raise ValueError("Patch missing required field: 'path'")

    rel_path = path.lstrip("/")
    target = Path(rel_path)
    target.parent.mkdir(parents=True, exist_ok=True)

    if mode == "delete":
        if target.exists():
            target.unlink()
        return

    content = patch.get("content", "")
    if not isinstance(content, str):
        raise ValueError("'content' must be a string")

    if mode == "upsert":
        target.write_text(content, encoding="utf-8")
        return

    if mode == "append":
        # create if missing, otherwise append
        with target.open("a", encoding="utf-8") as f:
            f.write(content)
        return

    raise ValueError(f"Unknown patch mode: {mode}")

def main():
    PATCH_DIR.mkdir(parents=True, exist_ok=True)
    APPLIED_DIR.mkdir(parents=True, exist_ok=True)

    for p in sorted(PATCH_DIR.glob("*.json")):
        data = json.loads(p.read_text(encoding="utf-8"))
        apply_patch(data)
        shutil.move(str(p), str(APPLIED_DIR / p.name))

if __name__ == "__main__":
    main()
