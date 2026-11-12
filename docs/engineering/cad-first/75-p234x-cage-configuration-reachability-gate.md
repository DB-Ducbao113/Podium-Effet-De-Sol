# P2.34X/54 — Sampled 3D ball-displacement configuration graph

Date: 2026-11-12. Branch: `work/engineering-four-corners-local`.

**Implementation committed. 14/14 tests executed locally with generic CadQuery/OpenCascade B-Reps and pure graph fixtures. No actual SHA-pinned P2.34E original 84-solid STEP, P2.34M measured path or P2.34N candidate STEP was available for native owner-source execution. Mechanical G2 HOLD.**

## Scope

Previous P2.34W checked each ball against its cage via independent ±X/±Y/±Z displacement probes. P2.34X generalizes this to a finite sampled 3D translation graph, checking **all three** obstacles in the original source-native CV scene: revised shaft, revised cup and unchanged cage. At every prescribed P2.34M source pose, six balls are moved independently from their transformed authored positions. The program computes exact native BRep Boolean intersection volumes with each obstacle at sampled translation nodes, and *also* at the midpoints of neighboring nodes.

Default graph: Cartesian offsets (-0.75,0,+0.75) mm on each axis, **27 nodes** with six-neighbor adjacency, and at most 54 half-edge midpoint collision checks for an all-clear graph. Each sampled offset is three exact native Boolean intersections (shaft, cup, cage). It records obstacle intersection volumes at the root, number of tested nodes and edges, number of Boolean queries and a shortest sample graph route to **the artificial grid boundary**, if one is found. Optional bounded `--steps-per-axis 2` allows 125 nodes; this is more expensive.

A route to an artificial grid boundary is **not evidence of actual escape** from the cage pocket. The grid covers neither the entire range of ball positions nor rotational, deformation or dynamic degrees of freedom. Collisions may exist *between* sampled endpoints and midpoint; the current algorithm therefore has no continuous collision-free guarantee. Conversely, an inability to reach the grid boundary cannot establish retention, and a collision at the root means no valid sampled start state for this diagnostic.

## Native dependencies and source protection

The checker verifies source84 SHA pins, original unmodified 84-BRep name/index mapping, original P2.34M prescribed selected-pose evidence and the exact P2.34W SHA/source/candidate/pose metadata. It independently reimports the P2.34N STEP, reconstructs the two revised races and 82 unchanged names, and repeats subtractive cut checks. It refuses existing output paths. It never modifies source geometry, starts integration or marks G2 acceptance.

Report fields are fixed:
- `sampledBoundaryIsNotCageEscape: true`
- `fullCagePocketRetentionCertified: false`
- `continuousCollisionFreePathCertified: false`
- `surfaceStressCertified: false`
- `constantVelocityCertified: false`
- `loadedTorqueCertified: false`
- `mechanicalG2Certified: false`

## Tests and execution

Local development: **14/14 PASS** (pure Python connected/disconnected graph tests and actual OpenCascade ball–obstacle Boolean tests). Includes rejection of root penetration, a collision at a sample-edge midpoint, missing 3-obstacle provenance, source report hash mismatch, false G2 claim and overwrite refusal. Test BReps are independent generic spheres; the authentic CV source geometry is not evaluated.

Files:
- `tools/cad-first/p2_34x_cage_reachability_gate.py`
- `tools/cad-first/test_p2_34x_cage_reachability_gate.py`

```bash
cd tools/cad-first
python -m unittest -v test_p2_34x_cage_reachability_gate.py
python p2_34x_cage_reachability_gate.py \
  --p234e-native /verified/P234E_native \
  --p234n-candidate /actual/P234N_native_prototype \
  --p234m-report /actual/P234M_native_audit.json \
  --p234w-report /actual/P234W_face_normal_and_cage_probe.json \
  --step-mm 0.75 --steps-per-axis 1 \
  --out /new/P234X_sampled_configuration_graph.json
```

## Required next engineering gates

First execute the authentic original P2.34M and revised P2.34N/P2.34W sequence. Next, evaluate adaptive collision-free motion of the complete cage/ball/shaft/cup assembly and continuous BRep swept volumes, not isolated translations or artificial grid boundaries. Require a physical geometric retention proof across source bend and phase ranges, then independently solve contact loads, angular speed equality and torque. No full-car Model B integration, merge, deployment or GitHub Actions.

**P2.34/54 IN PROGRESS. Mechanical G2 HOLD.**
