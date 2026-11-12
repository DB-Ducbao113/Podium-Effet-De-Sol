# P2.35C — Preserve original Model B multi-material opacity

Date: 2026-11-12. Branch: `work/engineering-four-corners-local`.

## Bug fixed

The original source-shell animation recorded only `materials[0].opacity` for every mesh, then assigned that single value to **all** materials on that mesh. Original owner Model B meshes may contain multiple materials (opaque paint, semi-transparent glass, decals). The animation thus overwrote independent source material alpha values, even after all original mesh transforms were restored at final scroll. It also forced `depthWrite=true` on all materials in the final chapter, ignoring original per-material depth-write settings.

## Implementation

- `sourceShellMaterialState.ts`: pure per-material calculation of animated opacity and depth-write from immutable original material settings. Reject invalid alpha; clamp shell transition.
- `ModelBAssemblyStage.tsx`: capture `opacity` and `depthWrite` from **each original material** before `copyMaterials` clones the source. Use the indexed original states for every rendered frame; the original GLB materials and geometry are not mutated.
- `sourceShellMaterialState.test.ts`: four Vitest cases for original final opacity, faded alpha, depth-write safety, invalid inputs.

## Verification

Five standalone local Node.js assertions of the same scalar formula **PASS**. Four project Vitest tests have been authored but **not run**. No browser/Chromium/WebGL screenshot or full-app typecheck has been executed. GitHub source files were read back after push.

The original P2.34 STEP/index/contact data remain unavailable. **P2.34 mechanical G2 BLOCKED; P2.35 frontend IN PROGRESS.** No merge, deploy or GitHub Actions.
