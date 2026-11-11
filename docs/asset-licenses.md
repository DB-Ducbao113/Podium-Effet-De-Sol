# Asset licenses and provenance

## Owner artwork promoted to production (10/11/2026)

The owner approved releasing the local review artwork into the production build after confirming that the DEV server (`http://localhost:5173/`) was the only place the pictures appeared. The root cause was not a broken image but three deliberate blockers: the Vite middleware that served the files existed in `serve` mode only, `.gitignore` excluded the whole `apps/web/public/images/p5/` tree so a clean CI checkout contained none of it, and `tools/check-public-boundary.mjs` rejected `.mp4`/`.webm` outside the pinned Homepage film.

`tools/promote-owner-assets.mjs` (`npm run assets:promote`) now reproduces the release: it hashes every source file, copies it byte-identical into the production public tree, hashes the destination again and aborts the whole run on any mismatch. Re-running it is idempotent. The released inventory is recorded in four manifests under `docs/asset-manifests/`:

| Manifest | Files | Bytes | Released artwork |
|---|---|---|---|
| `seasonal-production.json` | 351 | 20.493.580 | 2024/2025/2026 circuit heroes (desktop, mobile, thumbnail) and driver icons (full, small) |
| `extended-2026-production.json` | 90 | 5.319.946 | 2026 team, driver, headshot, car crop, hero and celebration concept artwork |
| `mini-race-production.json` | 62 | 14.650.881 | 2024/2025/2026 Mini Race team car GIFs and their reduced-motion WebP posters |
| `showroom-intro-production.json` | 3 | 2.639.454 | Showroom gate poster, 1280×720 WebM tunnel film and 960×540 MP4 fallback |

`apps/web/src/config/productionAssets.test.ts` re-checks every released file against its manifest SHA-256, so a drifted or missing byte fails CI instead of shipping silently. (On 10/11/2026 `.local-assets/`, `.local-assets` middlewares in `vite.config.ts`, `promote-owner-assets.mjs`, and unused `p5/portraits/*`, `p5/cinematic/*/action-*`, and `p5/hero/lando-helmet-2024.jpg` files were removed/archived outside the repo so `apps/web/public/images/` holds only the clean approved runtime images.)

**All of this artwork is AI-generated illustrative concept material.** It is not official Formula 1 photography, official team or driver imagery, verified 2026 chassis renderings, or licensed circuit photography. Team and sponsor marks, car numbers and driver likenesses shown in it may not match the real grid, and the historical packs explicitly state that chassis details were not verified. No trademark, sponsor, livery, publicity-right or commercial-use clearance is asserted by this release. The season results, standings and calendar remain sourced from the verified upstream APIs and are not affected by any artwork.

The 2024–2025 standings thumbnails remain **DEV-only** by the owner's explicit decision and are not part of this release.

## Showroom intro V3 — released to production (10/11/2026)

The owner supplied `showroom-intro-v3-file.html` and authorized extraction of its gate poster and tunnel film for DEV review on `/showroom`. The 67,618-byte 1280×720 WebP poster, the 1,546,796-byte 1280×720 WebM (8.625 s) and the 1,025,040-byte 960×540 MP4 (8.667 s) now ship in the production public tree at `/media/showroom/`, released on 10/11/2026 under `docs/asset-manifests/showroom-intro-production.json`. The DEV-only `/__peds-showroom-intro/` route and its Vite middleware were removed so DEV and production render the identical film. The two video files are pinned by SHA-256 in `tools/check-public-boundary.mjs`.

The prototype's simulated showroom, its five car render images, its specification cards, its livery switcher and its `EDS-G01` / model-ownership labels were deliberately not extracted: the intro leads into the existing Showroom, and the production car remains Model B with its recorded attribution. The film is AI-generated concept footage, not a recording of a real car or venue. No trademark, sponsor or commercial-use clearance is asserted.

## Championship journey intro — WITHDRAWN (09/11/2026)

The owner decided to remove the Championship calendar intro film entirely. The `JourneyIntro` component, its CSS, tests, the Vite `/__peds-journey-intro/` review route and `docs/asset-manifests/championship-intro-review.json` were deleted on 09/11/2026. The owner-supplied `globe-journey-v8-file.html` extraction (96,154-byte WebP poster, 1,045,923-byte MP4, 1,745,929-byte WebM) remains only in ignored `.local-assets/championship-intro-review/` and is not served or referenced by any code. It was never part of a production build. Rights and venue attribution were never cleared; the media must not be reintroduced without a new owner decision.

## 2024–2025 standings thumbnails — local owner review only (06/11/2026)

The owner supplied `PEDS_F1_2024_2025_PNG_WEBP.zip`, containing one 2048×682 WebP thumbnail per historical season (2024 and 2025), with PNG counterparts retained only locally. The WebP files are extracted to ignored `.local-assets/p5-historical-standings-v2/`; the DEV-only `/__p5-historical-standings/` route validates their exact sizes and SHA-256 values against `docs/asset-manifests/p5-historical-standings-review.json`. Production builds contain none of these files and preserve the existing venue-photo fallback.

No trademark, sponsor, photograph, historical-livery or commercial-use clearance is asserted. Promotion to public assets requires a separate owner rights review and approval.

## 2024–2025 Mini Race GIF pack — released to production (10/11/2026)

The owner supplied `PEDS_F1_all_20_GIFs.zip`, containing ten transparent, animated AI concept cars for each of 2024 and 2025. Its 20 GIFs are extracted to ignored `.local-assets/mini-race-2024-2025/`; first-frame WebP posters were generated only as reduced-motion alternatives. Both now ship in the production public tree at `/images/p5/mini-race/{2024,2025}/` and `/images/p5/mini-race/posters/{2024,2025}/`, released on 10/11/2026 under `docs/asset-manifests/mini-race-production.json`. The DEV-only `/__peds-mini-race/` route was removed so DEV and production serve the same pictures.

The archive explicitly says that sponsor logos and chassis details have not been independently verified for historical accuracy. No trademark, sponsor, commercial-use or livery clearance is asserted here; the artwork remains illustrative concept material.

## 2026 Mini Race GIF pack — released to production (10/11/2026)

The owner supplied `peds-2026-all-11-teams-horizontal-gifs-fixed.zip` for the Championship Mini Race. Its 11 GIFs and 11 WebP posters are extracted to ignored `.local-assets/mini-race-2026/` and now ship in the production public tree at `/images/p5/mini-race/gifs/` and `/images/p5/mini-race/posters/`, released on 10/11/2026 under `docs/asset-manifests/mini-race-production.json`. The WebP posters serve reduced-motion users in production as well.

The package describes AI-generated team illustrations, not verified 2026 chassis or liveries. The contact sheet shows team and sponsor marks and car numbers that may not match the standings driver. No trademark, sponsor or commercial-use clearance is asserted here; the artwork remains illustrative concept material.

## Included runtime assets

| Asset group | Provenance | Status |
|---|---|---|
| `public/models/model-b-eds-optimized-v1.glb` | “Formula 1 2022 Car” by Luis Adrian V., CC BY 4.0; modified materials, removed textures, consolidated and Meshopt-compressed; source and hash in `source-assets/models/model-b/README.md` | Owner-selected Showroom runtime asset; attribution visible in Showroom |
| `public/images/eds/**` | Original abstract driver/team/circuit/engineering artwork generated for the project; the `editorial/` EDS-G01 hero was removed 10/11/2026 | Included |
| `public/images/showroom/eds-g01/**` | **Removed 10/11/2026.** Original EDS-G01 technical schematics, withdrawn when the owner retired EDS-G01 in favour of Model B | **WITHDRAWN — directory no longer exists; see the EDS-G01 active-experience record below** |
| `public/media/homepage/hero-h3-2.mp4` + `hero-h3-2-poster.png` | Owner-approved Homepage film and poster; supplied by the owner and restored as the production hero on 01/11/2026 without re-encoding | **Included; bytes immutable.** mp4 1.761.848 B `FC9DE024…BD421`, poster 866.844 B `98F88281…CC69` |
| `public/images/championship/template/**` | Project-original model-free artwork generated in-session with Qoder ImageGen for the template-first implementation (2 hero plates + 4 venue plates at 3 widths, Next-Race plate and editorial plate at 2 widths, AVIF + WebP) | Included; 44 files, 3.653.197 B; per-file SHA-256 in `docs/asset-manifests/championship-template-artwork.json` |
| `public/logo/**` | Podium Effet De Sol brand assets supplied by the project owner | Included; owner retains responsibility for brand ownership evidence |
| `public/images/{circuits,driver-icons,concepts-2026,mini-race,driver-portraits-ai,driver-cinematic}/**` | Owner-supplied AI concept packages (plus 18 active Wikimedia `race-*` images in `driver-cinematic/`), released to production on 10/11/2026; see `docs/asset-manifests/*.json` | Included as **illustrative concept art**; not official F1 imagery |
| `public/media/showroom/**` | Owner-supplied AI-generated showroom gate poster and tunnel film, released to production on 10/11/2026 | Included as illustrative concept footage; SHA-256 pinned in `tools/ci/check-public-boundary.mjs` |
| `public/images/p4/cinematic/**` | **Removed 01/11/2026.** 36 decorative renders derived from the owner's EDS-G01 model were withdrawn; their local quarantine was permanently deleted with owner approval on 04/11/2026 | **WITHDRAWN — see the historical manifest below** |
| Plus Jakarta Sans Variable, Manrope Variable, IBM Plex Mono | Self-hosted through Fontsource packages pinned to `5.3.0`; runtime files are local WOFF2 subsets with Vietnamese coverage | SIL Open Font License 1.1; package license metadata retained in `node_modules` and npm lockfile |

The application uses Formula 1, team, driver, and circuit names editorially. No license in this repository grants rights to Formula 1, constructor, sponsor, or driver trademarks.

## EDS-G01 active experience — WITHDRAWN (10/11/2026)

The owner retired EDS-G01 entirely in favour of the current optimized Model B ("hãy loại bỏ tất cả liên quan đến EDS G01 … mình chỉ sử dụng Model B hiện tại đã optimized"). On 10/11/2026 every EDS-G01 label was removed from the active production experience: engineering article copy and alts, the Engineering index/article/anatomy pages, the About legal model-source clause, car-detail and Homepage vehicle-study alts, and the dead `model=eds-g01` Showroom SEO query branch. The eleven `public/images/eds/vehicle-studies/*.svg` illustrations are original brand-neutral Podium EDS editorial artwork (not Model B geometry) and were relabelled "PODIUM EDS"; the static `ground-effect-flow.svg` is a conceptual diagram, not Model B geometry. Showroom hotspots sit on Model B and are labelled accordingly.

| Item | Status |
|---|---|
| `apps/web/public/images/showroom/eds-g01/**` (8 original technical schematics) | **Removed from the public tree and the build.** Directory no longer exists; pruned defensively by `prune-legacy-showroom-assets.mjs` |
| `apps/web/public/images/eds/editorial/eds-g01-hero.svg` | **Removed.** The `editorial/` directory no longer exists |
| `StudioW15Stage.tsx`, `EDSStudioBackdropTexture.ts` (dead EDS-G01 studio backdrop modules) | **Removed from `apps/web/src`.** Unreachable from the production Showroom; rendered an `EDS-G01` backdrop label |
| `prune-legacy-showroom-assets.mjs` required-asset manifest | Reduced from 73 to 64 entries; the two EDS-G01 directories moved to `legacyTargets` |

The retired `public/models/eds-g01.glb` binary, the withdrawn P4 cinematic plates and their historical manifest (`docs/asset-manifests/p4-eds-g01-withdrawn.json`), and the `public/models/README.md` removal note are unchanged historical provenance and must not be erased or reintroduced. The production car remains Model B with its recorded CC BY 4.0 attribution. Guard tests continue to assert that no EDS-G01 label, module or asset returns to the active experience.

## P4 cinematic plates — WITHDRAWN (01/11/2026), disposed (04/11/2026)

On 01/11/2026 the owner issued a CRITICAL override: **EDS-G01 is the owner's self-built model and must not be used as a source for cinematic imagery, posters, backgrounds or derivative renders without explicit permission.** The earlier P4 instruction to use EDS-G01 as a cinematic source is revoked. All 36 plates were therefore withdrawn from the application.

| Item | Status |
|---|---|
| `apps/web/public/images/p4/cinematic/**` (36 files, 637.185 B) | **Removed from the public tree and the build.** Directory no longer exists |
| Former `scratch/ignition/p4/render/**` (scene.html, render.cjs, export.cjs, server.cjs, export-manifest.json, 7 master PNGs) | Relocated into quarantine in P4, then permanently deleted with the approved `scratch/` cleanup on 04/11/2026 |
| `CinematicPlate.tsx`, `cinematicPlates.ts`, `cinematicArtContract.test.ts` | Removed from `apps/web/src`; quarantined copies were subsequently disposed of |
| Runtime references (`WeekendResults.tsx`, `ChampionshipCalendar.tsx`, `championshipC1.css`, `championshipC11.css`) | **Removed.** No `data-palette`, no plate `<picture>`, no "EDS-G01 · …" caption remains |
| Historical quarantine record | `docs/asset-manifests/p4-eds-g01-withdrawn.json` — 52 disposed files, 3.271.860 B, with original per-file SHA-256 |

The owner approved permanent deletion of the exact `scratch/` cleanup manifest on 04/11/2026. The historical SHA-256 record remains for provenance; the quarantined bytes are no longer retained. The withdrawn plates must not be restored to the application without a new owner decision.

The removed plates were rendered from `public/models/eds-g01.glb` by `scene.html` (three.js WebGL, local Chromium) and graded by `export.cjs` (sharp; AVIF q52/WebP q80, brightness/saturation/contrast, vignette, grain). No third-party photographs, team/sponsor/venue artwork, official FIA circuit maps, mockup imagery or Model B assets were involved. The legal provenance is not the issue — the owner's consent is, and it was not given.

The P4 surfaces now use only the repository circuit schematic (`CircuitTrace`, labelled "illustrative, not an official FIA map") plus the existing data composition. **Independent, model-free artwork is required before any cinematic imagery returns**, and it needs its own licence/provenance record and owner approval first.

## P4 template-first artwork — integrated 01/11/2026

The owner's template-first directive required complete imagery for the Race Center and Calendar rebuild. Eight master images were generated for this project in-session with Qoder ImageGen, then converted with sharp into responsive AVIF/WebP ladders. They are model-free and independent of EDS-G01 and Model B.

| Role | Master | Runtime ladder | Subject / constraint |
|---|---|---|---|
| `ART-RC-HERO` | `p4-rc-hero-sunset-wide_1793522304088_432cd50c.png` (1.792×1.024, 2.487.516 B, `028B0838…65E0`) | `rc-hero-{896,1344,1792}.{avif,webp}` | Back-lit single-seater on a fictional permanent circuit at sunset; no text, logos, team identity or real venue |
| `ART-CAL-HERO` | `p4-cal-hero-night-clean_1793522437101_a9045796.png` (1.792×1.024, 2.906.449 B, `D7A5023D…A92`) | `cal-hero-{896,1344,1792}.{avif,webp}` | Night waterfront street circuit with a fictional skyline; regenerated to avoid recognizable real venues, then edited to remove residual pseudo-text |
| `ART-RC-VENUE-FOREST` | `p4-venue-forest_1793522262561_e3277c42.png` | `venue-forest-{640,1024,1600}.{avif,webp}` | Forested permanent circuit, golden hour; empty track, no branding |
| `ART-RC-VENUE-STREET` | `p4-venue-street-night_1793522341073_3d9932e9.png` | `venue-street-{640,1024,1600}.{avif,webp}` | Fictional night street circuit, wet asphalt; no marquees or sponsor boards |
| `ART-RC-VENUE-DESERT` | `p4-venue-desert_1793522367679_ad3b777e.png` | `venue-desert-{640,1024,1600}.{avif,webp}` | Desert circuit at dusk; empty track, no branding |
| `ART-RC-VENUE-MODERN` | `p4-venue-modern_1793522385491_d2a3b590.png` | `venue-modern-{640,1024,1600}.{avif,webp}` | Modern grandstand circuit at dusk; no readable sponsor text |
| `ART-CAL-NEXT` | `p4-cal-next-waterfront_1793525017596_8153a399.png` (2.657.292 B, `4C2C8BBC…F8BC9`) | `cal-next-{800,1200}.{avif,webp}` 3:2 | Night city/waterfront atmosphere for the Next Race feature; fictional venue, no text or brand marks |
| `ART-CAL-EDITORIAL` | `p4-cal-editorial-night_1793525034993_b45c71da.png` (1.140.107 B, `C4431D16…4E6F8D`) | `cal-editorial-{640,1000}.{avif,webp}` 4:3 | Night brake-glow detail with no car identity, caption always “illustrative” |

Generation and conversion notes: sources are 16:9 because the image tool returned 1.792×1.024 for a 21:9 request; heroes are cropped with CSS `object-fit` rather than distorted. AVIF uses quality 52 / effort 6 and WebP quality 80 / effort 5 with `withoutEnlargement`, so the 640-wide ladder stops below the 1.024 master and the 896-wide hero ladder below 1.792. All 44 outputs were decoded back to PNG and inspected before integration; two earlier drafts (square sunset hero, recognizable Marina Bay night hero, and a night hero with pseudo-text) were rejected and superseded.

The artwork is illustrative. It is never captioned as an official circuit map, never used to imply real telemetry or results, and carries no driver, team or sponsor likeness. Provenance and byte/SHA-256 records: `docs/asset-manifests/championship-template-artwork.json`.

## P5 Drivers hero photograph — removed in repo cleanup (10/11/2026)

`apps/web/public/images/p5/hero/lando-helmet-2024.jpg` (Wikimedia Commons thumbnail by Liauzh) was removed during the 10/11/2026 repository cleanup because the 2026 Drivers hero renders the owner-approved 2026 AI concept banner (`hero-drivers-2026.webp`) and 2024/2025 render the seasonal grid banner. Likewise `apps/web/public/images/p5/portraits/*` (174 files) and `apps/web/public/images/p5/cinematic/*/action-*` (36 files) were removed from `public/` after verifying they were shadowed or unreferenced.

## Homepage Explore artwork — released to production (11/11/2026)

| Visual | Runtime path | Source / treatment |
|---|---|---|
| Showroom card | `public/images/championship/template/rc-hero-1344.{avif,webp}` | Reuses the previously approved original, unbranded ART-RC-HERO artwork. It is illustrative and not the owner-locked Model B or EDS-G01. |
| Engineering card | `public/images/home/explore/engineering.webp` (fallback `engineering-flow.svg`) | Owner-approved AI concept illustration (32,990 B, SHA-256 `f8f0961c7f5d895519605b06525a9442d84a4949384cac964fd89cbf8cc63e3e`), promoted into `public/images/home/explore/` at owner request on 11/11/2026. Illustrative only, not computed CFD. |
| Drivers card | `public/images/home/explore/drivers.webp` (fallback `driver-helmet.svg`) | Owner-approved AI concept illustration (26,846 B, SHA-256 `2d2d177ef0de27c887346984b50923cebb7c58c3dcc64c92cd5f1245a5d9f6f7`), promoted into `public/images/home/explore/` at owner request on 11/11/2026. Illustrative concept helmet art. |
| Teams card | `public/images/home/explore/teams.webp` (fallback `team-garage.svg`) | Owner-approved AI concept illustration (23,314 B, SHA-256 `6edf89cf2a6ccd4722e45ffdc3b2988bbdf9534b7de835e7537792f6a8b7f829`), promoted into `public/images/home/explore/` at owner request on 11/11/2026. Illustrative garage concept art; commercial clearance not asserted. |

All four images carry empty `alt=""` (decorative gateway art above separated below-image text headers) with clean SVG fallbacks retained in `public/images/home/explore/`. No owner-locked Homepage video, canonical logo, Model B, or withdrawn EDS-G01 asset is altered.


## Excluded or local-only assets

- Model B Meshopt v1 is the selected Showroom runtime model at `apps/web/public/models/model-b-eds-optimized-v1.glb`; the frozen source and attribution record are under `source-assets/models/model-b/`. Its SHA-256 is `2D0091661DACE5D6C61AEBF898B4974644B44E43A5E8D10F602685C1631610A2`. The source is “Formula 1 2022 Car” by Luis Adrian V. (`luis.adrian.villagrana`) on [Sketchfab](https://sketchfab.com/3d-models/formula-1-2022-car-65dcd974798f4f03be5cdf4f79e228d8), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The optimized file replaces materials, removes texture dependencies, consolidates the scene, and applies quantized Meshopt delivery. The owner states that commercial use is authorized; visual, performance, and release QA remain separate gates.
- Model A, Blender sources, C42, EDS-G02, EDS-G03, QA screenshots, benchmark media, and historical visual experiments are not part of the upload set.
- 126 legacy WebP runtime files were preserved under ignored `.local-assets/legacy-public` for rollback, not included in the repository upload manifest.

## Release gate

### F1 2026 owner-provided concept package (released to production 10/11/2026)

The 22 driver headshots and 11 team car crops under `apps/web/public/images/concepts-2026/` come from the owner's AI concept package. Released bytes are verified against `docs/asset-manifests/extended-2026-production.json`. The supplied artworks are illustrative concepts, not official driver photography or verified 2026 car imagery. Commercial rights, likeness and trademark clearance remain unresolved.

Asset status here is an engineering inventory, not legal advice. CC BY 4.0 copyright permission does not independently clear trademarks, trade dress, design/patent, publicity rights, or the uploader's ownership of every element. Missing owner acceptance or third-party rights evidence must be treated as **BLOCKED** for commercial release.

### Generated 2024–2025 driver portraits (released to production 10/11/2026)

The owner requested new front-facing, photorealistic driver portraits in Formula 1 race suits, with a consistent editorial style for each season. The 2024 and 2025 sets are AI-generated composites from the portrait references, with season-specific team suit colors. They are not documentary photographs of the drivers in those suits. The WebP delivery files under `apps/web/public/images/driver-portraits-ai/` ship in the production build, released on 10/11/2026. `docs/asset-manifests/driver-portraits-ai.json` records the season, subject, team, prompt recipe, output path, size and SHA-256. The reference portrait sources and licenses remain in `apps/web/src/utils/driverPortraits.ts`. Facial likeness, team marks and suit details remain unverified concept art.
