# P2.54/54 — Source assembly QA closeout (NOT final car signoff)

**Repository:** `DB-Ducbao113/Podium-Effet-De-Sol`  
**Branch:** `feat/engineering-inside-machine-v2`  
**Review date:** 2026-11-13 (Asia/Ho_Chi_Minh)  
**Branch delivery:** DEV-only source changes. **G2 HOLD; no merge/deploy approval.**

## Actual regression found in existing build evidence

At commit `7514f152cc52f651b4867ba496b2cd1606dd93e8`,
the repository's existing coverage run reported **507 passing tests and
one failing test out of 508**, in
`apps/web/src/dev/assemblyPreview/assemblyRegistration.test.ts`.
The test assumed that a 250 mm raw outlier must yield a maximum
**post-fit** residual greater than 200 mm. The all-point least-squares
rigid registration appropriately distributes the residual; the actual
max residual was **173.613 mm**.

The pairwise length-mismatch diagnostic still exceeded 200 mm, and the
correct acceptance behavior is to reject any preview registration if
**either** independent diagnostic exceeds **5 mm**. The incorrect test
assertion was replaced by one against that meaningful 5 mm threshold.
This is not a relaxation of the actual visual acceptance rule.

A subsequent existing targeted source check at
`9ed50734cfa6de7ee49df54dcefbd2ab906d3d8c` recorded
**TypeScript, targeted source tests and release build source isolation PASS**.
Those results predate the final native wheel-audit patch; a full
post-P2.54 application browser acceptance has not been completed.

## Fixes delivered

1. `registrationReviewGate.ts` centralizes the single 5 mm limit for
   both imported and point-picked landmarks, fails closed on
   non-finite/inconsistent diagnostics or a non-unit quaternion, and
   never claims mechanical certification. Seven Vitest cases exercise
   accepted and rejected records.
2. `audit_measured_wheel_fit.py` now audits the **rendered** P2.8
   anchor using the exact root quaternion and translation, plus the
   explicitly exported manual offset. Previously, the Python audit
   compared against an identity-rotation translation only, contradicting
   P2.53's wheel-anchored frontend transform.
3. New `test_audit_measured_wheel_fit.py` covers identity, 90° and
   180° rotation, manual offsets, actual over-5 mm errors, invalid
   quaternions, invalid/missing offsets, and retention of G2 HOLD.
4. `run_owner_fullcar_review.py` now runs the seven targeted source
   test files (including P2.52/P2.53/P2.54 regressions), plus the
   native Python wheel-audit tests before attempting real source
   preflight and browser capture. It does not deploy or merge.

## Verification performed

| Gate | Observed result | Limit |
| --- | --- | --- |
| Regression reproduction from existing coverage evidence | 507 PASS / 1 FAIL at P2.53 head | Old test assumption, now fixed in source |
| Subsequent existing targeted source/TypeScript/build checks | PASS at the earlier P2.54 commit `9ed5073` | Predates final Python correction |
| Local P2.54 visual-gate numeric checks | **16 PASS** | Small isolated TypeScript module, not whole web app |
| Local P2.54 visual-gate TypeScript strict compile | **PASS** | Isolated module and matching result type stub |
| Local Python quaternion-aware audit tests | **7 PASS** | Synthetic geometry/placements, no real owner GLB |
| Python syntax compilation | **PASS** | Isolated Python files |
| Owner P2.8 original STEP / SHA-matched GLB browser capture | **NOT EXECUTED** | Private source files absent in this runtime |
| Independent manufacturer hardpoints, STEP shell contact and coupled motion | **NOT PROVED** | G2 HOLD |
| Full four-corner complete 18-chapter scroll video, responsive GPU benchmark | **NOT DELIVERED** | Final full-car review HOLD |

These local isolated tests executed in a separate scratch workspace
against copies of the committed algorithms. They are not a replacement
for repository TypeScript, complete Vitest, and browser/GPU tests.
No manual GitHub Actions run was requested as part of this batch.

## How to execute the actual owner-source verification locally

From the feature branch with the source files present:

```powershell
# Existing project script. It records real failures, and leaves G2 HOLD.
powershell -ExecutionPolicy Bypass -File scripts\review-original-fullcar.ps1
```

Expected evidence under the private output folder includes
`review-gates.json`, exact original source SHA preflight,
`measured-original-wheel-fit.json`, the real Chromium browser captures
and visual-only video. Do not claim these artifacts exist unless the
local runner actually produces them.

## Final decision for the 54-batch sequence

**P2.54 source QA patch is authored and committed.**
**P2.1–P2.54 is a completed numbered patch sequence only, NOT a completed
authentic F1 CAD assembly or a passed mechanical acceptance.**
This development branch remains **G2 HOLD / NOT APPROVED FOR PRODUCTION**.
To exit HOLD requires authentic owner source geometry, validated
mechanical mounting points and clearance tests, and full browser/visual
evidence with explicit owner acceptance.
