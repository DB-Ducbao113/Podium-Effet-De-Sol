# P2.42 — Four measured original Model B wheel stations assemble sequentially

Date: 2026-11-12. Work branch: `work/engineering-four-corners-local`.

## Two real visual problems

The imported original P2.8 59-mesh source is mounted into two measured front CAD stations and filtered into two rear wheel-end **visual proxy** stations, but all four clones previously called `originalPartAssembly(name,progress)`. The same source name therefore always returned the same progress at every station, making all four wheel assemblies move together. The original Model B showroom shell also used **one global tyre mask** for all four source wheel envelopes: its old tyres could disappear while the delayed replacement tyre at an individual wheel had not yet arrived, or the preview could show overlapping replacement/source tyres.

## P2.42 implemented

1. `modelBAssemblyTimeline.ts` adds `originalPartAssemblyAtStation(name,progress,WheelId)`. Each of the four existing original measured stations has a small, stable visual timing offset: front +Z (0), front -Z (+0.018), rear +Z (+0.037), rear -Z (+0.055). The original upright/bearing/hub/brake/hardware/rim/tyre part class ordering and source GLB geometry are unchanged. All source tyre meshes have returned to their measured final poses by progress 0.85.
2. `ModelBAssemblyStage.tsx` now uses the station-specific fraction for **every original P2.8 CAD mesh instance**, preserving source hardware pivots and final positions exactly. Rear P2.12/P2.14 original joint timing remains unchanged.
3. `showroomWheelMask.ts` extends the old `addReversibleWheelWindow(...,scalarMask)` API with an **optional** four-element `wheelMaskAmounts` uniform. The legacy single-mask GLSL code and existing caller tests remain unchanged. In the new path, the shader uses `uniform float pedsWheelMaskAmounts[4]` and per-wheel discard `threshold<pedsWheelMaskAmounts[wheel]`.
4. The Model B stage provides these four dynamic values in exactly the native `fit.wheels` order used by the original source wheel envelope shader. Each wheel's showroom tyre is discarded only as the corresponding real CAD-derived tyre has assembled. The X-ray inspection state deliberately masks all four original tyres so the selected actual source CAD node remains visible.
5. The local Chromium original-source QA gains forward and reverse scroll screenshots at progress 0.735 (mid-stagger), for **24 screenshots** total across desktop/mobile: ten chapter/reverse samples plus a selected original source X-ray frame and a restored-scene frame per viewport. The browser script rejects an unchanged mid-stagger versus following chapter PNG.

## Verification actually executed

- The exact saved `showroomWheelMask.ts` body was executed using an independent minimal `THREE.Vector3` and source material callback stub: **7/7 PASS**. This checked backward compatible scalar masks, four independent uniforms in source wheel order, actual GLSL newline escapes and per-wheel fragment comparison, dynamic updates, invalid mask arrays, missing measured wheel data and fail-closed shader injection points.
- The original `modelBAssemblyTimeline.ts` and exact P2.8 source part classifier were extracted from saved GitHub text and run through V8: **5/5 PASS**, including 10,001 forward/reverse progress positions, station ordering, all four tyres returned at 0.85, original P2.8 compatibility and unknown station rejection.
- Added three authored Vitest timeline cases and two authored showroom wheel mask tests.

**Not executed:** native Three.js shader/WebGL compilation against the authentic original Model B GLB, the app-wide TypeScript/Vitest suite, or the 24-screenshot Chromium test. Those need the complete project checkout and original private P2.8/P2.12/P2.14 source files. The two local algorithm suites prove the deterministic choreography and shader code generation, not final visual quality.

## Visual vs mechanical scope

These are **real source GLB mesh clones**, not a new fake four-wheel car. Their positions come from the existing four measured owner wheel centres. Only visual timing and renderer-only masking have changed; physical mating, axle loads, suspension geometry, actual rear CAD and mechanical G2 are not certified.

## Local manual QA, no GitHub Actions

```bash
npm ci
npm run typecheck --workspace=@peds/web
npx vitest run apps/web/src/dev/modelBAssembly/modelBAssemblyTimeline.test.ts apps/web/src/dev/assemblyPreview/showroomWheelMask.test.ts apps/web/src/dev/modelBAssembly/sourceCadXrayRenderLayer.test.ts
npm run dev --workspace=@peds/web
# With original 59/19/16 sources staged in DEV-only .local-assets:
PEDS_CHROMIUM_PATH=/usr/bin/chromium npm run qa:model-b:cad-assembly --workspace=@peds/web
```

No merge, deployment or GitHub Actions. P2.34 Mechanical G2 still BLOCKED/HOLD. P2.42 browser acceptance HOLD.
