# P2.12 v3 — 19-source-solid pose QA and pinned toe-bearing closure

Repository: **DB-Ducbao113/Podium-Effet-De-Sol**  
Branch: **work/engineering-four-corners-local**  
Date: **2026-11-09**  
Engineering gate: **G2 HOLD — no actual chassis remate, no release/deploy**.

## Why 12 good thread samples and 30 five-part Boolean pairs were insufficient

The P2.12 static proposal reuses P2.9 upright, 10 P2.10 suspension parts and P2.11 toe-eye bearings/pin. The five P2.12 threaded parts then replace the original fixed P2.11 toe rod. The **free-screw** demonstration rotates the adjuster sleeve while translating the opposite-hand rod ends (and their respective locknuts) by \`pitch*turn/360°\`. The other 14 CAD bodies remain fixed.

This is a useful *unconstrained thread motion demonstration*, **not** a kinematically closed suspension.

The P2.11 bearing centres remain fixed at the design datum positions. But in the free-thread motion, the two toe rod ends shift along the source axis. No source CAD for chassis/upright joint pickup migration, toe angle, spherical bearing rotation or coupled wishbone motion has been solved.

## Executed source CAD evidence

Test scripts:

- \`tools/cad-first/p2_12_19_body_motion_audit.py\`: all 19 original source CAD solids at sleeve angles **−90°, 0°, +90°**, 5 adjuster bodies moving / 14 old-source bodies fixed. Per-case native B-Rep pair classification is isolated in its own subprocess with timeout and source SHA in the JSON report.
- \`tools/cad-first/p2_12_joint_closure_gate.py\`: evaluates the nonclosure of pinned toe-eye centres at **−180°, −90°, −45°, 0°, +45°, +90°, +180°** using source coordinates independently of OpenCascade Boolean.
- \`tools/cad-first/test_p2_12_joint_closure_gate.py\`: mathematical regression, radial envelope and source-hash/no-overwrite checks.

The task-container review of the **packaged P2.12 v3 source** produced:

| Sleeve angle | 19-body pair classifications | Native Boolean candidates | Pinned outer eye mismatch | Pinned inner eye mismatch |
|---|---:|---:|---:|---:|
| −90° | 171 | 24 | 0.5 mm | 0.5 mm |
| 0° | 171 | 24 | 0 mm | 0 mm |
| +90° | 171 | 24 | 0.5 mm | 0.5 mm |
| **Total** | **513** | **72** | — | — |

The remaining **441 pairs** were excluded by nonoverlapping axis-aligned bounding boxes. No B-Rep exceptions or recorded above-threshold positive overlaps in these three source-only poses. **This does not certify geometric clearance** because earlier QC demonstrated false-negative zero Booleans on actual helical male/female geometry. The existing independent 12-case phase/surface occupancy test therefore remains mandatory.

The pinned-joint source-coordinate regression is independent of OCC Boolean:

| Sleeve angle | Axial movement of each rod end | In-plane bore-centre deviation |
|---|---:|---:|
| ±45° | 0.25 mm | 0.159544 mm |
| ±90° | 0.5 mm | 0.319087 mm |
| ±180° | 1.0 mm | 0.638174 mm |

At nominal 0°, the eyes match the authored P2.11 bearing centres. At any nonzero free-screw turn, these positions cease to coincide exactly with the **unchanged** static source bearing centres. The modeled P2.11 toe bearing outer radius is 11.6 mm and P2.12 eye bore radius is 12.0 mm, so the nominal transverse radial gap is 0.4 mm. At ±180°, the **projected offset** of 0.638174 mm exceeds this nominal gap, indicating an incompatible fixed-bore proxy pose even before accounting for flange/retention or spherical articulation.

That conclusion is **conditional on holding the prior 14 CAD bodies fixed**. A physically correct suspension could move the upright and/or spherical joints; their actual structural pickup locations and kinematics must be established to calculate that movement. The current showroom shell is not an authenticated structural chassis and cannot supply those hardpoints.

### Verification boundaries

The new gate is an **expected engineering blocker**, not a newly certified solution. It must demonstrate the mismatch and record:

- \`nominalPinnedEyeClosureWithin0p01mm=true\`;
- \`adjustedPinnedEyeClosureWithin0p01mm=false\`;
- \`actualChassisHardpointsVerified=false\`;
- \`continuousKinematicsCertified=false\`;
- \`mechanicalG2=HOLD\`.

The numerical 0.01 mm reporting criterion is a *review threshold* to detect the modeled coordinate mismatch, **not** a chosen manufacturing tolerance.

The local runner also checks the source SHA, 12 helical phase negative-control cases, 3 five-body source poses, the earlier CAD steps, and 3 complete 19-body source poses before browser recording. It uses **local Python processes**, not GitHub Actions.

### Reproduction without CI

\`\`\`powershell
python tools/cad-first/test_p2_12_joint_closure_gate.py
python tools/cad-first/p2_12_joint_closure_gate.py --out ".local-assets/cad-first/p212-pinned-joints.json"
python tools/cad-first/p2_12_19_body_motion_audit.py --out ".local-assets/cad-first/p212-all-19-pose-closure.json"
\`\`\`

The full-repository QA runner and WebGL video were **not executed in the current task**; source scripts and gates are committed for local use. Native 19-body B-Rep evidence and independent joint-closure evidence were executed against a P2.12 v3 source snapshot in the task container. A full checkout/source-byte-identical GitHub run still needs verification.

## What remains required for mechanical G2

1. Real engineering structural chassis and accurate rear upright/toe-pickup hardpoints (the current project-authored values are proposals).
2. Coupled rear suspension kinematic solver and correct rod-eye, bearing, wishbone and toe-angle motion under sleeve adjustment.
3. Proper structural bearing freedoms, axial retention, threaded flank loading, hard stops and locknut torque/preload.
4. Continuous swept-volume/solid-occupancy checks, true rear wheel-end P2.8 59-part cross-source mating and rear drivetrain clearance.
5. Structural stress/fatigue, regulatory/manufacturing review, source-faithful browser QA and owner-visible MP4.

**Gate conclusion:** 19-body static pose and source-point nonclosure measured, **not** solved; P2.12 remains source-development only, mechanical **G2 HOLD**.
