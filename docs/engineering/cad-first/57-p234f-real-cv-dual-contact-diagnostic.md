# P2.34F/54 — Original-source CV six-ball two-interface contact screening

Date: 2026-11-11. Branch: `work/engineering-four-corners-local`.

**Actual B-Rep source84 probe completed. Functional CV: HOLD. Mechanical G2: HOLD. This audit makes no native CAD changes.**

## Exactly authenticated inputs

The source is P2.34E's 84-solid STEP and 84-name index, with byte-level SHA-256 guards:

- Native STEP: `9bd7ec6a60d5c4c9f1f3e421cb730fc252de026aae21dcf570584e5dda0ec63e`
- Original source-name index: `57afa74054ca892d2cb5633fb1c03a3c906fc2a928adf45f4674aa008952a62a`
- Original native static/pose QA: `b2eb8da1720cd5bf206e716e24ad8ebdde28d620bf31aaea456edb1b05e4b894`

The original Model B complete F1 vehicle is **not** in this source package. No P2.34E B-Rep, GLB, source name, material or exterior is modified.

## First contact of each real native ball to each race

30 actual native geometry cases: **6 balls × 5 prescribed bends** (−10°, −5°, 0°, +5°, +10°). With each source ball prescribed at the previous design's half-bend pose and held fixed, rotate either the inner race about the bent input axis or the outer housing about its axial output axis independently. Use OpenCascade `BRepExtrema_DistShapeShape` with a 2° bracketing interval and eleven bisections (angular step 0.0009765625°), stopping at distance ≤0.00001 mm.

| Prescribed bend | Ball group | Inner first-contact phase | Outer first-contact phase |
|---|---|---:|---:|
| 0° | Balls 1–6 | 0.624023° | 0.613281° |
| ±10° | Balls 1 & 4 | 0.624023° | 0.613281° |
| ±10° | Balls 2 & 5 | **0.248047°** | **1.025391°** |
| ±10° | Balls 3 & 6 | **0.437500°** | **0.835938°** |

**Worst mismatch in independently measured unloaded first-contact phases: 0.777344°**. A 0.05° investigative contact-symmetry check is **FAIL**; **this 0.05° is not an OEM engineering tolerance or physical CV requirement**. Fixed-ball independent rotations cannot prove a working two-sided loaded torque path, equal angular input/output velocities, real lost motion under load, cage self-centering, or constant-velocity ratio. This is evidence that the current CAD has non-uniform unloaded engagement as bending increases.

## Original OpenCascade negative tolerance/position control

At +10° with source ball 2, actual nearest B-Rep ball-to-shaft gap is **0.0738852825 mm**. Construct the nearest-surface unit direction from the OpenCascade minimum-distance witness points and translate the *actual* source ball toward the shaft. Intersect actual native solids:

| Deliberate ball offset | Native measured intersection |
|---:|---:|
| +0.05 mm | zero volume, remaining clearance 0.023885 mm |
| +0.10 mm | **0.02055085 mm³** |
| +0.12 mm | **0.05970708 mm³** |

The +0.12 mm displacement crosses the prior **0.05 mm³** static collision reporting threshold. These are hypothetical positional perturbations, **not measured machining variation, compliance/load prediction, rated tolerance or evidence of a real-world failure**.

## Reproducible code and QA separation

- Full actual original-source first-contact and witness producer, `src/p2_34f_dual_contact_gate.py`, CSV, JSON, chart and **4 native-source tests** are contained in portable `PEDS_P234F_Real84_CV_TwoSided_Contact_Tolerance_G2_HOLD.zip`.
- Independent, short-running repo entry point `tools/cad-first/p2_34f_repo_native_contact_guard.py` checks original source integrity, actual +10° independently bracketed race contacts, and B-Rep +0.10/+0.12mm collision witnesses. `tools/cad-first/test_p2_34f_repo_native_contact_guard.py` provides **2 additional tests**.
- The 30-case high-precision generator is executed to create the supplied results but repeated kernel queries at tangential CAD separation may occasionally stall. **Clean extraction regression therefore verifies immutable SHA checksums, all recorded cases, four independent safe OpenCascade contact brackets and genuine perturbation Boolean intersections**, instead of rerunning all 60 near-tangent binary searches. This distinction is explicit rather than claiming the full producer reran from scratch at every test.
- The ZIP contains source P2.34E STEP/index/native audit, one P2.34E 84-mesh neutral GLB as unmodified visual reference, 30-case CSV and full JSON, generated curve plot, original full scripts, tests and their logs. ZIP CRC valid, **16/16 SHA-256 items** and **6/6 independent tests PASS from a clean extracted ZIP**.

No new STEP/GLB is exported as P2.34F does not revise source geometry. The previous P2.34E STEP/GLBs remain the latest visual assets.

## Remaining hard gates

P2.34 is **IN PROGRESS**, not P2.35. Real simultaneous loaded ball-to-both-race contact, true CV equal angular speed under articulating/transmitting torque, guide cage solved kinematics, rated load/fatigue, positive cup-to-gearbox retention, true rear suspension swept collision, four corners and integration with the owner's original full F1 Model B are **not verified**. P2.54 is a conditional target; do not equate patch number with engineering completion percentage.

No GitHub Actions, merge, deployment or substituted Model B.
