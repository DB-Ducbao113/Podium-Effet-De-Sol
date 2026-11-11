# P2.34/54 (continued) — Real rear77 provisional CV axial retaining ring

Date: 2026-11-11. Branch: `work/engineering-four-corners-local`.

**Native static geometry: PASS. Mechanical G2: HOLD. Functional articulating CV joint: FAIL at 1° tilt.**

## Implemented on authentic P2.34 native STEP

Using the SHA-256-verified original **76-source-BRep P2.34 STEP**, machine the original `P217_REAR_DRIVE_HALF_SHAFT_UNSPLINED` with an external circlip groove spanning z = −233.85…−232.55 mm, root radius 17.8 mm. Add a separately named, native connected open C-ring body `P234B_REAR_CV_SHAFT_SPLIT_RETENTION_RING` at z = −233.70…−232.70 mm, radial dimensions 17.95…23.50 mm, with a 3 mm split. Preserve all 76 original source IDs, giving **77 individually named original/project-authored B-Rep bodies**, not a substitute Model B car.

The ring is a provisional geometrical retention feature, not a fatigue-qualified spring steel retainer or approved manufacturing design.

## Measured OpenCascade evidence

| Static/negative-control check | Actual result |
|---|---:|
| Total native connected solids | **77** |
| Original unmodified source bodies | 75 |
| Modified original bodies / new retainer | 1 / 1 |
| All unordered native pairs | **2,926** |
| Inherited unaffected P2.34 pairs | 2,775 |
| Newly affected native pairs | **151** |
| AABB-separated new pairs | 142 |
| Exact new native OpenCascade B-Rep Boolean intersections | **9** |
| Significant nominal overlaps over 0.05 mm³ | **0** |
| Boolean errors | **0** |
| Full STEP independent roundtrip and source ID index | **77/77** |
| Source-hash authenticated tests from clean ZIP | **9/9 PASS** |
| ZIP SHA-256 items | **30/30 valid** |

**Axial nominal clearances:** circlip to shaft groove root 0.15 mm, circlip to CV housing face 0.30 mm. No significant native overlap at the nominal pose.

**Deliberate contact tests:** housing +0.5 mm creates 58.046442 mm³ overlap with the circlip; housing −0.5 mm creates 260.117588 mm³ overlap with the existing shaft shoulder. Pushing the C-ring ±0.4 mm into the shaft groove shoulder creates 12.509266 mm³ intersection in each direction.

**Articulating CV negative control:** tilt the rigid CV housing **1°** around the local x-axis through z = −239.5 mm: it intersects the shaft by **69.499829 mm³**. This definitively fails the proposed angular joint geometry. The new C-ring does not repair or certify CV articulation or rated torque/load. Retention spring material, installation deflection and radial capture are NOT certified.

## GLB and QA handoff

Three source-named neutral `#87929D` 77-mesh watertight GLB previews have **193,014 / 132,752 / 115,564 triangles** (HIGH/BALANCED/PERFORMANCE). They reuse 75 SHA-pinned original P2.34 preview meshes and retessellate only the native grooved shaft and independent C-ring. A VTK offscreen image renders the actual three B-Reps in seated and deliberately separated inspection poses.

The user handoff `PEDS_P234B_Rear77_Axial_Retainer_CAD_STEP_GLBS_QA.zip` contains all original SHA-pinned P2.34 input STEP/GLB source, new 77 B-Rep STEP, 77 source ID map, three 77 source GLBs, authoring/QA code, screen and actual QA logs. No GitHub Actions were used.

**P2.34/54 remains IN PROGRESS.** The real Rzeppa/tripod/other angularly articulating CV design, axial retention material/load verification, gearbox flange, chassis source registration, suspension sweep and original full-car Model B browser scroll are still missing. P2.54 is a conditional acceptance target, not a percent-complete claim. No merge/deploy or original car source mutation.
