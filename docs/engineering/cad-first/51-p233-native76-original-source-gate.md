# P2.33/54 — Original-source rear76 B-Rep: nominal static PASS, mechanical G2 HOLD

Date: 2026-11-11  
Branch: `work/engineering-four-corners-local`  
**Status: REAL ORIGINAL 76-SOLID CAD STATIC PASS; original whole-car Model B / dynamics / manufacture NOT certified.**

## Important update from the previous P2.33 HOLD

The earlier version of this report documented only an algorithmic fixture. Its original-source runtime blocker is **now resolved** in the local CAD review environment. The complete authoring modules P2.9–P2.14 were transferred from this repository, and each of the seven original files was checked against its approved **Git blob SHA-1** (not approximate geometric reconstructions). The main authoring process imported and executed actual `p2_12_toe_adjuster.all_parts()` and `p2_14_split_spherical_race.source_parts()` with the genuine P2.31 56-solid STEP.

The original P2.31 STEP SHA-256 was `e09a949f8827be01f9c0e50fc9b9c781b302642f3b40ea432836fe16d7eac284`. The source union removes two old P2.10 bearing proxies, retains 54 previous genuinely authored B-Reps, adds six genuine P2.11/P2.12 toe parts and 16 genuine P2.14 split-race parts. It retains the previously corrected P2.19 A-arms and P2.29 machined upright; it does not duplicate P2.9/P2.10 source IDs.

## Actual local native OpenCascade audit (2026-11-11)

| Verified native source gate | Result |
|---|---:|
| Original Git-authored CAD files with byte-exact SHA-1 | **7 / 7 PASS** |
| Original P2.31 imported solids | 56 |
| Retained original B-Rep solids after bearing proxy removal | 54 |
| New original toe source parts | 6 |
| New original P2.14 split-bearing source parts | 16 |
| **Source-authenticated unique native solids** | **76** |
| All unordered part pairs | 2,850 |
| Previously checked retained old-old pairs | 1,431 |
| New/changed pair candidates | **1,419** |
| New pairs AABB-separated | **1,334** |
| New pairs checked with exact OpenCascade B-Rep Booleans | **85** |
| Positive intersection volumes > 0.05 mm³ | **0** |
| Native Boolean errors | **0** |
| Native STEP independent roundtrip | **76 / 76 valid solids** |
| One-to-one original source name → STEP solid mapping | **76 / 76** |

Original native STEP: `P233_original_rear76_native_static.step`  
STEP SHA-256: `2807bfc253f2afaf76172fac06ed259051f970518bc3a3765c6c84e40438aa62`.

This is a real **nominal static source shape** audit. The check inherits only the 1,431 previously verified unchanged B-Rep pairs; it screens all 1,419 affected new pairs and reports all 85 exact checks. A static no-overlap result is not proof of fastening, load transfer, manufacturing tolerances, kinematic clearance or a physically buildable assembly.

## Three new 76-mesh neutral source visual previews

A separate GLB composer takes **54 verified prior P2.29 source-view meshes** and tessellates the **22 newly authored original P2.12/P2.14 B-Reps**. Every GLB contains 76 independently named watertight meshes with one neutral engineering-gray base material `#87929D`.

| Source viewer LOD | Triangle count | SHA-256 |
|---|---:|---|
| HIGH | 190,906 | `cc58518cd0e064af187aa32601504381150f2a9095b64e6b401fdb53f8a43ed0` |
| BALANCED | 131,652 | `2f28fa1d45ac8a384c90fec90b0cd75fa351b9710093ac71d41fa19fd1b90936` |
| PERFORMANCE | 114,746 | `19983334a23828a2d022b6e054e1c693afe911d3bfbe72569ffb136b4419739b` |

P2.29 mesh source correspondence and this 76-mesh preview do **not** independently establish manufacturing accuracy. All original Model B complete-vehicle meshes are excluded.

## Real output tests and reproducible handoff

The updated user handoff `PEDS_P233_Authentic_Rear76_Native_STEP_3GLB_StaticPASS_G2HOLD.zip` contains 7 authentic source scripts, P2.31 input STEP and source index, tested real P2.33 native authoring/GLB scripts, 76-solid STEP, full native collision JSON report and named source map, P2.29 viewer inputs, three 76-part GLBs, original-source check and regression logs, README and SHA256SUMS.

Archive integrity: **30/30 SHA-256 checks PASS**, ZIP CRC pass. Unpacked into a clean directory, **17/17 regression tests PASS, zero skips** (8 earlier algorithmic source-owner tests + 6 authentic STEP/native tests + 3 authentic GLB tests).

The exact locally executed scripts are included in the handoff ZIP. The GitHub working branch also carries the P2.33 original source-integration gate and original-source QA. No GitHub Actions were executed.

## G2/Model B blocker remains

No source-authenticated original full-car Model B GLB/STEP or actual chassis/gearbox hardpoint registration is included in this rear-corner package. No continuous wheel spin, suspension bump/toe/roll, CV articulation, brake load, locknut/fastener retention, thread preload/fatigue, front axle/four-corner assembly, or browser-video scrolling QA has passed. Do not interpret nominal rear76 static PASS as the finished F1 car.

**P2.33/54 static CAD milestone COMPLETE. Mechanical G2 HOLD. Next P2.34/54: real inner CV interface and driving/articulation checks. P2.54 remains the conditional overall acceptance target, not a percentage-complete claim.**

No GitHub Actions, merge, deployment, PR or original Model B source mutation.
