# P2.49 — True source-scene and camera convergence before 28-frame CAD visual QA

**Date:** 2026-11-13  
**Branch:** `work/engineering-four-corners-local`  
**Code patch:** implemented and pushed  
**Real GLB/CAD Chromium review:** HOLD  
**P2.34 mechanical G2:** BLOCKED / HOLD

## Actual defect

The local source-CAD Chromium acceptance runner waited for the DOM slider to match the desired scroll chapter, then slept a fixed 800 ms before recording the WebGL screenshot. The R3F `ModelBAnimationScene` separately eases both the actual 3D scene progress and camera position/look target. The DOM scrollbar reaching a chapter does **not** prove that the original P2.8 tyre, native fastener, P2.12/P2.14 rear-joint assembly, or camera have reached their target.

A static timeout can capture a partly assembled intermediate state, compare mismatched progress poses, wrongly reject a correct wheel timeline, or incorrectly claim a visible complete Model B. The issue affects reverse scrolling and X-ray camera transitions in particular.

## Changes

1. New pure `apps/web/src/dev/modelBAssembly/sourceFrameSettling.ts`: `sourceFrameSettled({progress,cameraErrorM,frame},targetProgress,firstFrame)` fails closed on nonfinite or out-of-range source telemetry. It requires two new R3F frames after the target was issued, measured scene progress error ≤0.004 and camera position/look-at error ≤0.015 metres.
2. In `ModelBAssemblyStage.tsx`, each `useFrame` now records the **actual** current scene progress and distance of camera position/look point from their target pose, rather than copying the DOM slider progress. Data is written directly to the existing WebGL canvas (`data-peds-model-b-scene-progress`, `data-peds-model-b-camera-error-m`, `data-peds-model-b-scene-settled`) without React state updates or GPU allocation.
3. In `apps/web/scripts/verify-model-b-cad-assembly.mjs`, each forward/reverse chapter remembers the previous render frame, moves the scrollbar, waits for the actual 3D model progress and camera to converge **in at least two subsequent frames**, and only then reads original-source CAD render callbacks and captures the PNG. Removed the fixed 800-ms wait. The 28-image QA JSON includes the measured scene progress/camera convergence of each frame. X-ray camera entry and return to normal scene also await real camera convergence rather than fixed delays.
4. Corrected the browser script's canvas selector to the actual `.mb-build-webgl canvas` (verified against `ModelBAssemblyPage.tsx`), so the new convergence gate reads the real existing Model B canvas. Missing canvas, missing measurements and a frozen R3F frame result in timeout/HOLD, not a false PASS.
5. Added `sourceFrameSettling.test.ts` with six authored Vitest cases for stage progress vs DOM scroll, camera flythrough, reverse chapters, fresh frame requirement, malformed source frame data and deterministic 10,001-step forward/backward coverage.

## Tests executed

- A byte-identical local copy of the GitHub-saved `sourceFrameSettling.ts` was checked with `git hash-object`: local and repository blob both `8f9fdb936de2ffcc5f547299335e4266054dc390`.
- `tsc --strict --noEmit --target ES2022 --module ESNext sourceFrameSettling.ts` **PASS**.
- `node --experimental-strip-types check.mjs` against that exact file: **6/6 PASS**, including 20,002 deterministic forward/reverse source progress values.
- The GitHub-stored Chromium QA program's complete JavaScript body was syntax parsed successfully; read-back confirmed the actual canvas selector, no original fixed delays, 3D progress and camera gates, and previous-frame identity requirement.
- Full monorepo TypeScript/Vitest, native Three.js model integration and **real 28-frame source-CAD Chromium/WebGL rendering have not been run**, because the private original Model B GLB and original P2.8/P2.12/P2.14 CAD binary input assets are not available in this assistant environment. Do not claim visual PASS.

## Actual local acceptance commands

```bash
npm ci
npm run typecheck --workspace=@peds/web
npx vitest run apps/web/src/dev/modelBAssembly/sourceFrameSettling.test.ts
npm run dev --workspace=@peds/web
# After staging the original SHA-verified 59/19/16 native CAD layers:
PEDS_CHROMIUM_PATH=/usr/bin/chromium \
 npm run qa:model-b:cad-assembly --workspace=@peds/web
```

This patch changes browser acceptance timing and instrumentation only, not CAD source geometry, mechanical constraints, original F1 materials, four-wheel placements, render effect styling or source file provenance. P2.8 wheel-end at the rear is still a front-source visual proxy, not a certified real rear suspension. **P2.34 G2 stays BLOCKED/HOLD.** No GitHub Actions, merge or deployment.
