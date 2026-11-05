---
description: Refactor PEDS code without changing behavior and verify no regression
---
Refactor scope: $ARGUMENTS

Read `AGENTS.md` and `docs/AI_DEVELOPMENT_WORKFLOW.md`, verify `rebuild` and baseline first.
State the invariant behavior and maintainability problem. Run existing focused tests BEFORE editing, add characterization tests for behavior with weak coverage.
Refactor in small isolated steps, no unrelated redesign or API contract changes. Check imports, TypeScript, state timing, event cleanup, 3D memory lifecycle and bundle implications.
Rerun focused tests, G5 and any affected browser QA; compare behavior and performance when relevant. Review diff and verify `rebuild` local/remote state. Output the PEDS report.
