import json
import shutil
import base64
from pathlib import Path

PATCH_DIR = Path("patch-queue")
APPLIED_DIR = PATCH_DIR / "applied"
FAILED_DIR = PATCH_DIR / "failed"

def _load_content(patch: dict) -> str:
    if "content" in patch and patch["content"] is not None:
        if not isinstance(patch["content"], str):
            raise ValueError("'content' must be a string")
        return patch["content"]

    # Optional: base64 content for escape-free payloads
    if "content_b64" in patch and patch["content_b64"] is not None:
        if not isinstance(patch["content_b64"], str):
            raise ValueError("'content_b64' must be a string")
        return base64.b64decode(patch["content_b64"]).decode("utf-8")

    return ""

def apply_patch(patch: dict):
    mode = patch.get("mode", "upsert")
    path = patch.get("path")
    if not path or not isinstance(path, str):
        raise ValueError("Patch missing required string field: 'path'")

    target = Path(path.lstrip("/"))
    target.parent.mkdir(parents=True, exist_ok=True)

    if mode == "delete":
        if target.exists():
            target.unlink()
        return

    content = _load_content(patch)

    if mode == "upsert":
        target.write_text(content, encoding="utf-8")
        return

    if mode == "append":
        with target.open("a", encoding="utf-8") as f:
            f.write(content)
        return

    raise ValueError(f"Unknown patch mode: {mode}")

def main():
    PATCH_DIR.mkdir(parents=True, exist_ok=True)
    APPLIED_DIR.mkdir(parents=True, exist_ok=True)
    FAILED_DIR.mkdir(parents=True, exist_ok=True)

    for p in sorted(PATCH_DIR.glob("*.json")):
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
            apply_patch(data)
        except Exception as e:
            # quarantine bad patches so the queue keeps flowing
            shutil.move(str(p), str(FAILED_DIR / p.name))
            (FAILED_DIR / (p.stem + ".error.txt")).write_text(str(e), encoding="utf-8")
            continue

        shutil.move(str(p), str(APPLIED_DIR / p.name))

if __name__ == "__main__":
    main()
