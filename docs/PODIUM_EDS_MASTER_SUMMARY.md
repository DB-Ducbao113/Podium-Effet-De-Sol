# Podium EDS — Master Summary

Last updated: 2026-10-30  
Branch: `migration/clean-architecture`  
QA baseline: `d7313f2`  
Integration upload: `926b979`, pushed to `origin/migration/clean-architecture` (public repository). Model/source assets were intentionally excluded.

## Current integration: Inside the Machine as Engineering

Inside the Machine REV4.2 is now the default Engineering experience in normal local DEV. The
previous `VITE_ITM_I1_LOCAL=1` requirement has been removed from the application and from the
local asset server. Production builds still exclude the experience and its assets.

| Route | Behaviour |
|---|---|
| `/engineering` | Inside the Machine REV4.2 in DEV; legacy Engineering index in production |
| `/engineering/inside-the-machine` | Direct deep link to the same component (no duplicate implementation) |
| `/engineering/insights` | Engineering article index |
| `/engineering/car-anatomy` | Existing interactive anatomy |
| `/engineering/:slug` | Engineering article deep links |

Entry points: site Navbar (desktop dropdown and mobile menu), homepage Engineering card, homepage
hero secondary CTA, and footer quick link all target `/engineering`.

### Experience navigation

The 3D experience keeps its cinematic full-screen layout and supplies a compact masthead instead of
the site Navbar/Footer:

- Desktop: brand (Home), Home, Insights, Car Anatomy, Showroom 3D, language, Advanced.
- Tablet/mobile (≤1023px): Sections disclosure with a 2×2 link grid, language, Advanced.
- Exit: brand or Home; browser Back/Forward and direct refresh work.

### Preserved REV4.2 content

Model B geometry, six chapters, 10 assemblies / 65 components / 75 transforms, native scroll-scrubbed
disassembly, offstage choreography, focus explanations, wheel-first reassembly in seven waves,
opening/final parity, Quality Lock, Retry, WebGL recovery, VI/EN localisation and Inspector
pause/resume were not rebuilt or re-authored.

## Local DEV review

```bash
npm run dev --workspace=@peds/web -- --host 127.0.0.1 --port 5178
```

Open `http://127.0.0.1:5178/engineering`. No environment flag is needed.

## Verification recorded on 2026-10-30

| Gate | Result |
|---|---|
| Whole-repo ESLint (`npx eslint . --quiet`) | PASS, exit 0 — the two previously reported errors were corrected safely |
| TypeScript (`npm run typecheck`) | PASS, exit 0 (api, web, contracts, security) |
| Tests (`npm test`) | PASS — web 64 files / 357 tests, api 16, security 2; exit 0 |
| Production build (`npm run build`) | PASS, exit 0; commercial visual isolation PASS; Cloudflare output PASS |
| Secret scan / public asset boundary | PASS / PASS |
| Production exclusion | PASS — `dist/client` contains no ITM chunk, label, namespace or asset |
| Runtime assets | PASS — 3 Meshopt GLBs (2,254,552 / 2,536,580 / 2,764,856 bytes), manifest 172,404 bytes, poster 20,768 bytes; SHA-256 matches `asset-identity.json`; HTTP 200; `EXT_meshopt_compression` present; model renders |
| Six-chapter traversal | PASS — all six chapter IDs in order, early focus bounds, seven reassembly waves, stops, reverse, Inspector, mobile |
| Wheel-first reassembly | PASS — selected-wheel lead, staged wheels, foundation after lead, continuity, stability, video captured |
| 75-transform recovery | PASS — final transforms and camera exactly equal opening; no explanation text or wave marker at final |
| Navigation and accessibility | PASS — desktop/tablet/mobile, keyboard Insights link, reduced motion, focus visibility, no overflow, no uncaught errors |
| Retry and context recovery | PASS — real GLB failure shows Retry and recovers; simulated `webglcontextlost` overlay shown and cleared on restore |
| Showroom | PASS — Model B renders with one canvas; Showroom source and behaviour unchanged |

Full details and evidence locations: `docs/qa/inside-machine-engineering-dev-integration.md`.

## Production status

Production remains on the legacy Engineering experience. Inside the Machine is not published, and
its assets stay in ignored local storage. Remaining production blockers:

- Commercial rights/attribution acceptance in `docs/asset-licenses.md`.
- Real-device sustained performance qualification; the existing performance contract remains
  HOLD/NO-GO and was not replaced by this integration.
- Normal CI, preview and production smoke gates, none of which ran here.
- Owner visual acceptance of the integrated route.

Code and documentation were committed as `926b979` and pushed to GitHub on 2026-10-30. Model and
runtime assets (`source-assets/`, `.local-assets/`) remain local. No merge, PR or deployment was
performed. This record stops at OWNER REVIEW.
