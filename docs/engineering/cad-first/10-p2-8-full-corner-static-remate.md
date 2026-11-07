# P2.8 — 59-solid whole-front-corner STEP remate (static gate)

**Date:** 2026-11-07  
**Branch:** `feat/engineering-inside-machine-v2` / Draft PR #4  
**Status:** **Static geometry gate PASSED. Engineering/kinematics release still HOLD.**  
**No CI, merge or deploy.**

## What actually changed

The P2.8 preflight found four substantial intersections between the P2.7 A-arm subassembly and P2.6 original upright: upper arm **12,714.0457 mm³**, upper stud **3,834.4613 mm³**, lower arm **8,997.2615 mm³**, lower stud **3,033.0197 mm³**.

The NEW source tool `tools/cad-first/p2_8_upright_remate.py` now:
1. Rebuilds the **actual CadQuery B-Rep** of P2.6 and P2.7 from the original authored source scripts; no outside STEP download or Model B substitution.
2. Removes the two P2.6 legacy wishbone rods and adds the eight P2.7 source bodies: **51 + 8 = 59 individually named solids**.
3. Uses Boolean subtractive machining of the four interfering arm/stud volumes on the upright (an approximate 0.3 mm expanded clearance study, followed by original body cuts to prevent residual overlaps).
4. Detects disconnected resulting fragments and **removes four small unsupported slivers** explicitly. This is a topology warning, not evidence of new load-bearing suspension lugs.
5. Exports a new STEP master and performs the **complete all-pair static native B-Rep Boolean audit**, rather than only checking the four previous failures.

## Independently measured local source evidence

| Check | P2.8 measured result |
|---|---:|
| Source solids | **59** |
| Valid solids after STEP roundtrip | **59 / 59** |
| Native STEP CAD faces | **870** |
| Possible source-body pairs (59 choose 2) | **1,711** |
| Nonintersecting AABBs excluded | **1,455** |
| Exact OpenCascade B-Rep Boolean intersections | **256** |
| Overlaps above 0.05 mm³ | **0** |
| Boolean failures | **0** |
| Material removed from upright | **31,363.98 mm³** |
| Small disconnected fragments discarded | **4** |

The generated source master digest is `bd35288c0a624a3cece51fc0b324005e12fd194b645d895a70241fcba78ec9e1`.

**Important:** the static result does not establish that the two A-arm outer studs actually have a structurally credible retained interface to the upright. Removing disconnected fragments made the CAD valid but cannot substitute for a designed clevis/bearing joint. The next stage requires explicitly adding a new boss or retained ball-joint interface with defined load path and preserving static clearance.

## Deliverables

`tools/cad-first/p2_8_upright_remate.py` is pushed to the experimental branch. Owner-only local pack `PODIUM_EDS_P2_8_STATIC_REMATE_REVIEW.zip` contains:
- `P28_integrated_59_solid_master.step` — complete original static source STEP master (mm);
- `P28_remate_manifest.json` — 59 semantic IDs, source hash, machining evidence and limitations;
- `P28_static_audit.json` — all-pair B-Rep collision result;
- reproduction Python source and upstream generator scripts.

### Source-derived GLB exports — now generated and verified

The first attempted full B-Rep export hit a local time limit. A second **source-linked composed export** succeeded, using unchanged per-tier P2.6 + P2.7 source GLB meshes (both SHA-verified) and **newly tessellating only the rewritten upright from P2.8 native STEP**.

| Tier | All named parts | Triangles | Bytes |
|---|---:|---:|---:|
| HIGH | 59 | 308,580 | 5,216,096 |
| BALANCED | 59 | 93,936 | 1,935,200 |
| PERFORMANCE | 59 | 64,195 | 1,324,468 |

Source integrity and method are stored in `P28_remate_manifest.json` and reproducible `tools/cad-first/p2_8_source_glb_composition.py`. All 59 scene node IDs survive GLB roundtrip. **These are CAD-derived composed preview LODs, not a complete fresh re-tessellation of 59 B-Rep bodies at each tier.** The STEP-re-tessellated upright's triangle mesh failed the strict watertightness test; this may arise at CAD face seams and must be reviewed and fixed for photoreal macro. The STEP B-Rep itself round-tripped as 59 valid solids.

The CAD Lab now supports the 59-part P2.8 static preview and checks the exact SHA-256 of the attached native static audit, without enabling unverified P2.8 wheel-spin, suspension or cinematic motion.

### Render evidence

Two offline VTK views were generated from the real P2.8 BALANCED GLB and combined in `P28_STATIC_SOURCE_REVIEW_BOARD.png`. They are **not screenshots from a WebGL browser** and not photoreal owner acceptance. Existing tyres and wheel surfaces remain visibly polygonal; cinematic quality is NOT achieved.


## Remaining execution gates

- **P2.8A:** author genuine upright outer-joint bearing/boss/retainer geometry that keeps a structurally connected load path. A model with no volumetric overlap but no retaining connection is inadequate.
- **P2.8B:** test the *whole 59-body assembly* during -15..+15 mm suspension bump and +/-8° steering using coherent transforms, rather than inheriting separate P2.6 and P2.7 test results. Interpolate/sample the actual coupled kinematic solution; report failures honestly.
- **P2.8C:** composed HIGH/BALANCED/PERFORMANCE preview GLBs now exist; still require repairing the upright tessellation's watertightness, an independently re-tessellated HIGH/LOW source audit if demanded, and real WebGL macro and framerate verification.
- **P2.9:** source-first hydraulic and bearing detail, load-bearing suspension joints, authentic machining/toolmarks as geometry/normal information where supported; no fabrication or OEM F1 claims.
- **P3–P5:** actual WebGL browser visual/cinematic and performance review against the owner reference, accessibility and local QA. No GitHub CI.
- **Owner gate:** Draft/HOLD, no merge or production deploy.

The previous P2.8 preflight remains historically useful: it failed on actual interference. The new **static-only** remate now passes that specific stage but must not be described as a validated functional F1 suspension.
