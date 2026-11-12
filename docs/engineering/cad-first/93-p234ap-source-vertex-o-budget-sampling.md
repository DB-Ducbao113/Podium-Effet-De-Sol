# P2.34AP/54 — O(budget) Model B source-vertex sampling

Date: 2026-11-12. Branch: `work/engineering-four-corners-local`.

## Actual improvement

P2.34AO fixed the number of emitted source-vertex points but still traversed every original GLB vertex on the CPU. A dense owner Model B GLB could have millions of vertex entries even if the particle visualization only needs 7,200 samples.

P2.34AP adds `ownerParticleSampling.ts`, a pure deterministic index sampler. For original total vertex count N and budget B, it returns `min(N,B)` strictly increasing source indices using the exact same cumulative-integer criterion as P2.34AO, but in O(min(N,B)) rather than O(N) time. It validates integer/source limits and performs no geometry reconstruction.

Updated `ownerSourceParticles.ts` keeps each original GLB position buffer and source mesh world transform intact, but jumps to only the globally selected index within each mesh. For every candidate it calls the same `getX/getY/getZ` and transforms to root-local coordinates; it retains the authored source-vertex identity, original deterministic point offsets, reverse-scroll animation, GPU resource ownership, global point budget and mechanical HOLD status. It supports standard and interleaved position attributes.

## Executed local verification

With the real globally-installed TypeScript transpiler and Node.js v22, six independent fixture tests in `/mnt/data/p234ap/test_sample.js` were **executed: 6/6 PASS**. They include direct index-by-index comparison with the old cumulative O(N) gate for ten N/B combinations, a 10,000,000-vertex case with exactly 7,200 indices, exact boundary inclusion, and invalid input controls.

Six equivalent `ownerParticleSampling.test.ts` cases were authored for project Vitest. They have **not** been executed by Vitest; Three.js, Vite packages and the original binary Model B GLB are unavailable in this runtime. The complete React/WebGL renderer and browser screenshot/video are likewise **not** verified.

## Local project verification

```bash
cd apps/web
npm run typecheck
npx vitest run src/dev/modelBAssembly/ownerParticleSampling.test.ts \
  src/dev/modelBAssembly/ownerSourceParticles.test.ts
npm run dev
# Inspect DEV-only /engineering/model-b-build in Chromium with original GLB.
```

This optimizes the original source-based visualization only. The exact SHA-256 pinned original P2.34E STEP/index/audit have still not been obtained. Model B mechanical assembly and rear CV G2 remain HOLD.

**P2.34/54 IN PROGRESS. No merge, GitHub Actions or deployment.**