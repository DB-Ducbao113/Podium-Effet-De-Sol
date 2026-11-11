# P2.34M/54 — Original-native common cage orientation and multi-bend phase screening

**Date:** 2026-11-11. **Repository:** `DB-Ducbao113/Podium-Effet-De-Sol`. **Branch:** `work/engineering-four-corners-local`.

**Delivered:** source-compatible engine, explicit pose-grid fixture, 31 source-independent local tests PASS. **Not delivered:** original P2.34E STEP native measurements, redesigned CV tracks/STEP, constant-velocity or torque acceptance. **Mechanical G2 HOLD.**

## Engineering transition from P2.34L

P2.34L searched all passing cage **translations** along a phase path but inherited the assumption that the cage and its six balls rotate only by half the bend angle. P2.34M expands the native trial pose to **rigid cage + six source balls as one group**, with three-axis correction samples about the original CV datum (`z = -239.5 mm`) after the source half-bend. The original shaft uses the P2.34G input `Z spin → X bend` transform, while the original cup uses negative `Z spin`. Each trial applies the exact same transformation to the cage and balls and then one local-frame translation. Source STEP and all original 84 solids remain unchanged.

Correction samples are **axis-aligned ±0.5° on X/Y/Z plus zero**. This is a seven-orientation local search, *not* a full 3D orientation solution. The default translation sphere has 0.2 mm steps and radius 0.2 mm, yielding seven offsets and **49 candidates per pose**. All candidate evaluations call OCC on the **real SHA-pinned P2.34E 84-solid native B-Rep**, if the actual owner-only source is supplied. No substitute primitive or generic car model is acceptable.

Per candidate, 6 balls are measured against both source races (12 exact `BRepExtrema` minimum distances, 12 exact solid intersection volumes), 15 original ball–ball and 6 ball–cage exact intersection volumes: **33 B-Rep Boolean tests + 12 native distances**. With the nine-pose example, the program schedules **14,553 Booleans and 5,292 distances**. These are execution *counts* only, **not claims that the operations ran on actual STEP**.

A candidate passes the **exploratory** geometric screen only if all six balls are within 0.00001 mm native minimum separation of **both** races, with no ball–race or ball–ball overlap >0.05 mm³ and no ball–cage overlap >1e-9 mm³. Positive subthreshold overlap remains unresolved contact/penetration, not certified unloaded contact. Cage pocket retention, bearing loads, reaction forces and safe clearances are **not** demonstrated by zero volume intersection.

For every bend, the solver considers **all** trial candidates that pass this screen and searches a phase-sequence path by dynamic programming, bounding shared translation jumps to 0.25 mm and cage orientation-correction jumps to 0.75°. It then checks the **independently selected best paths** across adjacent bends (0.5 mm translation, 6° conservative orientation-step limits). The cross-bend check is diagnostic only: no joint two-dimensional phase/bend constraint solution or between-sample contact proof is claimed.

The manifest must prescribe at least three bend angles with **the same three or more input/output phase pairs at each bend**, ordered and within the experimental 5°/1% sampled phase-ratio limits. It is a measurement schedule, **not precomputed fake source evidence**. The original 84 STEP, index and audit are SHA-verified by the existing P2.34F source loader before operations begin.

## Repository files

- `tools/cad-first/p2_34m_cage_orientation_native.py` — source-native multi-pose sampler, 33 Boolean/12 distance witness audit, translation + orientation candidate path solver and mandatory HOLD.
- `tools/cad-first/test_p2_34m_cage_orientation_native.py` — 31 local tests for input validation, 3-axis transforms, 6-ball/race/pocket collision classification, globally non-greedy path selection, phase/bend continuity and fake CAD API **accounting only**.
- `tools/cad-first/fixtures/p234m-prescribed-pose-grid.example.json` — explicitly exploratory nine-pose schedule (-10/0/+10°, shaft/cup phases 0/0.5/1.0°). No CAD results or acceptance claim.

## Local owner execution (no GitHub Actions)

```bash
cd tools/cad-first
python -m unittest -v test_p2_34m_cage_orientation_native.py
python p2_34m_cage_orientation_native.py \
  --p234e-native /absolute/path/to/verified/P234E_native \
  --pose-grid fixtures/p234m-prescribed-pose-grid.example.json \
  --grid-step-mm 0.2 --grid-radius-mm 0.2 --cage-tilt-deg 0.5 \
  --out /absolute/path/to/NEW-P234M-native-measurements.json
```

Source folder must contain the previously SHA-pinned `P234E_source84_revised_six_ball_clearance.step`, `P234E_source84_name_index.json` and `P234E_source84_ball_contact_audit.json`. The output path must not exist. The command is computationally expensive and **has not been run against those owner files** in this session. The local 31/31 tests use synthetic numeric fixtures or fake shape objects solely to assert call counts and program behavior; they do not substitute for OpenCascade geometry measurements.

## Decisions and remaining hard gates

P2.34M does not redesign the original shaft/cup groove shape. It is a search of bounded trial poses on the *same failing source geometry* and can return zero passing poses. A failure on this grid does not disprove all physically possible CV solutions; success on this grid does not prove continuous torque transfer.

**Next: P2.34N — changed-track CAD prototype** only after reviewing verified P2.34M native witness data: constrain an explicit cage angular trajectory, calculate conjugate ball-center paths and associated grooved track envelopes on a **separate, versioned original-derived CAD candidate**, then re-run native collisions, cage pocket retention and dense coupled phase sweeps; evaluate shaft speed equality and loaded torque path independently. The original source84 STEP remains immutable.

**G2 HOLD — no full Model B integration, merge, deploy or GitHub Actions. P2.34/54 still IN PROGRESS.**
