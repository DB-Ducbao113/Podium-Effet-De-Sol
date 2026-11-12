# P2.34R/54 — Source-linked C1 centerline interpolation diagnostic

Date: 2026-11-12. Branch: `work/engineering-four-corners-local`.

**Status:** 20/20 pure-Python numerical/provenance tests executed locally; native owner P2.34E STEP, P2.34M measured report and real P2.34Q report absent. No physical CAD groove has been redesigned, manufactured or accepted. **Mechanical G2 HOLD**.

## What changed from P2.34Q

P2.34Q reconstructed six original source-ball centerlines per bend for each of two native races and computed **three-point discrete curvature**. P2.34R consumes the complete source-Q report and constructs a **piecewise cubic Hermite curve with shared derivatives** at interior sample knots. The curve is mathematically position- and tangent-continuous (C1) where derivatives remain nonzero, but is **not** a proven C1/C2 machined CV groove surface.

Fail-closed input conditions: exact P2.34Q schema, original 84-source SHA and unchanged-source flags, P2.34M parent SHA shape, 3+ bends each with precisely 6 original balls × 2 original races, identical sample-phase scheduling, noncoincident points, strictly advancing phases, and valid finite millimeter coordinates. The input JSON is SHA-256 recorded. The report exposes each curve's per-segment phase width, source chord length, sampled curvature and sampled deviation from a straight chord.

Defaults: 16 samples per segment, exploratory flag at >1 inverse millimeter curvature or >0.25 mm chord deviation. **These are not manufacturing or OEM limits.** Values are numerical screening aids only. The cubic spline may overshoot source contact geometry and no B-Rep cutter/sweep was constructed. Even when all source traces report no flags, source material thickness, cage pocket retention, contact normals, tool clearance, stresses and torque remain unknown.

## Source files

- `tools/cad-first/p2_34r_centerline_spline_gate.py`
- `tools/cad-first/test_p2_34r_centerline_spline_gate.py`

Local execution:

```bash
cd tools/cad-first
python -m unittest -v test_p2_34r_centerline_spline_gate.py
python p2_34r_centerline_spline_gate.py --p234q-report /actual/P234Q_centerline_diagnostic.json --out /new/P234R_spline_diagnostic.json
```

**QA:** 20/20 tests passed in the active local Python runtime (no source STEP). They cover C1 derivative matching, zero/nonzero curvature, duplicate or missing trace IDs, SHA pin/provenance shape, phase progression, bad coordinates, cusp guard, output overwrite refusal, and permanent engineering HOLD flags. GitHub push is source/test/docs only; no Actions or deployment.

## Next acceptance blockers

The original-source chain must run **P2.34M → P2.34N → P2.34O → P2.34P → P2.34Q → P2.34R** with real independently authenticated source evidence. After that, a separate P2.34S native design/QA gate must measure revised race wall thickness, test curve and cutter envelopes against original B-Reps, verify smooth groove construction and cage retention, and calculate the actual coupled kinematics and loaded torque path.

This milestone is computational preparation, not completion of P2.34 or mechanical G2. No original source changes, Model B integration, merge, deploy, or GitHub Actions.
