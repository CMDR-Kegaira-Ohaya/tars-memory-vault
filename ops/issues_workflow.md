# Issues workflow (op-a + op-b)

Labels (recommended)
- op-a-review-needed (waiting on op-a)
- op-b-review-needed (waiting on op-b)
- ready-to-apply
- applied

Flow
1) Propose change as an Issue.
2) If one operator is absent, add the review label for the person you are waiting on:
   - op-a-review-needed (waiting on op-a)
   - op-b-review-needed (waiting on op-b)
   Do not apply shared-default changes yet.
3) The reviewer (op-a, or op-b) approves or requests changes in the Issue thread.
4) When both agree, add label ready-to-apply.
5) op-a applies by patch-queue (default). op-b only applies if they want to.
6) After apply, add label applied and close the Issue.

---
Issue template (copy/paste)
- Central claim: <what change we want>
- Scope: <personal or shared>
- Acceptance: <how we’ll know it’s right>
- Apply plan: <what files change>
---
