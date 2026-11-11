# P2.34/54 — Real rear76 keyed inboard shaft-to-CV-housing interface

Date: 2026-11-11
Branch: `work/engineering-four-corners-local`
**Status: nominal static keyed interface PASS; functional articulating CV, torque capacity, full Model B G2 HOLD.**

## Actual source CAD modification

P2.34 imports the **actual original-source P2.33 rear76 native STEP** (SHA-256 `2807bfc253f2afaf76172fac06ed259051f970518bc3a3765c6c84e40438aa62`), its exact SHA-pinned 76-name index and the original P2.33 76-solid native collision audit. It replaces only two original named CadQuery B-Reps: `P217_REAR_DRIVE_HALF_SHAFT_UNSPLINED` and `P217_REAR_CV_HOUSING_PROTOTYPE`. All other 74 source bodies are unchanged, and no placeholder car is introduced.

The nominal P2.17 annular CV-housing body has radius 21–40 mm at z=−245…−234 mm, while the P2.28 revised original drive shaft has an axial 18.4-mm radius in that span. The baseline precise OpenCascade minimum-distance measurement was **2.600000 mm**. In P2.34:

- Four connected shaft keys are fused along the inboard shaft tenon at 90° spacing, with native `4.5 × 6.0 × 8.0 mm` bounding prisms.
- Four slightly larger `4.8 × 6.9 × 14.0 mm` matching keyways are Boolean-cut into the actual source CV-housing annulus, providing nominal clearance.
- A connected 25-mm-radius, 3-mm-long shaft shoulder spans z=−248…−245 mm and contacts the original housing inboard face at z=−245 mm.
- The part count stays exactly **76** and material base color for visual meshes stays `#87929D`.

At nominal position the shaft/annulus native B-Rep minimum distance is **0.000000 mm** with **zero positive intersection volume**. With the shaft deliberately rotated ±2° relative to the stationary housing, the native B-Rep intersection volume is **10.296118 mm³** at each sign. This demonstrates a geometric anti-rotation obstruction, **not** a certified rated spline, load or CV articulation.

## Native B-Rep static QA

| Gate | Actual result |
|---|---:|
| Original source B-Reps from P2.33 | 76 |
| Revised source bodies | 2 (shaft and housing) |
| New/doubled CAD owner IDs | 0 |
| Total nominal source pairs | **2,850** |
| Unaffected native source pairs inherited from P2.33 | 2,701 |
| Changed-source affected pairs | **149** |
| AABB-separated affected pairs | 141 |
| Exact OpenCascade B-Rep Boolean checks | **8** |
| Positive overlaps above 0.05 mm³ | **0** |
| Native Boolean errors | **0** |
| STEP independently imported and validated | **76/76** |
| Named original-source solid index | **76/76** |
| Automated native/GLB regression | **9/9 PASS**, zero skips |

Canonical local P2.34 output STEP: `P234_original_rear76_inboard_keyed_static.step`, SHA-256 `e44f34413a13d28d7c045e58a80f40460cb2c4b72a558e0c04db9f2c4ce64145`. Reproducible STEP bytes can differ between exports because of metadata; source SHA, B-Rep identities and fit checks must remain valid.

## Three P2.34 source-named GLB previews

74 previously SHA-verified P2.33 source meshes are reused unchanged. The two newly changed P2.34 solids are re-tessellated directly from the new native STEP. Every GLB contains 76 unique, watertight, winding-consistent, engineering-gray PBR meshes.

| LOD | Meshes | Triangles |
|---|---:|---:|
| HIGH | 76 | 191,350 |
| BALANCED | 76 | 132,036 |
| PERFORMANCE | 76 | 115,136 |

Source and output manifest SHA-256 pins, exact CAD source-name ownership, readback checks, and tamper-negative-controls are included. The portable P2.34 handoff ZIP contains the actual STEP, original P2.33 signed-by-hash inputs, GLBs, four byte-verified authoring/QA scripts, and regression logs.

## Mechanical G2 HOLD — important distinction

The original P2.17 `P217_REAR_CV_HOUSING_PROTOTYPE` is a *rigid annular prototype*, not an actual CV joint's outer race and ball tracks. Rigid shaft keys and housing slots **cannot transmit torque through angular articulation** as a Rzeppa, tripod or other actual CV joint does. The opposite-direction axial retaining mechanism, torque capacity, contact stresses, lubrication, boot sealing, real gearbox output flange, bump/toe/roll sweeps and original owner Model B full-car chassis datums are **not established**. This patch demonstrates a provisional source-native **rigid keyed interface**, not a complete engineering CV solution.

The next work must resolve real CV articulation and positive retention before a drivetrain dynamic G2 gate can pass. The P2.54 acceptance milestone remains conditional. No Actions, merge, deploy, or replacement of the owner's original Model B.
