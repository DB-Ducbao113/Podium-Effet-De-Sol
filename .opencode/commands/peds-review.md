---
description: Review changed PEDS code for defects, regression, security and maintainability
---
Review scope (default uncommitted diff): $ARGUMENTS

Read `AGENTS.md` and `docs/AI_DEVELOPMENT_WORKFLOW.md`. Inspect `git status`, `git diff`, changed modules/tests and current `rebuild`.
This is review-only unless the user explicitly requested fixes. Prioritize real P0/P1/P2 issues; list each with precise file:line, triggering scenario, impact and recommended correction. Then P3 improvements if useful.
Review API contracts, data accuracy, input trust, CSP/CORS, loading/error states, hooks, 3D cleanup, accessibility, test quality and asset provenance. Do not invent findings or claim tests ran unless logs prove it.
Conclude blockers, missing tests and branch/remote status; label any unverified execution as NOT RUN.
