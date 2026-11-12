# P2.34AM/54 — Verified original Model B source-vertex particle reveal

Date: 2026-11-12. Branch: `work/engineering-four-corners-local`.

## Why this patch

After P2.34AF–AL, byte-level recovery of missing P2.34E source84 had been improved, but no authentic P2.34E STEP/index/contact audit became available. More recovery wrappers cannot produce geometry from hashes. Unlike the missing STEP, the repository **does contain** the genuine original owner Model B showroom GLB at `apps/web/public/models/model-b-eds-optimized-v1.glb` (2,120,816 bytes; Git blob `74fbd44daf709d0d368adef9de66e4e22a49fed4`). The DEV-only `/engineering/model-b-build` page already fetches this file, validates its exact committed Git blob identity, then parses it using Three.js.

P2.34AM adds actual visual implementation progress on that existing source rather than another metadata-only CAD source-recovery gate.

## Implementation

New `apps/web/src/dev/modelBAssembly/ownerSourceParticles.ts`:

- Reads the decoded and already Git-verified original `THREE.Group` mesh position buffers.
- Samples **existing vertex positions** deterministically, with a bounded default budget of 7,200 points; converts each vertex from mesh coordinates to original Model B root-local coordinates using the actual scene matrices.
- Creates a bounded `THREE.Points` cloud in uniform CAD gray `#87929d`; no pseudo CAD fasteners, invented bolt positions, chassis parts or geometric reconstruction.
- Uses scroll chapter progress to fade the particles in during source assembly visualization and out before `p>=0.84`, exposing only the original assembled owner car at the end.
- Exposes an explicit dispose function for generated GPU geometry/material.

Updated `ModelBAssemblyStage.tsx`:

- After the original GLB was source-verified and decoded by `useOriginalBody()`, allocate the particle field inside a React effect and destroy its resources on source replacement/unmount.
- Keep particle geometry under the **same source-only Model B scale group** as the real owner GLB.
- Change only particle material opacity/visibility within the existing `useFrame` callback. No added fake race part meshes; four-corner assembly, rear CAD source requirements, and mechanical G2 HOLD are unchanged.
- Avoid React parent state mutation during render. A source vertex failure gets a distinct visible error.

New `ownerSourceParticles.test.ts` contains four intended Vitest checks covering world-to-source coordinate transforms, source-only points, absence of geometry, bounding vertex-budget constraints and scroll opacity.

## Verification status

**Actual GitHub source tree and committed file text were checked before implementation.** Earlier P2.34AL Python Git recovery tests were independently rerun locally in this turn: **25/25 PASS**. Those do not exercise this new particle effect.

**The new TypeScript/Vitest test file and browser WebGL visualization have not been executed in this runtime.** This container does not hold the private source GLB binary or the repository's installed Three.js/Vite packages. Do not label the new visual effect as browser-tested, source-rendered or video-recorded. The patch is committed as an implementation candidate requiring local Vite/Chromium QA.

Reproduction on a repository checkout:

```bash
cd apps/web
npx vitest run src/dev/modelBAssembly/ownerSourceParticles.test.ts
# Run your existing DEV-only Model B route /engineering/model-b-build
# and verify scroll reveal, original body, particle visibility and resource cleanup.
```

The authentic P2.34E STEP and source index remain absent. P2.34AM does not imply rear CV torque verification, original native B-Rep G2 acceptance, Model B four-corner mechanical integration or a completed animation film.

**P2.34/54 IN PROGRESS — mechanical G2 HOLD. No merge, deploy or GitHub Actions.**