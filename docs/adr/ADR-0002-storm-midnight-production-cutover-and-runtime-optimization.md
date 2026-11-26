# ADR-0002: Storm Midnight Multi-Route Production Cutover, RED-Asset Retirement & Zero-3D-Tax Runtime Architecture

- **Date:** 2026-11-25
- **Status:** Accepted (Owner-approved via Gate 0 `1A, 2A, 3A, 4A, 5A` + runtime optimization directive)
- **Deciders:** Project Owner, Solution Architect (FE + BE)
- **Related:** `ADR-0001` (Automatic IP Timezone & Server UTC Clock Synchronization), `DESIGN.md`, `docs/asset-licenses.md`

## 1. Context
PODIUM — Effet de Sol previously accumulated multiple generations of visual templates (V5–V9 warm-paper/dark hybrids), legacy homepage drift video (`hero-h3-2.mp4`), Showroom tunnel intro videos (`intro-tunnel-*`), and the legacy `Model B` 3D vehicle (`model-b-eds-optimized-v1.glb`), while the unified **Storm Midnight Liquid Glass (`#05080e`)** interface, 2-bay `FP-04 RB` Pit Garage, and 12-scene 47-part `FP-04 RB` Engineering Show lived inside a DEV-only single-route sandbox (`/__design-prototype?tab=...`) backed by `.local-assets/` middlewares.

Promoting `/__design-prototype` as-is would: (1) break images in production builds due to `/__peds-prototype-assets/*`, (2) lose per-route URLs, browser Back/Forward history, and prerendered SEO HTML, (3) ship ~`7.77 MB` of dead legacy media/models, and (4) risk pulling `vendor-three` (`Three.js` + `@react-three/fiber`) or running unthrottled 60fps canvas/layout work on text and table routes.

## 2. Decision
1. **Canonical Multi-Route Storm Shell (`StormAppShell`):** Promote the Storm Midnight Liquid Glass shell and `GlobalLiquidNav` onto React Router's canonical production routes (`/`, `/season/:year`, `/season/:year/race/:round`, `/teams*`, `/drivers*`, `/cars/:carId`, `/engineering*`, `/showroom`, `/about`, `404`), redirecting `/__design-prototype` cleanly to canonical URLs.
2. **Deterministic Public Asset Promotion:** Publish responsive `AVIF`/`WebP` Storm backdrop ladders and `91` seasonal `2024–2025` WebPs into `apps/web/public/images/` via SHA-256 manifest (`docs/asset-manifests/storm-cutover-production.json`), removing DEV-only asset middlewares.
3. **Strict Route-Level 3D Isolation & Single WebGL Context:** Replace the multi-tab `SitePrototypeStage3D` wrapper with route-exclusive lazy 3D stages (`StormGarageCanvas` on `/showroom` and `StormEngineeringShow` on `/engineering`) while `/`, `/season/*`, `/teams*`, `/drivers*`, and `/about` use lightweight 2D/CSS Storm backdrops (`0 B` of `vendor-three` downloaded on non-3D routes; `<= 1` active WebGL context at all times).
4. **Expand → Migrate → Contract Legacy Retirement:** Relocate shared pure graphics telemetry helpers (`adaptiveController`, `frameMetrics`, `graphicsPreference`) into `components/showroom/graphics/`, then retire `model-b-eds-optimized-v1.glb`, `hero-h3-2*`, `f1-hero/*`, `media/showroom/*`, and unreachable legacy UI/DEV-lab directories, updating `worker.ts` (`APPROVED_PUBLIC_MODELS`), `check-public-boundary.mjs`, `verify-cloudflare-build.mjs`, `DESIGN.md`, and `asset-licenses.md` atomically.
5. **Runtime Smoothness Discipline:** Add `saveData`-aware chunk prefetching on `GlobalLiquidNav` hover/focus, isolate 1Hz UTC-synced countdown ticks into leaf components (`LiveCountdownLeaf`), cache target bounds in `useLiquidPointerGlow`, and pause/scale down 2D rain canvases when hidden, coarse-pointer, or reduced-motion.

## 3. Considered Alternatives
- **Alternative A — Keep Single-Route `?tab=` Architecture from `SitePrototypePage`:**
  - *Rejected:* Destroys shareable route URLs (`/showroom`, `/teams/mclaren`, `/engineering/:slug`), breaks static SEO prerendering for Engineering articles, and breaks expected Back/Forward history unless custom history emulation is maintained.
- **Alternative B — Keep Shared Background `LazyStage3D` (`AeroTunnelScene` / `PodiumMonolithsScene`) Mounted Across Editorial/Data Routes:**
  - *Rejected:* Forces visitors opening `/about` or championship tables to download `vendor-three` (~hundreds of KB gzipped) and hold an active WebGL context underneath `backdrop-filter` glass tables, hurting mobile LCP, memory, and battery life.
- **Alternative C — Delete Legacy Files Before Building & Testing Canonical Storm Routes:**
  - *Rejected:* Violates safe migration sequencing and risks breaking shared utility imports (`adaptiveController`, `frameMetrics`) mid-cutover.

## 4. Consequences
- **Positive:** Single cohesive Storm design system across Dev and Production; net `>= 4.0 MB` reduction in `apps/web/public/`; `0 B` Three.js cost on Home, Championship, Directories, and About; preserved SEO prerendering and automatic IP timezone accuracy (`ADR-0001`).
- **Negative / Trade-offs:** Retiring legacy V5–V9 components requires updating or retiring legacy static source-inspection tests (`HomeLandingV3.test.tsx`, `assetLocks.test.ts`, etc.) and replacing them with `stormCutoverBoundary.test.ts` so CI guards test the new Storm invariants rather than retired files.
