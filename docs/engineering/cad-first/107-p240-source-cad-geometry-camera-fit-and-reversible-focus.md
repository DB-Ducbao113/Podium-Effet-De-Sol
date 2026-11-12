# P2.40 — Exact source CAD macro framing and reversible early-scroll inspection

Date: 2026-11-12. Branch: `work/engineering-four-corners-local`.

## Problem verified in current code

The P2.39 X-ray source-CAD inspection only aimed the camera at an authenticated mesh when **scroll progress was greater than 0.24**. If a user inspected a genuine bolt through the source catalog in chapter 00/01, the frontend could report an original-source X-ray focus while the camera continued the usual whole-car orbit. The catalog worked around this by **forcing the page scroll to 95%** on selection, unexpectedly hijacking the user's chosen chapter.

A second limitation was using one fixed distance, 0.52 m for hardware or 1.4 m for all other parts. A real native CAD wheel or bearing could be cropped on a portrait/mobile viewport or appear too small on a desktop.

## P2.40 implementation (GitHub branch)

- Added `sourceCadFocusFraming.ts` with `sourceCadFocusDistance(worldSize,aspect,fov,hardware)`. It measures the selected original GLB own-geometry world AABB diagonal, computes the limiting horizontal/vertical camera FOV, fits the sphere with 24% safety margin, and applies modest native-macro minimums of 0.24 m (hardware) or 0.5 m (nonhardware). No assumed assembly dimensions or fabricated geometry.
- Added `sourceMeshWorldFocusBounds(mesh)` to `cadFocus.ts`: validates a real position geometry bounding box, updates the original mesh world transform and measures only that mesh, **not its descendant meshes**, using `sourceMeshOwnWorldBounds`.
- Updated `ModelBAssemblyStage.tsx` so selecting any authentic original CAD part focuses at **every** scroll chapter, including progress 0. The previously hardcoded distance is replaced with a source-geometry measured, aspect-aware fit. The X-ray verification callback is only true when the exact selected mesh exists **and its geometry can be framed**. Invalid mesh bounds refuse the focus and report an error.
- Removed `handleCatalogSelect`'s forced scroll-to-95%-progress behavior from `ModelBAssemblyPage.tsx`. Source inspection now preserves the user's actual scroll progress and temporarily presents only the selected source CAD mesh at its authored final pose. Clearing focus restores the previous timeline pose/material state.
- Added `sourceCadFocusFraming.test.ts` (six authored Vitest cases) and two native Three.js geometry validation cases to `cadFocus.test.ts`.
- Expanded the existing DEV-only `verify-model-b-cad-assembly.mjs` source-browser test: after returning to chapter 00, select an actual source CAD component; assert no jump in the scrubber, verified X-ray, nonblank changed WebGL frame, clear focus, assert restored original scroll scene and unchanged progress. On desktop+mobile it now records **20** actual-source screenshots and two per-layout JSON audits, not 18.

## Verified versus pending

- **Actually executed against exact GitHub-stored source function:** 6/6 standalone focus-framing tests PASS, including **10,000 deterministic random source geometry sizes, FOV values and desktop/mobile aspect ratios**, exact source-frame FOV constraints, safe small-hardware macro distance, invalid geometry and deterministic repeatability.
- The GitHub files were read back on the work branch and the local Chromium test script's JavaScript syntax was parsed.
- **Not executed:** repo Vitest, native Three.js geometry tests, full app typecheck and the authentic source CAD 20-screenshot Chromium smoke. The complete monorepo checkout, original private P2.8/P2.12/P2.14 binary source assets and runtime WebGL session are not available to this assistant environment. Thus **P2.40 visual browser approval is HOLD**, not a rendered complete F1 proof.

## Reproduce in an actual local checkout, without GitHub Actions

```bash
npm ci
npm run typecheck --workspace=@peds/web
npx vitest run apps/web/src/dev/modelBAssembly/sourceCadFocusFraming.test.ts apps/web/src/dev/modelBAssembly/cadFocus.test.ts
npm run dev --workspace=@peds/web
# Native original P2.8/P2.12/P2.14 staged in the DEV-only local CAD route:
PEDS_CHROMIUM_PATH=/usr/bin/chromium npm run qa:model-b:cad-assembly --workspace=@peds/web
```

The 20-image smoke should not PASS unless actual source assets have rendered. Original source geometry and CAD data remain immutable. No GitHub Actions, merge or deployment. P2.34 native 84-solid mechanical G2 still BLOCKED/HOLD.
