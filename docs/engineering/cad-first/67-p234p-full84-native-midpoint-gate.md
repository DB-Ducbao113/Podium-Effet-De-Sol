# P2.34P/54 — Full 84-solid native pair and interpolated midpoint QA

Date: 2026-11-12. Branch: `work/engineering-four-corners-local`.

**Delivered: native QA executable and 20 isolated synthetic logic tests. Original owner 84 STEP, P2.34M real measurement report and P2.34N revised STEP are NOT available in this runtime. No original CAD Boolean execution or accepted STEP. Mechanical G2 HOLD.**

## Design

P2.34O independently verifies that candidate STEP bodies may be reindexed to 84 original source IDs and that only the two CV races are subtractive geometry changes. P2.34P extends that to all **84 named solids**. For each source-original and post-cut candidate pose, screen all **84 choose 2 = 3,486** unordered pairs with axis-aligned bounding boxes and execute exact native OpenCascade Boolean volume only for overlapping boxes. Compare the candidate to the original at the **same transform** by immutable name pairs, not by unstable STEP solid indices.

Flag only overlaps **exceeding 0.05 mm³** that grow **more than 0.05 mm³** over the original pair's corresponding intersection. This is a new-interference *regression* check, not a claim the preexisting contacts are safe. All positive-volume, even subthreshold, evidence remains ambiguous for real loaded race contact. These numeric thresholds are exploratory only.

The original P2.34M path must provide a rectangular bend/phase grid of 3+ bend settings and 3+ phase pairs. P2.34P measures all selected native source poses, plus a midpoint between adjacent phase samples at each bend and between adjacent bends at each phase. With a 3x3 grid: **nine original pose samples plus 12 interpolated midpoint samples**. Each sample scans 3,486 pairs for each of original and candidate, while AABB-separated pairs skip exact Boolean calls. A static 84-solid source-versus-candidate scan is also performed.

At poses, *only* shaft, cup, six balls and cage receive the P2.34M prescribed CV transforms; all other original source bodies are deliberately held in their authored positions. This is not a full suspension dynamics model, and the linearly interpolated cage controls are **not** a physically solved trajectory. The code always exports `continuousClearanceCertified: false`, `constantVelocityCertified: false`, `torqueCertified: false`, `mechanicalG2Certified: false`, and `modelBFullCarIncluded: false`.

## Integrity / execution

The checker fails closed unless the original source loader authenticates original STEP, index and QA SHA-256 pins; the P2.34N candidate STEP hashes match its own audit; the P2.34M report matches that candidate audit; all 82 unchanged solids uniquely match original shapes; two changed races are independently verified as subtractive modifications. It refuses overwriting an existing report.

Files:
- `tools/cad-first/p2_34p_full84_adaptive_gate.py`
- `tools/cad-first/test_p2_34p_full84_adaptive_gate.py`

Local command:

```bash
cd tools/cad-first
python -m unittest -v test_p2_34p_full84_adaptive_gate.py
python p2_34p_full84_adaptive_gate.py \
  --p234e-native /path/to/original/P234E_native \
  --p234n-candidate /path/to/P234N_native_prototype \
  --p234m-report /path/to/P234M_native_audit.json \
  --out /path/to/NEW-P234P-full84-native-report.json
```

**QA status:** During local development, 20/20 isolated synthetic logic tests PASS and Python syntax compilation PASS. The test fixtures deliberately stub upstream modules when their CadQuery dependencies are absent; the real native implementation remains tied to original P2.34O/N/M imports. The pushed version has not been independently rerun from a clean repository checkout. Unit tests do not validate native source STEP geometry.

**Important limitation:** This is the first expanded all-pairs and sampled-midpoint program, not a physical/mechanical acceptance gate. Identical or inherited baseline overlaps may remain unsafe, AABB/Boolean tolerances require calibration, contact stress and groove strength are not checked, and midpoints cannot prove all inter-sample states.

## Next P2.34Q hard gate

Execute actual original source P2.34M → P2.34N → P2.34O → P2.34P locally. If and only if real source evidence supports the prototype, replace discrete sphere-cutter tracks with curvature-continuous track surface candidates and add wall-thickness, cage-pocket, ball-retention and contact-normal checks. Independently verify constant angular velocity and torque transfer before mechanical G2 acceptance.

P2.34/54 remains IN PROGRESS; mechanical G2 HOLD. No Model B full-car integration, merge, deploy or GitHub Actions.
