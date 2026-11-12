# P2.35F — Original Model B source completeness and chapter truth gate

**Date:** 2026-11-12
**Branch:** `work/engineering-four-corners-local`
**Scope:** Developer-only Model B source-authentic assembly review; not mechanical acceptance.

## Defects corrected

1. The source-only chapters previously claimed "camera only" even after P2.35A–E introduced original GLB node separation and source-vertex point convergence. Chapter 01 descriptions and the `data-model-b-scene-truth` attribute now identify a **source-only GLB visual reveal**, with no independent P2.8 fastener geometry claimed.
2. The final chapter could be labeled `ORIGINAL_CAD_ASSEMBLY` with original P2.8 loaded but P2.12/P2.14 absent. The final and rear-joint chapters now signal `UNVERIFIED_REAR_PROPOSAL` until both rear source layers are decoded.
3. Chapter 00 previously claimed an exact source already verified during the asynchronous GLB load. The page now passes the verified-original readiness flag; before it is true, chapter text reads `WAITING_FOR_ORIGINAL`.
4. The source uploader displayed total manifest-loaded file counts, which may be different from successfully decoded and rendered CAD meshes. An independent `modelBSourceCoverage()` gate now uses only the verified `onReady` counts, in strict order: original Model B mesh count > 0, front P2.8 ==59, toe P2.12 ==19, split races P2.14 ==16.
5. The page now visibly reports **CAD 0/94, 59/94, 78/94 or 94/94 verified decoded meshes**, distinguishes original owner GLB, displays the explicit **rear source is a front-wheel-end visual proxy** caveat and always states **VISUAL ONLY**.

## Invariants

- `modelBSourceCoverage().mechanicalMateCertified` is always `false`.
- Even 94/94 verified decoded CAD mesh sources are **not** 94 actual car parts fitted to a certified chassis, and neither mechanical G2 nor a real rear-wheel-end geometry source is claimed.
- Early chapter loading does not claim original GLB authenticity before the original SHA-1 and geometry probe complete.
- The original owner car exterior and all P2.8/P2.12/P2.14 GLB source bytes are unchanged.
- P2.34 source84 mechanical G2 is still BLOCKED/HOLD.

## Source changed

- `apps/web/src/dev/modelBAssembly/modelBSourceCoverage.ts` — pure visual-source coverage audit.
- `apps/web/src/dev/modelBAssembly/modelBSourceCoverage.test.ts` — eight Vitest cases.
- `apps/web/src/dev/modelBAssembly/modelBChapterTruth.ts` — source-only, loading and incomplete rear truth.
- `apps/web/src/dev/modelBAssembly/modelBChapterTruth.test.ts` — revised/added source truth assertions.
- `apps/web/src/dev/modelBAssembly/ModelBAssemblyPage.tsx` — visible provenance status and machine-checkable DOM attributes.
- `apps/web/src/dev/modelBAssembly/modelBAssembly.css` — provenance status styling.

## Verification

- Independently compiled exact `modelBSourceCoverage.ts` with global TypeScript `tsc --noEmit --strict --target ES2022`: **PASS**.
- Executed standalone Node tests against the transpiled TypeScript: **8/8 PASS** (waiting, source-only, exact P2.8 count, layer dependencies, split-only rejection, 78-mesh stage, 94-mesh source-only final, invalid numeric counts). Working check files: `/mnt/data/p235f` in the assistant local runtime.
- The committed Vitest tests and full app typecheck were **not executed**; no installed monorepo npm dependencies or browser WebGL runtime are available in the current environment. No screenshot or assembly video has been validated.
- All changed GitHub files were read back from the work branch.

## Local acceptance command (manual, not GitHub Actions)

```bash
npm ci
npm run typecheck --workspace=@peds/web
npx vitest run apps/web/src/dev/modelBAssembly/modelBSourceCoverage.test.ts apps/web/src/dev/modelBAssembly/modelBChapterTruth.test.ts
npm run dev --workspace=@peds/web
# /engineering/model-b-build?sourceOnly=1
# Verify data-model-b-scene-truth and data-model-b-cad-verified-meshes.
# Import original source CAD and ensure stages 0 -> 59 -> 78 -> 94 are truthful.
```

**P2.35F source coverage patch complete at source-control level. P2.35 visual acceptance: HOLD until browser validation.**
