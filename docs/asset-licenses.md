# Asset licenses and provenance

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

## P4 imagery proposal — no asset integrated (01/11/2026)

Stage C of the owner directive requested an imagery/provenance proposal with a preview before any new asset is integrated. The registered inventory contains no licensed candidate for Race Center or Calendar imagery: the only rasters are four project-authored Engineering social images, the PODIUM brand family and the approved Homepage poster; the 72 SVGs under `images/eds/**` are circuit schematics, abstract helmet graphics, EDS-G01 vehicle studies and engineering diagrams; Model B stays outside `public`; the EDS-G01 plates remain quarantined.

No asset was added, moved or re-licensed in this stage. The proposal (schematic-only vs project-authored model-free vector art vs owner-licensed photography vs Model B, which is BLOCKED) is recorded in `docs/IGNITION_MASTER_PLAN.md` §13.29C. **G-2 remains PARTIAL** until the owner selects an option and its provenance record is written here before integration.

> Superseded for P4 imagery by the owner-approved template-first implementation above. The proposal record is retained as history; the status conflict it describes no longer applies to `public/images/p4/template/**`.

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
