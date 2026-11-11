# P2.34D/54 — Real P2.34C native 84-body CV ball/cage axial-envelope fix

Date: 2026-11-11  
Branch: `work/engineering-four-corners-local`  
**Scope: original 84-BRep nominal static and 11 sampled local angular poses PASS. Actual functional constant-velocity gearbox, loaded ball retention and whole-car Model B G2 HOLD.**

## Fault P2.34C's zero-overlap audit did not catch

The original P2.34C six-ball CV-like source was collision-free at its 11 prescribed local poses, but that was not evidence of contact or ball capture. Exact native OpenCascade BRepExtrema confirms at the zero-degree pose each ball has a **0.300 mm unloaded gap** from both input shaft and outer-cup ball channels, and **0.260 mm** from its guide pocket. A positive torque transfer, self-centering cage or speed ratio is not demonstrated by nominal no-overlap geometry.

With the original cup z span **−245 … −234 mm**, four of six actual source balls protrude **0.530427 mm beyond the cup end plane at +10° and −10°**. Geometric escape is possible even though the nine-piece collision screen previously passed.

## Native geometry modified, not a new substitute car

Input is the real source-named P2.34C 84-BRep STEP pinned to SHA-256 `a5f961b580dbb142c63c9790840131cc181a739104653089cba5a80a65f53f46`. The original source index and source collision report are SHA-pinned as well.

Exactly **two existing source-owner BReps** were revised:

- `P217_REAR_CV_HOUSING_PROTOTYPE`: extend actual annular housing **1.5 mm at both ends**, from z **−245..−234** to **−246.5..−232.5 mm**. Fuse two integral **0.30 mm axial end lips** with **31.5 mm throat radius**.
- `P234C_REAR_CV_BALL_GUIDE_CAGE`: OpenCascade slab-intersection machine the actual spherical-pocket source cage from **11.0 to 7.0 mm** axial height.

All **82 other source bodies and their names are unchanged**. The new CAD assembly retains **84 source IDs**. The old P2.34B shaft C-ring still does NOT anchor the revised outer housing to the gearbox or load path.

## Measured original OpenCascade QA

| Source-native B-Rep measure | Executed result |
|---|---:|
| Named original source solids | 84 |
| Modified original bodies | **2** |
| New/duplicated source owner IDs | **0** |
| Original native source pairs | 3,486 |
| Inherited unchanged pairs | 3,321 |
| Newly affected pairs rechecked | **165** |
| New AABB-excluded pairs | 149 |
| New exact OCC Boolean intersections | **16** |
| Significant collisions above 0.05 mm³ | **0** |
| Native STEP readback / source names | **84/84 each** |
| Local nine-piece angle samples | **11** (−10°, −7°, −5°, −3°, −1°, 0°, +1°, +3°, +5°, +7°, +10°) |
| Angle-sample pair screening | **396** |
| Angle-sample exact OCC Booleans | **231** |
| Local angle-sample significant clashes | **0** |
| Original P2.34C balls outside cup at ±10° | **4 of 6** |
| P2.34D balls outside cup at ±10° | **0 of 6** |
| Minimum ball axial-envelope margin at ±10° | **0.969573 mm** |
| Minimum cage axial-envelope margin at ±10° | **0.462867 mm** |
| Forced individual ball ±4 mm into integral end-lip overlap | **3.210366 mm³ each direction** |
| Forced cage ±4 mm into integral end-lip overlap | **193.453364 mm³ each direction** |
| Unloaded B-Rep ball→shaft / ball→cup / ball→cage gaps | **0.300 / 0.300 / 0.260 mm** |

New STEP SHA-256 `f59c2691a8bdba9b7d711eaaf8bebe8b6daac625b2783119abc3972d27cf7f83`. Three source-named neutral **#87929D** watertight GLBs were exported at HIGH/BALANCED/PERFORMANCE: **252,388 / 175,816 / 155,638** triangles. Only two of the original 84 viewer meshes were re-tessellated; 82 retain prior geometries. A VTK comparison screenshot renders actual source GLBs at a prescribed +10° pose.

**Independent reproducibility:** clean extraction of the original user handoff `PEDS_P234D_Rear84_CV_Ball_Axial_Capture_STEP_GLBS_QA.zip` passed **9/9 tests**, **28/28 SHA-256** source/file integrity checks and ZIP CRC. The complete STEP exporter, GLB compositor, comparison renderer and full nine-test suite are in this ZIP. On GitHub, the independently verified same-source geometric regression `tools/cad-first/p2_34d_repo_cv_envelope_gate.py` and its test `test_p2_34d_repo_cv_envelope_gate.py` are byte-matched to the local execution and pass **2/2 tests** when the real P2.34C source data is mounted.

## Limits that must not be promoted to PASS

The source Rzeppa-like geometry is an engineering proposal with straight axial grooves. The **0.300 mm unloaded ball-to-track clearance remains unresolved as a load/contact problem**. Native zero intersection and an axial end-lip obstruction do not prove a real torque path, a constant angular speed ratio, ball-cage load retention, axial end-lip strength/fatigue, an output flange or a gearbox-to-car connection. These are **11 discretely prescribed local poses**, not a continuously solved kinematic or swept-volume check of the entire 84-part moving rear corner.

The original owner **Model B full-car chassis is not contained** in this package. Four wheel stations, front suspension, rear gearbox, original chassis hardpoints, Three.js + Anime.js full-car scroll, mobile performance, and the final whole-car video remain outstanding.

**Progress remains P2.34/54 (IN PROGRESS). Mechanical G2: HOLD.** Do not advance to P2.35 solely because the ball envelope now clears. P2.54 remains an acceptance *target* rather than an effort percentage or guaranteed final patch. No GitHub Actions, merge or deployment.
