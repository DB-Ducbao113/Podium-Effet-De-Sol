---
description: Exercise PEDS routes in a real browser with responsive, accessibility and console QA
---
Target routes/flows: $ARGUMENTS

Read `AGENTS.md` and `docs/AI_DEVELOPMENT_WORKFLOW.md`. Confirm `rebuild` and the actual routes.
Start the app if permitted and a browser is available. Test 360, 390, 768, 1024, 1440 and 1920 widths; the main user flow, keyboard, focus, reduced motion, 3D fallback, loading/error states, console and network, overflow and navigation.
Record actual browser/version, screenshots/evidence under ignored local folders, and results by route/viewport. Do not claim screenshot inspection without inspection or Playwright testing without running it.
When browser unavailable, state BROWSER QA NOT VERIFIED (blocking for UI acceptance). If any code changed, rerun G5 and branch checks. Produce the PEDS report.
## Project map and scope requirements
Read `docs/AI_PROJECT_BLUEPRINT.md`, `docs/AI_FEATURE_FILE_MAP.md`, `docs/AI_EDIT_POLICY.md` and `docs/AI_DESIGN_CONTRACT.md` before editing/reviewing. Trace the exact user-visible route through actual code. Record target DEV/production mode and mobile behavior, change allowlist, cross-cutting dependencies, protected-file decisions and related tests. Never replace the approved design with an unapproved retired roadmap. If files move or routes change, update the project map with the implementation.
