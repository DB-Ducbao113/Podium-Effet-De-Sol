# Asset licenses and provenance

## Included runtime assets

| Asset group | Provenance | Status |
|---|---|---|
| `public/models/eds-g01.glb` | Original EDS-G01 generated for Podium Effet De Sol; no imported third-party texture | Included as current production Showroom asset |
| `public/images/eds/**` | Original abstract driver/team/circuit/editorial/engineering artwork generated for the project | Included |
| `public/images/showroom/eds-g01/**` | Original EDS-G01 technical schematics generated for the project | Included |
| `public/logo/**` | Podium Effet De Sol brand assets supplied by the project owner | Included; owner retains responsibility for brand ownership evidence |
| Barlow Condensed, Space Grotesk, IBM Plex Mono | Self-hosted through Fontsource packages pinned to `5.3.0`; runtime files are local WOFF2 subsets with Vietnamese coverage | SIL Open Font License 1.1; package license metadata retained in `node_modules` and npm lockfile |

The application uses Formula 1, team, driver, and circuit names editorially. No license in this repository grants rights to Formula 1, constructor, sponsor, or driver trademarks.

## Excluded or local-only assets

- Model B Meshopt v1 is prepared under non-public `source-assets/models/model-b/` with its attribution record. Its frozen SHA-256 is `2D0091661DACE5D6C61AEBF898B4974644B44E43A5E8D10F602685C1631610A2`. The source is “Formula 1 2022 Car” by Luis Adrian V. (`luis.adrian.villagrana`) on [Sketchfab](https://sketchfab.com/3d-models/formula-1-2022-car-65dcd974798f4f03be5cdf4f79e228d8), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The optimized file replaces materials, removes texture dependencies, consolidates the scene, and applies quantized Meshopt delivery. Commercial release remains blocked until attribution placement, visual/performance acceptance, and owner acceptance of third-party-rights risk.
- Model A, Blender sources, C42, EDS-G02, EDS-G03, QA screenshots, benchmark media, and historical visual experiments are not part of the upload set.
- 126 legacy WebP runtime files were preserved under ignored `.local-assets/legacy-public` for rollback, not included in the repository upload manifest.

## Release gate

Asset status here is an engineering inventory, not legal advice. CC BY 4.0 copyright permission does not independently clear trademarks, trade dress, design/patent, publicity rights, or the uploader's ownership of every element. Missing owner acceptance or third-party rights evidence must be treated as **BLOCKED** for commercial release.
