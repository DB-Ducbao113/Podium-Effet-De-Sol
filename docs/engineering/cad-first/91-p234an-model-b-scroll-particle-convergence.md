# P2.34AN/54 — Real scroll-converging source vertex particles for Model B

Date: 2026-11-12. Branch: `work/engineering-four-corners-local`.

## Concrete change from P2.34AM

The prior Model B particle reveal sampled original mesh vertex locations and changed only a point-cloud overlay's opacity. P2.34AN adds **actual reversible 3D assembly travel**, still driven exclusively by the previously Git-identity-verified original `apps/web/public/models/model-b-eds-optimized-v1.glb` mesh.

`ownerSourceParticles.ts` keeps two separate arrays: (1) immutable target positions copied from the decoded original mesh, transformed to original Model B root-local space, and (2) a GPU-backed mutable Float32Array. It derives deterministic temporary offsets from the sampled point index and the measured source mesh extent. These offset coordinates are **presentation trajectories only**, not synthetic mechanical part geometry. For any progress at/after 0.70, the offset is identically zero and every point converges to its *exact* sampled owner-source location. Reverse scroll moves points back along the same paths.

The transform uses a smoothstep ease over scroll progress 0.12–0.70, bounded and deterministic, with no `Math.random()` or derivative CAD fitting. `ownerParticleOpacity()` from P2.34AM still fades particles out by 0.84 and keeps the original car visible. Source geometry, original chassis materials, mounted wheel CAD and mechanical G2 flags are unchanged.

`ModelBAssemblyStage.tsx` calls `setAssemblyProgress(p)` in the existing Three.js `useFrame` rendering loop only while particles are visible. The point cloud is built and disposed in an effect associated with the already-validated original model. Animation updates only the overlay's generated position buffer; the original owner `THREE.Mesh` data is never modified.

## Regression tests

Updated `ownerSourceParticles.test.ts`:

- Existing exact sample-coordinates test now checks the *converged* source positions at progress 0.70.
- New actual movement test checks start, fully converged original mesh positions, reverse-scroll intermediate and full return to start.
- New determinism test constructs two equivalent clouds and confirms byte-identical Float32 positions at the same scroll fraction.
- New easing test asserts monotonic progress and exact terminal fraction 1.
- Existing bounds, geometry-free failure and fade timing are retained.

Total **7 authored Vitest cases**. The TypeScript/Vitest suite and Chromium rendering were **not executed** within this task environment: the repository's web dependencies and binary GLB are not present in the local container. GitHub file content was fetched and verified after commit. Do not claim screenshot/video/real browser QA or a completed full-car original mechanical assembly.

To test in actual repository checkout without GitHub Actions:

```bash
cd apps/web
npm run typecheck
npx vitest run src/dev/modelBAssembly/ownerSourceParticles.test.ts
npm run dev
# /engineering/model-b-build is DEV-only.
```

## Known limits

This patch is an original source-based particle visual transition, not a source STEP rebuild, native six-ball CV cage manufacturing plan, torque-rated mechanical mate, or real four-corner engineering acceptance. The exact SHA-256 pinned P2.34E original STEP/index/audit have not been obtained in this environment. Mechanical G2 HOLD remains.

**P2.34/54 IN PROGRESS. No merge, deploy or GitHub Actions.**
