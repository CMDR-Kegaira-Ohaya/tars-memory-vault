# Issues workflow (OP-1 + OP-2)

Labels (recommended)
- op-2-review-needed
- ready-to-apply
- applied

Flow
1) Propose change as an Issue.
2) If OP-2 is absent, add label op-2-review-needed (pending review); do not apply any hard shared changes.
3) OP-2 approves or requests changes in the Issue thread.
4) When both OPs agree, add label ready-to-apply.
5) OP-1 applies by patch-queue (default). OP-2 only applies if they want to.
6) After apply, add label applied and close the issue.

---
Issue template (copy/paste)
- Central claim: <what change we want>
- Scope: <personal or shared>
- Acceptance: <how we'll know it's right>
- Apply plan: <what files change>
---
