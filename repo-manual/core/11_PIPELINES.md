## Pipeline 1 — build
`work/scratch -> work/dev | work/op-a | work/op-b -> work/shared -> repo-manual/* -> logs/decisions/*`

Use this for shaping new repo-side material from rough draft to stable guidance.

## Pipeline 2 — connector
`repo-manual/refs/connector -> repo-manual/core -> repo-manual/troubleshooting`

Keep the raw connector surface in references, point to it from core docs, and record repeated break/fix patterns in troubleshooting.

## Pipeline 3 — workflows
`repo-manual/workflows -> .github/workflows -> repo-manual/troubleshooting`

Document workflow intent first, install executable workflow files second, capture repeated failures third.

## Pipeline 4 — incidents
`incident -> logs/incidents -> repo-manual/troubleshooting -> logs/decisions (only if structure changes)`

Do not turn every incident into a permanent rule.
Only promote repeated or structural lessons.

## Pipeline 5 — GPT-side reference installs
`design intent -> repo-manual/refs/gpt -> hidden GPT-side stack update later`

Use this when a GPT-side module or root-index patch needs a canonical repo-side reference before the hidden stack is changed.
The repo reference is authoritative for draft/install intent, but it is not the live hidden stack by itself.
