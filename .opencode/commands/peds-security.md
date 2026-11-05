---
description: Threat-model and inspect PEDS code, dependencies, secrets and public asset boundaries
---
Security scope: $ARGUMENTS

Read `AGENTS.md`, `docs/security.md` and `docs/AI_DEVELOPMENT_WORKFLOW.md`. Verify `rebuild` before edits.
Inventory entry points, trust boundaries, sensitive data and credible abuse cases. Inspect SSRF, XSS, CORS, CSP, input schema, request limits, rate limit, error exposure, caching, dependencies, asset provenance and Worker behavior; consider CSRF if adding writes/auth.
Run `npm run security:secrets`, `npm run security:assets` and `npm run security:audit`, plus existing API/security tests and focused negative tests where possible.
Do not expose real secrets in output or run destructive auto-fix. Findings must have severity P0–P3, file:line, practical exploit condition and remediation. If code changes, run full G5 and affected QA, then verify branch/remote and report. HIGH/CRITICAL blockers mean HOLD.
