# Podium EDS design status

The **Storm Midnight Liquid Glass** creative direction (`#05080e` storm surfaces, unified `GlobalLiquidNav`, Living-Photo AVIF/WebP Storm plates, Live F1 Pulse Dock, 2-bay 11-team `FP-04 RB` Pit Garage Showroom, and 12-scene 47-part `FP-04 RB` Engineering Disassembly Show) was owner-approved and promoted to canonical production on 25/11/2026 (`ADR-0002`), retiring the prior IGNITION, V5–V9, Model B Showroom, and Homepage drift/tunnel video designs.

## Durable boundaries

- The original Podium EDS logo (`public/logo/logo.png`, `public/logo/logo-compact.png`) is the canonical brand asset. Preserve its source artwork and aspect ratio.
- `FP-04 RB` (`fp04rb-showroom-{desktop,mobile}.glb`, `fp04rb-pit-crew-v1.glb`, `fp04rb-engineering-v1.glb`) is the active 3D study mesh across `/showroom` and `/engineering`, attributed to Peter Kiss (`PETERKISSDESIGN`) as a non-commercial illustrative concept. `Model B` (`model-b-eds-optimized-v1.glb`) and Homepage/Showroom `.mp4`/`.webm` films are retired from `public/` (`source-assets/` remains frozen offline).
- EDS-G01 is retired from the active experience. Historical withdrawal and provenance records remain in `docs/asset-manifests/` and `docs/asset-licenses.md`.
- Local review assets in `.local-assets/` and source files in `source-assets/` are outside the public build. Moving an asset into production requires a clear license, manifest SHA-256, and provenance record.
- Keep real results, calendars, and standings tied to their verified Jolpica & OpenF1 sources, with automatic edge IP timezone detection (`/api/timezone`). Do not present concept visuals or illustrative telemetry as official FIA/team photography or CAD data, and keep card faces free of DEV review watermarks (exposing editorial provenance cleanly on `/about`, footer, and Dossier views).
- Preserve keyboard access, 200%/400% text-zoom reflow, reduced-motion behavior, and a usable fallback for 3D experiences.
