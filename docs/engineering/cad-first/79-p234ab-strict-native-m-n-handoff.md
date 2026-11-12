# P2.34AB/54 — Reject incomplete measured M→N handoff before CAD cutting

Date: 2026-11-12. Branch: `work/engineering-four-corners-local`.

## Problem identified

P2.34AA formerly allowed P2.34N native track cutting after testing only two high-level P2.34M flags: `allBendTracesFound` and `allChosenPathsCrossBendScreen`. Those flags are not sufficient evidence that all selected native P2.34M candidates actually exist in `perPose`, are marked exploratory PASS, occur in manifest order, and satisfy the complete P2.34N sample-path contract. In a malformed or inconsistent M report, N would be called and then might fail deep inside the CAD build. This is an unsafe handoff and wastes a heavy native operation.

## Changes

Created `tools/cad-first/p2_34ab_m_to_n_handoff.py`, a **pure metadata** contract gate:

1. Read a supplied native P2.34M report and exact source pose-grid manifest.
2. Use P2.34M's actual `pose_grid()` validator to recover the full prescribed bend/phase schedule.
3. Match each real M `perPose` in order and check `qualificationCount`, `testedCandidates` and candidate list sizes.
4. Reuse P2.34N's actual `validated_paths()` validation—not an independently weaker copy—to reject out-of-range candidate indices, nonqualifying measured poses, duplicate references, bad transforms, absent bend tracks and incomplete selected-pose coverage.
5. Require the N-selected pose order to equal the original source pose-grid order. Emit the SHA-256 digests of the original M report and grid file, and permanently hold all mechanical certification flags.

Updated `tools/cad-first/p2_34aa_native_runner.py` so an explicitly requested N cut calls `inspect_files(m_file, grid)` **after M has finished and before N's native B-Rep build**. Any exception is logged in the immutable AA manifest, and N is not invoked.

Updated `tools/cad-first/test_p2_34aa_native_runner.py` to mock this new dependency for the existing expected successful N-flow unit case; added a negative case where a corrupt M→N selection raises and the candidate builder must never run. Added `tools/cad-first/test_p2_34ab_m_to_n_handoff.py` with 10 synthetic-report tests covering schema, SHA, pose count/order, missing rows, candidate ref, candidate accounting, duplicate source selection and manifest hashes.

## Test status

**New AB and adjusted AA tests are committed but NOT fully executed in this turn.** The tests are source-independent metadata checks; even a PASS would not demonstrate a valid original 84-solid STEP, CNC-machinable groove or CV torque/constant velocity performance. Existing prior AA 13-test status does **not** apply automatically to the changed version.

To run locally (no GitHub Actions):

```bash
cd tools/cad-first
python -m unittest -v test_p2_34ab_m_to_n_handoff.py
python -m unittest -v test_p2_34aa_native_runner.py
python p2_34ab_m_to_n_handoff.py \
  --p234m-report /verified/P234AA_native_M_001/P234M_native_audit.json \
  --pose-grid fixtures/p234m-prescribed-pose-grid.example.json
```

The example pose-grid file exists in the repository at `tools/cad-first/fixtures/p234m-prescribed-pose-grid.example.json`. Replace only when the authentic native manifest differs; M and AB require a byte-consistent source run.

## Remaining blocking issue

The three SHA-pinned original P2.34E files are absent from the inspected 1,188-file repository tree. Without the actual STEP/index/audit, no real P2.34M/native CV geometry can be measured. The P2.34AB metadata handoff is a defect fix, **not a mechanical acceptance** or a new validated source data set.

**P2.34/54 ongoing; mechanical G2 HOLD. No full Model B integration, merge, deploy or GitHub Actions.**
