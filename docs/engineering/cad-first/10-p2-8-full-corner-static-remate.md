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

**No P2.8 GLB exports are marked complete.** Initial export attempt exceeded the local execution limit; no partial output is presented as a valid HIGH, BALANCED or PERFORMANCE GLB. P2.6 and P2.7 old GLBs cannot be overlaid as a substitute: their source upright is not the freshly machined P2.8 geometry.

## Remaining execution gates

- **P2.8A:** author genuine upright outer-joint bearing/boss/retainer geometry that keeps a structurally connected load path. A model with no volumetric overlap but no retaining connection is inadequate.
- **P2.8B:** test the *whole 59-body assembly* during -15..+15 mm suspension bump and +/-8° steering using coherent transforms, rather than inheriting separate P2.6 and P2.7 test results. Interpolate/sample the actual coupled kinematic solution; report failures honestly.
- **P2.8C:** regenerate HIGH/BALANCED/PERFORMANCE GLBs from this exact new master, retain all 59 source IDs, SHA-256 manifest and inspect macro normals/edge fidelity in real WebGL.
- **P2.9:** source-first hydraulic and bearing detail, load-bearing suspension joints, authentic machining/toolmarks as geometry/normal information where supported; no fabrication or OEM F1 claims.
- **P3–P5:** actual WebGL browser visual/cinematic and performance review against the owner reference, accessibility and local QA. No GitHub CI.
- **Owner gate:** Draft/HOLD, no merge or production deploy.

The previous P2.8 preflight remains historically useful: it failed on actual interference. The new **static-only** remate now passes that specific stage but must not be described as a validated functional F1 suspension.
