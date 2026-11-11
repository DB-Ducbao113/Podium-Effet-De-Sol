# P2.34C/54 — Source84 six-ball angular-CV geometric feasibility (G2 HOLD)

Date: 2026-11-11. Branch: `work/engineering-four-corners-local`.

**Authentic native CAD: 84-body nominal static PASS. Sampled local nine-body angular poses ±10° PASS. Functional constant-velocity drivetrain: NOT CERTIFIED. P2.34 remains IN PROGRESS.**

## Original source provenance and scope

Uses the three exact SHA-256 pinned P2.34B owner files: 77-solid STEP `c4308df769268f4d9ca3996742dec214148ee088dbe4eb33dfdf2c22db005767`, source part-name index `d4824a82eb7651f58de65090de1998e6f86b4c2a5ca29c08f2b4852dedc3b3f6` and native source audit `313ff0ca120e1b4eb0171708c0472c7f1dca087485fc7e980bd9d4b842f30054`. No original Model B full-car chassis was included or modified.

The real P2.34B source shaft and housing retain their part IDs and are reworked with native OpenCascade geometry. The source housing's original 40 mm outer-radius / 11 mm axial-datum envelope is retained, with its bore enlarged to radius 35.5 mm. An inner drive race of radius 29 mm is fused to the original shaft. Six 3.9 mm radius axial ball grooves on a pitch radius of 32.2 mm are cut from both true native bodies. Six 3.6 mm radius independent ball B-Reps and one radius 29.8–35 mm cage B-Rep with six 3.86 mm spherical pockets are separately authored. 75 old sources remain unchanged.

The source now has **84 actual native solids**: 77 originally + 7 additional (six balls and a cage), with two of the original 77 revised. This is a six-ball CV-like geometric study; the straight axial tracks and prescribed guide motion are not production Rzeppa race geometry or proof of a constant angular velocity ratio.

## Actual nominal full-source B-Rep audit

| Metric | Executed value |
|---|---:|
| Separate original/source-derived native solids | **84** |
| All unordered native source pairs | 3,486 |
| Unchanged-source pairs inherited from P2.34B | 2,775 |
| New or modified-source pairs reviewed | **711** |
| AABB-separated changed pairs | 682 |
| New exact OpenCascade Boolean intersections | **29** |
| Significant intersections >0.05 mm³ | **0** |
| Native Boolean errors | **0** |
| Full STEP independent source roundtrip | **84/84** |
| One-to-one original source-name to STEP solid index | **84/84** |

Canonical native STEP SHA-256: `a5f961b580dbb142c63c9790840131cc181a739104653089cba5a80a65f53f46`.

## Angular pose screening and negative controls

The shaft rotates by θ about the nominal x-axis through z = −239.5 mm. The six ball centres and guide are **prescribed** at θ/2; the source housing remains fixed. Sample θ = **−10°, −7°, −5°, −3°, −1°, 0°, +1°, +3°, +5°, +7°, +10°**. Only the nine local native CV components move in this analysis. At each of 11 poses, all 36 local pairs are screened (15 AABB exclusions and **21 exact native B-Rep Booleans**). Thus **396 pose-pairs, 231 exact checks, zero intersections above 0.05 mm³**. A continuous swept-volume or dynamically moving 84-body rear-corner check has **not** been performed.

For reference, the old P2.34B rigid shaft/CV housing had a **69.499829 mm³** intersection at a 1° bend. The new study has no local native interference at its tested 1° pose. It does NOT establish real joint angular speed equality, cage self-centring, structural contact, or torque capacity.

Independent actual source CAD positive controls show a 2° torsional twist of shaft/outer race relative to a fixed first ball causes ~0.140 / 0.133 mm³ geometric B-Rep contact, respectively. A 1 mm ball radial displacement inward/outward causes >5 mm³ actual native interference. These are collision-checker positive controls, not qualification of traction/contact stress.

## Critical discovered regression: old retaining ring no longer works

The legacy `P234B_REAR_CV_SHAFT_SPLIT_RETENTION_RING` remains as a source-history part, but no longer contacts the remodeled enlarged-bore outer housing under a +0.5 mm axial shift (**0 mm³ intersection**). The P2.34B housing positive axial-retention result is **NOT transferable** to P2.34C. Cage/ball self-capture, replacement axial retainers, output-flange connection and rotational load path are therefore **HOLD**. Do not promote this six-ball prototype to a finished CV joint.

## Real viewer outputs and handoff QA

The handoff `PEDS_P234C_RealSource_CV_SixBall84_STEP_GLBS_11PoseQA.zip` contains: source-locked original P2.34B 77 STEP and source GLBs, P2.34C complete native authoring/STEP exporter and 84-part STEP/part-name index, three independently named PBR `#87929D` GLB profiles, ten actual source regression tests, native audit logs, a sampled-angle MP4 and screenshots. The three GLBs contain 84 individually named, watertight meshes. OpenCascade generated a handful of zero-area sphere seam faces, removed only in the preview mesh triangulation; original source B-Reps were unchanged. Triangle totals HIGH **257,976**, BALANCED **200,096**, PERFORMANCE **183,592**.

Actual tests: **10/10 PASS** from a *clean extracted ZIP*, **28/28 SHA-256** files verified, ZIP CRC passed. The 5.5-second H.264 1280×720 clip is an **11-pose, 2-fps engineering sample review**, not smooth continuous CV certification or the full Model B car/scroll website.

The GitHub branch also contains a compact source-native independent probe and regression, `tools/cad-first/p2_34c_source84_cv_probe.py` and `tools/cad-first/test_p2_34c_source84_cv_probe.py`. The full 84-body STEP exporter, GLB authoring, video renderer and ten executed test cases are contained in the handoff ZIP. No GitHub Actions were used.

## Next gate / reproduction

```bash
python tools/cad-first/p2_34c_source84_cv_probe.py --source-p234b-native .local-assets/cad-first/p234b-native --out .local-assets/cad-first/p234c-repo-probe
PEDS_P234B_ORIGINAL_NATIVE=.local-assets/cad-first/p234b-native PYTHONPATH=tools/cad-first python -m unittest -v test_p2_34c_source84_cv_probe
```

**P2.34/54 IN PROGRESS — mechanical G2 HOLD.** A true constant-velocity mechanism still requires crossing/offset tracks, guide-ball kinematic solution and angular-velocity measurement, positive cage/outer-cup retention, actual inner output flange, torque/contact/fatigue modelling, loaded tolerances and genuine moving rear/four-corner Model B clearance. P2.54 remains only a conditional total-project acceptance target. No merge, deploy or PR automation.
