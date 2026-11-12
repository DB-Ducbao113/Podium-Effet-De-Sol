# P2.37A–B — Original Model B source shell geometry displacement fix

Date: 2026-11-12. Branch: `work/engineering-four-corners-local`.

## The real visual geometry bug

In `ModelBAssemblyStage.tsx`, the original owner GLB mesh bounding box was constructed using `new THREE.Box3().setFromObject(mesh)`. Three.js includes the entire mesh world matrix here, including the source shell group scale. The old implementation nevertheless computed:

```ts
const extent=box.getSize(new THREE.Vector3()).length()*shellScale;
const strength=extent>2.3?0:.10+stablePartOffset(mesh.name)*5;
const offset=worldDirection.multiplyScalar(strength/shellScale);
offset.applyMatrix4(mesh.parent.matrixWorld.clone().invert()).sub(
 new THREE.Vector3().applyMatrix4(mesh.parent.matrixWorld.clone().invert())
);
```

This effectively applied the parent scale twice to world-oriented displacement. It also misclassified large source chassis surfaces as small pieces if the shellScale was below one: a 30-source-unit mesh at scale 0.15 is already a 4.5-metre world-space mesh, but multiplying by 0.15 again suppresses the extent under a 2.3-metre lock threshold. Such original body panels could separate incorrectly.

## P2.37A actual code changes

- New pure `sourceWorldReveal.ts` computes reveal distance from the **true world-space source mesh bounds**, without a second shell scale.
- A giant source mesh whose world-space bbox diagonal exceeds 2.3 m remains fixed; a small mesh receives a bounded 0.10–0.16 m visual translation based on unique source-derived mesh phase.
- Convert the world displacement to the mesh's parent-local coordinates by multiplying only the linear 3x3 of the parent inverse world matrix. Translation cannot alter displacement and a rotated/nonuniformly scaled parent is supported.
- Update `ModelBAssemblyStage.tsx` to use these helpers in the existing source-GLB node traversal; original mesh vertices, names, orientation, authored final positions and imported P2.8/P2.12/P2.14 CAD source binaries are unchanged.

## Verification

- Local `tsc --strict --noEmit --target ES2022` of the pure helper: **PASS**.
- Actually executed local Node tests against the exact pure helper transcription: **8/8 PASS**. Tested chassis immobilization, world distances, invalid bounds/phase, identity parent, shell scale 0.1, rotated and nonuniform parents, parent translation, invalid matrices/deltas.
- New `sourceWorldReveal.test.ts`: eight authored Vitest cases covering the same invariants.
- P2.37B adds `sourceWorldReveal.three.test.ts`: two further authored **Three.js-native** cases constructing a scaled shell, rotated/nonuniform parent, translated GLB mesh, measuring world translation, verifying the final authored pose and ensuring the oversized chassis is not disassembled.
- **The two Three.js test cases and full app build were NOT executed** because the full monorepo's npm dependencies are not present locally.
- The source-only visual Chromium scene and the native owner GLB are NOT available to render here. P2.37 visual acceptance remains HOLD.

## Manual acceptance

```bash
npm ci
npm run typecheck --workspace=@peds/web
npx vitest run apps/web/src/dev/modelBAssembly/sourceWorldReveal.test.ts apps/web/src/dev/modelBAssembly/sourceWorldReveal.three.test.ts
npm run dev --workspace=@peds/web
# Independently run the P2.36C local Chromium 16-frame screenshot QA.
```

No GitHub Actions, merge or deployment. P2.34 source84 CV mechanical G2 remains BLOCKED/HOLD.

**P2.37 source change implemented; final 3D verification pending.**
