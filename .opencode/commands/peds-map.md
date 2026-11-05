---
description: Analyze a PEDS request and produce an exact route-to-file edit plan without changing code
---
Request: $ARGUMENTS

Read `AGENTS.md`, `docs/AI_PROJECT_BLUEPRINT.md`, `docs/AI_FEATURE_FILE_MAP.md`, `docs/AI_EDIT_POLICY.md`, `docs/AI_DESIGN_CONTRACT.md` and `docs/AI_DEVELOPMENT_WORKFLOW.md`.
VERIFY current branch is `rebuild` and record HEAD/working tree. This command is READ-ONLY: do not write files, commit, push, change branch, run live sync or deploy.
Inspect the actual request's route and environment (DEV vs production, mobile <=860 vs desktop), locate route entry in App.tsx, trace the owning component/styles, state/services/API/data as needed, and relevant tests/contracts.
Return: (1) acceptance criteria, (2) relevant route/flow and current behavior, (3) exact file allowlist with reasons and GREEN/AMBER/RED classification, (4) read-only dependencies, (5) affected contracts and regression risks, (6) focused tests + full required checks/browser matrix, (7) needed owner approval for any protected changes, (8) current branch verification.
Never guess missing file ownership or infer feature approval from retired legacy design names.

For frontend design/UI/3D work: consult `docs/frontend/README.md` and the matching atomic task ID + acceptance gate. Treat the roadmap as a plan, not owner approval for a full redesign. Maintain exact file allowlist and check the task board only after required verified evidence.
