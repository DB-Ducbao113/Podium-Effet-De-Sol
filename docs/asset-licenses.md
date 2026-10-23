# Asset licenses and provenance

## Included runtime assets

| Asset group | Provenance | Status |
|---|---|---|
| `public/models/eds-g01.glb` | Original EDS-G01 generated for Podium Effet De Sol; no imported third-party texture | Included as current production Showroom asset |
| `public/images/eds/**` | Original abstract driver/team/circuit/editorial/engineering artwork generated for the project | Included |
| `public/images/showroom/eds-g01/**` | Original EDS-G01 technical schematics generated for the project | Included |
| `public/logo/**` | Podium Effet De Sol brand assets supplied by the project owner | Included; owner retains responsibility for brand ownership evidence |
| Google Fonts requests | Inter and Playfair Display loaded from Google Fonts; no font binaries committed | External service; subject to upstream font licenses and privacy review |

The application uses Formula 1, team, driver, and circuit names editorially. No license in this repository grants rights to Formula 1, constructor, sponsor, or driver trademarks.

## Excluded or local-only assets

- Model B Meshopt v1 is stored only in `.local-assets` for development review. Its frozen SHA-256 is `2D0091661DACE5D6C61AEBF898B4974644B44E43A5E8D10F602685C1631610A2`. Commercial release remains blocked until provenance and commercial-use evidence are approved.
- Model A, Blender sources, C42, EDS-G02, EDS-G03, QA screenshots, benchmark media, and historical visual experiments are not part of the upload set.
- 126 legacy WebP runtime files were preserved under ignored `.local-assets/legacy-public` for rollback, not included in the repository upload manifest.

## Release gate

Asset status here is an engineering inventory, not legal advice. Missing owner or third-party rights evidence must be treated as **BLOCKED** for commercial release.
