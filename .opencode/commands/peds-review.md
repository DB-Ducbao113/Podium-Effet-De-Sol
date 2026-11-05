---
description: Review changed PEDS code for defects, regression, security and maintainability
---
Review scope (default uncommitted diff): $ARGUMENTS

Read `AGENTS.md` and `docs/AI_DEVELOPMENT_WORKFLOW.md`. Inspect `git status`, `git diff`, changed modules/tests and current `rebuild`.
This is review-only unless the user explicitly requested fixes. Prioritize real P0/P1/P2 issues; list each with precise file:line, triggering scenario, impact and recommended correction. Then P3 improvements if useful.
Review API contracts, data accuracy, input trust, CSP/CORS, loading/error states, hooks, 3D cleanup, accessibility, test quality and asset provenance. Do not invent findings or claim tests ran unless logs prove it.
Conclude blockers, missing tests and branch/remote status; label any unverified execution as NOT RUN.
## Project map and scope requirements
Read `docs/AI_PROJECT_BLUEPRINT.md`, `docs/AI_FEATURE_FILE_MAP.md`, `docs/AI_EDIT_POLICY.md` and `docs/AI_DESIGN_CONTRACT.md` before editing/reviewing. Trace the exact user-visible route through actual code. Record target DEV/production mode and mobile behavior, change allowlist, cross-cutting dependencies, protected-file decisions and related tests. Never replace the approved design with an unapproved retired roadmap. If files move or routes change, update the project map with the implementation.
