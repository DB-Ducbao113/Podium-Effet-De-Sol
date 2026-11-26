# Architecture

This document records the current **Podium — Effet de Sol** workspace boundaries, runtime architecture, and Cloudflare deployment contract (`ADR-0001`, `ADR-0002`).

## Dependency direction

```text
HTTP adapter -> interface -> application -> domain
                         \-> infrastructure

web route -> storm / feature view -> shared UI, store, services, data
web 3D stage -> cached GLB loader -> Worker /models/* allowlist
jobs -> verified upstream source -> web data snapshots (manual CLI only)
```

- `apps/api` domain and application layers do not import React, Vite, or Node-specific APIs (`no_nodejs_compat`). The Worker interface uses standard Web Fetch API `Request` and `Response` objects.
- Non-3D web routes (`Home`, `Season`, `Teams`, `Drivers`, `Entity`, `Engineering Article`, `About`) maintain **0 static Three.js / R3F dependencies**; `vendor-three` loads lazily only on `/showroom` and `/engineering` (or on hover prefetch when network conditions allow).

## Applications

### `apps/web` — React 18 + Vite 6 + Three.js SPA

Organized by canonical feature slice under the **Storm Midnight Liquid Glass** UI (`ADR-0002`):

- `components/storm`: canonical shell (`StormAppShell`), lazy route entries (`routes/*`), Home (`StormOverview`, `LiveF1PulseDock`, `LiveCountdownLeaf`), Championship (`StormViews`), Entity dossiers (`StormEntityDetailPage`), Showroom (`StormShowroomView`, `StormGarageCanvas`), Engineering (`StormEngineeringShow`), About (`StormAboutView`), and network-aware route + GLB prefetcher (`routePrefetch.ts`, `modelPrefetchCache.ts`).
- `components/showroom/fp04rb-garage`: 2-bay 11-team 2026 `FP-04 RB` Pit Garage (`GarageScene`, `GarageLighting`, `GarageCameraController`, `fp04rbLoader`, `pitCrewLoader`, `liveryComposer`, `cockpitEnhancer`). Desktop uses a single calibrated `desktop` LOD shared across both bays with non-blocking pit-crew hydration.
- `components/engineering`: 12-scene 47-part `FP-04 RB` disassembly stage (`EngineeringDisassemblyStage`, `engineeringGlbLoader`, `engineeringMotionDirector`, `engineeringStoryTimeline`, `engineeringAeroStreamlines`, `EngineeringCockpitPanel`, `EngineeringArticlePage`). Uses cached template cloning, unified Three.js `MeshoptDecoder`, `gl.compileAsync`, demand-driven rendering (`frameloop="demand"`), and capped DPR `[1, 1.5]`.
- `components/layout/navigation`: unified `GlobalLiquidNav`, `CompactNavDialog`, and `navRegistry`.
- `components/seo`: bilingual `RouteSeo` metadata, canonical URLs, and structured data.
- `store`, `services`, `data`, `results-engine`: Zustand state (`useChampionshipStore`, `useNavigationStore`, `useTimezoneStore`), Jolpica/OpenF1 same-origin API clients, verified 2024–2026 baselines, and observational verification CLI.

### `apps/api` — Cloudflare Worker Edge API

- `domain`: immutable proxy policies (`JOLPICA_POLICY`, `OPENF1_POLICY`) and fixed upstream origins.
- `application`: bounded cache, single-flight request deduplication (`inflight`), and stale-while-error fallback (`ProxyUseCase`).
- `infrastructure`: bounded in-memory cache (`BoundedCache`), fixed-window per-IP rate limiter (`FixedWindowRateLimiter`), and timeout-aware upstream HTTP fetch (`fetchJson`).
- `interfaces/http`: Web Fetch API handlers for `/api/timezone` (edge IP timezone from `request.cf.timezone` + UTC clock), `/api/jolpica/*`, and `/api/openf1/*`, with strict CORS and query validation.
- `worker.ts`: same-origin API router, security headers (`CSP`, `HSTS`, `X-Frame-Options`, `nosniff`, `Permissions-Policy`), and allowlisted `/models/*.glb` asset gate (same-origin fetch only; blocks cross-site and direct document navigation).

### `apps/jobs` — Manual F1 Data Sync

Independent, manually invoked Node scripts (`update-2026-data.js`, `sync-openf1-sessions.js`) that synchronize verified F1 snapshots into `apps/web/src`. Never scheduled or executed automatically during build or deployment.

## Shared packages

- `@peds/contracts`: runtime-independent Worker/HTTP TypeScript contracts (`WorkerEnvironment`, `ProxyResult`, `TimezoneDetectResponse`).
- `@peds/security`: query-shape allowlists, bounds checks, and strict origin matching (`isOriginAllowed`, `validateQueryShape`).

## Cloudflare deployment architecture

One Cloudflare Worker (`wrangler.jsonc`) serves `/api/*` and allowlisted `/models/*` (`fp04rb-engineering-v1.glb`, `fp04rb-showroom-desktop.glb`, `fp04rb-showroom-mobile.glb`, `fp04rb-pit-crew-v1.glb`), while Cloudflare Static Assets serves the Vite client build from `apps/web/dist/client` with `not_found_handling: "single-page-application"`.

- `apps/web/public/_headers` sets global security headers plus cache lifetimes for `/assets/*` and `/models/*` (`immutable`, 1 year), `/images/*` and `/logo/*` (7 days + `stale-while-revalidate`), and `/manifest.webmanifest` (1 day).
- `env.production` uses `APP_ENV="production"` and `ALLOWED_ORIGINS=""` (strict same-origin API access by default).
- Build-time SEO scripts (`generate-seo-artifacts.mjs`, `prerender-engineering.mjs`) default to `noindex, nofollow` unless `VITE_SITE_URL` and `VITE_ALLOW_INDEXING=true` are explicitly provided on a non-preview production build.
