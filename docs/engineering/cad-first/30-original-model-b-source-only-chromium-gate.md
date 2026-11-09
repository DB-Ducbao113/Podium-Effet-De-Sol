# Original owner Model B: independent browser proof before private P2.8

Branch: `work/engineering-four-corners-local`. DEV only, no GitHub Actions, no merge, no deploy. Mechanical G2 HOLD.

## Verified repository state

- The original owner car exists in GitHub as `apps/web/public/models/model-b-eds-optimized-v1.glb`, exact size **2,120,816 bytes**, Git blob SHA `74fbd44daf709d0d368adef9de66e4e22a49fed4`.
- A recursive live GitHub work-branch tree did **not** contain any P2.8 59-mesh GLB or STEP binary, although the original P2.8 regeneration scripts exist. Therefore the full original P2.8 physical/CAD assembly cannot truthfully be marked complete from the public work-branch files alone.
- The assistant container cannot clone GitHub (DNS unavailable), and the connected GitHub text API cannot transfer this >2MB private binary to that container. It is **not accurate** to claim Chromium ran the real full Model B here.

## What can now be tested independently

`/engineering/model-b-build?sourceOnly=1` loads the actual repository-hosted Model B GLB (no substitute), verifies the Git blob SHA **before Three.js decoding**, and disables automatic loading of optional private P2.8/P2.12/P2.14 source files for this test only.

The six scroll chapters remain available. When P2.8 is missing, `modelBSourceOnlyCamera.ts` computes six distinct camera poses from the owner's decoded Model B bounding box and known calibrated scale; **no assumed suspension hardpoints, fake screws or fabricated rear-wheel geometry are drawn**. `modelBChapterTruth.ts` switches the labels and descriptions to accurately describe the source-only exterior/camera study, not a completed physical assembly.

Actual source-only Chromium MP4 is implemented in `tools/cad-first/record_original_model_b_only_local.py`. It self-starts Vite on loopback and refuses to output PASS unless it sees HTTP 200 for the original GLB, correct 2,120,816-byte Git object, real WebGL2 context, six visible real source camera states, at least five distinct original WebGL canvas screenshots, 96 actual browser frames and a valid FFmpeg H.264 MP4. An existing Vite process is supported with `--existing-vite`. All evidence is saved to JSON alongside the actual frames and video.

On a full checkout with dependencies:

```sh
python tools/cad-first/record_original_model_b_only_local.py --out .local-assets/reviews/original-model-b-showroom
```

This standalone browser test **does not require** a P2.8 binary and does not use GitHub Actions. It never marks 59-part CAD installation, four-wheel mechanical calibration, chassis mates or continuous suspension kinematics as proved.

Once the original P2.8 is rebuilt from the author's source scripts, `tools/cad-first/run_four_corners_local.py` now invokes the source-only Chromium/MP4 gate first, then its separate true 59-mesh and 31-rear-part full assembly recorder. The resulting two MP4 files have distinct scopes and are not conflated.

## Executed validation in this task

- A verbatim local copy of the committed `modelBSourceOnlyCamera.ts` was compiled using `tsc --strict` on Node 22, **PASS**.
- Four independent Node runtime check groups **PASS** for six distinct source-derived chapter camera poses, viewport scaling, geometry-source identity and invalid geometry failures.
- The locally compiled source is byte-for-byte equal by length and FNV checksum to the latest GitHub source file: **3,056 characters / FNV-1a 1537370341**.
- The full real original-car Chromium test, original glTF rendering and MP4 have **NOT RUN** in this container. Missing executable owner Model B GLB and web dependencies prevent a defensible screenshot/video here.

## Final-status boundaries

Original Model B-only camera path: IMPLEMENTED, standalone TypeScript checks PASS, real Chromium/browser STILL NOT RUN.

59-part original CAD installation: NOT VERIFIED; P2.8 binary must be regenerated from real source.

P2.12/P2.14 rear CAD source proposals: previously reviewed, but mechanical G2 HOLD.

**Do not claim this source-only camera review is the full Model B assembly.**