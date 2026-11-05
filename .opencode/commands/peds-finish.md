---
description: Run final PEDS quality gate and verify changed work against the rebuild branch
---
Read `AGENTS.md` and `docs/AI_DEVELOPMENT_WORKFLOW.md`. Audit the current changes without assuming earlier agents' success claims.
Check actual branch=`rebuild`, baseline and final HEAD, working tree/diff, acceptance criteria, code review, tests and any browser/security/performance evidence.
Run G5 commands: lint, typecheck, test:coverage, security:secrets, security:assets, security:audit, build, cloudflare:dry-run and git diff --check. Run format:check and distinguish pre-existing formatting failures from new ones.
For UI work ensure real-browser QA evidence; if not available, clearly HOLD. Fetch origin/rebuild only if network allowed; distinguish local uncommitted work, unpushed commits and exact remote SHA. Check CI for exact SHA when remote has new commit.
Never auto-commit/push/reset/deploy. Return the complete PEDS TASK QUALITY REPORT with PASS/FAIL/NOT RUN per gate and honest final state.
## Project map and scope requirements
Read `docs/AI_PROJECT_BLUEPRINT.md`, `docs/AI_FEATURE_FILE_MAP.md`, `docs/AI_EDIT_POLICY.md` and `docs/AI_DESIGN_CONTRACT.md` before editing/reviewing. Trace the exact user-visible route through actual code. Record target DEV/production mode and mobile behavior, change allowlist, cross-cutting dependencies, protected-file decisions and related tests. Never replace the approved design with an unapproved retired roadmap. If files move or routes change, update the project map with the implementation.
