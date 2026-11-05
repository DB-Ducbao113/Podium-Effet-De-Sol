# PEDS | TECHNICAL GOVERNANCE AND IMPLEMENTATION PLAN

**Type:** operational plan for sustainable website changes. **Not a new art-direction roadmap.**
**Goal:** when a user gives a feature/change request, an AI agent can identify the correct route and file ownership, implement a minimal patch, verify it, and demonstrate exactly what changed on `rebuild`.

## Plan baseline and known limits

- Source baseline inventory: `rebuild` HEAD `4828c4c5c6a453c4ecf35d250d39415b6e37b307`, inspected 2026-11-05.
- Existing quality infrastructure: ESLint, TS, Vitest, v8 coverage for `src/utils/**` + `src/services/**`, two security scripts, npm audit, Vite/Cloudflare build/dry-run, GitHub CI, optional Playwright-core smoke.
- Known limitations: no universal cross-platform browser E2E suite wired into CI; DEV routes differ from production; content/data provenance takes manual review; current `DESIGN.md` has no approved successor aesthetic. Do not claim test thresholds or Cloudflare production smoke passed automatically.

## Phase 0 — Architecture and change-scope contract (this deliverable)

**Outputs**
- `AGENTS.md` → entrypoint + mandatory reading order.
- `docs/AI_PROJECT_BLUEPRINT.md` → site/product, stack, route topology, data and deploy flows.
- `docs/AI_FEATURE_FILE_MAP.md` → feature owner and exact route/component/style/test chains.
- `docs/AI_EDIT_POLICY.md` → GREEN/AMBER/RED and approved-scope template.
- `docs/AI_DESIGN_CONTRACT.md` → current visual style vs approved invariants vs pending design.
- `docs/AI_DELIVERY_PLAN.md` → phases, responsibilities and exit criteria.
- `docs/AI_DEVELOPMENT_WORKFLOW.md` → existing implementation/testing/QA/rebuild gate.

**Exit:** links exist in repo; routes/path examples match real code; no app behavior changed by docs alone.

## Phase 1 — Per-task workflow and traceable change map

- Every implementation request produces a plan: route + user flow → component owner → data/service dependency → tests → precise patch allowlist.
- Agent reads enough source to verify assumptions, classifies risk and does not silently edit AMBER/RED.
- Required tests and self-review after final modification; report actual local vs remote status.
- Entry commands: `/peds-map <request>` (read-only scoping), `/peds-work <request>` (implementation), `/peds-finish` (final verification).

**Exit:** change report includes modified-file rationale and evidence for each acceptance criterion; no unrelated source/asset/lockfile diff.

## Phase 2 — Broader automated verification (future implementation, NOT done now)

- Add cross-platform, repeatable Playwright browser tests and a browser installation/runner strategy; current `tools/browser-smoke.mjs` hard-codes a Windows Edge path and is not a full CI E2E suite.
- Separate **development preview** tests from **production build** tests (Showroom and Engineering differ materially).
- Route smoke coverage: Home, Championship/Results/Calendar/Standings, Teams, Drivers, Showroom, Engineering, About, error/404 and query/deep-link flows.
- Edge QA: mobile hub breakpoint 860/861, keyboard/reduced motion, failed network, stale source, no WebGL and media fallback.
- Set measurable code coverage/quality thresholds only after recording baseline; do not invent an arbitrary 90% guarantee.
- Add build artifact and bundle-budget reporting, dependency hygiene and smoke CI when appropriate.

**Exit:** reproducible command and CI artifacts; representative routes pass in test and real browser across supported environments.

## Phase 3 — Data and security contract hardening (future)

- Document source-of-truth for F1 results, calendar, standings and provenance per year; protect immutable baseline cutoff and ID normalization.
- Separate read-time sync from manual write-capable jobs. Add replay/regression fixtures for missing session, rate limit, unavailable source, stale cache and sprint double-counting.
- Test Worker headers/CORS/CSP/allowlist, response error privacy, model asset route and rate limiting (isolate-local limitations remain documented).
- Review dependency security, Source Asset → production promotion rules and licenses.
- Ensure no automatically scheduled sync/push/deploy is introduced without explicit owner authorization.

**Exit:** negative tests and provenance evidence guard high-risk data/API changes; security deviations are visible and owned.

## Phase 4 — Approved design-system modernization (blocked on creative approval)

- First obtain an explicit design brief from the owner (new style, reference, route priorities, assets and motion).
- Establish approved tokens/component variants and wire them through current Tailwind/CSS without blind global replacement.
- Convert one representative page; check EN/VI, responsive, accessibility and visual QA; only then scale to other routes.
- Keep original logo, protected media/model identity and source rights intact unless independently authorized.

**Exit:** `DESIGN.md` states the new approved direction; screenshots/acceptance criteria and visual tests justify each migration. **Not started** simply because this plan exists.

## Phase 5 — Performance and release rigor (future)

- Establish baseline per route/device: Web Vitals (LCP/INP/CLS), bundle size, network, CPU/memory, WebGL frame time/FPS/draw calls as appropriate.
- Profile slow or resource-intensive pages first; optimize with proof, preserve visual behavior and fallback.
- Add documented non-production Cloudflare preview release gate, exact SHA trace and smoke test only with owner approval.
- No production deployment is triggered by writing this plan.

**Exit:** measurable before/after changes, no regressions and explicit release approval with exact commit SHA.

## Definition of Done for every implementation task

1. Relevant route/ownership identified using `AI_FEATURE_FILE_MAP.md`, checked against current code.
2. Allowed patch paths selected via `AI_EDIT_POLICY.md`; protected changes approved explicitly.
3. User acceptance criteria demonstrated, with tests/screenshots where applicable.
4. Full applicable quality gate from `AI_DEVELOPMENT_WORKFLOW.md` executed, failures reported.
5. Branch `rebuild` checked **after last edit**; local working-tree vs remote commit/CI distinguished.
6. No assertion of production launch, preview or design approval that did not happen.

## Updating documentation when architecture changes

**Routes changed:** update blueprint + feature map + SEO/navigation/test map.  
**New dependency or workspace:** update stack table + architecture + build/CI.  
**Data path/storage/sync changed:** update pipeline diagram + sensitive ownership + data QA.  
**Approved design changed:** update `DESIGN.md` first + this contract + page tests.  
**New asset/provenance:** update licenses/manifests and security/asset checks.
