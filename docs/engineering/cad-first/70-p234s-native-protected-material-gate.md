# P2.34S/54 — Protected native CV shaft/cup material review

Date: 2026-11-12. Branch: `work/engineering-four-corners-local`.

**Deliverable:** Native OpenCascade/CadQuery test gate with source-linked P2.34O/P2.34P evidence and two explicitly bounded material-protection zones. **Mechanical G2 HOLD.** No owner-native 84-solid P2.34E/P2.34N STEP pair or executed P2.34M–P audit was accessible in this session; no authentic P2.34S result has been produced.

## Actual scope

P2.34R constructs an analytic C1 centerline from earlier discrete source trajectory samples. That does not determine a manufacturable CV groove, race-wall thickness, ball retention or load capacity. P2.34S therefore does **not** assert a true global wall-thickness measurement. It protects two **specified local subsets** of the as-authored original B-Reps:

- **Shaft core:** original material intersecting a cylinder of radius 24 mm, axial range z = -245..-234 mm.
- **Outer cup shell:** original material in an annular cylinder with radii 38.5..41 mm, the same axial range.

Both regions are defined in the inherited original P2.34E source-local millimeter coordinate frame, near the recorded CV datum z = -239.5 mm. They are design-screening masks, **not a certified minimum wall thickness**. A future engineering review must verify that the specified zones are genuinely appropriate for the car's original geometry.

For each source/revised race, exact native B-Rep Boolean intersections obtain the amount of source material present inside its protected envelope and the amount of that material removed from the candidate. Source occupancy must be at least 1 mm³ to stop a meaningless PASS when the zone contains no source race. The exploratory allowed removal is at most 0.001 mm³. Independent candidate-minus-source Boolean rejects added material, consistent with the earlier P2.34O subtractive guard.

## Provenance and mandatory integration

The main command reads the SHA-pinned original P2.34E 84-solid STEP/index/audit through P2.34F's loader; requires the candidate P2.34N STEP plus audit, the P2.34M report and the independent P2.34O and P2.34P JSON results. It verifies their input/output hashes, source part count, unique 82-unchanged-solid mapping consistency and 84-part full-pair review metadata. It reimports the candidate and independently reconstructs the original-to-candidate geometry mapping before native protected-zone testing.

Failure of either P2.34O's sampled contact screen, P2.34P's full-84 interference-regression screen or either native material-protection zone prevents the combined **exploratory** diagnostic flag from passing. Irrespective of that flag, the output explicitly states:

- `actualLocalWallThicknessFieldMeasured: false`
- `fullSmoothGrooveC2SurfaceCertified: false`
- `cagePocketRetentionCertified: false`
- `loadedContactStressCertified: false`
- `constantVelocityCertified: false`
- `transmittedTorqueCertified: false`
- `mechanicalG2Certified: false`

## QA

Files:
- `tools/cad-first/p2_34s_native_protected_material_gate.py`
- `tools/cad-first/test_p2_34s_native_protected_material_gate.py`

Local development: **13/13 PASS**, including **five genuine CadQuery/OpenCascade operations on independent generic shapes** testing retained material, shaft-core damage, cup-shell damage and missing source occupancy. These shapes are *synthetic*, not project source84 geometry. The SHA/report tests use synthetic fixtures. The committed version was not rerun from a clean checkout.

Example owner-local command:

```bash
cd tools/cad-first
python -m unittest -v test_p2_34s_native_protected_material_gate.py
python p2_34s_native_protected_material_gate.py \
  --p234e-native /verified/P234E_native \
  --p234n-candidate /actual/P234N_native_prototype \
  --p234m-report /actual/P234M_native_audit.json \
  --p234o-report /actual/P234O_postcut_native_review.json \
  --p234p-report /actual/P234P_full84_native_report.json \
  --out /new/P234S_material_review.json
```

## Next hard gates

Verify the real original STEP and each executed upstream source audit; calibrate the protected region against the actual race groove and chassis geometry; sample *true local minimum wall thickness* near a continuous C2 toolpath with B-Rep surface/solid inspection; verify cage pocket retention, coupled angular-velocity kinematics and loaded torque. The discrete spherical cutter prototype and the new screening tool are not adequate for mechanical G2 approval.

**P2.34/54 IN PROGRESS. G2 HOLD.** The original 84 source solids remain unmodified. No Model B integration, production deployment, merge or GitHub Actions.
