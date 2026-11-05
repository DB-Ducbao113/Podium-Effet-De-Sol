---
description: Implement a PEDS task and run all required quality and rebuild checks
---
Task: $ARGUMENTS

Read `AGENTS.md` and `docs/AI_DEVELOPMENT_WORKFLOW.md`; load skill `peds-quality-gates` if available.
Before writing, confirm branch `rebuild`, document baseline HEAD/dirty tree, identify acceptance criteria, risk and tests.
Implement the smallest safe solution. Add tests for behavior changes, reproduce bugs when possible and keep product/security/asset boundaries.
Review the diff, run relevant targeted tests, all required G5 gates, browser QA for UI and security/performance measurements when applicable. Fix and rerun failures without weakening checks.
Finally verify the current local branch, changes, unpushed commits, origin/rebuild when reachable and GitHub CI on the exact remote SHA if applicable. Do not push/commit/deploy without authorization.
Return the required PEDS TASK QUALITY REPORT, not an unsupported “done”.
