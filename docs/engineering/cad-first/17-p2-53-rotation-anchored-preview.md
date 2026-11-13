# P2.53/54 — Rotation-anchored P2.8 overlay and camera pose review

**Repository:** `DB-Ducbao113/Podium-Effet-De-Sol`  
**Branch:** `feat/engineering-inside-machine-v2`  
**Release status:** DEV-only / **G2 HOLD**

## Defect and impact

The original P2.8 front tyre center is generally **not at the GLB root origin**.
The measured-wheel overlay formerly applied this translation:

`ModelBMeasuredWheelCenter - P28OriginalWheelCenter + UserOffset`.

That is only valid when the CAD root rotation is identity. Any manual
preview rotation moves the actual tyre center away from the matched
Model B wheel center, even though the UI continues to describe it as a
wheel-centered overlay.

Fastener macro camera targeting also used a simple source-position
difference. Once P2.8 was rotated, that camera target no longer matched
the rendered mesh position.

## Changes

1. Add pure `assemblyAnchor.ts`: rigid quaternion-vector rotation and
   `anchoredSourceTranslation(targetM, sourceM, quaternion, userOffsetM)`.
   Formula is **translation = target - R(source) + userOffset**.
   No scale or geometry edits. Reject nonunit/nonfinite quaternions and
   invalid source/target coordinates.
2. In `AssemblyPreviewStage.tsx`, compute the rotation and placement
   once before the camera focus. Apply the same quaternion to the wheel
   center when determining the overlay position.
3. Compute macro camera targets in the *actually rendered* P2.8 pose:
   selected CAD part center (plus temporary presentation offset)
   transformed by the current root quaternion and translation.
4. A registered landmark transform remains a visual fit, never a
   certified mechanical mate. Macro camera works with an active
   registration even if the measured-wheel overlay checkbox is off.
5. If a user manually edits translation or Euler angles after fitting
   landmarks, clear the old `registration`, provenance and derived
   transform before accepting the manual pose. Do not export stale fit
   evidence as though it applied to the new pose.

## Evidence and regression tests

`assemblyAnchor.test.ts` adds six Vitest cases:
identity placement, 90° anchored rotation, 180° rotation, source array
immutability, invalid quaternion, and invalid coordinates.

In this environment an identical standalone module was executed with:

- `node --experimental-strip-types test.mjs` — **PASS**, nine assertions
  covering anchor mapping, 90°/180°, immutability and invalid values;
- deterministic 400-rotation numeric soak test — **PASS**;
- `tsc --strict --target ES2022 --module esnext --moduleResolution bundler --noEmit assemblyAnchor.ts` — **PASS**.

**Not executed:** full repository typecheck, Vitest suite, Chromium/WebGL
raycasting or GPU camera inspection. These tests must still be run
against the branch with dependency installation and owner original
P2.8 STEP/GLB assets before owner acceptance.

## Remaining hold gates and next batch

- Actual source hardpoint correspondences and native CAD/Model B
  clearances have not been proven.
- Four-corner complete F1 assembly and 18-chapter 0→100→0 full-car
  cinematic browser video remain unverified.
- P2.54: final batch-level QA audit, compile/build/browser acceptance
  checklist and release HOLD decision (unless real evidence exists).

**Do not equate reaching P2.54 with a physically complete F1 model.**
