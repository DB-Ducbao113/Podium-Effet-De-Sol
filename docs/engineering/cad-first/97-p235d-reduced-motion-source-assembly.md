# P2.35D — Reduced-motion accessibility for original Model B assembly

## Scope
The Model B stage previously used `reducedMotion` only to disable progress smoothing, but continued animating the original owner shell's separated mesh nodes and CAD vertex particles. For users with reduced-motion preferences this still caused unnecessary motion during scrolling.

## Changes
- Added `sourceBodyVisualDisplacement(progress,name,hasCad,reducedMotion,cadSeparation)` to `sourceOnlyMeshMotion.ts`. When reduced motion is enabled, displacement is exactly zero; otherwise the existing source-only per-mesh choreography and CAD-present body displacement are unchanged.
- Updated `ModelBAssemblyStage.tsx` to call this helper for each original mesh and hide source vertex dust in reduced-motion mode.
- Added a Vitest test that checks both CAD and source-only branches for 101 scroll values with reduced motion on and off.

## Constraints
This does not disable source CAD hardware chapter progress, change camera framing, add invented source parts, or resolve P2.34 mechanical G2. No browser QA or app Vitest run has been executed in this environment; only GitHub source updates and read-back verification were performed.

Branch: `work/engineering-four-corners-local`. P2.35 IN PROGRESS; P2.34 G2 HOLD. No merge, deploy or GitHub Actions.
