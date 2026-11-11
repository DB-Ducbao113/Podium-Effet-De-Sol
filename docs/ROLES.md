# PEDS — Agent Roles & Directory Ownership

Use this file to assign specialized AI agents clear module boundaries with minimal merge conflicts and clear test gates. All agents still follow `AGENTS.md`, `DESIGN.md`, and `docs/AI_DEVELOPMENT_WORKFLOW.md`.

## Role ownership matrix

| Agent Role | Primary Scope & Owned Directories | Read-Only Shared Dependencies | Primary Test / Check Gate | Strictly Do Not Edit |
|---|---|---|---|---|
| **Frontend UI & Pages** | `apps/web/src/components/{home,championship,directory,pages,layout,mobile,common,ui,seo}/`, `apps/web/src/styles/`, `apps/web/src/hooks/`, `apps/web/src/i18n/`, `apps/web/src/App.tsx` | `src/store/*`, `src/data/*`, `src/types/*`, `src/utils/seasonalVisuals.ts`, `src/utils/extended2026Visuals.ts` | `npm run typecheck`, `npm run test --workspace=@peds/web`, responsive Playwright QA (`390x844`, `1440x900`) | `apps/api/*`, `public/models/*`, `docs/asset-manifests/*`, CSP headers, locked hero/logo assets |
| **3D / Showroom & Engineering Anatomy** | `apps/web/src/components/showroom/**`, `apps/web/src/components/engineering/**`, `apps/web/src/components/home/world/**`, `apps/web/src/dev/**` (review/reference only) | `public/models/model-b-eds-optimized-v1.glb`, `public/media/showroom/*`, `docs/pipeline/*` | `modelBLoader.test.ts`, `modelBMaterials.test.ts`, `commercialVisualIsolation.test.ts`, `showroomIntroState.test.ts`, `engineeringAnatomyBoundary.test.ts`, WebGL smoke | Modifying immutable GLB/MP4/WebM bytes, reintroducing withdrawn EDS-G01 labels/modules |
| **Backend API & Edge Security** | `apps/api/src/**`, `packages/security/src/**`, `packages/contracts/src/**`, `apps/web/public/_headers`, `wrangler.jsonc` | `apps/web/src/services/{openF1Service,f1DataService}.ts` | `npm run test --workspace=@peds/api`, `npm run test --workspace=@peds/security`, `npm run cloudflare:dry-run`, `npm run security:secrets` | UI components/CSS, loosening CORS/CSP or upstream host allowlist |
| **Data & Results Engine** | `apps/jobs/src/**`, `apps/web/src/data/{championship,cars,drivers,teams,teamSeasons,engineeringArticles}*`, `apps/web/src/services/**`, `apps/web/src/store/**`, `apps/web/src/results-engine/**`, `apps/web/src/utils/{podiumStats,raceSchedule,championshipTimezone,standingsMovement}.*` | `apps/api/src/*`, `apps/web/src/types/*` | `standingsEngine.test.ts`, `podiumStats.test.ts`, `critical-fixes.test.ts`, `results-engine/*.test.ts` | UI layout CSS, Model B / Showroom files, unverified F1 result mutation |
| **Assets & Legal Compliance** | `apps/web/public/images/**`, `apps/web/src/data/visualAssets/*`, `apps/web/src/utils/{venueHeroes,driverCinematic,driverPortraits,f1VisualAssets2026,seasonalVisuals,extended2026Visuals,teamAtmosphere,circuitVisualAssets2026}.*`, `apps/web/src/config/{assetLocks,championshipAssetCompliance,productionAssets,edsG01Withdrawal}.test.ts`, `docs/asset-manifests/**`, `docs/asset-licenses.md` | `apps/web/src/components/directory/*`, `DESIGN.md` | `productionAssets.test.ts`, `championshipAssetCompliance.test.ts`, `assetLocks.test.ts`, `edsG01Withdrawal.test.ts`, `npm run security:assets` | Editing locked RED assets (`public/logo/*`, `public/media/homepage/hero-h3-2.*`, `public/models/model-b-eds-optimized-v1.glb`) or erasing `p4-eds-g01-withdrawn.json` |
| **QA / CI & Build** | `.github/workflows/**`, `tools/ci/**`, `tools/qa/**`, `apps/web/scripts/**`, `apps/web/vite.config.ts`, root `package.json`, `eslint.config.js` | All workspace test/build scripts, `wrangler.jsonc` | Full G5 gate (`lint`, `typecheck`, `test:coverage`, `security:secrets`, `security:assets`, `security:audit`, `build`, `cloudflare:dry-run`) | Shipping unapproved dev-only routes, bypassing CSP/security/asset checks |

## Handoff rules between agents

1. Any UI change touching data shapes or routes must sync through `@peds/contracts` (`packages/contracts`) or `apps/web/src/types/`.
2. Never add new images under `apps/web/public/` without updating `docs/asset-licenses.md`, running `npm run security:assets`, and updating the relevant manifest test.
3. No agent commits, resets, or deploys directly without explicit repository owner authorization.

