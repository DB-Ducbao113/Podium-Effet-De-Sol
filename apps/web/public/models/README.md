# Public 3D Models (`FP-04 RB`)

This directory holds the four owner-approved `FP-04 RB` runtime GLB assets gated behind same-origin Cloudflare Worker checks (`Cross-Origin-Resource-Policy: same-origin`, `X-Robots-Tag: noindex, noimageindex, nosnippet`):

- `fp04rb-engineering-v1.glb` — 47-part segmented 3D scroll-disassembly & F1 OLED cockpit model for `/engineering` and `/engineering/car-anatomy`.
- `fp04rb-showroom-desktop.glb` — Primary LOD for the 2-bay 11-team 2026 Pit Garage (`/showroom`).
- `fp04rb-showroom-mobile.glb` — Compact LOD for Bay 2 and mobile GPUs (`/showroom`).
- `fp04rb-pit-crew-v1.glb` — Rigged pit-crew wheel-service model (`/showroom`).

All `FP-04 RB` meshes are non-commercial illustrative concept studies attributed to Peter Kiss (`PETERKISSDESIGN`); SHA-256 hashes and provenance are recorded in `docs/asset-licenses.md` and `tools/ci/check-public-boundary.mjs`.

Historical provenance: the owner approved removal of the former EDS-G01 model on 04/11/2026, and retired `model-b-eds-optimized-v1.glb` from `public/models/` during the Storm Midnight production cutover on 25/11/2026 (`source-assets/models/model-b/` remains frozen offline).
