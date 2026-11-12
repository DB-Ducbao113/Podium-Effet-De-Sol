# P2.34AA/54 — Source recovery and staged local native M→N runner

Date: 2026-11-12. Branch: `work/engineering-four-corners-local`.

## Actual repository/source finding

The GitHub tree at previous commit `01322a4957e3ce33cad3385bb5788bceb877d76b` contained 1,188 entries, including P2.34E/P2.34M–Z Python scripts, but **not** the exact three original P2.34E source files (STEP, name index, native ball-contact audit). The source files have never been retrieved in this execution context. The original source24/84 CAD cannot be reconstructed from SHA hashes. **Real mechanical G2 remains HOLD.**

SHA-256 pins, in the order STEP, index and audit:
- `9bd7ec6a60d5c4c9f1f3e421cb730fc252de026aae21dcf570584e5dda0ec63e`
- `57afa74054ca892d2cb5633fb1c03a3c906fc2a928adf45f4674aa008952a62a`
- `b2eb8da1720cd5bf206e716e24ad8ebdde28d620bf31aaea456edb1b05e4b894`

## Implemented P2.34AA action

The executable `tools/cad-first/p2_34aa_native_runner.py` is the first **local native execution launcher**, not another stand-alone geometry assertion.

1. Hash the three P2.34E source-native files and refuse any missing/mismatching bytes; do not trust filenames alone.
2. Confirm the P2.34M prescribed pose manifest parses under P2.34M's actual `pose_grid()` validator, and record its SHA.
3. Default to **no native CAD execution** until `--execute-m` is supplied. On request, invoke the installed local P2.34M engine directly. The engine rechecks the original STEP and index/audit and attempts native OCC measurements. Verify the resulting M report's source SHA, pose-grid SHA, 84-solid count, immutability, all sampled pose rows, and explicit G2 HOLD.
4. Only if `--execute-n` was also requested **and** M actually produced both `allBendTracesFound=true` and `allChosenPathsCrossBendScreen=true`, call P2.34N `build()` to create the **discrete spherical-envelope CV cut PROTOTYPE**, never a physically certified continuous groove.
5. Preserve one immutable output directory per attempt. Record JSON execution status, source hashes, M/N output hashes, completed stages and blocking reasons. Return exit code 2 for blocked or incomplete requested execution.

**No GH Actions, background jobs, merge, deployment or automatic Model B integration.**

Local commands from `tools/cad-first`:

```bash
python -m unittest -v test_p2_34aa_native_runner.py
# SHA/manifest preflight only:
python p2_34aa_native_runner.py \
  --p234e-native /owner/original/P234E_native \
  --pose-grid fixtures/p234m-prescribed-pose-grid.example.json \
  --out-dir /new/P234AA_preflight_001

# Execute actual native P2.34M only with verified owner files:
python p2_34aa_native_runner.py \
  --p234e-native /owner/original/P234E_native \
  --pose-grid fixtures/p234m-prescribed-pose-grid.example.json \
  --out-dir /new/P234AA_native_M_001 --execute-m

# Explicitly allow M followed by source-derived N prototype if M passes:
python p2_34aa_native_runner.py \
  --p234e-native /owner/original/P234E_native \
  --pose-grid fixtures/p234m-prescribed-pose-grid.example.json \
  --out-dir /new/P234AA_native_MN_001 --execute-m --execute-n
```

The generated `P234AA_execution_manifest.json` always contains `mechanicalG2Certified=false` and `modelBFullCarIntegrated=false`. It is not a full M–Y runner. Downstream O–Y real native reports remain pending valid M/N output.

## Test evidence and limits

**13/13 local Python tests PASS**, testing missing source, wrong hashes, invalid/missing pose grid, refusal of implicit M/N execution, preserving existing output, successful simulated M and N flow with explicit requests, rejection of an ineligible M report, missing M poses, and recording actual runner failures. The successful M/N tests deliberately **stub** the source/CAD modules; do not report these as owner-native geometry execution.

The real negative-control CLI was executed with missing source directories and exited **2**, reporting `BLOCKED_SOURCE_OR_EXECUTION_G2_HOLD` with all source files `MISSING`. No physical STEP exists to validate geometry.

## Next required unblock

The next meaningful CAD task is loading the exact P2.34E STEP/index/audit from the owner's CAD export or other verified archive, not adding another synthetic checker. Once available, run local P2.34AA M on the authenticated STEP and inspect native results before N or O–Y. Unsupported native geometry may cause the runner to abort and record the specific error. All G2 statements remain HOLD until genuine physical/mechanical evidence exists.

**P2.34/54 still IN PROGRESS. No Model B full car, merge, deploy or GitHub Actions.**
