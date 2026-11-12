# P2.34AO/54 — Bound original Model B source-vertex particle count

Date: 2026-11-12. Branch: `work/engineering-four-corners-local`.

## Actual bugs found in P2.34AN

The source-vertex particle builder computed a per-mesh allocation with `Math.max(1, Math.floor(budget * meshVertexCount / totalVertexCount))`. This guaranteed **at least one sample per mesh**, potentially exceeding the global requested budget when the source contains more mesh nodes than the budget. It could produce unnecessarily large GPU allocations for densely segmented CAD assemblies.

It also accepted only `THREE.BufferAttribute`. Real glTF/Three.js geometry may use `THREE.InterleavedBufferAttribute` for positions. Those geometries were silently omitted from the visual reveal, causing incomplete point-cloud source coverage.

## Changes committed

Updated `apps/web/src/dev/modelBAssembly/ownerSourceParticles.ts`:

1. Accept either standard or interleaved position attributes with `itemSize === 3`, reading source positions exclusively through the public `getX/getY/getZ` API.
2. Derive the exact cap `limit = Math.min(budget, total)`. Use deterministic **global proportional selection**: a vertex is sampled when the integer part of `(globalIndex + 1) * limit / total` exceeds that of `globalIndex * limit / total`. This yields exactly `limit` sample candidates across all original meshes, with no mesh minimum that can overflow the bound.
3. Stop on non-finite sampled coordinates rather than silently creating a partial source point cloud.
4. Report `sampledMeshCount` for actual source meshes selected, not all eligible meshes.

The original Git-verified Model B GLB remains unchanged. Particle positions still converge to genuine original source vertices through P2.34AN's animation; no artificial bolt geometry or mechanical mating claims are added.

Updated `ownerSourceParticles.test.ts` with three additional Vitest cases covering a 400-mesh source with a 256-point global cap; actual `THREE.InterleavedBufferAttribute` position sampling; and nonfinite original source rejection. The test count is now **10 authored cases**.

## Verification limits

All three changed files' committed text was fetched again from GitHub, verifying their presence and expected changes. The full Vitest/Three.js suite and Chromium WebGL playback were **not executed** in this environment because the repository's npm dependencies and private original Model B GLB are not present. A Python/JS mathematical check of the global allocation invariant is useful but not a substitute for browser execution.

Local verification commands without GitHub Actions:

```bash
cd apps/web
npm run typecheck
npx vitest run src/dev/modelBAssembly/ownerSourceParticles.test.ts
npm run dev
# DEV route: /engineering/model-b-build
```

**P2.34/54 IN PROGRESS; Mechanical G2 HOLD. No original P2.34E source STEP, no mechanical G2 certification, no merge, deployment or GitHub Actions.**
