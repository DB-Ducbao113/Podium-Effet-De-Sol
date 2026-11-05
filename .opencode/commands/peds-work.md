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
## Project map and scope requirements
Read `docs/AI_PROJECT_BLUEPRINT.md`, `docs/AI_FEATURE_FILE_MAP.md`, `docs/AI_EDIT_POLICY.md` and `docs/AI_DESIGN_CONTRACT.md` before editing/reviewing. Trace the exact user-visible route through actual code. Record target DEV/production mode and mobile behavior, change allowlist, cross-cutting dependencies, protected-file decisions and related tests. Never replace the approved design with an unapproved retired roadmap. If files move or routes change, update the project map with the implementation.

For frontend design/UI/3D work: consult `docs/frontend/README.md` and the matching atomic task ID + acceptance gate. Treat the roadmap as a plan, not owner approval for a full redesign. Maintain exact file allowlist and check the task board only after required verified evidence.
