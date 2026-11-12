# P2.34Y/54 — Conservative continuous straight-segment collision screen

Date: 2026-11-12. Branch: `work/engineering-four-corners-local`.

**Implementation pushed; 12/12 actual local Python/CadQuery/OpenCascade tests PASS on independent sample geometry. No authenticated original P2.34E 84-solid STEP, P2.34M measured report or P2.34N candidate STEP available in this session. Mechanical G2 HOLD.**

## Method

P2.34X models each six-ball displacement with a 3D node graph and checks sampled endpoints and edge midpoints for solid overlap. This may miss a collision between samples.

P2.34Y adds a conservative **full straight-translation segment** test on each edge of the sample route to the artificial P2.34X grid boundary. At the midpoint of a translated ball segment of length L, the exact OCC nearest gap to each stationary source-native obstacle (shaft, cup, cage) is d. Since moving a rigid shape by a translation of magnitude h can change the minimum shape separation by at most h, if **d > L/2 + 0.0001 mm** the entire straight segment is guaranteed separated from that obstacle, conditional on valid exact B-Rep geometry and numerical robustness.

If a midpoint has Boolean intersection volume >1e-8 mm³, classify BLOCKED with its obstacle and witness position. If separation cannot be guaranteed, bisect the edge and recurse, up to eight levels by default. At exhaustion or touching/near-zero gap, return **UNKNOWN** rather than claiming a collision-free edge. A graph route is classified clear only if **every constituent segment** is certified separated from all three obstacles.

The algorithm does not construct a swept-volume CAD body. The 1-Lipschitz distance bound is conservative for **rigid linear translation only**. It cannot assess angular articulation between source poses, whether the final grid boundary is outside an actual cage pocket, load-induced deformation, friction, force transmission, torque, or velocity ratio.

## Provenance

The program validates SHA-linked P2.34M and P2.34X reports, original source84 identity, P2.34N candidate STEP/audit, the original 84-solid loader, and the 82 unchanged plus 2 revised race mapping. Candidate race changes must be purely subtractive. It refuses output overwrites, invalid path jumps, nonfinite points and false upstream G2 claims.

The following output indicators are **always false**:
`fullCagePocketRetentionCertified`, `actualBallEscapeFromPocketCertified`, `fullArticulationDynamicsCertified`, `loadedTorqueCertified`, `constantVelocityCertified`, `mechanicalG2Certified`.

## Files and QA

- `tools/cad-first/p2_34y_continuous_segment_gate.py`
- `tools/cad-first/test_p2_34y_continuous_segment_gate.py`

The 12/12 passing local unit tests include true OCC sphere-to-sphere distances; definitely clear, blocked, and unknown segment cases; an obstacle near the path requiring recursive subdivision; invalid grid topology and SHA; and preservation of an existing report file. These generic shape tests do **not** constitute owner-source mechanical validation. The pushed code was not independently rerun after GitHub publication.

Local invocation:

```bash
cd tools/cad-first
python -m unittest -v test_p2_34y_continuous_segment_gate.py
python p2_34y_continuous_segment_gate.py \
  --p234e-native /verified/P234E_native \
  --p234n-candidate /actual/P234N_native_prototype \
  --p234m-report /actual/P234M_native_audit.json \
  --p234x-report /actual/P234X_sampled_configuration_graph.json \
  --max-depth 8 \
  --out /new/P234Y_continuous_segment_review.json
```

## Next engineering gate

Before adding more isolated diagnostics, the authentic native STEP and measured P2.34M pose evidence must be made available and the **existing P2.34M–Y chain actually executed**. P2.34Z should prioritize an executable end-to-end run manifest and audit of any schema mismatches, CAD source availability and test reproducibility. Only actual native evidence can justify further race design and loaded mechanical analysis.

**P2.34/54 IN PROGRESS — mechanical G2 HOLD. No Model B full-car integration, merge, deploy or GitHub Actions.**
