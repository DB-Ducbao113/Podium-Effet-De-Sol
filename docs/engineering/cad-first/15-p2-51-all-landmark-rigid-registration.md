# P2.51/54 — All-landmark rigid registration hardening

**Scope:** Model B showroom shell + original owner P2.8 59-part CAD preview.  
**Branch:** `feat/engineering-inside-machine-v2`  
**Release gate:** G2 HOLD; DEV-only, no merge or deploy authorization.

## Why this batch exists

Previously, the rotation used only the first three landmark pairs and the
translation was anchored to the first point. Even with the P2.50 all-pairs
distance audit, a noisy or nearly collinear first triangle could bias the
visual alignment or prevent otherwise usable later points from contributing.

## Implemented

- Replace the first-three basis with a rigid least-squares quaternion fit
  over **all** measured Model B/P2.8 point pairs (Horn symmetric 4x4
  matrix; Jacobi eigensolver); fit the translation from both centroids.
- Require non-collinear spatial spread of both sources, rejecting
  near-degenerate target/source picks rather than returning unstable transforms.
- Reject non-finite or extreme input coordinates and duplicated landmark IDs
  after trimming whitespace.
- Retain P2.50's independent **all-pairs** length mismatch audit and
  per-point residual audit. Reflections cannot masquerade as valid rotations:
  pairwise distances alone are not sufficient to detect a mirror.
- Fail closed in the browser when replacing or re-running registration:
  remove previously accepted registration/evidence/transform and reset
  staging before validating new user data.
- Preserve **P2.8 CAD scale = 1**, all original CAD nodes, visual-only
  staging and the existing 5 mm preview review thresholds.

## Test coverage authored

`apps/web/src/dev/assemblyPreview/assemblyRegistration.test.ts` now covers:

1. Exact 90-degree Z and 180-degree X rigid transformations.
2. Four-anchor 4 mm noise, least-squares residual, and order independence.
3. Valid input whose first three anchors are collinear but fourth is not.
4. Fully collinear source and near-collinear target rejection.
5. Scale mismatch, late-anchor mismatch, and reflected (mirrored) targets.
6. Non-finite/extreme coordinates, provenance and normalized duplicate IDs.
7. Mechanical-fit certification remains explicitly false.

Mathematical test vectors were exercised in a standalone Node numerical
harness. **Repository Vitest, TypeScript typecheck and browser/WebGL
integration tests have not been executed in this connector-only session.**
Do not interpret a committed test as an executed passing test.

## Local verification

```bash
npm ci
npm run typecheck --workspace=@peds/web
npm run test --workspace=@peds/web -- src/dev/assemblyPreview/assemblyRegistration.test.ts
```

After those checks, run actual owner-source registration and browser review,
including deliberately noisy landmarks, extreme views and repeated imports.
Owner-only P2.8 STEP/GLB remains outside the publicly committed repository.

**G2 HOLD:** No measured manufacturer chassis hardpoints, STEP-to-shell
mechanical interference or 4-corner whole-car QA certificate has been produced.
A least-squares visual fit never certifies a real mechanical mate.
