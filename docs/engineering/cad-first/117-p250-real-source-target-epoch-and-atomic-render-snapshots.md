# P2.50 — Real source-target epoch and atomic frame QA for Model B

Date: 2026-11-13. Branch: `work/engineering-four-corners-local`.

**Implementation:** pushed. **TypeScript / Node isolated checks:** executed. **Actual native WebGL/GLB acceptance:** HOLD. **P2.34 Mechanical G2:** BLOCKED/HOLD.

## Defects discovered in P2.49

The P2.49 stage tested scene settlement using:

```ts
sourceFrameSettled(current,desired,Math.max(0,current.frame-2))
```

This calculated the *first* frame directly from the current frame, so the requirement that **two new frames elapsed after the target changed** was effectively tautological. The stage could mark a brand-new scroll chapter as settled on the same render frame if the camera and geometry already happened to be close enough. More importantly, a new authentic CAD source or a newly inspected native bolt at the same scroll progress could inherit an old “settled” frame status.

The Chromium QA separately read scene/camera convergence, GPU scheduled draw ranges and `THREE.Points.onAfterRender` counts across multiple canvas reads. R3F updates the scheduled values in `useFrame` and receives render callbacks later in the frame; mixing those observations could generate stale or inconsistent source screenshot evidence. The X-ray entry/exit checks also did not require a distinct target epoch.

## Implemented changes

1. Added `sourceFrameTargetEpoch.ts` with an actual `targetIssuedFrame` tracked in a persistent React `useRef`. It changes when the desired scroll fraction changes, when the authentic source Object3D identity is replaced, or when the native selected CAD mesh identity changes. Source object references, not guessed mesh names, define identity. Old epochs are never reused for a new Model B source, selected nut or reversed scroll target. Invalid or backward frame counters fail closed.
2. `ModelBAssemblyStage.tsx` advances this epoch from the actual R3F `useFrame` and passes the stored issuance frame to the existing `sourceFrameSettled` validation. It publishes `data-peds-model-b-target-issued-frame` alongside actual scene progress, camera error and current R3F frame. The former tautological expression `Math.max(0,current.frame-2)` has been removed.
3. New dependency-free `source-cad-frame-snapshot.mjs` validates an **atomic canvas snapshot**: coherent render frame, actual target epoch, camera and scene convergence, scheduled native CAD drawRange and post-render callback counts. A newly issued scroll target must have a genuinely later epoch than the previous frame, unless the very first screenshot requests the initial chapter already at progress 0.
4. `verify-model-b-cad-assembly.mjs` waits for frame `>=` previous screenshot frame + 2, frame `>=` actual target issuance frame + 2, a new target epoch when the scroll chapter changed, source progress error ≤0.004 and camera position/look error ≤0.015 m. For chapters with scheduled visible native dots, the canvas must also have real `onAfterRender` callbacks. A single `canvas.evaluate` records both scene/camera and render evidence for one sample; the same sample is validated and saved to JSON.
5. Original P2.8/P2.12/P2.14 source-CAD X-ray selection and X-ray clearing now additionally require their own new target epoch, at least two new source frames and the expected inspection callback state before taking a real PNG. This blocks accepting a previous part's settled camera or stale selected-point evidence.
6. Added `sourceFrameTargetEpoch.test.ts` (eight authored Vitest cases), `source-cad-frame-snapshot.test.mjs` (ten Node built-in cases) and an NPM script `qa:model-b:frame-snapshot` for repeatable dependency-light QA.

## Verification actually executed

The two exact sources copied to the assistant's active local container were hashed with `git hash-object`; both matched their GitHub source blobs:

- `sourceFrameTargetEpoch.ts`: `93689e7d0ec01f6bcb340d328cc8026dee48870b`.
- `source-cad-frame-snapshot.mjs`: `94ceac90dd1cf8e83b80c13806768b4a18db07fd`.
- The committed Node test file was also byte-identical: `c06b3e7c6650442488a7be137cc7fc372a70b750`.

Executed in `/mnt/data/p250`:

```bash
tsc --strict --noEmit --target ES2022 --module ESNext \
  sourceFrameTargetEpoch.ts sourceFrameSettling.ts
node --experimental-strip-types --test \
  sourceFrameTargetEpoch.node.test.mjs \
  source-cad-frame-snapshot.test.mjs
```

- **TypeScript strict:** PASS.
- **18/18 Node test groups:** PASS (8 tests of genuine epoch behavior + the 10 verbatim committed Node snapshot tests).
- Includes source replacement, fastener selection, clearing X-ray, forward/reverse chapter changes, stale callback frames, invalid camera/scene telemetry, 10,001 source target changes and 10,001 coherent target snapshot checks.
- The complete GitHub Chromium QA script was read back and syntactically parsed. Its true WebGL canvas selector, non-tautological epoch handling, atomic snapshot, source render callback gates and X-ray entry/exit epoch checks are present.
- **Not executed:** full application React/Three.js typecheck, native Vitest suite, WebGL GPU compilation, screenshots/video or real four-wheel F1 visual acceptance. The assistant runtime lacks the complete repository checkout and required original binary Model B / private P2.8/P2.12/P2.14 CAD files.

## Run in a real Model B source checkout

```bash
npm ci
npm run typecheck --workspace=@peds/web
npm run qa:model-b:frame-snapshot --workspace=@peds/web
npx vitest run apps/web/src/dev/modelBAssembly/sourceFrameTargetEpoch.test.ts
npm run dev --workspace=@peds/web
# With local original SHA-pinned 59/19/16 CAD source binaries:
PEDS_CHROMIUM_PATH=/usr/bin/chromium \
 npm run qa:model-b:cad-assembly --workspace=@peds/web
```

This patch fixes QA synchronization. It does **not** add certified CAD mates, modify original GLB geometry, or imply the front-source rear wheel-end visual proxy is genuine rear mechanical design. **P2.34 G2 stays BLOCKED/HOLD.** No GitHub Actions, merge or deployment.
