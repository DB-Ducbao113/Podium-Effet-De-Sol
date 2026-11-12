# P2.41 — Native source CAD X-ray depth composition and honest runtime proof

Date: 2026-11-12. Work branch: `work/engineering-four-corners-local`.

## Actual defect

P2.39–P2.40 used only transparency to reveal an imported original bolt or bearing. Even if the Model B exterior was faded to 14%, the selected mesh's cloned viewer material still performed normal depth testing and could remain hidden by nearer opaque parts. Meanwhile the page could mark `data-model-b-cad-xray-active=true` when the source mesh had been identified and its camera bounds were measured, **before the WebGL material state had actually been applied**.

## P2.41 implemented

- New pure module `sourceCadXrayRenderLayer.ts`: when an original P2.8/P2.12/P2.14 CAD mesh is selected, only that mesh receives `depthTest=false` and a late `renderOrder` of at least 1000. Custom source renderOrder values above 1000 receive an even later order. All other source mesh instances retain their original depth test and draw ordering.
- In `ModelBAssemblyStage.tsx`, record each viewer-cloned original CAD material's `depthTest` value and each authentic mesh's `renderOrder` when binding into the measured 4-wheel scene. These exact values are restored automatically on the next frame when focus closes or switches parts. Vertex positions, authored geometry, source GLB material bytes and source CAD names are unchanged.
- New `sourceCadXrayFrameVerified()` returns true only if an **actually visible selected original source mesh** has at least one material, every material is fully opaque, depth-writing and non-depth-tested, and its scene draw order is late. The stage calls back only when the applied renderer state changes, avoiding repeated React updates on every frame.
- `ModelBAssemblyPage.tsx` now advertises `X-RAY FOCUS / VERIFIED ORIGINAL SOURCE` and `data-model-b-cad-xray-active=true` only when **both** exact source geometry camera validation and actual R3F material-compositing confirmation match the requested part ID, wheel station and CAD source origin. It also publishes `data-model-b-cad-xray-compositing=PASS|OFF`.
- The Chromium source-assembly smoke test now requires `compositing=PASS` during authentic X-ray focus and `OFF` after clearing the selected source mesh.

## Executed tests

- `sourceCadXrayRenderLayer.test.ts` contains **nine authored Vitest tests** for selected source-only draw priority, source renderer restoration, unaffected sibling depth tests, custom original render order, original source non-depth-tested materials, 1,001 scroll focus/clear cycles, malformed source renderer values, explicit renderer frame-apply gate, and prevention of false PASS for hidden, depth-tested or transparent selected materials.
- **Executed independent V8 checks against the exact GitHub-saved pure functions:** 7/7 source render layer cases PASS; 10/10 per-frame compositing evidence cases PASS (including a 1,001-sample reversible focus state cycle).

The actual Three.js/React/WebGL app and its Vitest suite **have not been run** because the complete checkout, private source binaries and npm dependencies are not locally available. No original F1 screenshot or browser PASS is claimed.

## Scope

This is a presentation-only visualization of an authenticated source CAD mesh, not a certified physical X-ray, CT cross-section, mechanical assembly, interference resolution, or verified bearing/bolt installation. The source-backed rear wheel-end remains a front P2.8 visual proxy. P2.34 Mechanical G2 remains BLOCKED/HOLD.

No GitHub Actions, merge or deployment.
