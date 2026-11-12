# P2.44 — Real imported CAD vertex-dot assembly for four Model B tyres and selected components

**Date:** 2026-11-12  
**Branch:** `work/engineering-four-corners-local`  
**Source-control implementation:** complete  
**Real browser/GLB visual acceptance:** HOLD  
**Mechanical P2.34 G2:** BLOCKED/HOLD

## Why this patch matters

The previous P2.42/43 used genuine source-derived P2.8 wheel meshes but animated them as solid parts. The original engineering showcase goal also calls for the Anime.js-style **dense CAD point construction** of authentic real nuts/bolts, wheel details and components.

The existing `ownerSourceParticles.ts` provides 7,200 native source-sampled points for the exterior Model B GLB only; it did not add actual per-wheel CAD surface dots to the four animated P2.8 wheel meshes. A fake generic dot cloud would not track real CAD vertices.

## Implementation

1. New `sourceCadVertexDots.ts` builds a bounded `THREE.Points` overlay **only** by sampling original imported CAD `BufferAttribute` or `InterleavedBufferAttribute` `position` vertices with the preexisting `sourceSampleIndices` deterministic O(budget) sampler. It accepts no geometry lacking native vertex coordinates or containing invalid samples. Source bounding dimensions are validated via the existing exact own-geometry `sourceMeshWorldFocusBounds` helper.
2. Each original P2.8 `P2_TYRE_SLICK_BODY` mesh at a measured wheel station gets its **own** point layer (maximum 1,100 sampled source points per wheel, 4,400 total). The point layer is a **child of that original imported mesh**, so it follows the source car's four measured wheel transformations, side-specific yaw, normal scroll translation, tyre part assembly and original final pose without copying or inventing chassis geometry.
3. The new `sourceCadAssemblyDotOpacity(fraction,reducedMotion)` is zero before assembly, rises to 0.67 at midpoint, then is zero at the final authentic tyre pose. The final original CAD solid is never replaced or hidden by a permanent particle fake. Reduced Motion disables point animation.
4. When a visitor selects **any** original source part through the existing CAD inspector, `buildSourceCadVertexDots(selectedMesh,1200,true)` draws sampled dots from **that part's own original vertices**, with a distinct viewer-only material and renderOrder 1002. This stays attached to the actual selected bolt, wheel, race or bearing mesh even as its original screw-centre pivot moves during the scroll.
5. Three.js viewer-owned point buffers and materials are disposed on CAD source change, unmount or cleared selection. Their source GLB geometry/index buffers, material source bytes, part names, unique hashes and world registrations are never edited or disposed by this overlay.
6. `ModelBAssemblyStage.tsx` builds these source-only overlays conditionally after real P2.8 source and measured fit have been loaded, and drives their opacity from the exact wheel-specific timeline already created in P2.42. `ModelBAssemblyPage.tsx` reports the **actual sampled original P2.8 CAD vertex count** in the assembly provenance strip and in `data-model-b-authentic-cad-vertex-dots`. There is no dot cloud when the authentic P2.8 asset is unavailable.
7. The local 24-screenshot Chromium source-CAD acceptance runner now additionally requires the original CAD vertex-dot source layers to have been built before claiming a four-wheel visual QA pass.

## Source changes

- `apps/web/src/dev/modelBAssembly/sourceCadVertexDots.ts`
- `apps/web/src/dev/modelBAssembly/sourceCadVertexDots.test.ts` — 9 **authored** real Three.js/Vitest cases
- `apps/web/src/dev/modelBAssembly/ModelBAssemblyStage.tsx`
- `apps/web/src/dev/modelBAssembly/ModelBAssemblyPage.tsx`
- `apps/web/scripts/verify-model-b-cad-assembly.mjs`

## Actual verification in this assistant runtime

- **7/7** pure-source timing, size, sampling and validation tests PASS from the exact GitHub-saved code, including 10,000 dot size inputs and a 500,000-vertex sampling case constrained to 1,100 positions.
- **7/7** source-builder tests PASS with a **minimal Three.js-compatible geometry/points stub** executing the GitHub-saved `buildSourceCadVertexDots` function body. Verified exact source position correspondence (1,718 original vertices → 1,100 sampled points), four-wheel 4,400-point upper bound, authentic selection layer precedence, source material depth behavior, idempotent owned-resource disposal, invalid source vertices and invalid sampling budgets. The stubs validate the algorithm, not real GPU rendering.
- This environment has Chromium installed but headless Chromium does **not** expose a WebGL context, even with tested SwiftShader flags. The full monorepo dependencies and original private native 59/19/16 CAD files are also absent. The **9 authored native Vitest cases and actual Chromium/GLB 24-image suite have NOT been executed**.
- The source code is checked back on the work branch; do not report an authentic full-car visual PASS without actual native source render evidence.

## Real checkout acceptance, without GitHub Actions

```bash
npm ci
npm run typecheck --workspace=@peds/web
npx vitest run \
 apps/web/src/dev/modelBAssembly/sourceCadVertexDots.test.ts \
 apps/web/src/dev/modelBAssembly/ownerSourceParticles.test.ts \
 apps/web/src/dev/modelBAssembly/modelBAssemblyTimeline.test.ts
npm run dev --workspace=@peds/web
# Original SHA-pinned 59 P2.8 / 19 P2.12 / 16 P2.14 CAD sources staged locally:
PEDS_CHROMIUM_PATH=/usr/bin/chromium \
 npm run qa:model-b:cad-assembly --workspace=@peds/web
```

Check both desktop/mobile forward/reverse scroll, progressive tyre dots, bolt focus at early chapters, X-ray restoration and zero source-node/memory leaks after a model reload.

**No merge, deployment or GitHub Actions.** Do not equate sampled source vertices, native mesh counts, visual wheel proxies or P2.44 dot animations with a certified physical assembly. The actual rear wheel-end still requires genuine rear CAD, and P2.34 G2 remains HOLD.
