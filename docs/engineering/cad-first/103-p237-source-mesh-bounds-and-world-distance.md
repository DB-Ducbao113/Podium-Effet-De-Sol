# P2.37C–E — Original Model B geometry-correct source mesh choreography

Date: 2026-11-12. Branch: `work/engineering-four-corners-local`.

## Real geometry errors corrected

The old `Box3.setFromObject(mesh)` measured not just the mesh's own original GLB vertex data but all nested child objects. Consequently, a small F1 body node with a large chassis child could be incorrectly classified as a large panel and would remain static during the intended source-only reveal.

P2.37C now obtains `mesh.geometry.boundingBox` and computes the exact world-space axis-aligned bounding box of **that mesh's own source geometry only** using the affine world matrix's center and half extents. It does not fabricate substitute vertices or count child meshes. It handles rotations, shear, negative scales, nonuniform parent scales, world translations and the original Model B shell scale. The original big-chassis >2.3 m immobilization remains.

P2.37D preserves the original mesh pose and reports a source geometry bounds error rather than crashing the whole F1 viewer if a malformed source bounding box cannot be measured. The body material/geometry GLB bytes remain untouched.

P2.37E normalizes the direction before applying the world-space source reveal strength. Previously the vector components (±1, +0.7 or -0.5, ±1) had magnitude near 1.5, so a configured 0.10–0.16 m translation became about 0.15–0.25 m. The corrected source mesh travels exactly the configured 0.10–0.16 m before per-scroll choreography scales the offset. Giant meshes with strength 0 skip parent inverse calculations entirely. The final part pose at scroll 0 and 0.84–1.00 is still the owner's original transform.

## Source and tests

- `apps/web/src/dev/modelBAssembly/sourceWorldReveal.ts`: pure geometry world-bounds and unit reveal direction helpers.
- `apps/web/src/dev/modelBAssembly/ModelBAssemblyStage.tsx`: source geometry own bounds, fail-closed source nodes and normalized world direction.
- `apps/web/src/dev/modelBAssembly/sourceWorldReveal.bounds.test.ts`: eight authored pure Vitest cases on original geometry own bounds, 90° rotations, shell scaling, arbitrary affine matrices and invalid source input.
- `apps/web/src/dev/modelBAssembly/sourceWorldReveal.three.test.ts`: three authored native Three.js cases, including nested large descendants and the original source final world pose; **not executed**.

### Executed independently

The exact function bodies from the saved GitHub `sourceWorldReveal.ts` were executed in a V8 runner, rather than reconstructed from conceptual examples:
- **6/6 world-bounds checks PASS**, including 10,000 deterministic arbitrary affine source transforms versus all eight transformed bounding-box corner positions.
- **6/6 normalized visual-offset checks PASS**, including 1,001 source travel samples and invalid-centroid handling.

These are pure algorithm checks. **The full Three.js, React, app-wide TypeScript/Vitest build and original GLB/Chromium visual acceptance were not run** in this environment.

## Mechanical scope

P2.37 fixes an original **source GLB visual exploded view**. It does not assert true CAD bolt insertion paths or physical wheel suspension mates. P2.34 six-ball CV native 84-solid source Mechanical G2 remains BLOCKED/HOLD.

No GitHub Actions, merge or deployment.
