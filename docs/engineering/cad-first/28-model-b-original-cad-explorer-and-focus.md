# Model B scroll — verified CAD component explorer and source-focused camera

Work branch: `work/engineering-four-corners-local`. Route: `/engineering/model-b-build` (DEV only). Mechanical G2 HOLD. No GitHub Actions, PR, merge or deployment.

## Implemented interaction

The real original Model B GLB remains the base stage. Once the exact original P2.8 59-node GLB has been SHA-256 checked and decoded, the **EXPLORE REAL CAD PARTS** control opens a searchable catalog. It lists the native P2.8 part names for both front stations and only the permitted wheel-end proxy names at the two rear stations. When P2.12 and P2.14 have been decoded, the rear catalog adds precisely the 19-minus-4-plus-16 original source meshes, with four superseded annular bearing proxies suppressed.

Catalog entries carry the exact source part ID, the individually measured wheel station, and source origin. Searching can match part codes or subsystem labels and be filtered to one station. Unknown parts, duplicate source IDs and invalid rear-only parts are rejected. No substitute car or invented screw is generated.

Selecting a catalog entry opens the same original-CAD inspector already used by Three.js mesh raycasts and highlights only the clone of the selected source material. The camera tracks the current geometry-bound-centre of the selected mesh in WORLD coordinates, not its GLB Object3D origin. This is important for CAD meshes whose vertices were authored at offset coordinates. The camera uses a closer distance for actual P2.8 hardware. Dismissing the inspector restores normal chapter camera and original material emissive values. Selecting from the catalog while early in the scroll can navigate to 95% so the actual fully assembled source part is visible; direct canvas click preserves existing scroll position.

These are visual camera and highlighting operations only: no source STEP/GLB geometry modification, no change in fastener handedness, no claim of an actual installation path, no chassis hardpoint certification, and no mechanical joint signoff.

## New code

- `cadFocus.ts` / `cadFocus.test.ts`: world-centroid selected mesh location, source identity resolution, exact material reset and missing mesh negative cases.
- `cadPartCatalog.ts` / `cadPartCatalog.test.ts`: exact source identities over four wheel stations with 59 original front meshes, the correct rear visual wheel-end subset and 31 native rear parts when P2.14 replaces four obsolete annuli.
- `CadPartBrowser.tsx` / `cadPartBrowser.css`: searchable, station-filtered source-only component explorer.
- `ModelBAssemblyStage.tsx`: original GLB raycast selection, reversible clone-material highlight and animated source-derived camera.
- `ModelBAssemblyPage.tsx` / `modelBAssembly.css`: catalog, part inspection, accessible labels and responsive integration; safer disposal without state updates during unmount.
- `tools/cad-first/record_model_b_scroll_local.py`: the real Chromium recorder now searches and selects `P2_TYRE_SLICK_BODY` from the original source catalog at the front +Z station, checks its part identity and G2 warning, then requires actual WebGL canvas appearance to change during source-geometry focus before accepting any MP4.
- `tools/cad-first/run_four_corners_local.py`: added dedicated catalog and focus Vitest targets and browser evidence gates.

## Real verification status

The previously generated original P2.12+P2.14 BALANCED 31-source-mesh GLB was re-imported locally from `/mnt/data` and checked again: 31 distinct manifest part IDs, 39,122 triangles, all mesh objects watertight and consistently wound, SHA-256 `bf44ce0951825e41fb04631cbe8e040b1ed5e24fb6842f6ca0e1cb7a498578de`. The four native source-composition Python regression cases previously passed locally.

**NOT YET RUN:** New React/Three.js TypeScript typecheck and Vitest, real-click Chromium closeup QA, and actual Model B full-car MP4. The tool execution environment has Node, global TypeScript, Chromium and FFmpeg, but not a complete repository checkout, Vite/React/Three dependencies or the original Model B/P2.8 owner GLBs. GitHub text connector commits are not the same as a runtime browser test. The existing 5-second VTK rear-assembly MP4 is only a rear-source CAD review and must never be presented as the final full-car website video.

**MECHANICAL G2 HOLD. PRODUCTION UNCHANGED.**