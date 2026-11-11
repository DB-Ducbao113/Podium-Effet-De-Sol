# P2.34E/54 — Original-source rear84 CV ball clearance / first-contact gate

Date: 2026-11-11. Branch: `work/engineering-four-corners-local`.

**84 genuine native CAD bodies at nominal static pose PASS; 11 prescribed local poses have positive native separation; full functional CV, torque capacity, Model B mechanical G2 HOLD.**

## Source and modification

Input source: genuine P2.34D 84-body STEP, exact SHA-256 `f59c2691a8bdba9b7d711eaaf8bebe8b6daac625b2783119abc3972d27cf7f83`, its source-index mapping and original native audit. Only **six existing**, individually named `P234C_REAR_CV_TORQUE_BALL_01..06` real OpenCascade spheres were reauthored at their original centres, with radius **3.60 → 3.72 mm**. All **78 other original CAD bodies** remain unchanged. No owner source Model B full vehicle is included or replaced.

## Actual executed native QA

| Check | Result |
|---|---:|
| Original source native CAD parts | **84** |
| Independently revised source bodies | **6** |
| Unchanged source bodies | **78** |
| All unordered static pairs | **3,486** |
| Inherited unchanged pairs | **3,003** |
| New/affected pairs | **483** |
| AABB-separated | **465** |
| Exact native OpenCascade Boolean checks | **18** |
| Significant native intersections >0.05 mm³ | **0** |
| Independent STEP readback | **84/84 valid** |
| Original source-name → STEP index mapping | **84/84** |
| Local angular samples | −10, −7, −5, −3, −1, 0, +1, +3, +5, +7, +10° |
| All nine-body local-pose pairs accounted | **396** |
| Unchanged original pairs inherited from P2.34D | 33 |
| Changed ball–ball pairs AABB-separated | 165 |
| **Exact OpenCascade minimum-surface-distance checks** | **198** |
| Minimum ball-to-shaft separation over samples | **0.073885 mm** |
| Minimum ball-to-cup separation over samples | 0.180000 mm |
| Minimum ball-to-cage separation over samples | 0.139998 mm |

The 198 distances are **not Boolean intersections**. Positive exact native minimum distance means the sampled pair is disjoint. Continuous swept motion, manufacturing tolerances and mechanical loading were not checked.

## Measured geometric free rotation before first contact

| Native OpenCascade BRepExtrema measurement | P2.34D | P2.34E |
|---|---:|---:|
| Nominal ball→inner track clearance | 0.300 mm | **0.180 mm** |
| Nominal ball→outer track clearance | 0.300 mm | **0.180 mm** |
| Nominal ball→cage pocket clearance | 0.260 mm | **0.140 mm** |
| First one-sided shaft→held-ball geometric contact | 1.088257° | **0.623657°** |
| First one-sided cup→held-ball geometric contact | 1.084473° | **0.612671°** |

These one-sided controlled rotation probes **do not demonstrate a two-sided loaded torque path**, transmission under preload, equal angular velocities or the function of a true Rzeppa/tripod CV. Nominal ball-to-track gaps remain nonzero, and the 0.073885-mm minimum bend clearance cannot be accepted as a safe real manufacturing tolerance without deflection/thermal/load evidence.

## Real source STEP and visual handoff

P2.34E native STEP source SHA-256: `9bd7ec6a60d5c4c9f1f3e421cb730fc252de026aae21dcf570584e5dda0ec63e`.

Three GLB tiers have **84 unique, watertight, winding-consistent source meshes** in CAD gray `#87929D`. Only six revised sphere B-Reps were re-tessellated; 78 others remain the exact prior P2.34D meshes. The user handoff `PEDS_P234E_Rear84_Real_CV_Ball_Clearance_STEP_GLBS_QA.zip` contains all authentic prior input STEP and three GLBs, new output STEP, three GLBs, full authoring scripts, QA report, GitHub independent gate, tests and a real B-Rep minimum-gap-vs-angle plot. The portable standalone full authoring/GLB source is in the ZIP; the repository `p2_34e_repo_contact_gap.py` independently recomputes original-source 84-BRep/11-pose geometry and first-contact thresholds.

QA: **9/9 full source/STEP/GLB tests plus 2/2 independent repository native tests** (run in separate processes to avoid occasional OpenCascade long-running kernel operations). Clean ZIP SHA256SUMS and CRC verified. GitHub source test remains fail-closed if the authentic original P2.34D STEP is absent or modified.

## G2 HOLD

The source CV inner/outer tracks and six balls are *not* a certified constant-velocity, torque-rated mechanism. Critical remaining tasks: derived equal input/output angular velocity under changing bend, positive two-sided ball-track engagement, realistic Rzeppa/cage motion, axial cup retention to gearbox, loaded contact stress, lubrication, actual Model B car/chassis hardpoints, four corners, Three.js/Anime.js full-car scroll and browser QA. P2.34/54 **IN PROGRESS**; P2.54 is a conditional project acceptance target, not a percentage-complete claim. No merge, deploy or GitHub Actions.
