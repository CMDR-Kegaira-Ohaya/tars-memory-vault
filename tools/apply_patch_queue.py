import base64
import json
import shutil
from pathlib import Path

PATCH_DIR = Path("patch-queue")
APPLIED_DIR = PATCH_DIR / "applied"
FAILED_DIR = PATCH_DIR / "failed"

# Safety guards (tune as needed)
DEFAULT_MAX_WRITE_BYTES = 250_000  # 250 KB
DEFAULT_ALLOW_WORKFLOWS = False   # edits to .github/workflows require explicit allow_workflows=true


def _load_content(patch: dict) -> str:
    """Load content from patch['content'] or patch['content_b64']."""
    if "content" in patch and patch["content"] is not None:
        if not isinstance(patch["content"], str):
            raise ValueError("'content' must be a string")
        return patch["content"]

    if "content_b64" in patch and patch["content_b64"] is not None:
        if not isinstance(patch["content_b64"], str):
            raise ValueError("'content_b64' must be a string")
        return base64.b64decode(patch["content_b64"]).decode("utf-8")

    return ""


def _normalize_rel_path(path: str) -> Path:
    if not path or not isinstance(path, str):
        raise ValueError("Missing required string field: 'path'")
    rel = Path(path.lstrip("/"))
    # prevent traversal
    if any(part == ".." for part in rel.parts):
        raise ValueError(f"Path traversal not allowed: {path!r}")
    return rel


def _assert_allowed(target: Path, patch: dict, content: str | None = None) -> None:
    """Guardrails: size + workflows protection."""
    # size guard
    if content is not None:
        limit = int(patch.get("max_write_bytes", DEFAULT_MAX_WRITE_BYTES))
        if len(content.encode("utf-8")) > limit:
            raise ValueError("Patch content too large (size guard)")

    # workflows guard
    allow_workflows = bool(patch.get("allow_workflows", DEFAULT_ALLOW_WORKFLOWS))
    if len(target.parts) >= 2 and target.parts[0] == ".github" and target.parts[1] == "workflows":
        if not allow_workflows:
            raise ValueError(
                "Edits to .github/workflows require allow_workflows=true in the patch"
            )


def apply_patch(patch: dict) -> None:
    mode = patch.get("mode", "upsert")

    # MOVE / RENAME
    if mode == "move":
        src_raw = patch.get("src")
        dest_raw = patch.get("dest")
        if not isinstance(src_raw, str) or not isinstance(dest_raw, str):
            raise ValueError("move requires string fields: 'src' and 'dest'")
        src = _normalize_rel_path(src_raw)
        dest = _normalize_rel_path(dest_raw)

        _assert_allowed(src, patch)
        _assert_allowed(dest, patch)

        if not src.exists():
            raise FileNotFoundError(f"Source does not exist: {src}")
        dest.parent.mkdir(parents=True, exist_ok=True)
        src.replace(dest)
        return

    # Everything else uses "path"
    path = patch.get("path")
    target = _normalize_rel_path(path)

    # DELETE
    if mode == "delete":
        _assert_allowed(target, patch)
        if target.exists():
            target.unlink()
        return

    # REPLACE TEXT (find/replace inside a file)
    if mode == "replace_text":
        _assert_allowed(target, patch)
        if not target.exists():
            raise FileNotFoundError(f"Target does not exist for replace_text: {target}")

        find = patch.get("find")
        replace = patch.get("replace", "")
        if not isinstance(find, str) or find == "":
            raise ValueError("replace_text requires non-empty string field: 'find'")
        if not isinstance(replace, str):
            raise ValueError("'replace' must be a string")

        replace_all = bool(patch.get("replace_all", False))

        text = target.read_text(encoding="utf-8")
        if find not in text:
            raise ValueError("replace_text: 'find' string not found")

        new_text = text.replace(find, replace) if replace_all else text.replace(find, replace, 1)

        _assert_allowed(target, patch, new_text)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(new_text, encoding="utf-8")
        return

    # UPSERT / APPEND
    content = _load_content(patch)
    _assert_allowed(target, patch, content)
    target.parent.mkdir(parents=True, exist_ok=True)

    if mode == "upsert":
        target.write_text(content, encoding="utf-8")
        return

    if mode == "append":
        with target.open("a", encoding="utf-8") as f:
            f.write(content)
        return

    raise ValueError(f"Unknown patch mode: {mode}")


def main() -> None:
    PATCH_DIR.mkdir(parents=True, exist_ok=True)
    APPLIED_DIR.mkdir(parents=True, exist_ok=True)
    FAILED_DIR.mkdir(parents=True, exist_ok=True)

    for p in sorted(PATCH_DIR.glob("*.json")):
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
            if not isinstance(data, dict):
                raise ValueError("Patch JSON must be an object")
            apply_patch(data)
        except Exception as e:
            # quarantine bad patches so the queue keeps flowing
            shutil.move(str(p), str(FAILED_DIR / p.name))
            (FAILED_DIR / (p.stem + ".error.txt")).write_text(str(e), encoding="utf-8")
            continue

        shutil.move(str(p), str(APPLIED_DIR / p.name))


if __name__ == "__main__":
    main()
