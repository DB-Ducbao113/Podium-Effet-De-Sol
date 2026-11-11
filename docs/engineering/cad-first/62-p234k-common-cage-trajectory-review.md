# P2.34K/54 — Sampled common-cage trajectory review

Date: 2026-11-11. Branch: `work/engineering-four-corners-local`.

**Code and source-independent tests added. Original 84-solid source has not been run in this session. Mechanical G2 HOLD.**

## Purpose

P2.34J independently finds one common cage translation for each static coupled-phase pose, preserving six source-ball relative positions. P2.34K takes **three or more separate, genuine P2.34J native reports** at a single bend and checks whether their independently selected best translations describe a sampled candidate trajectory with bounded jumps.

The native source SHA, 84-part count, exact report schema, mechanical HOLD flag and candidate screens must be preserved. Inputs are hashed and named in the resulting report. Input and cup phase magnitudes must increase together using 360-degree phase unwrapping. Sampled phase-increment ratio, step sizes, shared translation jumps and half-bend cage orientation changes are evaluated separately; no disjoint configurations may silently pass as a continuous path.

**Important design limitations:** P2.34J performs only shared cage/ball translation and rotates the cage to half the bend angle. P2.34K inherits this **assumed** orientation; it does not solve cage freedom, groove normal vectors, force contact or ball-center kinematics. It checks independently chosen *best* poses only. Failure does not prove that other candidates lack a connected path. A pass is a sampled screen, not proof between samples or at loaded torque.

Exploratory limits: maximum 5° per phase step, 0.25 mm translation jump, 5° half-bend orientation step and 1% output/input phase-increment deviation. These values are analysis parameters, not certified F1 or OEM engineering tolerances.

## Files

- `tools/cad-first/p2_34k_common_cage_trajectory_gate.py`
- `tools/cad-first/test_p2_34k_common_cage_trajectory_gate.py`

To run tests locally:
```bash
cd tools/cad-first
python -m unittest -v test_p2_34k_common_cage_trajectory_gate.py
```

After producing **separate** source-authenticated P2.34J JSONs in order of increasing input phase:
```bash
python p2_34k_common_cage_trajectory_gate.py --j-report pose0.json pose1.json pose2.json --out new-P234K-report.json
```

**Source availability:** authentic owner P2.34E STEP/index/audit files were not present in the current working environment. No native OCC measurements, new STEP, GLB or full-car Model B tests are claimed.

## Next hard engineering gate

For P2.34L, retain the full feasible candidate set at each J pose and solve a constrained path across candidates, not just a best-per-pose greedy sequence; add cage orientation degrees of freedom and native cross-ball/pocket contact checks. Once a common path has evidence, derive and machine-test separately versioned inner/outer race track proposals. Real angle-to-angle velocity equality and torque transfer remain unproven.

**P2.34 remains IN PROGRESS; G2 HOLD. No merge, deploy or GitHub Actions.**
