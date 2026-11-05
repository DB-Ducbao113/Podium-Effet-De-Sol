---
name: peds-quality-gates
description: Enforce the Podium EDS rebuild workflow with baseline Git inspection, regression tests, static checks, security, browser QA, performance evidence, code review and final branch/CI verification on every implementation task.
compatibility: opencode
---

# PEDS quality gates

Always follow repository root `AGENTS.md` and `docs/AI_DEVELOPMENT_WORKFLOW.md`. Use this skill for every code, UI, API, security, debug, dependency, refactor or optimization request.

1. Before editing, verify current branch is exactly `rebuild`, inspect dirty working tree, HEAD and code/test/design boundaries. Stop before writes if branch mismatches.
2. Define verifiable acceptance criteria and risk. Add focused regression tests as appropriate.
3. Implement minimal changes; never suppress failing checks or leak private assets.
4. Self-review changed lines and run the full, relevant gate described in the workflow. Perform actual browser QA for UI and negative security tests for high-risk changes.
5. After the final change, audit local `rebuild`, remote `origin/rebuild`, uncommitted/unpushed changes and the CI of the exact SHA.
6. Produce the `PEDS TASK QUALITY REPORT` with evidence and a truthful final state. An unavailable tool or skipped browser test is `NOT VERIFIED`, not PASS.

Never auto-commit, auto-push, auto-deploy, rebase, reset, stash or run live F1 sync without explicit authorization.
