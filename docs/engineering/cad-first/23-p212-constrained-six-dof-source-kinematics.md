# P2.12 — 6DOF constrained source-proposal rear toe kinematics

Project: **Podium Effet De Sol** · branch: \`work/engineering-four-corners-local\`  
CAD input: **P2.9 / P2.10 / P2.11 / P2.12 threaded v3**, unmodified source geometry.  
Engineering status: **G2 HOLD**. No verified structural chassis or native joint articulation.

## Previous blocker and distinction

The previous P2.12 "free screw" demonstrator translated two threaded eye ends relative to **unchanged rear toe bearings**. At sleeve turns ±90° their centres moved 0.5 mm away from the pinned joint centres; at ±180° the lateral component exceeded the project-authored nominal radial annulus gap. That was a real defect in the *unconstrained animation assumption*.

A physical rear toe linkage instead moves the upright with the arm geometry as the effective rod-eye separation changes. P2.12 now includes a separate **source-proposal, six-degree-of-freedom geometric solver**. It does **not** silently animate the existing 19 CAD solids or claim that the earlier pinned-eye failure vanished from the free-screw demonstration.

## Six source-defined geometric equations

Unknowns: upright translation (X/Y/Z, millimetres) and orientation (rotation vector X/Y/Z, radians).

Solve these six simultaneous residuals:

1. Upper A-arm, inner chassis pickup A ↔ outer spherical-bearing centre: preserve original distance.
2. Upper A-arm, inner chassis pickup B ↔ outer spherical-bearing centre: preserve original distance.
3. Lower A-arm, inner chassis pickup A ↔ outer spherical-bearing centre: preserve original distance.
4. Lower A-arm, inner chassis pickup B ↔ outer spherical-bearing centre: preserve original distance.
5. Fixed inner toe joint ↔ upright-mounted outer toe joint: distance equals nominal toe length plus **2 × 2 mm/revolution × sleeve turn / 360°**.
6. Wheel-centre source origin has constant **Y** (illustrative fixed ride-height slice).

Project-authored hardpoints are imported directly from P2.10/P2.11 source, not manually copied from body polygons. Each upper/lower A-arm is additionally checked for a **single rotation about its original two fixed inner chassis pivots**, reproducing the moved outer spherical-centre datum.

The solver uses \`scipy.optimize.least_squares\`, a CAD dependency already declared in \`tools/cad-first/requirements.txt\`. Bounds are ±10 mm translation / ±3° rotation-vector components; all six residuals must be <0.001 mm; degenerate Jacobians and nonfinite results fail. The 0.001 mm criterion is a computational check, **not** a manufacturing tolerance.

## Executed task-container geometry evidence

Native hardpoints were read from the packaged P2.9–P2.12 v3 source proposal and checked at seven turns:

| Sleeve turn | Calculated upright Y-axis rotation (Euler XYZ Y) | Max ideal length residual |
|---:|---:|---:|
| −180° | +0.60519° | <0.001 mm |
| −90° | +0.30141° | <0.001 mm |
| −45° | +0.15041° | <0.001 mm |
| 0° | 0° | 0 mm |
| +45° | −0.14985° | <0.001 mm |
| +90° | −0.29914° | <0.001 mm |
| +180° | −0.59612° | <0.001 mm |

In the task-container prototype, maximum exact mathematical linkage residual was **~2.84×10⁻¹⁴ mm**. Both A-arm outer-centre reconstructions about their individual chassis hinge axes passed the same computational tolerance. **Five local solver regression tests passed**.

This is more constrained than rotating the rear upright about the line joining its two lug bores (the single-hinge shortcut changes nominal upper/lower arm leg lengths by up to approximately 0.24 mm at ±90°). The six-equation solver solves **all four** arm distances simultaneously.

## Mechanical issues newly exposed, not hidden

Even when all ideal joint **centres** are mathematically closed, the current P2.10/P2.11 "spherical bearings" are represented by **annular CAD cylinders with source-aligned bores**, not verified articulated spherical races/balls. Source yaw makes the *transformed upright pin axes* noncoaxial with the ideal A-arm and toe-link local bearing bore axes.

At ±90°, calculated toe bearing/pin axis mismatch is about **0.553–0.562°**; upper/lower arm mismatch is about **0.318–0.320°**. At −180°, the toe mismatch reaches about **1.134°**. These must be addressed with correctly designed physical ball-joint articulation, clearance and retention before mechanical G2.

This solver **does not** certify:
- real Model B structural chassis hardpoints, because the current points are project-authored proposals;
- 19-solid dynamically transformed B-Rep collision/interference, or full bump/roll/camber/toe coupling;
- real toe-arm pin/spherical-bearing articulation, thread flank force transmission, preload, material stress/fatigue or real rear wheel-end P2.8 fit;
- an animated/cinematically accurate full car, Chromium/WebGL or recorded MP4.

## Local commands (no GitHub Actions)

\`\`\`powershell
python tools/cad-first/test_p2_12_constrained_kinematics.py
python tools/cad-first/p2_12_constrained_kinematics.py --out ".local-assets/cad-first/p212-constrained-six-dof.json"
\`\`\`

The JSON report includes seven source-derived poses, body transform vectors, both rigid wishbone hinge rotations, remaining bearing-axis mismatch, source CAD SHA-256 for **all four source Python files**, and explicit false certification flags.

\`tools/cad-first/run_four_corners_local.py\` has been extended to require this report alongside the existing source static 171-pair, phase-negative-control 12-case, and free 19-solid pose checks. It **refuses** stale reports when **any** P2.9–P2.12 source file changes and does not grant G2.

**Status:** source hardpoint *centre* closure numerically solved at fixed ride-height for seven sample positions; CAD articulation and genuine chassis-mated motion remain **G2 HOLD**.
