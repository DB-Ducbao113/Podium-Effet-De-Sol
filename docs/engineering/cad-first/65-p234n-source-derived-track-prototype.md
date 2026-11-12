# P2.34N/54 — Original-derived native CV track-cut STEP candidate (HOLD)

Date: 2026-11-12. Branch: `work/engineering-four-corners-local`.

**Code delivered; original 84-native STEP not present in this session; NO P2.34N STEP has been created or validated from owner source. Mechanical G2 HOLD.**

## What is implemented
`tools/cad-first/p2_34n_track_candidate.py` requires two actual inputs: the original P2.34E 84-solid source STEP, index and audit with their fixed SHA-256 pins (loaded using P2.34F's native loader), and the *executed* P2.34M native report, including its per-pose qualifying candidates and sampled cage path indices. This is not a generator from P2.34M's example schedule or synthetic tests. It refuses missing, failed, contradictory or incomplete native evidence; the candidate report's SHA is recorded.

For every chosen pose and six real source balls, P2.34N applies the P2.34M rigid cage transform to the ball centers, then maps the transformed centers **back into each race's source-local coordinates**: inverse X-bend/Z-spin for the input shaft and inverse negative Z-spin for the output cup. It creates **separately versioned cutter spheres** with radius derived from each native original ball volume plus bounded trial clearance (default 0.05 mm). The cutter compounds are subtracted from *copies* of the original shaft and housing. The remaining 82 native bodies stay inherited, and no input source files are overwritten.

The builder refuses a malformed or disconnected machined solid, a per-race cut beyond the experimental 30% volume-loss guard, a source ball that does not match the expected sphere envelope, and an export/re-import that does not preserve 84 valid solids. The output carries a SHA-256 audit and permanent **G2 HOLD** flags.

**Serious limitations:** This is a *discrete union of spherical milling envelopes*, not a curvature-continuous machined conjugate groove. Selected per-bend paths from P2.34M do not prove a continuous two-parameter bend/phase trajectory. The sample-set groove is not independently checked post-cut against all ball/cage contacts, groove wall thickness, cage retention, structural strength, velocity equality or loaded torque. STEP export/reimport may not preserve owner names or source index order; therefore the output has no approved new owner ID mapping and must not be treated as an accepted 84-part replacement. No GLB or Model B integration.

## QA
Source-independent Python transform and fail-closed contract checks: **15/15 local PASS**. A separate standalone CadQuery/OCC smoke test cut a prototype sphere from a generic annular solid and returned one valid B-Rep body. Neither constitutes evidence for the original native 84-solid STEP.

To run locally with actual owner files:
```bash
cd tools/cad-first
python -m unittest -v test_p2_34n_track_candidate.py
python p2_34n_track_candidate.py \
  --p234e-native /path/to/verified/P234E_native \
  --p234m-report /path/to/actual/P234M_native_audit.json \
  --out /path/to/NEW-P234N-native-prototype
```

No GitHub Actions, merge, deploy, or Model B claim.

**Next verification gate**: independently run P2.34M on original source, inspect if it yields full qualified paths. Only if that gate passes may P2.34N generate a provisional STEP, then reindex source IDs, audit every modified native solid and sample dense coupled poses on the cut geometry. Solve continuous groove curvature/cage kinematics and loaded forces before considering G2 acceptance.

**P2.34/54 remains IN PROGRESS — G2 HOLD.**
