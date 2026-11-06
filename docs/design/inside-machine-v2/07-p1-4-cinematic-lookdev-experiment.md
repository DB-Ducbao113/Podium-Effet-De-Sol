# P1.4 — Cinematic lookdev iteration (experiment, no CI gate)

**Repository:** `DB-Ducbao113/Podium-Effet-De-Sol`  
**Branch:** `feat/engineering-inside-machine-v2`  
**Isolation:** DEV-only `/engineering/p1-front-left`; PR #4 remains Draft.

## Implemented in this iteration

### A. Actual studio reflection environment

Added `P1StudioEnvironment.tsx`. It creates a procedural Three.js `RoomEnvironment` and PMREM cubemap **locally**, inside the pilot Canvas. Nothing is downloaded from an external HDR server. Metallic wheel/hub/brake surfaces now receive broad studio reflections, not only the harsh direct light from previous versions. On unmount the environment texture and PMREM resources are disposed; source GLB files remain untouched.

### B. One geometry, two material treatments

Added `P1BlueprintMaterials.ts`. The original R4.5 meshes are the only meshes used for the vehicle silhouette. Only source material clones change their albedo, metalness and roughness continuously as Blueprint is entered, including the **chassis**, to create a cohesive technical treatment. Mechanical feature-edge lines remain limited to the focused wheel. No whole-car wireframe triangle net is created; no duplicate chassis is rendered. Scrubbing back returns to the original studio material appearance.

### C. GLB-anchored technical callouts

Added `P1PartAnnotations.tsx`. Two restrained technical labels track the **real center-lock and outer-wheel nodes** in world space, not arbitrary screen points. They are hidden in the hero opening frame, and restyle for pale Blueprint. They show static engineering names only, **not invented telemetry**.

### D. Six-shot cinematic editing rail

Replaced static timeline headings with six compact, keyboard-accessible, clickable scene markers. The timeline remains a **single deterministic normalized progress**; jumping to Hero/Lock/Explode/Blueprint/Macro/Rebuild does not fork animation state. The film rail scrolls horizontally on mobile without forcing the page to overflow.

## Not performed

- CI was deliberately **not run, awaited, inspected or modified** in this experimental iteration. Commits include `[skip ci]`.
- No browser WebGL visual scoring was asserted.
- No source GLB geometry was changed.
- No project-wide tests, backend, API, Homepage, Showroom or Championship changes.
- No merge to the migration branch, main, or deploy.

## What to inspect next directly on the DEV pilot

1. `0%` — whole car silhouette, especially the tire against graphite floor.
2. `40%` — center lock in view; no annotation colliding with part.
3. `54%` — wheel extraction with believable separation and material hierarchy.
4. `73%` — chassis, wheel and background become a coherent pale technical view; no dark livery leakage.
5. `80%` — macro brake/hub and label clarity, no triangle-mesh wireframe noise.
6. `100%` — studio material and all seven transforms restored with no leftover overlay.
7. Performance profile — check studio reflection preparation time and FPS on lower-spec GPU; visually tone down the environment if too expensive.

**Current status:** P1.4 *code implemented; visual acceptance unverified*. Owner cinematic review remains HOLD. Next experiment is dynamic part focus/camera composition and physical macro material lookdev based on actual WebGL captures.
