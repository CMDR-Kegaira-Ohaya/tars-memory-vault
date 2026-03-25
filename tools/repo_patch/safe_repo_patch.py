#!/usr/bin/env python3
from __future__ import annotations

import argparse
import copy
import difflib
import hashlib
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any


class PatchError(RuntimeError):
    pass


FLAG_MAP = {
    "IGNORECASE": re.IGNORECASE,
    "MULTILINE": re.MULTILINE,
    "DOTALL": re.DOTALL,
}


@dataclass(frozen=True)
class Span:
    start: int
    end: int


@dataclass
class PatchResult:
    path: str
    sha256_before: str
    sha256_after: str
    changed: bool
    operations: list[dict[str, Any]]
    diff: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Safe anchored repo patch utility")
    parser.add_argument("--spec", required=True, help="Path to patch spec JSON")
    parser.add_argument("--dry-run", action="store_true", help="Preview diff without writing")
    parser.add_argument("--write", action="store_true", help="Apply patch and write file")
    args = parser.parse_args()
    if args.dry_run == args.write:
        raise SystemExit("Exactly one of --dry-run or --write is required")
    return args


def load_json(path: Path) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise PatchError(f"spec file not found: {path}") from exc
    except json.JSONDecodeError as exc:
        raise PatchError(f"invalid JSON in spec: {path}: {exc}") from exc


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def detect_newline(text: str) -> str:
    if "\r\n" in text:
        return "\r\n"
    if "\n" in text:
        return "\n"
    if "\r" in text:
        return "\r"
    return "\n"


def normalize_newlines(text: str, newline: str) -> str:
    normalized = text.replace("\r\n", "\n").replace("\r", "\n")
    return normalized.replace("\n", newline)


def compile_pattern(anchor: dict[str, Any]) -> re.Pattern[str] | None:
    if anchor["type"] != "regex":
        return None
    flags = 0
    for name in anchor.get("flags", []):
        try:
            flags |= FLAG_MAP[name]
        except KeyError as exc:
            raise PatchError(f"unsupported regex flag: {name}") from exc
    return re.compile(anchor["value"], flags)


def find_matches(text: str, anchor: dict[str, Any]) -> list[Span]:
    anchor_type = anchor.get("type")
    if anchor_type not in {"exact", "regex"}:
        raise PatchError(f"unsupported anchor type: {anchor_type}")

    if anchor_type == "exact":
        needle = anchor["value"]
        if needle == "":
            raise PatchError("empty exact anchor is not allowed")
        matches: list[Span] = []
        start = 0
        while True:
            index = text.find(needle, start)
            if index < 0:
                break
            matches.append(Span(index, index + len(needle)))
            start = index + len(needle)
        return matches

    pattern = compile_pattern(anchor)
    assert pattern is not None
    return [Span(match.start(), match.end()) for match in pattern.finditer(text)]


def validate_matches(anchor_label: str, anchor: dict[str, Any], matches: list[Span]) -> None:
    count = len(matches)
    expected = anchor.get("expected_matches")
    unique_only = bool(anchor.get("unique_only", False))

    if expected is not None and count != expected:
        raise PatchError(
            f"{anchor_label}: expected {expected} match(es), found {count}"
        )
    if unique_only and count != 1:
        raise PatchError(f"{anchor_label}: unique_only requires exactly 1 match, found {count}")
    if count == 0:
        raise PatchError(f"{anchor_label}: no matches found")


def replace_exact(text: str, needle: str, replacement: str, replace_all: bool) -> tuple[str, int]:
    if needle == "":
        raise PatchError("empty exact find is not allowed")
    count = text.count(needle)
    if count == 0:
        return text, 0
    if replace_all:
        return text.replace(needle, replacement), count
    return text.replace(needle, replacement, 1), 1


def replace_regex(text: str, pattern_spec: dict[str, Any], replacement: str, replace_all: bool) -> tuple[str, int]:
    pattern = compile_pattern(pattern_spec)
    assert pattern is not None
    count_found = len(list(pattern.finditer(text)))
    if count_found == 0:
        return text, 0
    count = 0 if replace_all else 1
    new_text, changed = pattern.subn(replacement, text, count=count)
    return new_text, changed


def op_find_replace(text: str, operation: dict[str, Any], replace_all: bool) -> tuple[str, dict[str, Any]]:
    find_spec = operation["find"]
    replacement = operation["replace"]
    if find_spec["type"] == "exact":
        matches = find_matches(text, find_spec)
        validate_matches("find", find_spec, matches)
        new_text, changed = replace_exact(text, find_spec["value"], replacement, replace_all)
    else:
        matches = find_matches(text, find_spec)
        validate_matches("find", find_spec, matches)
        new_text, changed = replace_regex(text, find_spec, replacement, replace_all)

    if changed == 0 or new_text == text:
        raise PatchError(f"{operation['op']}: no-op change refused")

    return new_text, {
        "op": operation["op"],
        "matches": len(matches),
        "changed": changed,
    }


def op_insert(text: str, operation: dict[str, Any], after: bool) -> tuple[str, dict[str, Any]]:
    anchor = operation["anchor"]
    matches = find_matches(text, anchor)
    validate_matches("anchor", anchor, matches)
    span = matches[0]
    insert_at = span.end if after else span.start
    content = operation["content"]
    new_text = text[:insert_at] + content + text[insert_at:]
    if new_text == text:
        raise PatchError(f"{operation['op']}: no-op change refused")
    return new_text, {
        "op": operation["op"],
        "matches": len(matches),
        "insert_at": insert_at,
        "bytes_added": len(content),
    }


def op_replace_between(text: str, operation: dict[str, Any]) -> tuple[str, dict[str, Any]]:
    start_anchor = operation["start_anchor"]
    end_anchor = operation["end_anchor"]
    start_matches = find_matches(text, start_anchor)
    end_matches = find_matches(text, end_anchor)
    validate_matches("start_anchor", start_anchor, start_matches)
    validate_matches("end_anchor", end_anchor, end_matches)

    start_span = start_matches[0]
    end_span = None
    for candidate in end_matches:
        if candidate.start >= start_span.end:
            end_span = candidate
            break
    if end_span is None:
        raise PatchError("replace-between: no end anchor found after start anchor")

    include_start = bool(operation.get("include_start", False))
    include_end = bool(operation.get("include_end", False))
    replace_start = start_span.start if include_start else start_span.end
    replace_end = end_span.end if include_end else end_span.start
    if replace_end < replace_start:
        raise PatchError("replace-between: invalid replacement range")

    replacement = operation["replace"]
    new_text = text[:replace_start] + replacement + text[replace_end:]
    if new_text == text:
        raise PatchError("replace-between: no-op change refused")

    return new_text, {
        "op": operation["op"],
        "start_matches": len(start_matches),
        "end_matches": len(end_matches),
        "replace_start": replace_start,
        "replace_end": replace_end,
    }


def apply_operation(text: str, operation: dict[str, Any]) -> tuple[str, dict[str, Any]]:
    op = operation.get("op")
    if op == "replace-first":
        return op_find_replace(text, operation, replace_all=False)
    if op == "replace-all":
        return op_find_replace(text, operation, replace_all=True)
    if op == "insert-before":
        return op_insert(text, operation, after=False)
    if op == "insert-after":
        return op_insert(text, operation, after=True)
    if op == "replace-between":
        return op_replace_between(text, operation)
    raise PatchError(f"unsupported op: {op}")


def unified_diff(path: str, before: str, after: str) -> str:
    before_lines = before.splitlines(keepends=True)
    after_lines = after.splitlines(keepends=True)
    diff = difflib.unified_diff(before_lines, after_lines, fromfile=f"a/{path}", tofile=f"b/{path}")
    return "".join(diff)


def apply_patch(spec: dict[str, Any]) -> tuple[Path, str, PatchResult]:
    target_path = Path(spec["path"])
    if not target_path.exists():
        raise PatchError(f"target file not found: {target_path}")
    if not target_path.is_file():
        raise PatchError(f"target path is not a file: {target_path}")

    original = target_path.read_text(encoding="utf-8")
    sha_before = sha256_text(original)
    expected_sha = spec.get("expected_sha256")
    if expected_sha and expected_sha != sha_before:
        raise PatchError(
            f"expected_sha256 mismatch for {target_path}: expected {expected_sha}, found {sha_before}"
        )

    newline_mode = spec.get("newline", "preserve")
    newline = detect_newline(original) if newline_mode == "preserve" else newline_mode
    if newline not in {"\n", "\r\n", "\r"}:
        raise PatchError(f"unsupported newline mode: {newline_mode}")

    working = original
    summaries: list[dict[str, Any]] = []
    for index, op in enumerate(spec.get("operations", []), start=1):
        normalized_op = copy.deepcopy(op)
        for key in ("content", "replace"):
            if key in normalized_op and isinstance(normalized_op[key], str):
                normalized_op[key] = normalize_newlines(normalized_op[key], newline)
        working, summary = apply_operation(working, normalized_op)
        summary["index"] = index
        summaries.append(summary)

    if working == original:
        raise PatchError(f"patch produced no file change: {target_path}")

    sha_after = sha256_text(working)
    diff = unified_diff(str(target_path), original, working)
    if not diff:
        raise PatchError(f"diff unexpectedly empty after change: {target_path}")

    result = PatchResult(
        path=str(target_path),
        sha256_before=sha_before,
        sha256_after=sha_after,
        changed=True,
        operations=summaries,
        diff=diff,
    )
    return target_path, working, result


def print_result(result: PatchResult) -> None:
    payload = {
        "path": result.path,
        "sha256_before": result.sha256_before,
        "sha256_after": result.sha256_after,
        "changed": result.changed,
        "operations": result.operations,
    }
    print(json.dumps(payload, indent=2))
    print("--- DIFF ---")
    print(result.diff, end="" if result.diff.endswith("\n") else "\n")


def main() -> int:
    args = parse_args()
    spec_path = Path(args.spec)
    try:
        spec = load_json(spec_path)
        target_path, patched, result = apply_patch(spec)
        print_result(result)
        if args.write:
            target_path.write_text(patched, encoding="utf-8")
            print("--- WRITE ---")
            print(f"wrote {target_path}")
        return 0
    except PatchError as exc:
        print(f"PATCH ERROR: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
