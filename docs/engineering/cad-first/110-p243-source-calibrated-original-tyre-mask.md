# P2.43 — Source-calibrated four-wheel masks; source-stable dither

Date: 2026-11-12  
Branch: `work/engineering-four-corners-local`  
Scope: frontend visual source preservation, NOT physical CAD acceptance.

## Defects discovered after P2.42

1. The four owner showroom tyre cut-out windows used a hard-coded axial half-depth of `max(2.5,1.24*radius)` in original Model B source units. This was wider than the actual verified P2.8 tyre thickness and could hide original F1 body work, brake attachments or internal geometry near each wheel.
2. The dissolve pattern depended on `gl_FragCoord.xy`, i.e. framebuffer pixel coordinates. When the camera or user scroll moved, the screen-space random threshold could crawl over the stationary tyre surface instead of staying attached to the owner's original source geometry.

## Implementation

- `ownerMeasuredFit.ts` now exposes `originalP28TyreWidthM` measured from the **SHA-verified P2.8 `P2_TYRE_SLICK_BODY` native source bounds**; the existing calibration already verifies its Z thickness near 0.314 m.
- New `sourceWheelMaskCalibration.ts`: `sourceWheelMaskHalfWidth(tyreWidthM,shellScale)` validates original P2.8 thickness and known nonmetric Model B source scale before converting to GLB source units; applies an 80% of full width half-envelope (= physical half width with 60% safety margin). For the known 0.314 m tyre at 0.173572872 source scale, this is ~1.447 source units, instead of the previous ~2.5–2.7 source units. Also includes a deterministic, source-local 3D dither reference helper.
- `showroomWheelMask.ts`: adds scalar `pedsWheelHalfWidth` uniform derived from that verified native CAD geometry, uses `abs(local.z)<pedsWheelHalfWidth`, and changes the partial dissolve to `fract(sin(dot(vPedsSourcePosition,vec3(...)))*43758.5453)` instead of `gl_FragCoord.xy`. The original body material/geometry and GLB bytes are unchanged. The existing one-mask API and newer four-per-wheel uniforms remain compatible.
- Updated `ownerMeasuredFit.test.ts` to check native source tyre width. Updated `fourCornerLayout.test.ts` typed original-fit fixture to carry that width. Updated `showroomWheelMask.test.ts` to require the measured axial mask and stable 3D source-position threshold.
- Added `sourceWheelMaskCalibration.test.ts` with seven authored Vitest cases for genuine source dimensions, scale bounds, deterministic 3D source threshold, a 10,000-point dither distribution and invalid source inputs.

## Actually executed

Two independent V8 test suites extracted and ran the **GitHub-saved function bodies**, not a reconstruction from a visual description.

- **7/7** source tyre width + deterministic 3D dither tests PASS, including 10,000 source coordinate samples.
- **8/8** GLB wheel-mask shader injection test cases PASS with the exact source material `onBeforeCompile` function and a minimal material/uniform stub: old scalar mask, four-mask array, 0.314 m tyre width conversion and GLSL declarations, source-space dither, actual string newline escaping, bad original source widths, missing wheel envelopes, and missing GLSL injection points.

These tests verify the emitted shader strings and algorithm. They do **not** compile the production Three.js `MeshStandardMaterial` shader on a functioning WebGL GPU, nor do they verify the real owner's original Model B GLB in Chromium. The available headless Chromium in this environment could launch but did not expose a WebGL rendering context; browser/visual acceptance remains **HOLD**. Whole-repository npm dependencies, full React/Vitest suite and private SHA-verified P2.8/P2.12/P2.14 CAD binaries are not available here.

## Manual acceptance in native local checkout

```bash
npm ci
npm run typecheck --workspace=@peds/web
npx vitest run apps/web/src/dev/assemblyPreview/sourceWheelMaskCalibration.test.ts \
  apps/web/src/dev/assemblyPreview/showroomWheelMask.test.ts \
  apps/web/src/dev/assemblyPreview/ownerMeasuredFit.test.ts \
  apps/web/src/dev/assemblyPreview/fourCornerLayout.test.ts
npm run dev --workspace=@peds/web
# With authentic 59/19/16 source files staged locally:
PEDS_CHROMIUM_PATH=/usr/bin/chromium npm run qa:model-b:cad-assembly --workspace=@peds/web
```

## Gate

**P2.43 source implementation: completed. P2.43 browser acceptance: HOLD.** The original P2.8 front geometry is still reused as a visual rear wheel-end proxy. P2.34 six-ball CV 84-solid mechanical G2 remains BLOCKED/HOLD. No merge, deploy or GitHub Actions.
