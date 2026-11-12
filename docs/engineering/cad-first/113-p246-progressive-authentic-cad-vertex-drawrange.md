# P2.46 — Progressive original-CAD vertex construction, reversible scrub, GPU audit

Date: 2026-11-12. Branch: `work/engineering-four-corners-local`.

**Code patch status:** implemented and pushed. **Actual owner Model B + private 59/19/16 source CAD WebGL visual acceptance:** HOLD. **P2.34 mechanical G2:** BLOCKED/HOLD.

## Defect / limitation

P2.44–P2.45 produced point layers containing sampled native vertices of original P2.8 tyres and fasteners. But all sampled vertices became visible simultaneously; the only animation was a pulse in opacity. That did not reproduce the intended CAD-engineering construction effect where authentic mesh points appear sequentially while parts assemble.

## P2.46 source changes

- New pure `sourceCadDotProgress.ts` computes the number of **original sampled vertex points** visible at a given part-assembly fraction, with smooth deterministic accumulation to the full sample count by fraction `0.64`. The original `sourceCadAssemblyDotOpacity` fades the point overlay as the real source CAD solid becomes assembled. At assembly fraction `0`, draw range is empty; at fraction `1`, points are not visible although the complete original source solid remains in place.
- `sourceCadVertexDots.ts` now initializes each viewer-owned `THREE.BufferGeometry.drawRange` to `(0,0)` for construction dots, or `(0,sourceSampleCount)` for a selected original source CAD part inspected with X-ray.
- `ModelBAssemblyStage.tsx` invokes `updateSourceCadDotRange` on the **same** source-sampled point geometry and only calls Three.js `setDrawRange(0,count)` when its value changes. It does not recreate point buffers, change authenticated GLB `position` attributes, or create replacement fasteners during forward or backward scrolling.
- For verification without React rerenders, the dev-only real WebGL canvas now exposes three integers from the *actual current point draw ranges*: `data-peds-model-b-drawn-cad-dots`, `data-peds-model-b-visible-cad-dots` and `data-peds-model-b-inspection-cad-dots`. This instrumentation does not alter source geometry or add GPU draw calls.
- The existing 28-screenshot desktop/mobile local Chromium QA script now checks real draw counts: source hardware point counts must rise during chapter 02; build dots must be invisible before build and at the assembled final car; inspection of one original source CAD mesh must have a positive original vertex draw count; clearing X-ray must return the selected dot count to zero. It still checks source provenance, mounted four-corner actual CAD identity, 31 native rear source mesh instances per rear wheel, visual bounds and reverse-scroll image changes.
- `sourceCadVertexDots.test.ts` now verifies the initial construction `drawRange=0`, full original X-ray draw range and source vertex buffer integrity across reverse scrubbing.
- New `sourceCadDotProgress.test.ts`: seven authored Vitest cases: initial/mid/final native point construction, full reverse invariance, tiny source meshes, Reduce Motion / X-ray exclusion, skip unchanged GPU range writes, repeated scroll cycles and malformed source frames.

## Executed validation, distinct from authoring tests

The exact authored pure `sourceCadDotProgress.ts` helper was copied to a local TypeScript test fixture and validated with:

```bash
tsc --strict --noEmit --target ES2022 --module ESNext sourceCadDotProgress.ts
node --experimental-strip-types --input-type=module # seven Node assertion groups
```

**TypeScript strict compile: PASS. 7/7 actually executed Node assertion groups: PASS.** Coverage includes 10,001 forward progress positions, 10,001 reverse positions, repeated ten-cycle drawRange restoration, tiny/normal source vertex budgets, no-op range updates, and invalid inputs. This is a genuine local compiler and Node runtime test of the pure helper, **not a claim to have run the repository's Vitest suite or Three.js renderer**.

## Remaining acceptance

The GitHub connector can read source text but did not return the binary original Model B GLB. The assistant container cannot access GitHub directly and does not have the entire project checkout, NPM `three`/React dependencies or the authentic local P2.8/P2.12/P2.14 GLB source binaries. Consequently, original F1 WebGL scenes, GPU shader compilation, 28 actual model screenshots and video remain **not run**.

Native checkout acceptance:

```bash
npm ci
npm run typecheck --workspace=@peds/web
npx vitest run \
 apps/web/src/dev/modelBAssembly/sourceCadDotProgress.test.ts \
 apps/web/src/dev/modelBAssembly/sourceCadVertexDots.test.ts \
 apps/web/src/dev/modelBAssembly/sourceCadDotSelection.test.ts
npm run dev --workspace=@peds/web
# With authentic 59/19/16 P2.8/P2.12/P2.14 GLBs in DEV-only source staging:
PEDS_CHROMIUM_PATH=/usr/bin/chromium \
 npm run qa:model-b:cad-assembly --workspace=@peds/web
```

P2.46 remains a deterministic **presentation-only original-source vertex reveal**. The native P2.8-derived rear wheel-end is still a front-CAD visual proxy; no geometry from an actual rear suspension, six-ball CV cage, manufactured bolt or physically certified mating constraint is invented. No GitHub Actions, merge or deploy.
