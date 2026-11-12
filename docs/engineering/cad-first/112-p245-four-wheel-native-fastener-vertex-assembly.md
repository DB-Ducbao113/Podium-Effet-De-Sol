# P2.45 — Four-wheel native CAD fastener vertex construction and leak-safe source overlays

**Date:** 2026-11-12  
**Branch:** `work/engineering-four-corners-local`  
**Implementation:** committed  
**Actual original F1 Chromium/WebGL visual acceptance:** HOLD  
**P2.34 source84 mechanical G2:** BLOCKED/HOLD

## Corrections and visible changes

### 1. Fix the real P2.44 source-dot visibility problem

The original P2.44 point overlays copied actual GLB vertices and then drew them with ordinary `depthTest=true`. Because the sampled dots lie directly on the existing opaque mesh surface, the mesh's depth buffer could fully or partially occlude the dots, producing almost no visible engineering-point effect.

`sourceCadVertexDots.ts` now draws only these temporary viewer-owned source-vertex points with `depthTest=false`, `depthWrite=false` and `renderOrder=850`. Selected CAD inspection points retain their later render order 1002. Both are transparent layers and are **invisible at the final authentic source pose**. No original CAD materials, vertex/index data, names, transforms or source GLB bytes are changed.

### 2. Extend from only four tyre surfaces to actual source fasteners

The P2.44 dots previously covered four original P2.8 tyre meshes, plus one CAD part manually selected in X-ray. It did not show nuts/bolts in the actual four-wheel assembly sequence.

New `sourceCadDotSelection.ts` takes the actual `visual.meshes` mounted scene inventory. From each original P2.8 wheel station, it deterministically selects **at most six existing** native mesh IDs already classified as hardware (`FASTENER`, `NUT`, `STUD`, `LOCK`, `RETAINER`, etc.). It never invents a hardware name or shape, never reads rear P2.12/P2.14 as a P2.8 bolt, and rejects unknown fifth wheel stations or duplicated IDs.

Each qualifying original hardware mesh receives its own bounded 256-source-vertex `THREE.Points` layer, parented directly to that mesh, so the real wheel carrier, source screw pivot and original-part assembly timeline are applied without a second movement calculation.

- Four tyre surfaces: at most **4 × 1,100 = 4,400** original vertex samples.
- Up to six fasteners at each of four wheel stations: at most **24 × 256 = 6,144** samples.
- Absolute combined ceiling: **10,544 source samples / 28 viewer-owned point draw layers**, on top of the old original exterior GLB vertex dust effect. Actual totals may be lower when a source mesh has fewer vertices or when fewer hardware parts exist.
- Reduced Motion and early/late original-part timeline fractions continue to suppress build dots; authentic solid native source CAD is never replaced.
- Part X-ray remains a separate overlay sampled exclusively from the selected native mesh.

### 3. Fix source changes and React effect lifecycle

The P2.44 stage stored imperative `THREE.Points` objects in React `useState`. During model replacement, selected-source changes, React StrictMode double effect cleanup or fast scroll, a render could momentarily retain a state reference to a **disposed** GPU buffer.

`ModelBAssemblyStage.tsx` now manages viewer-only dot layers through `useRef`, not state. Each effect cleanup immediately removes its layer from the current ref **before** disposing its geometry/material; replacing a selected part clears the previous selected overlay on cleanup. All callbacks to the React page report only the actual sampled mesh/vertex count and do not hold the graphics resources.

`ModelBAssemblyPage.tsx` reports both total authentic sampled vertices and number of genuine fastener meshes on the page and as DOM audit attributes.

### 4. Browser QA gate

`verify-model-b-cad-assembly.mjs` now requires authentic source vertex-dot evidence and a positive fastener layer count, validates the 10,544 point / 24 fastener mesh caps, and includes original P2.8 hardware mid-assembly frames at scroll progress 0.535, both forward and backward.

**When run in a real source-equipped checkout**, the script would produce **28 WebGL PNG screenshots** across desktop and mobile, plus JSON source audits, and fail if hardware/four-wheel scroll progression does not change pixels. The script has **not been run** against the actual F1/CAD data in this environment.

## Files changed

- `apps/web/src/dev/modelBAssembly/sourceCadDotSelection.ts` — native P2.8 hardware selection and hard render budget
- `apps/web/src/dev/modelBAssembly/sourceCadDotSelection.test.ts` — nine authored Vitest cases
- `apps/web/src/dev/modelBAssembly/sourceCadVertexDots.ts` — original-surface visibility correction
- `apps/web/src/dev/modelBAssembly/sourceCadVertexDots.test.ts` — updated + three additional native Three.js lifecycle/interleaved tests
- `apps/web/src/dev/modelBAssembly/ModelBAssemblyStage.tsx` — four-corner hardware dots + ref-based cleanup
- `apps/web/src/dev/modelBAssembly/ModelBAssemblyPage.tsx` — original source overlay provenance counts
- `apps/web/scripts/verify-model-b-cad-assembly.mjs` — 28-image original-source QA gate

## Verification actually executed

- **8/8** exact GitHub-saved source hardware selection cases PASS, including 1,000 shuffled source traversal orders, rejection of invalid/duplicated hardware, four measured wheel stations and confirmation that no source identities are modified.
- **6/6** exact GitHub-saved source budget-function checks PASS, including maximum 10,544 native samples, 28 draw layers, sparse original mesh source vertices and malformed counts.
- **6/6** `buildSourceCadVertexDots` original function-body tests PASS using minimal Three-compatible scene, material and geometry stubs: exact sampled source vertex coordinates; correct build/X-ray draw order; four native tyre budgets; idempotent graphics cleanup without releasing source geometry; invalid source vertices/budgets.
- The new native Three.js/Vitest cases are **authored but not executed**. The full app TypeScript build, WebGL GPU shader compilation and 28-screenshot true F1/CAD browser smoke remain **unexecuted**. No npm dependency tree or original SHA-pinned P2.8/P2.12/P2.14 CAD binaries are available in the assistant container, and the GitHub connector cannot supply the binary GLB content for a real visual run.

## Native acceptance commands (manual checkout only, no Actions)

```bash
npm ci
npm run typecheck --workspace=@peds/web
npx vitest run \
  apps/web/src/dev/modelBAssembly/sourceCadVertexDots.test.ts \
  apps/web/src/dev/modelBAssembly/sourceCadDotSelection.test.ts \
  apps/web/src/dev/modelBAssembly/modelBAssemblyTimeline.test.ts
npm run dev --workspace=@peds/web
# In another shell after original CAD source staging:
PEDS_CHROMIUM_PATH=/usr/bin/chromium \
  npm run qa:model-b:cad-assembly --workspace=@peds/web
```

**P2.45 code-level patch complete. Actual original GLB browser assembly review: HOLD.** The P2.8 wheel-end mirrored to the rear is still explicitly a front-source visual proxy; the real native rear suspension / P2.34 mechanical six-ball G2 remain unverified.

No merge, deploy, or GitHub Actions.
