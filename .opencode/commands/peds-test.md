---
description: Add meaningful regression tests and run PEDS unit/integration coverage checks
---
Test target: $ARGUMENTS

Read `AGENTS.md` and `docs/AI_DEVELOPMENT_WORKFLOW.md`. Confirm current branch `rebuild` before writing tests.
Inspect actual behavior, existing tests and risk. Include happy path, edge cases, invalid input, error paths and regression. Do not mock the subject under test so heavily that the test becomes meaningless.
Run focused tests, `npm run test:coverage`, `npm run typecheck` and `npm run lint`. State the real coverage scope (web measured; API/security tested under current root script). Do not claim thresholds not configured.
If changes were made, complete G5/G6/G8 as applicable and return the PEDS report with test counts, failed gates and branch verification.
