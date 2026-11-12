# P2.34V/54 — Native nearest-point witnesses for six CV balls, races and cage

Date: 2026-11-12. Branch: `work/engineering-four-corners-local`.

**Source/tests delivered, 11/11 local tests PASS on real generic CadQuery/OCC sphere B-Reps. The authentic P2.34E 84-solid STEP, measured P2.34M report and P2.34N cut STEP are unavailable here. Mechanical G2 HOLD.**

## New measurement

P2.34U measures exact BRep/radial-line intersections on a finite set of prescribed rays. P2.34V introduces native `BRepExtrema_DistShapeShape` queries on each of the six genuine source balls against the **revised inner shaft, revised outer cup, and unchanged cage** at each selected original-source P2.34M pose. It records minimum BRep distance, up to 16 OCC nearest-point witness pairs, their coordinates, separation-direction unit vectors (only when separated), and corresponding exact solid intersection volume. With six balls × three counterparts, each pose schedules **18 minimum-distance queries and 18 Boolean intersections**.

The source and candidate pose transforms reuse P2.34M's existing rigid half-bend / cage correction / translation prescription. BRep source index is reconstructed via P2.34O's unique 84-solid identity matching, after SHA-256 source/candidate report checks, immutable P2.34E source loader verification and P2.34N subtractive-cut audit. P2.34U must have passed its finite-ray screen; this does not prove the earlier screens are physically acceptable.

## Explicit distinction: witness direction vs contact normal

A line connecting the nearest points of two *separated* solids is a **gap-direction diagnostic**. It is not necessarily the actual race-surface normal or reaction-force vector. At zero distance or overlapping bodies there can be multiple ambiguous geometric witnesses; this code **does not** assign a unique contact normal. It does not compute face-level OCC `BRepAdaptor_Surface` normals or load reactions. A nonintersecting ball and cage can also be outside an open cage pocket; therefore absence of cage intersection is **not proof of ball retention or containment**.

Exploratory thresholds: at most 0.05 mm distance between each ball and both races; intersection volume tolerance 1e-8 mm³. These values are not race manufacturing tolerances. Contact stress, continuous cage capture, C2 machinable grooves, constant velocity, torque transmission and G2 remain unproven even if the sampled screen passes.

## Files

- `tools/cad-first/p2_34v_nearest_contact_witness.py`
- `tools/cad-first/test_p2_34v_nearest_contact_witness.py`

Local commands:

```bash
cd tools/cad-first
python -m unittest -v test_p2_34v_nearest_contact_witness.py
python p2_34v_nearest_contact_witness.py \
  --p234e-native /verified/P234E_native \
  --p234n-candidate /actual/P234N_native_prototype \
  --p234m-report /actual/P234M_native_audit.json \
  --p234u-report /actual/P234U_exact_intersection_review.json \
  --out /new/P234V_native_nearest_contact.json
```

**11/11 tests actually executed locally**, including true OpenCascade minimum distances on disjoint, tangent and overlapping generic spheres, overlapping cage classification, corrupted SHA, false G2 claim, and output overwrite. The test suite is not a substitute for source84 native verification. The pushed files are being independently fetched/verified, not executed via GitHub Actions.

## Next hard gate

P2.34W should investigate native face parameter/surface normals *only at verified separations and unique witness configurations*, detect underconstrained cage capture through geometric containment rather than overlap-only tests, and identify real reaction-force paths. The source 84 solids and genuinely measured upstream P2.34M–U reports remain prerequisites for any physical conclusions. The original source remains untouched.

**P2.34/54 IN PROGRESS. Mechanical G2 HOLD. No Model B full-car assembly, merge, deploy, or GitHub Actions.**
