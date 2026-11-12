# P2.35B/54 — Staggered source-only Model B mesh assembly

Date: 2026-11-12. Branch: `work/engineering-four-corners-local`.

## Actual work

The previous P2.35A restored the original Model B shell mesh positions on scroll but used one shared scalar separation value for all source meshes. Every eligible exterior part consequently moved in lockstep. This gives a synchronized shell transition rather than a part-by-part assembly presentation.

P2.35B adds `apps/web/src/dev/modelBAssembly/sourceOnlyMeshMotion.ts` with source-node-specific, deterministic timing. The source mesh name is fed into an FNV-style hash to get a bounded phase. The original mesh positions are separated over chapter progress 0.12–0.37, held apart through 0.60, then independently restored by 0.84. This is a presentation-only effect on mesh nodes belonging to the **Git-verified original Model B GLB**, not newly authored source geometry, separate engineering fasteners or physical insertion proof.

Updated `ModelBAssemblyStage.tsx`: when real P2.8 CAD is absent, compute `sourceBodyMeshSeparation(p,item.mesh.name)` for each original owner body mesh and apply it to the already-existing `origin + offset * amount` transform. At progress 0 and progress 0.84–1, all mesh nodes return to the recorded exact original transforms. When authentic P2.8 CAD is available, continue to use the existing shared source-CAD chapter displacement and its full four-corner choreography; no change to its mates. The existing uniform source-derived point-cloud color and particle convergence remain.

## Actual verification

A local exact-code TypeScript compile to Node ESM and six tests in `/mnt/data/p235b` were **executed: 6/6 PASS**. Tests check zero displacement at beginning/end, 0.70 plateau during the construction chapter, deterministic and differentiated phases, staggered displacement at an intermediate progress, 10,001 progress samples per mesh bounded to 0..0.70 and reversible, and fail-closed non-finite progress. A corresponding six-case repository Vitest file was committed.

The repository **Vitest, full web app typecheck and browser WebGL/Chromium QA have not been executed**. This environment lacks the private committed binary GLB and installed web app npm dependencies. The GitHub branch files were verified by fetching saved content. The standalone Node checks prove pure choreography timing, not complete React/Three.js rendering.

## Files

- `apps/web/src/dev/modelBAssembly/sourceOnlyMeshMotion.ts` — deterministic per-source-mesh choreography
- `apps/web/src/dev/modelBAssembly/ModelBAssemblyStage.tsx` — render integration
- `apps/web/src/dev/modelBAssembly/sourceOnlyMeshMotion.test.ts` — six Vitest cases

## Reproduction without GitHub Actions

```bash
cd apps/web
npm run typecheck
npx vitest run src/dev/modelBAssembly/sourceOnlyMeshMotion.test.ts
npm run dev
# DEV /engineering/model-b-build: inspect part-by-part source shell motion
```

## Scope and gate

P2.34 original CV source84 G2 remains BLOCKED/HOLD. This patch is visual choreography, not a complete 84-solid drive train, manufacturer-grade source CAD, or finished Model B scroll video. No merge, deploy or GitHub Actions.

**P2.35/54 IN PROGRESS.**
