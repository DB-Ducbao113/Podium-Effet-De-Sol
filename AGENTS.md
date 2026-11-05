# PEDS — Mandatory AI development rules

Scope: all agents editing this repository. Active working branch: `rebuild`.
Read `docs/AI_DEVELOPMENT_WORKFLOW.md` before implementing changes. Read `DESIGN.md`, `docs/architecture.md` and `docs/security.md` whenever your task touches those boundaries.

## Mandatory behavior on EVERY implementation request

1. Identify user acceptance criteria, impacted files, risk and test strategy. For ambiguous implementation details choose the smallest safe change; do not silently invent product requirements.
2. Read the actual code and relevant existing tests. Record the baseline `git status --short`, `git branch --show-current`, `git rev-parse HEAD` and relevant failing tests before editing.
3. Work only on the approved branch `rebuild`. If the current branch is different, STOP BEFORE WRITING and report the mismatch. Do not run destructive Git commands, checkout, reset, rebase, force-push, stash, commit or push without explicit authorization.
4. Make focused, maintainable changes. Add or update regression tests for functional modifications and reproduce bugs before fixing them. Preserve API/security boundaries, 3D fallbacks, asset provenance, product claims and accessibility.
5. After code edits, perform a self-review of `git diff` for correctness, input validation, missing edge cases, dead code, dangerous side effects, unnecessary complexity, secrets and public assets.
6. Run the applicable targeted tests and the complete local quality gate defined in `docs/AI_DEVELOPMENT_WORKFLOW.md`. Do not claim anything passed without running it. If one gate fails: investigate, fix and rerun; do not suppress checks or change assertions merely to obtain green output.
7. For visible UI changes, perform real-browser responsive and interaction QA; for security-sensitive changes, run security checks; for performance changes, measure before/after. If tooling/browser/preview is unavailable, report `NOT VERIFIED`, never `PASS`.
8. Recheck the current `rebuild` branch and changes after the last edit. Distinguish local HEAD, remote `origin/rebuild` and GitHub Actions status. Remote verification requires fetched remote state; a clean working tree does NOT prove a push occurred.
9. End EVERY implementation task with a concise evidence-based completion report using the exact template in `docs/AI_DEVELOPMENT_WORKFLOW.md`. Mark the task `HOLD` if any blocking gate fails or cannot be checked.

## Repo-specific guardrails

- Node.js >=22; npm workspaces: `apps/web` (React/Vite/Three.js), `apps/api` (Cloudflare Worker), `apps/jobs`, `packages/*`.
- Keep upstream APIs behind `/api/jolpica` and `/api/openf1`; no client-controlled upstream origins or new public secrets.
- Never publish `source-assets/` or `.local-assets/`; no deployment or data-sync execution without explicit authorization.
- Honor `DESIGN.md`: canonical original logo; Model B showroom boundary; EDS-G01 retired; cite verifiable results; reduced-motion/keyboard/3D fallback.
- Never run `npm audit fix --force`, rewrite lockfiles indiscriminately, or silently weaken CSP, lint, tests or TypeScript constraints.
- `npm run verify` is NOT the entire gate: it omits coverage, dependency audit and formatting; use the full command matrix from the workflow.
- Use optional OpenCode `/peds-finish` after any task as an explicit audit; these agent rules remain mandatory even without a slash command.
