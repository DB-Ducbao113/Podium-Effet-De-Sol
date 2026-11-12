# P2.34O/54 — Independent native post-cut CV STEP verification

Date: 2026-11-12. Branch: `work/engineering-four-corners-local`.

**Implementation delivered. No authentic P2.34N candidate STEP or P2.34M native evidence has been supplied/executed in this session. Mechanical G2 HOLD.**

## Scope and inherited blockers

P2.34N is a guarded CAD prototype generator that conditionally subtracts spherical source-derived cutter envelopes from two P2.34E original native races and exports a revised 84-solid STEP. Its export may reorder solids or discard original names. There is currently **no accepted P2.34N STEP** and no measured complete P2.34M original-source trajectory. P2.34O is therefore a **post-cut verification tool**, not a claim that actual CV geometry passed.

## P2.34O implementation

- Authenticate exact candidate STEP SHA, P2.34N native audit, its P2.34M report SHA and SHA-pinned original 84-solid P2.34E source. Reject tampering, unsupported modified parts and any premature G2/velocity/torque claims.
- Re-import candidate STEP and match the **82 unchanged source B-Reps** against originals using unique original volume/center/bounds signatures. If any original solid is missing, changed, ambiguous or duplicated, stop. This matching is a conservative identity guard, **not a preserved STEP naming guarantee**.
- Attribute the **two remaining revised native solids** to shaft and cup only when each has a unique audit-matching volume, plausible centroid/bounds and measured removed volume fraction. Reject disconnections or invalid shapes.
- Independently run native Boolean `revised.cut(original)` to detect **added material**, plus `original.cut(revised)` to measure removed native volume. Both races must be strictly subtractive, within experimental numerical tolerance.
- At all selected P2.34M cage poses, rerun P2.34M's native ball/shaft, ball/cup, ball/ball and ball/cage measurements against the **re-imported candidate**: **33 exact native intersection Booleans and 12 native BRepExtrema distances per pose**. Record full per-pose witness and preserve any failure, including missing dual-race contact or intersections. Even a positive exploratory screen is **not** validation of stresses or forces.

Output is an original-SHA-linked JSON audit with geometric identity map, independent material subset checks, per-ball sampled postcut native evidence and permanent `mechanicalG2Certified: false`.

## Tests and execution status

- `tools/cad-first/p2_34o_native_postcut_gate.py` — main postcut source-native audit.
- `tools/cad-first/test_p2_34o_native_postcut_gate.py` — standalone synthetic fixture contracts for source names, volume/centroid/bounds mapping, source pins, ambiguous identities, geometric subtraction, false certificates, measured-pair accounting and no-overwrite safety.
- **21/21 locally developed tests PASS**; the tests use synthetic shapes/numbers, **not owner 84-BRep STEP**. The committed code/test files were verified on GitHub but have **not been independently re-executed from a clean checkout**.

Local run with actual owner files (no GitHub Actions):

```bash
cd tools/cad-first
python -m unittest -v test_p2_34o_native_postcut_gate.py
python p2_34o_native_postcut_gate.py \
  --p234e-native /verified/original/P234E_native \
  --p234n-candidate /actual/P234N_native_prototype \
  --p234m-report /actual/P234M_native_audit.json \
  --out /new/path/P234O_postcut_native_review.json
```

Candidate directory must contain `P234N_source84_track_cut_PROTOTYPE.step` and `P234N_prototype_native_audit.json` from the same run. The program refuses overwriting existing audit files.

## Important engineering limitations

The P2.34N cut is a discrete union of spheres, not a smooth/conjugate manufacturable race. P2.34O checks **the existing prescribed finite path points** only; no mid-phase or continuously swept collision, contact force, shaft speed equality, torque transfer, wall thickness or cage retention is certified. The inspection is limited to the two changed races, six balls and cage. Unchanged source components' new intersections with cut races are **not** exhaustively screened here; a full source-wide native interference gate is still required.

On a source geometry mismatch, this checker fails closed; it does not modify original STEP or silently accept proxy geometry. Unique signatures and limited numeric tolerances are engineering diagnostics, not an authoritative persistent new 84-solid name index.

**Next P2.34P:** only after actual P2.34M → P2.34N → P2.34O source-native execution, audit the complete 84-solid candidate with source-identity reconstruction, pairwise B-Rep intersections and adaptive midpoint poses; design a smooth machinable groove and solve real contact/torque/velocity. No Model B full-car integration, merge, deploy or GitHub Actions.

**P2.34/54 IN PROGRESS. Mechanical G2 HOLD.**
