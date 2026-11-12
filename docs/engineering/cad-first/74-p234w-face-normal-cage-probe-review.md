# P2.34W/54 — Face-supported OCC nearest normals and directional cage obstruction probe

Date: 2026-11-12. Branch: `work/engineering-four-corners-local`.

**Implementation and tests committed. Direct OpenCascade API smoke on three generic sphere-pair configurations: 3/3 PASS. Full 12-test committed suite not executed on an exact clean checkout. Original P2.34E STEP and actual P2.34M/V evidence absent; no original 84-solid measurements. Mechanical G2 HOLD.**

## Why P2.34W is necessary

P2.34V identifies nearest points on the ball and CV race but the separation unit vector is **not necessarily a surface normal**. At edge/corner support and tangency, surface normals can be non-unique or misleading.

P2.34W calls native OpenCascade `BRepExtrema_DistShapeShape`, checks the nearest support's `BRepExtrema_IsInFace` classification for the *other* solid, and obtains an oriented native face normal using CadQuery's `Face.normalAt()`. It records the cosine between that normal and the race-to-ball separation direction; if the gap is zero (contact/penetration) or the nearest support is an edge/vertex, the result is classified as ambiguous, not certified. The exploratory direction-consistency threshold is cosine >= 0.95 for available face-supported solutions. This geometric witness check **does not calculate loaded contact normals, dynamic forces or transmission**.

For the cage, six axial translation directions (±X, ±Y, ±Z) are checked for ball–cage intersection at offsets 0.5/1.0/2.0 mm. An unobstructed direction indicates a possible geometric escape path for that *sampled displacement*, but **does not prove cage failure**, because retention may depend on other components, articulation, and continuous geometry. Conversely, collisions with the cage in some directions **do not prove captive ball pockets**. The output explicitly sets `pocketContainmentCertified: false` and `fullCagePocketContainmentCertified: false`.

## Source and output contract

The program requires the original SHA-256 pinned 84-solid P2.34E source loader, an actual P2.34N candidate STEP and audit, a P2.34M native path report, and P2.34V report. Input lineage is checked; source→candidate names are reestablished via P2.34O's unique geometric mapping, and both modified races are checked to remain subtractive. Per-pose evidence records 6 balls × 2 face-normal reviews plus cage directional probes. The original source is immutable. All G2/force/velocity/torque certification fields remain false even if exploratory direction checks happen to pass.

Local commands:

```bash
cd tools/cad-first
python -m unittest -v test_p2_34w_face_normal_cage_probe.py
python p2_34w_face_normal_cage_probe.py \
 --p234e-native /verified/P234E_native \
 --p234n-candidate /actual/P234N_native_prototype \
 --p234m-report /actual/P234M_native_audit.json \
 --p234v-report /actual/P234V_native_nearest_contact.json \
 --out /new/P234W_face_normal_and_cage_probe.json
```


Files:
- `tools/cad-first/p2_34w_face_normal_cage_probe.py`
- `tools/cad-first/test_p2_34w_face_normal_cage_probe.py`

## Actual validation status

Three direct native OCC smoke cases executed locally: two spheres with 1 mm gap (at least one valid face-supported witness with orientation cosine >0.95), two tangent spheres (zero gap, no unique separation direction), and two penetrating spheres (zero gap, no unique separation direction), all PASS.

The 12-case regression suite was committed, but **not executed** from the GitHub version; do not report 12/12 PASS. No owner-original STEP, actual P2.34M accepted path or revised P2.34N source-derived STEP was present to run the full native chain.

## Remaining gates

1. Source-authentic full pipeline P2.34M→P2.34N→P2.34V→P2.34W.
2. Evaluate actual cage-pocket geometry, six-ball capture relative to cup/shaft under articulation, and the full continuous escape configuration space, not just six sampled translations.
3. Verify race and cage contact face normals in loaded contact situations, friction, reaction forces, velocity ratio and torque, and valid C2 groove surfaces before any mechanical G2 decision.

**P2.34/54 IN PROGRESS. G2 HOLD. No Model B integration, merge, deploy, or GitHub Actions.**
