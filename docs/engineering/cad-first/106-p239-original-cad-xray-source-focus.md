# P2.39 — Source CAD X-ray component inspection

Date: 2026-11-12. Branch: `work/engineering-four-corners-local`.

## The UX problem

Model B already supports searching the SHA-verified P2.8/P2.12/P2.14 source CAD inventory, selecting an original source part and focusing the camera on the selected native geometry. However, visually inspecting tiny bolts, bearing rings and other internal CAD nodes was difficult: the F1 exterior remained mostly opaque and all nearby CAD mesh nodes continued to depth-occlude the target.

## Actual frontend work

- `cadInspectionVisualFrame.ts` defines a deterministic, reversible material-only focus presentation: the selected source mesh becomes fully opaque with depth writes, all other existing source CAD parts retain their authored scroll transforms but are shown at up to 8% opacity with depth writes disabled, and the original owner Model B body material is reduced to at most 14% shell alpha. No original GLB geometry, material source bytes, topology or mechanical mate is changed.
- In `ModelBAssemblyStage.tsx`, `useFrame` applies the focus appearance to **the one existing original source CAD mesh selected by actual part ID, wheel station and CAD origin**. The selected component moves to its original authored final pose even if the camera was still in an earlier scroll chapter. Source-vertex particle dust is disabled while inspecting, avoiding visual clutter. Clearing the selection returns all viewer materials to the authored timeline/chapter state. The existing 4-wheel source provenance audit and screw-pivot original-pose logic remain.
- The stage now returns an explicit `onFocusVerified` callback **only after the selected original mesh uniquely resolves**; failures are reported instead of silently claiming focus success.
- `ModelBAssemblyPage.tsx` displays `X-RAY FOCUS / VERIFIED ORIGINAL SOURCE` only after the stage callback matches source part ID, wheel station AND origin. A machine-readable `data-model-b-cad-xray-active` attribute allows actual WebGL QA to distinguish requested inspection from confirmed source-mesh focus.
- The local CAD Chromium acceptance program saves **18 WebGL PNGs** total: eight scroll/reverse images plus one selected real CAD X-ray image per desktop/mobile layout. It requires the confirmed source focus flag and a pixel difference from the unselected final-car image. This is not an invented car screenshot.

## Test evidence

- `cadInspectionVisualFrame.test.ts`: seven authored Vitest cases.
- **Actually executed 7/7 independent V8 pure-function checks PASS** from the GitHub-saved `cadInspectionVisualFrame.ts`: 1,001 normal scroll states, selected full opacity/final pose, dimming of nonselected CAD, reversible original shell alpha, reduced-motion final pose, NaN/Infinity handling and 1,001 × four focus-mode bounds checks.
- **NOT executed:** monorepo Vitest, full React/Three.js typecheck, original source GLB Chromium screenshot program and 18-image visual evidence. Real F1 source 59/19/16 private CAD binaries are unavailable in this assistant runtime.

## Scope

This patch is a non-destructive **source CAD part inspection** visual, not a certified physical X-ray, manufacturing CT scan, B-Rep section cut, bolt installation, torque path, suspension mate or finished four-corner kinematics. P2.34 mechanical G2 remains HOLD.

## Manual source review

```bash
npm ci
npm run typecheck --workspace=@peds/web
npx vitest run apps/web/src/dev/modelBAssembly/cadInspectionVisualFrame.test.ts apps/web/src/dev/modelBAssembly/cadFocus.test.ts
npm run dev --workspace=@peds/web
# After the 59/19/16 original CAD layers are staged:
npm run qa:model-b:cad-assembly --workspace=@peds/web
```

No GitHub Actions, merge or deploy.

**P2.39 implementation complete. Browser visual QA HOLD.**
