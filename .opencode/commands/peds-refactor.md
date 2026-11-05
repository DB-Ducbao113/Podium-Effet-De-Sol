---
description: Refactor PEDS code without changing behavior and verify no regression
---
Refactor scope: $ARGUMENTS

Read `AGENTS.md` and `docs/AI_DEVELOPMENT_WORKFLOW.md`, verify `rebuild` and baseline first.
State the invariant behavior and maintainability problem. Run existing focused tests BEFORE editing, add characterization tests for behavior with weak coverage.
Refactor in small isolated steps, no unrelated redesign or API contract changes. Check imports, TypeScript, state timing, event cleanup, 3D memory lifecycle and bundle implications.
Rerun focused tests, G5 and any affected browser QA; compare behavior and performance when relevant. Review diff and verify `rebuild` local/remote state. Output the PEDS report.
## Project map and scope requirements
Read `docs/AI_PROJECT_BLUEPRINT.md`, `docs/AI_FEATURE_FILE_MAP.md`, `docs/AI_EDIT_POLICY.md` and `docs/AI_DESIGN_CONTRACT.md` before editing/reviewing. Trace the exact user-visible route through actual code. Record target DEV/production mode and mobile behavior, change allowlist, cross-cutting dependencies, protected-file decisions and related tests. Never replace the approved design with an unapproved retired roadmap. If files move or routes change, update the project map with the implementation.
