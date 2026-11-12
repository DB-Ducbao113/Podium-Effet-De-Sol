# P2.34T/54 — Native radial-section material-span review

Date: 2026-11-12. Branch: `work/engineering-four-corners-local`.

**Status: implemented, generic native CadQuery tests 15/15 PASS locally. The actual owner 84-solid P2.34E STEP and P2.34N candidate still have NOT been executed. Mechanical G2 HOLD.**

## Why P2.34S was not enough

P2.34S checked original material remaining within two fixed protected zones by native Boolean volumes. This can detect material loss but does not measure local wall thickness or find a groove cross-section with insufficient material. P2.34T adds sampled **radial-section apparent material-span** checks over the original and candidate B-Reps. It is not a certified minimum wall-thickness measurement.

Each radial ray uses CadQuery native `Solid.isInside()` to classify evenly spaced points, then bisects transitions between inside and outside. The output reports apparent radial material intervals, the shortest interval observed, missing source occupancy and multiple disjoint candidate intervals. **A small void or bridge entirely between samples can be missed.** Consequently, even a passing ray does not prove a rigorous lower bound on wall thickness; the method only searches prescribed rays and cross-sections.

## Fixed exploratory sample schedule

- Shaft: radial range 20–30 mm; cup: 34.5–41 mm.
- Six angles: 0°, 60°, 120°, 180°, 240°, 300°.
- Three source-local planes: z = −242, −239.5, −237 mm.
- Grid spacing: 0.1 mm (bounded 0.01–0.5 mm); 18 rays per race, 36 total.
- Exploratory required contiguous span: 1 mm per ray. An empty original ray, empty candidate ray or more than one material interval fails the screen.

These choices are **not manufacturing tolerances** and must be validated against original source geometry before any approval.

## Input and evidence protection

P2.34T requires P2.34E original native STEP, index and audit; the P2.34N candidate STEP and audit; the original P2.34M pose report; and the original P2.34S material-protection report. Each file is SHA-linked. P2.34O's native identity mapping and subtractive material checks are repeated after reading the candidate STEP, preventing a silently reordered 84-solid scene. The tool rejects missing or failed upstream sampled/protection gates, tampered files, ambiguous identities and an existing output path.

The native gate returns `radialSectionGlobalMinimumThicknessCertified: false`, `continuousC2GrooveCertified: false`, `ballCageRetentionCertified: false`, `loadedStressCertified: false`, `constantVelocityCertified: false`, `torqueTransmissionCertified: false`, `mechanicalG2Certified: false`, regardless of sampled ray outcomes.

## Files and local test

- `tools/cad-first/p2_34t_radial_section_gate.py`
- `tools/cad-first/test_p2_34t_radial_section_gate.py`

```bash
cd tools/cad-first
python -m unittest -v test_p2_34t_radial_section_gate.py
python p2_34t_radial_section_gate.py \
 --p234e-native /path/to/P234E_native \
 --p234n-candidate /path/to/P234N_native_prototype \
 --p234m-report /path/to/P234M_native_audit.json \
 --p234s-report /path/to/P234S_material_review.json \
 --step-mm 0.1 \
 --out /new/path/P234T_radial_review.json
```

Tests: 15/15 PASS in the current local environment using genuine CadQuery/OpenCascade on **independent synthetic shaft/cup cylinders**, including damaged shaft core, damaged cup shell, disjoint radial material intervals, intact source geometry, provenance rejection and output overwrite refusal. These tests are not genuine owner-source inspection; the pushed version has not been re-executed from a clean checkout.

## Next hard engineering gate

Actual native P2.34M through P2.34T data are required before deciding groove/toolpath dimensions. A subsequent gate should use exact B-Rep surface and section geometry and adaptive exploration to bound local structural wall thickness, then solve physical cage retention, contact normals, loaded stress, equal angular velocity and torque path. P2.34T does not certify any of these.

**P2.34/54 IN PROGRESS. Mechanical G2 HOLD.** No original source change, Model B integration, merge, deploy or GitHub Actions.
