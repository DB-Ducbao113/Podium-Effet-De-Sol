# P2.21 — Rear rotor-hat interface correction (native CAD)

Date: 2026-11-10
Branch: `work/engineering-four-corners-local`
Scope: owner-authored rear wheel-local static CAD. No Model B replacement or original source binary changes.

## Defect confirmed using P2.16/P2.17 original source solids

The previous P2.17 rotor-hat spacer was **4.1231056 mm** from the P2.16 rear brake rotor (OpenCascade BRepExtrema exact minimum distance). Because the existing collision audit only checked positive intersections, a "no collisions" result did not demonstrate a physical rotor-to-hat interface.

The original hat-to-hub gap was 0.4 mm. P2.21 preserves this as an explicit HOLD rather than declaring torque transfer without a spline/key/friction clamp. Former dust seal position also intersects the revised flange, so its model is relocated; the seal is not certified.

## Source CAD corrections

`tools/cad-first/p2_21_rear_rotor_mount.py` creates 11 independently named native STEP solids:

- Replacement source `P216_REAR_BRAKE_DISC_VENTED`: retain original vented rotor and machine eight new mounting bores at radius 80 mm, each with a 3.40 mm radius.
- Replacement source `P217_REAR_ROTOR_HAT_SPACER`: connected axial stem and radial flange, seated at z=-64 mm at the original disc face and drilled with corresponding eight bores.
- Replacement source `P217_REAR_BEARING_DUST_SEAL`: alternative static location away from flange, not a certified seal.
- Eight `P221_REAR_ROTOR_HAT_STUD_UNTHREADED_01` to `_08`: original, individually named, unthreaded 3.05 mm shank radius B-Rep solids with separate heads. Their axial retention/locking is NOT certified.

These 11 solids replace three prior names and add eight new names **only in the review composite**. The 32-part original source becomes a **40-part candidate**. Original P2.16/P2.17/P2.18 scripts and the owner Model B GLB remain unchanged. All parts retain the same neutral base color `#87929d`; metalness and roughness vary by component role.

## Executed local source QA

| Gate | Measured |
|---|---:|
| Before: original hat to disc minimum distance | 4.123106 mm |
| After: revised hat to disc minimum distance | 0 mm |
| Remaining revised hat to original hub minimum distance | **0.4 mm (HOLD)** |
| Original source bodies | 32 |
| Native revised part IDs | 11: 3 replacements and 8 additions |
| Candidate rear source solids | **40** |
| Possible 40-body pairs | **780** |
| Excluded by AABB | **640** |
| Exact native B-Rep Boolean pairs | **140** |
| Intersections > 0.05 mm3 | **0** |
| P2.21 STEP roundtrip | **11/11 valid** |
| P2.21 HIGH / BALANCED / PERFORMANCE GLB triangles | 27816 / 10876 / 5816 |
| SHA-verified 40-part review GLB triangles (H/B/P) | 86280 / 48156 / 37630 |
| Individual native/source + 40-part composite tests | **6/6 PASS** |

A further true STEP source cross-check imports the SHA-verified **two original P2.19 revised arm solids** from the owner's previous review package. It screens 80 P2.19-arm-vs-P2.21-source pairs: 76 AABB exclusions, 4 actual B-Rep Boolean intersections and zero overlaps >0.05 mm3. This **does not** include the remaining P2.9/P2.10 bodies or P2.12/P2.14.

The P2.21 GLB composite reads SHA-verified P2.18 rear32 originals and the new P2.21 native source; it preserves 40 distinct source part names and rejects mutated GLBs. It will skip its test when the exact prior owner P2.18 local binary bundle is missing, rather than simulating that source.

## Reproduce locally, no GitHub Actions

```bash
PYTHONPATH=tools/cad-first python -m unittest -v test_p2_21_rear_rotor_mount test_p2_21_composite_review
python tools/cad-first/p2_21_rear_rotor_mount.py --out .local-assets/cad-first/p221-native
python tools/cad-first/p2_21_composite_review.py --rear32-dir .local-assets/cad-first/p218-rear32-neutral-review --p221-dir .local-assets/cad-first/p221-native --out .local-assets/cad-first/p221-rear40-review
python tools/cad-first/p2_21_p219_cross_gate.py --p219-dir .local-assets/cad-first/p219-source --out .local-assets/cad-first/p221-p219-cross
```

All output directories must be new. Native source scripts require CadQuery, OpenCascade/OCP, NumPy and trimesh as previously installed for P2.16–P2.20. The browser's original Model B is untouched.

## Remaining blockers / scope truth

**Mechanical G2 HOLD.** A planar hat/disc face contact and no-volume-intersection alone do not prove clamp load, rotor hat bending strength, fastening torque or wheel hub torque transmission. Studs are still unthreaded, the 0.4 mm hat-hub gap remains, and actual bearing preload/CV/gearbox/suspension movement are unresolved.

**P2.20 authentic 63-body original P2.12/P2.14 native audit is NOT RUN.** Do not add eight new studs to a nominal 63-body count and call the corresponding 71-body assembly validated. Actual Model B station registration, full-car integration, browser captures, new MP4, performance and device QA are also NOT RUN.

No PR, GitHub Actions, merge, deployment or OEM claim.
