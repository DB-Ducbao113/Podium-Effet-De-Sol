# PODIUM — EFFET DE SOL | AI PROJECT BLUEPRINT

**Status:** current-code inventory and development governance, **not** an approved new creative redesign.
**Read first:** root `AGENTS.md` → this file → `docs/AI_FEATURE_FILE_MAP.md` → `docs/AI_EDIT_POLICY.md` → `docs/AI_DESIGN_CONTRACT.md` → `docs/AI_DEVELOPMENT_WORKFLOW.md`.
**Source baseline inspected:** `rebuild` at `4828c4c5c6a453c4ecf35d250d39415b6e37b307` (2026-11-05). File paths and behavior must be checked again before each edit; this inventory does not replace source inspection.

## 1. Website là sản phẩm gì?

**PODIUM — Effet de Sol** is an **independent, unofficial Formula 1 editorial / engineering / results web experience**, focused on the ground-effect era, racing data, car engineering stories and an interactive 3D technical showroom. Not an official FIA/F1/team service; no assumption that editorial/illustrative images are official photos or measurements.

**Current pages and user flows (based on source):**

1. **Home (/):** branded cinematic/editorial hero, race control/next-race context, current season overview, navigation to results/showroom/engineering; reduced-motion behavior and optional local previews.
2. **Championship (/season/2024|2025|2026):** Standings (driver and constructor), Calendar, Results, season switcher, sessions/classifications, race details, team/driver contextual access. Deep links use query `tab=standings|calendar|results|teams|drivers` and `category=drivers|constructors`.
3. **Results detail (/season/:year/race/:round):** classification modal over Championship. Only valid years/rounds and known results; invalid cases show 404.
4. **Showroom (/showroom):** production Model B 3D inspection, camera presets, paint/livery choices, technical hotspots and adaptive graphics. Development may open `ShowroomReview` (`src/dev/showroom-review`) via explicit `?review=p6` / `?author=1` flags (details below).
5. **Teams and Drivers (/teams, /drivers):** directories with season-aware data and visual cards; team/driver detail pages use slugs/IDs.
6. **Car detail (/cars/:carId):** specifications/editorial data from car catalog and team/season profiles.
7. **Engineering (/engineering, /engineering/car-anatomy, /engineering/:slug):** engineering editorial index, interactive anatomy and articles (unified across DEV and production).
8. **About (/about):** independent project/editorial scope, credits and attribution.

**Current implementation must not be confused with product approval:** `DESIGN.md` says prior IGNITION/V7/V8/V8.2/V9 creative roadmaps were retired and no replacement design direction is approved. Existing components/tokens are current implementation, not a permanent brief.

## 2. Actual stack — DO NOT invent technologies

| Layer                   | Actual code/tooling                                                            | Role                                                    | Location                                                                            |
| ----------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Runtime/package manager | Node >=22, npm workspaces, npm lockfile                                        | install/build/scripts                                   | `package.json`, `package-lock.json`                                                 |
| Client                  | React 18 + TypeScript + Vite 6                                                 | SPA and code-split routes                               | `apps/web/src/main.tsx`, `App.tsx`, `apps/web/vite.config.ts`                       |
| Routing                 | react-router-dom 7                                                             | routes, query parameters, navigation                    | `App.tsx`, `components/layout/navItems.ts`                                          |
| State                   | Zustand 4, localStorage                                                        | selected season, results, navigation language, timezone | `store/*`, `services/f1DataService.ts`                                              |
| Styling                 | Tailwind CSS 4 + PostCSS, CSS variables, scoped legacy styles                  | current UI/design implementation                        | `index.css`, `tailwind.config.js`, `components/**.css`                              |
| Motion/icons            | animejs 4, lucide-react                                                        | UI animation and icons                                  | Home/other components                                                               |
| 3D                      | Three.js, @react-three/fiber, @react-three/drei, meshoptimizer                 | Model B, 3D and visual scenes                           | `components/showroom/*`, `components/showroom/model-b/*`, `components/home/world/*` |
| Fonts                   | self-hosted Fontsource Manrope, Space Grotesk, Barlow Condensed, IBM Plex Mono | typography and CSP-compatible loading                   | `main.tsx`, `index.css`                                                             |
| API                     | Cloudflare Workers Fetch API, @cloudflare/vite-plugin, Wrangler 4              | same-origin proxy, headers, asset routing               | `apps/api/src/*`, `wrangler.jsonc`                                                  |
| Upstreams               | Jolpica + OpenF1                                                               | classification/schedule/telemetry reads                 | `apps/api/src/domain/proxyPolicy.ts` and HTTP adapters                              |
| Shared code             | @peds/contracts, @peds/security                                                | Worker types, input allowlist/bounds                    | `packages/*`                                                                        |
| Data tooling            | Node jobs, results-engine, JSON/TS snapshots                                   | manual F1 data refresh, validation                      | `apps/jobs/*`, `apps/web/src/results-engine/*`, `apps/web/src/data/*`               |
| Quality                 | ESLint, Prettier, TypeScript, Vitest 5, v8 coverage, Playwright-core scripts   | static/test/manual browser smoke                        | root scripts, `tools/*`, `.github/workflows/ci.yml`                                 |
| Images/build            | sharp, AVIF/WebP, SEO/prerender and asset guards                               | optimized media and client build                        | `apps/web/scripts/*`                                                                |

**Not in current architecture:** no evidence of a project application database (Postgres/MongoDB/etc.), user login/auth system, admin dashboard, CMS, Next.js server-side rendering app, or automatically scheduled F1 ingestion. Do not add these as assumptions.

## 3. Repo directory map

```text
/
├── AGENTS.md                       # agent entrypoint
├── DESIGN.md                       # durable approved design/asset boundaries
├── docs/
│   ├── AI_PROJECT_BLUEPRINT.md     # this overview
│   ├── AI_FEATURE_FILE_MAP.md      # route -> files -> related tests
│   ├── AI_EDIT_POLICY.md           # editing permissions and prohibited changes
│   ├── AI_DESIGN_CONTRACT.md       # site/UX/design truth + pending decisions
│   ├── AI_DELIVERY_PLAN.md         # phases and exit criteria
│   ├── AI_DEVELOPMENT_WORKFLOW.md  # after-task testing/QA/branch verification
│   ├── architecture.md             # verified existing architecture
│   ├── security.md                 # security assumptions/limits
│   ├── asset-licenses.md           # licenses, provenance, withdrawn assets
│   └── qa/                         # historical evidence, NOT current test status
├── apps/
│   ├── web/
│   │   ├── public/                 # shipped logo/images/models/media/_headers
│   │   ├── src/
│   │   │   ├── App.tsx, main.tsx, index.css
│   │   │   ├── components/         # home/championship/showroom/pages/engineering/
│   │   │   │                       # layout/mobile/common/ui/directory/seo
│   │   │   ├── data/               # race, driver, team, car and content snapshots
│   │   │   ├── services/           # upstream browser clients, reconcile & standings
│   │   │   ├── results-engine/     # observed/source-verified results machinery
│   │   │   ├── store/              # Zustand state
│   │   │   ├── dev/                # DEV-only ShowroomReview / visual labs & references
│   │   │   ├── hooks/, utils/, types/, i18n/, config/, styles/
│   │   ├── scripts/                # SEO/prerender/guard/build tools
│   │   └── vite.config.ts
│   ├── api/src/{domain,application,infrastructure,interfaces,http}/
│   └── jobs/src/
├── packages/{contracts,security}/
├── tools/
│   ├── ci/                         # scan-secrets & public asset boundary CI checks
│   ├── qa/                         # Playwright browser smoke & visual QA runners
│   └── cad/                        # Blender CAD / geometry authoring utilities
├── .opencode/{skills,commands}/
├── .github/workflows/ci.yml
├── wrangler.jsonc
├── package.json, package-lock.json
└── .env.example
```

## 4. Request and data flow

**Web/route:** browser → `main.tsx` (React StrictMode + ErrorBoundary + BrowserRouter) → `App.tsx` (lazy route + responsive mobile hub + SEO + layout) → feature view/components.

**Championship/data:** `data/championship/*` baseline + `f1DataService.ts` persisted snapshot / validation / reconcile → `useChampionshipStore.ts` → `ChampionshipView` / `RaceResults` / `ChampionshipStandings` / `RaceCalendar`. Browser read refresh runs on eligible routes/visibility with a 15-minute throttle in `App.tsx`; it is **not** a backend cron.

**API:** browser uses `/api/jolpica/*` or `/api/openf1/*` → Cloudflare `apps/api/src/worker.ts` → `interfaces/http/{jolpica,openf1}.ts` (request validation/CORS) → `application/proxyUseCase.ts` (cache/single-flight/stale) → `infrastructure/fetchJson.ts` → fixed external origins in `domain/proxyPolicy.ts`. Shared validation in `packages/security`. Do not bypass with direct browser API calls.

**F1 batch jobs:** `apps/jobs/src/update-2026-data.js` and `sync-openf1-sessions.js` are explicitly manual write-capable tools. The `apps/web/src/results-engine` subsystem contains verification/observational machinery and CLI: no silent production publishing.

**Production:** Vite client in `apps/web/dist/client` + Cloudflare Worker API. `wrangler.jsonc` serves static assets, routes `/api/*` and allowlisted `/models/*` through Worker; SPA fallback for frontend paths. No automatic deploy in current GitHub workflow.

## 5. Development ≠ production (CRITICAL)

| Area                              | DEV behavior                                                                                                             | Production behavior                               |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| `/engineering`                    | `EngineeringIndexPage` (same as prod; links to R5 preview in DEV)                                                        | `EngineeringIndexPage`                            |
| `/engineering/inside-the-machine` | `InsideMachineTrialPage` (`dev/insideMachineI1` Model B R5 CAD/Blender + Anime.js v4, launched via `npm run preview:r5`) | `NotFound` (`404`; withheld in prod)              |
| `/engineering/car-anatomy`        | `EngineeringAnatomyPage` with interactive DEV 3D scene                                                                   | `EngineeringAnatomyPage` static/overview boundary |
| `/showroom`                       | `ModelBShowroom` (`?review=p6` / `?author=1` opens `ShowroomReview`)                                                     | `ModelBShowroom`                                  |
| `/` with `?v9=1`                  | optional HomeWorldHost preview                                                                                           | preview disabled                                  |
| `/__home-v9-lab`                  | local visual lab route                                                                                                   | absent                                            |
| Public assets                     | Served identically from `apps/web/public/` (all `.local-assets` middlewares removed)                                     | Served from `dist/client/`                        |

**For a feature to be verified, test both its correct DEV mode and its actual production build/preview.** `npm run dev` alone does not prove shipped behavior. Never promote review-only assets/routing accidentally.

## 6. Protected business invariants

- Season years are supported only as defined by `src/types`, currently 2024–2026. Unknown years/IDs return fallback/not-found, not synthetic official data.
- Race classification and standings accuracy matter more than cosmetic ranking; respect `baselineCutoff.ts` and verification rules; don't recredit sprint points or silently fabricate results.
- Source trust, contributor attribution, legal provenance, discarded EDS-G01 imagery and original brand identity governed by `DESIGN.md` and `docs/asset-licenses.md`.
- Model B binary, original production homepage film/poster and source asset identities have documented immutability / hash constraints. No rewrite, optimization or replacement as a side effect of UI changes.
- Contract boundary: same-origin API only, fixed upstream origins, query-shape bounds, headers/CSP; `/models/model-b-eds-optimized-v1.glb` is the allowlisted asset.
- Current architecture favors data-driven content, graceful errors, keyboard access, reduced motion and 3D fallback.

## 7. Source-of-truth precedence and disagreements

1. **User's explicit current task** and owner-approved design/asset decisions.
2. **Security, licensing, immutable asset and factual accuracy constraints** in `DESIGN.md`, `docs/security.md` and `docs/asset-licenses.md`; do not override implicitly.
3. **Actual `rebuild` source, tests and build config** for current behavior.
4. This AI blueprint and file map (may become stale; update on structural changes).
5. Historical QA notes, discontinued roadmap names and archived review copies (informational only).

If docs conflict with code: document the discrepancy; do not silently rewrite either, and do not treat a historical plan as active approval.
