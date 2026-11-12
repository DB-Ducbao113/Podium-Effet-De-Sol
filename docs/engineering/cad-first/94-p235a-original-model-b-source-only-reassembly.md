# P2.35A/54 — Original Model B source-only scroll reassembly

Date: 2026-11-12. Branch: `work/engineering-four-corners-local`.

## Transition from P2.34

P2.34 source84 six-ball CV native G2 remains BLOCKED: three SHA-pinned original STEP/index/contact files were not recovered, and two-sided loaded constant-velocity transmission was not validated. No additional P2.34 alphabet-suffix blockers will be generated. P2.35 is the independent **owner-original Model B frontend assembly** track, not mechanical G2 sign-off.

## Actual code change

The DEV-only `/engineering/model-b-build` route already authenticates and decodes the repository's original committed Model B GLB. However, `ModelBAssemblyStage.tsx` used `exteriorSeparation(progress, Boolean(visual))`; when original P2.8 CAD is not staged, `visual` is null and separation is permanently zero. Thus the source-only mode animated the camera and vertex dust, but the original owner body mesh nodes themselves remained fixed throughout the design chapters.

P2.35A adds `originalBodySourceOnlySeparation(progress)` to `modelBAssemblyTimeline.ts` and switches the stage to it **only without imported P2.8 CAD**. The function smoothly separates already-authored, small original shell mesh nodes at scroll 0.12–0.30, holds during 0.30–0.65, and gradually restores the exact original mesh transforms by 0.84. The final 0.85–1.00 chapter has zero displacement. Larger original shell mesh nodes remain in place under the existing source bounding-box screen-space extent threshold. This is a reversible visual exploded view of an original exterior GLB, not a certified CAD disassembly or newly designed interior hardware.

When verified P2.8 wheel CAD is staged, the existing original four-corner build choreography takes precedence unchanged. The visual mesh positioning code uses the existing recorded `origin` and `offset`; it doesn't change the GLB original vertex buffers or its SHA-verified provenance.

## Verification evidence

Updated `modelBAssemblyTimeline.test.ts` with a new source-only assembly test checking exact first/last/source-restored poses, full separation, transition decay, NaN clamping and bounded progress. Local standalone Node execution of the exact scalar equation **PASS** on seven boundary cases, all 10,001 evenly sampled scroll fractions and repeatability. This standalone test does **not** replace the app's Vitest test or React/Three.js WebGL integration.

Repo Vitest, browser screenshot, scroll video and production TypeScript build were **not** executed here; the full app's dependencies, original private binary GLB and Chromium render session are not available in the assistant runtime. Source code was committed and read back through GitHub on the work branch.

## Verification in an actual local repository checkout

```bash
cd apps/web
npm run typecheck
npx vitest run src/dev/modelBAssembly/modelBAssemblyTimeline.test.ts
npm run dev
# Inspect source-only /engineering/model-b-build (original GLB auto-loaded).
```

**P2.35/54 STARTED. P2.34 mechanical G2 BLOCKED/HOLD. No GitHub Actions, merge or deployment.**
