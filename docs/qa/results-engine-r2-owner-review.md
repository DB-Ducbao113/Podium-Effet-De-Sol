# EDS QA RELEASE REPORT — Results Engine R2

Date: 2026-10-26 (Asia/Bangkok)  
Commit SHA: `c7fab22a9b8cbfe92326775d0c568fd8d556bfa6` (working-tree changes are not committed)  
Target branch: `migration/clean-architecture`  
Target environment: Local development / OWNER REVIEW  
Risk level: HIGH

## Change summary

- Results rounds and tabs now derive only from non-empty classifications, not Calendar dates.
- OpenF1 `session_result` is the default source for completed Practice, Qualifying, Sprint Qualifying and Sprint sessions.
- The Owner explicitly authorized API use for this development phase; scheduled automation will be rebuilt later.
- The local snapshot was backfilled through R18 without hardcoding result rows.
- Race, Sprint, Qualifying, Sprint Qualifying and Practice use session-specific columns.
- DNF/DNS/DSQ entries without numeric positions are retained at the end instead of causing the session to be rejected.
- Historical Sprint classifications remain available to Results but are excluded from standings recalculation when already covered by the static baseline.

## Root cause

R18 Race came from the race-results pipeline, while the other tabs depended on a separate session snapshot that stopped at R17. The existing job preferred an inaccessible archive and its Jolpica fallback could not supply Practice or Sprint Qualifying. Therefore R18 had Race but no other tabs.

## Source capability matrix

| Source | Practice | Qualifying | Sprint Qualifying | Sprint | Race |
| --- | ---: | ---: | ---: | ---: | ---: |
| OpenF1 `session_result` | Yes | Yes, Q1/Q2/Q3 arrays | Yes, SQ arrays | Yes | Yes |
| Jolpica Ergast-compatible API | No | Yes | No | Yes | Yes |
| Local snapshot | Captured | Captured | Captured | Captured | Existing race pipeline |

Owner authorization covers this development snapshot. Provider terms for production publication remain a separate release gate.

## API and normalization evidence

- R18 Practice 1/2/3 (`session_key=11389/11390/11391`): 22 rows per session.
- R18 Qualifying (`session_key=11392`): 22 rows with Q1/Q2/Q3 durations and gaps.
- R17 Sprint Qualifying and Sprint: 22 rows each.
- R18 sessions: `fp1`, `fp2`, `fp3`, `qualifying`; Race is supplied by the existing race pipeline.
- R17 sessions: `fp1`, `sprintQualifying`, `sprint`, `qualifying`; Race is supplied by the existing race pipeline.
- Results dropdown ends at R18; R19–R23 are not exposed.

## Static checks

- ESLint: PASS — zero errors and zero warnings.
- TypeScript: PASS.
- Unit/integration: PASS — web 61 files / 338 tests; API 3 files / 16 tests; security 1 file / 2 tests.
- Focused Results/Sprint regression: PASS — 2 files / 27 tests.
- Production build: PASS — Vite SSR/client, SEO artifacts, Engineering prerender, commercial visual isolation and Cloudflare output verification.
- Diff whitespace check: PASS.

## Functional and browser checks

- R18 tabs: PASS — `Race | Qualifying | FP3 | FP2 | FP1`.
- R17 tabs: PASS — `Race | Qualifying | Sprint | Sprint Qualifying | FP1`.
- R18 Qualifying and all R18 Practice sessions: 22 rows.
- R17 Sprint: 22 rows.
- Previous/Next latest-round boundary: PASS.
- Keyboard navigation Race → Qualifying: PASS.
- Responsive QA: PASS at 375×812, 390×844, 768×1024, 1440×900 and 1920×1080.
- Horizontal overflow: none at all five viewports.
- Page exceptions and Results-specific unexpected console errors: none.

Known observations outside this patch: Google Fonts can be denied by the local sandbox, and Navbar emits pre-existing duplicate-key warnings.

Evidence:

- `scratch/results-r2/report.json`
- `scratch/results-r2/mobile-375.png`
- `scratch/results-r2/mobile-375-sprint.png`
- `scratch/results-r2/tablet-768.png`
- `scratch/results-r2/desktop-1440.png`
- `scratch/results-r2/desktop-1440-sprint.png`

## CI/CD and automatic data pipelines

- Required GitHub Actions: NOT RUN for these uncommitted changes.
- Automatic data source 1: NOT CONFIGURED; `sync:2026` is manual.
- Automatic data source 2: NOT CONFIGURED; `sync:sessions` is manual.
- Preview deployment: NOT RUN.
- Production deployment: NOT RUN.
- Production smoke tests: NOT RUN.

Manual refresh until automation is rebuilt:

```powershell
npm.cmd run sync:sessions -- --source openf1
```

## Defects and residual risks

- R2-001 — Release gate / provider terms: API use is Owner-authorized for development; production publication terms remain unverified.
- R2-002 — P2 / freshness: scheduled ingestion is deferred by Owner direction, so refresh remains manual.
- R2-003 — P3 / historical coverage: some older sessions legitimately contain fewer than 22 classified rows because of DNS/DNQ; integrity checks do not invent positions.
- R2-004 — P3 / existing UI console: duplicate Navbar keys remain outside Results scope.

## Final decision

**FINAL DECISION: HOLD**

Reason: local implementation, API ingestion, snapshot write, tests, build and responsive browser QA passed. Release remains on HOLD because changes are uncommitted, CI and automatic pipelines are not configured/run for this revision, provider terms are not dispositioned for production, and Preview/production verification was not authorized.

Next required action: Owner reviews the R18 and R17 screenshots. When authorized later, add scheduled automation with integrity checks, then commit/push on the development branch and repeat CI/Preview validation.
