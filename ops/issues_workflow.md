# Issues workflow (op-a + op-b)

Labels (recommended)
- op-b-review-needed
- ready-to-apply
- applied

Flow
1) Propose change as an Issue.
2) If op-b is absent, add label op-b-review-needed (pending review); do not apply shared-default changes yet.
3) op-b approves or requests changes in the Issue thread.
4) When both agree, add label ready-to-apply.
5) op-a applies by patch-queue (default). op-b only applies if they want to.
6) After apply, add label applied and close the Issue.

Note (repo hygiene)
- If your repo still has an older label like op-2-review-needed, create/rename to op-b-review-needed and use op-b-review-needed going forward.

---
Issue template (copy/paste)
- Central claim: <what change we want>
- Scope: <personal or shared>
- Acceptance: <how we’ll know it’s right>
- Apply plan: <what files change>
---
