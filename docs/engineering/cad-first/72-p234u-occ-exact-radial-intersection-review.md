# P2.34U/54 — Exact OCC radial surface intersections versus P2.34T point sampling

Date: 2026-11-12. Branch: `work/engineering-four-corners-local`.

**Implementation and 12/12 generic CadQuery/OpenCascade tests PASS in local development. The actual owner P2.34E 84-solid source, executed P2.34M measurement report and revised P2.34N STEP are still unavailable. Mechanical G2 HOLD.**

## Why this is necessary

P2.34T estimates material intervals on 36 prescribed radial rays with point classification at 0.1-mm intervals and bisects only changes in observed occupancy. A narrow material gap can fall **entirely between two sample points** and incorrectly appear continuous. P2.34U instead calls the native OpenCascade `BRepIntCurveSurface_Inter` algorithm to obtain face/radial-line intersections; it splits the radial review range at all detected intersections, then classifies the midpoint of every open interval as material/void. This exposes thin interruptions *on the prescribed ray*, subject to OCC numerical reliability and geometric degeneracies.

**Confirmed generic negative control:** a 0.02 mm wide box cutter placed inside a valid 3D cup-shell sample at radial x=37.43..37.45 mm produces two radial material intervals in the exact face-intersection review, while the representative 0.1 mm sample misses the gap and reports one. The test uses actual CadQuery/OCC synthetic B-Rep shapes. This is **not** evidence on the user's source84 vehicle assembly.

## Program behavior

- Apply the original review's 18 shaft plus 18 cup radial rays: six angles (0, 60, 120, 180, 240, 300 degrees), three z planes (-242, -239.5, -237 mm), with native source-local radial ranges 20–30 mm and 34.5–41 mm respectively.
- Record all source and revised OCC intersection radii, native-classified material intervals and minimum observed *on-ray* material spans.
- Compare those OCC intervals to the earlier P2.34T sampled-span reconstruction, reporting every disagreement. A mismatch is diagnostic, and not silently ignored.
- Recheck exact original P2.34E loader SHA pins, revised P2.34N STEP/audit SHA and original P2.34M → P2.34S → P2.34T report SHA lineage. Reimport and uniquely map all 84 original solids using P2.34O's identity review. Verify the two modified race solids remain strictly subtractive.
- Refuse existing report paths; always record `exactGlobalMinimumWallThicknessCertified: false`, `mechanicalG2Certified: false`.

The earlier 1 mm screen is reused as an exploratory finite-ray interval check and **not a validated manufacturing criterion**.

## Limitations

The OCC algorithm can face tangencies, coincident surface/line segments, tolerance instability, topology errors and near-degenerate cuts. The current implementation does **not** prove full resolution of these cases and leaves the explicit flag `tangentialDegeneraciesFullyResolved: false`. Even exact face-intersections on 36 rays cannot provide a rigorous global minimum wall thickness, manufacturing process feasibility, true C2-conjugate grooves, cage retention, loaded contact stress, shaft speed equality or torque transmission. This report is deliberately an inspection of the same P2.34N discrete spherical-cutter prototype, not a new approved CV design.

## Files and local commands

- `tools/cad-first/p2_34u_exact_ray_gate.py`
- `tools/cad-first/test_p2_34u_exact_ray_gate.py`

```bash
cd tools/cad-first
python -m unittest -v test_p2_34u_exact_ray_gate.py
python p2_34u_exact_ray_gate.py \
  --p234e-native /verified/P234E_native \
  --p234n-candidate /actual/P234N_native_prototype \
  --p234m-report /actual/P234M_native_audit.json \
  --p234s-report /actual/P234S_material_review.json \
  --p234t-report /actual/P234T_radial_review.json \
  --out /new/P234U_exact_intersection_review.json
```

Local tests: **12/12 PASS** on generic CadQuery/OpenCascade geometry plus report/provenance contracts. The committed script was authored to match the locally exercised approach; **no complete owner-source integration was run**.

## Next engineering gate

Actual owner-native execution of P2.34M through P2.34U is prerequisite to interpreting these diagnostics for the vehicle. Once available, use adaptive face-normal distances and section topology near the exact CV ball track and original source wall, then independently verify continuous cage pocket retention, contact normals, torque transfer and input-output angular velocity. Avoid accepting source-baseline overlaps or sparse-ray agreement as safe real hardware.

**P2.34/54 IN PROGRESS, G2 HOLD. No merge, deployment, Model B integration or GitHub Actions.**
