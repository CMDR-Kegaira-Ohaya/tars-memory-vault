# 12 · FILE_POLICY

## Purpose
Strict file-handling policy for the proposed GPT-side packaging branch.
This file exists to make intake and packaging predictable, safe, and portable.

## Accepted first-wave input types
Text and structured text:
- `.json`
- `.md`
- `.txt`

Archive:
- `.zip`

Assets only:
- `.png`
- `.jpg`
- `.jpeg`
- `.webp`

## Deferred / not-first-wave
Do not treat these as first-wave package inputs without a separate policy update:
- office documents
- executables
- scripts as active code payloads
- nested archives
- audio/video bundles
- arbitrary binary blobs

## Encoding rule
Text files must be UTF-8.
Normalize line endings to LF.
Reject or explicitly flag unknown/broken encodings instead of guessing silently.

## Filename and path policy
- normalize target slugs and generated folder names to lowercase kebab-case when safe
- reject absolute paths
- reject path traversal (`..`)
- reject duplicate normalized paths
- do not preserve hostile or ambiguous path forms from archives

## Zip policy
When a zip archive is used:
- inspect before trusting
- reject nested zip files in v1
- reject path traversal entries
- reject unsupported file types unless the user explicitly chooses a non-packaged raw export path
- unpack into a virtual normalized tree first, not straight into a target tree

## Assets policy
Assets are optional and belong in `assets/`.
Assets are not runtime code.
Do not invent asset references in the manifest unless the asset actually exists.

## Save policy
Save files belong in `saves/` only when the package kind/runtime supports save state.
Do not create save slots automatically unless the target profile and user intent support them.

## Output stability rule
Generated manifests should use stable field order.
Generated folder layout should be canonical and repeatable.
The same valid input should produce the same normalized target tree unless the operator changes the target profile.

## Rejection rule
If an input cannot be handled safely under this policy:
- reject it plainly
- say why
- say what first-wave format to convert it into

Do not fake support.
