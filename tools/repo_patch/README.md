# Safe Repo Patch Utility v1

Purpose: perform anchored text edits with explicit failure on ambiguity, overmatch, or no-op.

## Supported operations

- `replace-first`
- `replace-all`
- `insert-before`
- `insert-after`
- `replace-between`

## Safety model

Each operation can require:

- exact or regex anchors
- expected match count
- `unique_only`
- dry-run diff output
- explicit failure on ambiguity
- explicit failure on no-op
- optional `expected_sha256` precondition for the target file

The utility preserves the file's dominant newline style where practical.

## CLI

```bash
python tools/repo_patch/safe_repo_patch.py --spec patch-spec.json --dry-run
python tools/repo_patch/safe_repo_patch.py --spec patch-spec.json --write
```

Exactly one of `--dry-run` or `--write` is required.

## Spec shape

```json
{
  "path": "terminal/index.html",
  "expected_sha256": null,
  "newline": "preserve",
  "operations": [
    {
      "op": "insert-after",
      "anchor": {
        "type": "exact",
        "value": "<title>TARS Terminal</title>",
        "expected_matches": 1,
        "unique_only": true
      },
      "content": "\n<meta name=\"example\" content=\"1\" />"
    }
  ]
}
```

## Anchor forms

```json
{
  "type": "exact",
  "value": "literal text",
  "expected_matches": 1,
  "unique_only": true
}
```

```json
{
  "type": "regex",
  "value": "pattern",
  "flags": ["MULTILINE"],
  "expected_matches": 1,
  "unique_only": true
}
```

Supported regex flags:

- `IGNORECASE`
- `MULTILINE`
- `DOTALL`

## Operation fields

### `replace-first`

Required:
- `op`
- `find`
- `replace`

### `replace-all`

Required:
- `op`
- `find`
- `replace`

### `insert-before`

Required:
- `op`
- `anchor`
- `content`

### `insert-after`

Required:
- `op`
- `anchor`
- `content`

### `replace-between`

Required:
- `op`
- `start_anchor`
- `end_anchor`
- `replace`

Optional:
- `include_start`
- `include_end`

`replace-between` uses the first valid start/end pairing after anchor validation.

## Guarantees

The utility fails when:

- the file does not exist
- `expected_sha256` does not match
- an anchor match count differs from expectation
- `unique_only=true` and the anchor is not unique
- an operation produces no text change
- `replace-between` cannot find a valid range
- a later sequential operation becomes invalid after an earlier one and can no longer satisfy its anchor constraints

## Current v1 boundary

This v1 applies operations sequentially and relies on per-step anchor validation. It does **not** yet implement a separate preflight overlap-analysis pass across all operations before mutation.

## Output

Dry run prints:

- target path
- sha256 before / after
- unified diff preview
- per-operation summary

Write mode prints the same summary and writes only if all operations succeed.
