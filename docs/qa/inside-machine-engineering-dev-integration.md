# EDS QA RELEASE REPORT — Inside the Machine Engineering integration

> Historical QA record. The local `scratch/` screenshots and generated reports cited below were permanently deleted with owner approval on 04/11/2026; these references are no longer live evidence paths.

Date: 2026-10-30 (local)  
QA baseline: `d7313f2`  
Upload commit: `926b979` (pushed to `origin/migration/clean-architecture`; model assets excluded)  
Target branch: `migration/clean-architecture`  
Target environment: Normal local DEV review — no environment flag  
Risk level: HIGH — 3D rendering, routing, local asset delivery

## Change summary

Inside the Machine REV4.2 is the default Engineering experience in local DEV. The application now
gates the experience on `import.meta.env.DEV`; `VITE_ITM_I1_LOCAL` is no longer read by the app or
the local asset middleware. The production build keeps the legacy Engineering index because the
constant folds to false and the lazy import is tree-shaken.

Routes: `/engineering` opens the experience (legacy index in production), `/engineering/insights`
keeps the article index, `/engineering/car-anatomy` is unchanged, and `/engineering/:slug` keeps
article deep links. `/engineering/inside-the-machine` still resolves to the same component, so there
is no duplicate implementation. All site entry points target `/engineering`: Navbar desktop/mobile,
homepage Engineering card, homepage hero secondary CTA and footer quick link.

The cinematic layout is preserved. The experience replaces the site Navbar/Footer with a compact
masthead: desktop links Home, Insights, Car Anatomy, Showroom 3D; tablet/mobile uses a Sections
disclosure with a 2×2 link grid; language and Advanced remain. Brand and Home are explicit exits;
Back/Forward and refresh work. Model B geometry, chapters, choreography, wheel-first reassembly and
all REV4.2 behaviour were left intact.

Test-harness note: two QA scripts were hardened after an observed timing flake. The full-traversal
scripts now wait for story progress and scene transforms to stabilise before exact final-state
comparisons; the nav QA waits for the ITM root to unmount before asserting the Showroom canvas. No
assertion was removed or weakened.

## Static checks

| Check | Result | Evidence |
|---|---|---|
| Whole-repo ESLint | PASS | `npx eslint . --quiet`, exit 0. The two previously reported errors in `DocumentIntroController.tsx` (react-refresh) and `tools/build-plan-archives.mjs` (no-empty) were corrected without suppression |
| TypeScript | PASS | `npm run typecheck` (api, web, contracts, security), exit 0 |
| Unit/integration tests | PASS | `npm test`: web 64 files / 357 tests, api 16, security 2; exit 0 |
| Production build | PASS | `npm run build`, exit 0; commercial visual isolation PASS (32 modules, 116 artifacts); Cloudflare output PASS (4 articles) |
| Secret scan | PASS | `npm run security:secrets`, exit 0 |
| Public asset boundary | PASS | `npm run security:assets`, exit 0 |
| Production exclusion | PASS | `dist/client` scan: no `Inside the Machine` label, no `__itm-i2`, no ITM chunk or asset file |
| Staging scope | PASS | Code/docs committed as `926b979` and pushed; `source-assets/` and `.local-assets/` excluded |

## Functional and browser checks

| Check | Result | Evidence |
|---|---|---|
| Default route | PASS | Plain DEV server at `http://127.0.0.1:5178/engineering`; title `Inside the Machine \| Podium EDS`; model visible; one canvas; PERFORMANCE active = locked |
| Entry points | PASS | Navbar, homepage card and footer link verified previously; nav QA re-verified desktop/tablet/mobile entry and exit |
| Compact navigation | PASS | Desktop `#section-nav` visible with 4 links; ≤1023px toggle visible and opens 2×2 grid; no horizontal overflow at 1440/768/375 |
| Deep links and history | PASS | `/engineering/insights` (1 index heading, 3 ITM links), `/engineering/car-anatomy` (hero), article deep links unchanged; brand → `/`; Back/Forward and refresh exercised |
| Six-chapter traversal | PASS | Chapter IDs machine, skin, cooling, heart, precision, one-machine at expected progress; early focus in bounds; seven waves foundation → front-wheels |
| Progressive disassembly and explanation | PASS | 26 distinct wheel positions across 0–100%; 32 sampled explanation frames across the first five chapters; no explanation/wave at final |
| Wheel-first reassembly | PASS | Selected wheel leads at 87.5%, other wheels stage after lead, foundation starts after lead, staged components remain detached, continuity and stability pass |
| 75-transform recovery | PASS | Final transforms and camera exactly equal opening; final progress 1; transform count 75; video captured (`slow-wheel-first-reassembly.webm`, 16,484,960 bytes) |
| Inspector pause/resume | PASS | Paused, isolation active, progress restored to 0.8300049, transforms and camera unchanged after resume |
| Quality Lock | PASS | Requested HIGH remains pending while locked PERFORMANCE is unchanged; reset clears pending |
| Retry and WebGL recovery | PASS | Blocking all ITM GLBs exposes Retry; allowing and clicking recovers the model. Synthetic `webglcontextlost` shows the overlay and `webglcontextrestored` clears it (simulated event, not physical GPU loss) |
| Accessibility | PASS limited | Keyboard focus + Enter on Insights; usable control names; reduced-motion chapter traversal visible with no errors. Full screen-reader audit NOT RUN |
| Showroom | PASS | One canvas; Model B copy and render confirmed by screenshot; no source or behaviour changes |
| Errors | PASS | No uncaught page errors in the final runs; aborted duplicate GLB/Jolpica requests are navigation teardown, not asset failures |

## Asset verification

Source identity is `apps/web/src/dev/insideMachineI1/asset-identity.json`. The serve-only middleware
validates byte length and SHA-256 before responding; production builds never copy the files.

| Asset | Bytes | SHA-256 | HTTP |
|---|---|---|---|
| HIGH Meshopt GLB | 2,764,856 | `2109752C…1353862` | 200 |
| BALANCED Meshopt GLB | 2,536,580 | `75B37467…6F64EE` | 200 |
| PERFORMANCE Meshopt GLB | 2,254,552 | `CB4C864D…92F0BB` | 200 |
| Assembly manifest | 172,404 | `85D8E47C…43F42F0` | 200 |
| Poster WebP | 20,768 | `A184575E…2B3FC1` | 200 |

All three GLBs declare `EXT_meshopt_compression`, `KHR_mesh_quantization` and
`KHR_materials_clearcoat`; each has 85 meshes, 172 nodes and 301 accessors. Rendering in the browser
confirms successful Meshopt decode.

## Evidence

- Integration nav QA and screenshots: `scratch/frontend/itm-integration/` (`nav-qa-final.json`,
  `engineering-final.png`, `showroom-model-b.png`, viewport/menu screenshots)
- Six-chapter regression: `scratch/frontend/itm-integration/full-regression-rerun/REGRESSION_QA.json`
- Wheel-first/reassembly QA: `scratch/frontend/itm-integration/full-qa/ASSEMBLY_ORDER_QA.json` and
  `video/slow-wheel-first-reassembly.webm`
- QA scripts: `apps/web/scripts/itm-story-1-rev4-2-regression.mjs`,
  `apps/web/scripts/itm-story-1-rev4-2-qa.mjs`
- Local URL: `http://127.0.0.1:5178/engineering`

## Defects and residual risks

- No new P0/P1/P2 defect remains open. The observed final-state and Showroom canvas failures were
  test-harness races; both were reproduced, root-caused and corrected with convergence waits while
  keeping exact assertions. Retests PASS.
- P3: production intentionally differs from DEV (legacy Engineering experience) until the release
  gates below are accepted.
- Site Navbar/Footer remain replaced by the compact masthead inside the experience; this is the
  approved cinematic design, with Home/brand exits and website section links.
- Real-device sustained performance, full accessibility audit, physical WebGL context loss, CI,
  preview deployment and production smoke tests remain NOT RUN.

## Specialized checks

- 3D Showroom: PASS (render, one canvas, unchanged subsystem)
- Performance: NOT RUN — the existing performance contract keeps its separate HOLD/NO-GO record; no
  new FPS optimisation cycle was attempted
- Security: PASS for secret and public-boundary scans; no new third-party integration
- Automated data sources: NOT RUN — no push or release
- CI/CD: NOT RUN — no push, merge, PR or deployment

**FINAL DECISION: HOLD** for production release; the local DEV integration is ready for OWNER REVIEW.

**Reason:** Static gates, runtime assets, routing, REV4.2 traversal and browser checks pass. Public
release still requires commercial-rights acceptance, real-device performance qualification and the
normal CI/preview/production gates.  
**Next required action:** Owner completes the local DEV walkthrough. Production remains a separate
decision and must not be inferred from this review.
