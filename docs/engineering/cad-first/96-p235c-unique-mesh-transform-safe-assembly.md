# P2.35C/54 — Unique owner GLB mesh identity and nested-transform-safe visual separation

Date: 2026-11-12. Branch: `work/engineering-four-corners-local`.

## Two concrete P2.35B defects

1. The per-mesh reveal phase was keyed only by `mesh.name`. Real glTF/GLB files may have multiple mesh nodes with identical names or empty names. Those nodes moved simultaneously, defeating the promised part-by-part motion.
2. The reveal offset direction was computed from the original mesh **world-space** bounding-box center but then added directly to `mesh.position`, which is defined in the mesh's **parent-local** coordinate frame. A rotated or scaled parent transforms the visual separation in an unintended direction.

## P2.35C changes

- Add `sourceBodyMeshKey(name,ordinal)` to `sourceOnlyMeshMotion.ts`. Each original owner GLB mesh gets a stable traversal ordinal appended to its original source name; duplicate and unnamed nodes therefore have distinct animation identities without creating synthetic parts.
- Update `ModelBAssemblyStage.tsx` to assign this key while traversing source mesh nodes and to pass it to `sourceBodyMeshSeparation()`.
- Convert the existing world-space reveal offset to the original node's parent-local coordinates using the inverse parent world matrix, subtracting the inverse-transformed origin so translation does not corrupt the direction. This conversion is performed once during the existing shell visual effect setup.
- The original owner GLB vertex buffers, parent transforms, and final source poses remain unchanged. At progress 0 and progress >=0.84, the original mesh local positions are restored exactly. Source-only and P2.8-present paths retain their previous chapter boundaries and mechanical G2 restrictions.
- Add two Vitest cases covering duplicate/blank names and invalid source ordinals, bringing `sourceOnlyMeshMotion.test.ts` to **8 authored cases**.

## Verification limits

GitHub file contents are fetched after the push. The source-node key math and motion bounds can be verified in Node without the original GLB, but a complete Three.js nested-parent matrix regression and Chromium video render require a checkout with app dependencies and original Model B binary.

**P2.35/54 IN PROGRESS. P2.34 Mechanical G2 BLOCKED/HOLD. No merge, deployment or GitHub Actions.**
