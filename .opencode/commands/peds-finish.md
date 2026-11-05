---
description: Run final PEDS quality gate and verify changed work against the rebuild branch
---
Read `AGENTS.md` and `docs/AI_DEVELOPMENT_WORKFLOW.md`. Audit the current changes without assuming earlier agents' success claims.
Check actual branch=`rebuild`, baseline and final HEAD, working tree/diff, acceptance criteria, code review, tests and any browser/security/performance evidence.
Run G5 commands: lint, typecheck, test:coverage, security:secrets, security:assets, security:audit, build, cloudflare:dry-run and git diff --check. Run format:check and distinguish pre-existing formatting failures from new ones.
For UI work ensure real-browser QA evidence; if not available, clearly HOLD. Fetch origin/rebuild only if network allowed; distinguish local uncommitted work, unpushed commits and exact remote SHA. Check CI for exact SHA when remote has new commit.
Never auto-commit/push/reset/deploy. Return the complete PEDS TASK QUALITY REPORT with PASS/FAIL/NOT RUN per gate and honest final state.
