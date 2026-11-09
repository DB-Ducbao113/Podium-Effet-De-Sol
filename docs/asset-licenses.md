# Asset licenses and provenance

## Showroom intro V3 — local DEV review only (07/11/2026)

The owner supplied `showroom-intro-v3-file.html` and authorized extraction of its gate poster and tunnel film for DEV review on `/showroom`. The 67,618-byte 1280×720 WebP poster, the 1,546,796-byte 1280×720 WebM (8.625 s) and the 1,025,040-byte 960×540 MP4 (8.667 s) are stored only in ignored `.local-assets/showroom-intro-v3/`; their exact sizes, dimensions and SHA-256 values are recorded in `docs/asset-manifests/showroom-intro-v3-review.json` with `release: "hold"`. The DEV-only `/__peds-showroom-intro/` route validates each file against that manifest before serving it and exists in Vite serve mode only, so the production build contains none of these bytes.

The prototype's simulated showroom, its five car render images, its specification cards, its livery switcher and its `EDS-G01` / model-ownership labels were deliberately not extracted: the intro leads into the existing Showroom, and the production car remains Model B with its recorded attribution. The film is AI-generated concept footage, not a recording of a real car or venue. No trademark, sponsor or commercial-use clearance is asserted; promoting the film to production needs a separate owner rights review and visual approval.

## Championship journey intro — WITHDRAWN (09/11/2026)

The owner decided to remove the Championship calendar intro film entirely. The `JourneyIntro` component, its CSS, tests, the Vite `/__peds-journey-intro/` review route and `docs/asset-manifests/championship-intro-review.json` were deleted on 09/11/2026. The owner-supplied `globe-journey-v8-file.html` extraction (96,154-byte WebP poster, 1,045,923-byte MP4, 1,745,929-byte WebM) remains only in ignored `.local-assets/championship-intro-review/` and is not served or referenced by any code. It was never part of a production build. Rights and venue attribution were never cleared; the media must not be reintroduced without a new owner decision.

## 2024–2025 standings thumbnails — local owner review only (06/11/2026)

The owner supplied `PEDS_F1_2024_2025_PNG_WEBP.zip`, containing one 2048×682 WebP thumbnail per historical season (2024 and 2025), with PNG counterparts retained only locally. The WebP files are extracted to ignored `.local-assets/p5-historical-standings-v2/`; the DEV-only `/__p5-historical-standings/` route validates their exact sizes and SHA-256 values against `docs/asset-manifests/p5-historical-standings-review.json`. Production builds contain none of these files and preserve the existing venue-photo fallback.

No trademark, sponsor, photograph, historical-livery or commercial-use clearance is asserted. Promotion to public assets requires a separate owner rights review and approval.

## 2024–2025 Mini Race GIF pack — local owner review only (06/11/2026)

The owner supplied `PEDS_F1_all_20_GIFs.zip`, containing ten transparent, animated AI concept cars for each of 2024 and 2025. Its 20 GIFs are extracted to ignored `.local-assets/mini-race-2024-2025/`; first-frame WebP posters were generated only as reduced-motion alternatives. The DEV-only `/__peds-mini-race/` route verifies the exact GIF and poster sizes/SHA-256 values in `docs/asset-manifests/mini-race-2024-2025-review.json`. The production build contains none of these bytes and keeps the visual car-slot fallback.

The archive explicitly says that sponsor logos and chassis details have not been independently verified for historical accuracy. No trademark, sponsor, commercial-use or livery clearance is asserted. Promotion to public assets requires a separate owner rights review and approval.

## 2026 Mini Race GIF pack — local owner review only (06/11/2026)

The owner supplied `peds-2026-all-11-teams-horizontal-gifs-fixed.zip` for the Championship Mini Race. Its 11 GIFs and 11 WebP posters are extracted to ignored `.local-assets/mini-race-2026/`. The DEV-only `/__peds-mini-race/` route validates exact filenames, sizes and SHA-256 values against `docs/asset-manifests/mini-race-2026-review.json`. The production build contains no GIFs or posters from this pack and shows the existing car-slot fallback. The WebP posters serve reduced-motion users in local review.

The package describes AI-generated team illustrations, not verified 2026 chassis or liveries. The contact sheet shows team and sponsor marks and car numbers that may not match the standings driver. The package itself calls for visual and rights review before public release. No trademark, sponsor or commercial-use clearance is asserted here; promotion to public assets needs a separate owner review and approval.

## Included runtime assets

| Asset group | Provenance | Status |
|---|---|---|
| `public/models/model-b-eds-optimized-v1.glb` | “Formula 1 2022 Car” by Luis Adrian V., CC BY 4.0; modified materials, removed textures, consolidated and Meshopt-compressed; source and hash in `source-assets/models/model-b/README.md` | Owner-selected Showroom runtime asset; attribution visible in Showroom |
| `public/images/eds/**` | Original abstract driver/team/circuit/editorial/engineering artwork generated for the project | Included |
| `public/images/showroom/eds-g01/**` | Original EDS-G01 technical schematics generated for the project | Included |
| `public/media/homepage/hero-h3-2.mp4` + `hero-h3-2-poster.png` | Owner-approved Homepage film and poster; supplied by the owner and restored as the production hero on 01/11/2026 without re-encoding | **Included; bytes immutable.** mp4 1.761.848 B `FC9DE024…BD421`, poster 866.844 B `98F88281…CC69` |
| `public/images/p4/template/**` | Project-original model-free artwork generated in-session with Qoder ImageGen for the P4 template-first implementation (2 hero plates + 4 venue plates at 3 widths, Next-Race plate and editorial plate at 2 widths, AVIF + WebP) | Included; 44 files, 3.653.197 B; per-file SHA-256 in `docs/asset-manifests/p4-template-artwork.json` |
| `public/logo/**` | Podium Effet De Sol brand assets supplied by the project owner | Included; owner retains responsibility for brand ownership evidence |
| `public/images/p4/cinematic/**` | **Removed 01/11/2026.** 36 decorative renders derived from the owner's EDS-G01 model were withdrawn; their local quarantine was permanently deleted with owner approval on 04/11/2026 | **WITHDRAWN — see the historical manifest below** |
| Barlow Condensed, Space Grotesk, IBM Plex Mono | Self-hosted through Fontsource packages pinned to `5.3.0`; runtime files are local WOFF2 subsets with Vietnamese coverage | SIL Open Font License 1.1; package license metadata retained in `node_modules` and npm lockfile |

The application uses Formula 1, team, driver, and circuit names editorially. No license in this repository grants rights to Formula 1, constructor, sponsor, or driver trademarks.

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

The artwork is illustrative. It is never captioned as an official circuit map, never used to imply real telemetry or results, and carries no driver, team or sponsor likeness. Provenance and byte/SHA-256 records: `docs/asset-manifests/p4-template-artwork.json`.

## P5 Drivers hero photograph — local owner review

`apps/web/public/images/p5/hero/lando-helmet-2024.jpg` is a 1,280 × 1,280 Wikimedia Commons thumbnail of Lando Norris's 2024 helmet, photographed on 18 April 2024 by Liauzh and published under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). The [source page](https://commons.wikimedia.org/wiki/File:Lando_Norris_Helmet_2024.jpg) identifies the subject and photographer. The source bytes are retained; the runtime applies CSS crop, reduced saturation and red/orange lighting. The hero labels the image as archival and links the source and license. Bytes and SHA-256 are in `docs/asset-manifests/p5-drivers-hero.json`. Commercial use and related trade dress remain subject to owner/legal review.

## Homepage Explore V1 — 04/11/2026 (feature branch review)

| Visual | Runtime path | Source / treatment |
|---|---|---|
| Showroom card | `public/images/p4/template/rc-hero-1344.{avif,webp}` | Reuses the previously approved original, unbranded ART-RC-HERO artwork. It is illustrative and not the owner-locked Model B or EDS-G01. |
| Engineering card | `public/images/home/explore/engineering-flow.svg` | New project-original, model-free technical illustration authored for the Homepage. Not computed CFD or measured telemetry. |
| Drivers card | `public/images/home/explore/driver-helmet.svg` | New project-original generic helmet drawing; no driver likeness or sponsor marks. |
| Teams card | `public/images/home/explore/team-garage.svg` | New project-original fictional pit garage; no team name, sponsor or real venue. |

All four images are decorative gateway art with empty alt text; visible titles, destination links and hover effects are rendered in HTML/CSS. The prior AI concept sheet containing recognizable team/driver branding is **NOT** imported. No owner-locked video, logo, Showroom model or disallowed EDS-G01 derivative is modified or used as a source. This feature branch is for review; no production deployment is authorized by the asset inventory.

## Homepage Explore V2 — local cinematic review only (04/11/2026)

A second owner-review iteration follows feedback that the four vector cards did not visually match the approved cinematic concept. Four temporary WebP crops (Showroom, Engineering, Drivers, Teams) were extracted from the generated composite concept `a_cinematic_futuristic_ui_hero_section_for_explo.png`; the prominent synthetic F1 mark on the garage wall was obscured. **They are neither four independently generated masters nor cleared production imagery.** The local owner-review package is distributed separately and is **not committed to GitHub**.

- **Review directory:** `.local-assets/home-explore-v2/{showroom,engineering,drivers,teams}.webp`.
- **DEV-only URL:** `/__peds-home-explore/{name}.webp`, registered by the Vite serve-only middleware with allowed filenames and exact byte/SHA-256 validation.
- **Production behavior:** `HomeStoryLinks.tsx` uses previously registered unbranded P4 / original SVG fallback imagery when `import.meta.env.DEV` is false. No local-review file is present in `public/` or the production build.
- **Source caveats:** output resolution of these concept crops is limited; independent high-resolution, rights-approved final images are still required before commercial release.
- **Asset locks:** Homepage H3.2 film and poster, official logo, Model B and EDS-G01 remain untouched.


## Excluded or local-only assets

- Model B Meshopt v1 is the selected Showroom runtime model at `apps/web/public/models/model-b-eds-optimized-v1.glb`; the frozen source and attribution record are under `source-assets/models/model-b/`. Its SHA-256 is `2D0091661DACE5D6C61AEBF898B4974644B44E43A5E8D10F602685C1631610A2`. The source is “Formula 1 2022 Car” by Luis Adrian V. (`luis.adrian.villagrana`) on [Sketchfab](https://sketchfab.com/3d-models/formula-1-2022-car-65dcd974798f4f03be5cdf4f79e228d8), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The optimized file replaces materials, removes texture dependencies, consolidates the scene, and applies quantized Meshopt delivery. The owner states that commercial use is authorized; visual, performance, and release QA remain separate gates.
- Model A, Blender sources, C42, EDS-G02, EDS-G03, QA screenshots, benchmark media, and historical visual experiments are not part of the upload set.
- 126 legacy WebP runtime files were preserved under ignored `.local-assets/legacy-public` for rollback, not included in the repository upload manifest.

## Release gate

### F1 2026 owner-provided concept package (local review)

The 22 driver headshots and 11 team car crops under `apps/web/public/images/p5/concepts-2026/` come from the owner's AI concept package. The 33 source images and its manifest needed to reproduce those outputs are retained locally at `.local-assets/p5-concepts/`; they are not committed to Git. `tools/sync-f1-2026-concepts.mjs` reproduces the 235-pixel car crop below the poster's names and numbers; `docs/asset-manifests/f1-2026-concepts.json` records every delivered file's size, SHA-256, and crop. The supplied artworks are illustrative concepts, not official driver photography or verified 2026 car imagery. This integration is for local owner review; commercial rights, likeness and trademark clearance, and visual approval remain unresolved.

Asset status here is an engineering inventory, not legal advice. CC BY 4.0 copyright permission does not independently clear trademarks, trade dress, design/patent, publicity rights, or the uploader's ownership of every element. Missing owner acceptance or third-party rights evidence must be treated as **BLOCKED** for commercial release.

### P5 generated 2024–2025 driver portraits (local review)

The owner requested new front-facing, photorealistic driver portraits in Formula 1 race suits, with a consistent editorial style for each season. The 2024 and 2025 sets are AI-generated composites from the existing local portrait references, with season-specific team suit colors. They are not documentary photographs of the drivers in those suits. The resulting PNG masters and WebP delivery files remain in ignored local P5 assets; no publication approval is inferred. `docs/asset-manifests/p5-generated-portraits.json` records the season, subject, team, prompt recipe, output path, size and SHA-256. The reference portrait sources and licenses remain in `apps/web/src/utils/driverPortraits.ts`. Facial likeness, team marks, suit details and commercial rights need owner review before release.
