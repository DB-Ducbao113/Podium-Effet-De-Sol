# P2.47 — Distinguish requested CAD drawRange from actual Three.js post-render evidence

**Date:** 2026-11-13  
**Work branch:** `work/engineering-four-corners-local`  
**Code-level patch:** COMPLETE / pushed  
**Authentic source GLB + full-app Chromium/WebGL acceptance:** HOLD  
**P2.34 Mechanical G2:** BLOCKED/HOLD

## Actual defect in P2.46

The local browser QA described three values taken from the canvas as "actual GPU draw ranges". In fact, the stage wrote them in R3F `useFrame` **before** Three.js rendered the scene. They were derived from `BufferGeometry.drawRange` and material visibility, not the renderer's actual object render callbacks. A source mesh could have 500 planned points yet remain invisible, rejected by the shader, or never have its `THREE.Points` object processed. The previous QA could report a source-part success based solely on that plan.

A related fail-open case was `Number(element.dataset.missingAttribute)`: missing attributes could be silently converted from null to zero.

## P2.47 implementation

1. `sourceCadRenderEvidence.ts` is a pure typed helper with a per-frame counter for **original sampled source vertex points**. `beginSourceCadRenderEvidence` resets counts every R3F frame to eliminate stale numbers. `recordSourceCadAfterRender` validates a genuine source point buffer's position count and its exact drawRange boundaries, distinguishes construction from inspection, and records only a positive count from the actual `THREE.Points.onAfterRender` callback. An absent callback produces zero observed points even if the scheduled draw range is positive.
2. `ModelBAssemblyStage.tsx` wires `onAfterRender` only to the viewer-owned sampled original P2.8 tyre/hardware `THREE.Points` layers and the selected genuine source CAD inspection layer. A stable React `useCallback` avoids stale closures during source swaps or inspector changes. The real WebGL canvas exposes:
   - `data-peds-model-b-drawn-cad-dots` and `data-peds-model-b-visible-cad-dots`: **scheduled**, from `useFrame`, retained for comparison;
   - `data-peds-model-b-rendered-cad-dots`: **post-render callback count** for build dots;
   - `data-peds-model-b-rendered-inspection-dots`: **post-render callback count** for selected original source CAD;
   - `data-peds-model-b-render-calls`, `data-peds-model-b-render-frame`, `data-peds-model-b-render-evidence`: per-frame callback count, sequence and `PENDING`/`OBSERVED`/`INVALID` status.
3. `verify-model-b-cad-assembly.mjs` no longer accepts scheduled counts as proof of actual source geometry rendering. During real forward/reverse wheel assembly it verifies the callback counts are bounded by scheduled visible samples, source layers are not processed outside their chapters, actual hardware point callbacks increase in chapter 02, the selected original part receives nonzero inspection callbacks, and they disappear when the selection is cleared.
4. New dependency-free `source-cad-draw-evidence.mjs` rejects absent browser telemetry, impossible source point counts, mismatched callback status, false draw call claims and X-ray dots unexpectedly mixed with normal build frames.
5. New source tests: `sourceCadRenderEvidence.test.ts` (8 Vitest cases authored; full repo Vitest not run) and `source-cad-draw-evidence.test.mjs` (10 Node built-in test cases executed).
6. Added `qa:model-b:cad-draw-evidence` to `apps/web/package.json`, runnable without any real CAD source files or a graphical browser.

## Tests ACTUALLY executed

In the assistant container, a byte-identical copy of the GitHub-saved `sourceCadRenderEvidence.ts` and the exact `source-cad-draw-evidence.mjs` and its authored `.test.mjs` were materialized. `git hash-object` of all three copied sources matched their respective read-back GitHub blob SHAs:

- Source render audit `0ab1932154deb4593c03bd670a6ba3d0fad8b948`
- QA helper `7b59de9e8b4a4786c8f28fd0227b1e8532fbed2a`
- Authored Node QA tests `9fd08a3df25a22b018745efa9cbaa5fc7f64a149`

Executed:
```bash
tsc --strict --noEmit --target ES2022 --module esnext sourceCadRenderEvidence.ts
node --experimental-strip-types --test \
 sourceCadRenderEvidence.node.test.mjs \
 source-cad-draw-evidence.test.mjs
```

**TypeScript strict: PASS. Node: 18/18 PASS** (8 Node equivalent cases for the genuine render evidence helper + the exact 10 committed QA test cases). Tests include **2,002 forward/reverse frame checks and 10,000 additional sampled valid render states**, source buffer bounds, selected inspection counts, missing attributes, false positive scheduled draw ranges and stale counters. The onAfterRender integration in actual React/Three.js and GLB renderer was **not** executed.

## Important limitation

A `THREE.Points.onAfterRender` callback means Three.js passed that source object through its rendering pathway. It is **stronger than simply reading drawRange**, but by itself does not prove all source vertices resulted in visible screen pixels, a valid GPU shader, or authentic CAD alignment. The existing 28-PNG Chromium pixel/bounds checks are still necessary; the renderer test cannot be declared PASS until the original Model B binary and the private SHA-verified P2.8/P2.12/P2.14 files are available in a functioning source-equipped checkout.

The source-only point geometry, original owner GLB material bytes, four wheel centres, renderer budget (10,544 source dots, 28 build dot layers), rear proxy disclosure and P2.34 mechanical G2 HOLD remain unchanged.

## Reproduction (local, without GitHub Actions)

```bash
npm run qa:model-b:cad-draw-evidence --workspace=@peds/web
npm run typecheck --workspace=@peds/web
npm run test --workspace=@peds/web -- \
  src/dev/modelBAssembly/sourceCadRenderEvidence.test.ts
# Run real CAD acceptance only when all original source binaries are staged:
npm run dev --workspace=@peds/web
PEDS_CHROMIUM_PATH=/usr/bin/chromium \
 npm run qa:model-b:cad-assembly --workspace=@peds/web
```

**No merge, deployment or GitHub Actions.** The patch prevents false CAD render QA evidence; it does not certify the engineering assembly.
