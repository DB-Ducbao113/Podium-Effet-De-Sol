# P2.34Q/54 — Original-source CV race centerline curvature review

Date: 2026-11-12. Branch: `work/engineering-four-corners-local`.

**Status: numerical screening tool committed; original P2.34E STEP and executed P2.34M measured report absent. Mechanical G2 HOLD.**

## Purpose

Earlier P2.34N cuts discrete spherical envelopes in the original source shaft and cup using selected P2.34M ball centers. Such a cutter union does **not** provide a designed smooth groove. P2.34P checks full-84 solid interference regressions only at finite sampled poses and interpolated midpoints. P2.34Q is a **preliminary centerline geometry audit**: it reconstructs selected native ball centers into both inner and outer source-race local coordinate systems and reports chord lengths, finite turn angles, and three-point discrete curvature for every source ball and sampled bend.

The implementation `tools/cad-first/p2_34q_native_centerline_review.py` imports the source using the existing SHA-pinned P2.34F loader and requires P2.34N's original P2.34M path validator. It uses actual original native sphere center coordinates, not guessed track dimensions, and does not edit any original B-Rep. There are six ball traces on each of two race sides per bend (36 total for three bends). The tool applies exploratory **2 mm maximum sample chord and 20° maximum discrete turn** screening flags. These are neither tolerances nor approval criteria.

The three-point curvature radius is not a verified osculating radius for a manufactured CV track, and three or more point samples do not certify C1/C2 surface continuity. This stage does not measure source race wall thickness, force transmission, friction, cage pocket retention or dynamic ball tracking. Interpolation between P2.34M poses is intentionally excluded from claims.

## Files and execution

- `tools/cad-first/p2_34q_native_centerline_review.py` — native-source SHA-linked centerline/turn/curvature report with unconditional G2 HOLD.
- `tools/cad-first/test_p2_34q_native_centerline_review.py` — 13 source-independent synthetic contracts checking the numerical and reporting logic.

Local engineering run (no Actions):

```bash
cd tools/cad-first
python -m unittest -v test_p2_34q_native_centerline_review.py
python p2_34q_native_centerline_review.py \
  --p234e-native /verified/original/P234E_native \
  --p234m-report /actual/native/P234M_native_audit.json \
  --out /new/path/P234Q_centerline_diagnostic.json
```

**Actual QA in this session:** six independent local mathematical smoke checks were run and passed for straight-line curvature, circular three-point radius, coincident points, reversed point path and nonfinite inputs. The full newly committed 13-test suite **has not been executed from a clean checkout** and no real native 84-solid measurement was performed. Do not call these tests mechanical QA.

## Required next gates

1. Execute original-source P2.34M with the SHA-matched real 84-solid STEP, then P2.34N → P2.34P; without actual evidence, new track designs are hypothetical.
2. Evaluate measured centerline samples for feasible trajectory topology across phase/bend and define **continuous** inner/outer groove centerlines with controlled tangents, curvature and wall clearance.
3. Inspect native track wall thickness, full-body interference, ball-cage retention, loaded contact normals and constant input/output angular velocity against actual source geometry.

The original 84 solids and Model B remain unmodified. **G2 HOLD, P2.34/54 IN PROGRESS.** No merge, deploy or GitHub Actions.
