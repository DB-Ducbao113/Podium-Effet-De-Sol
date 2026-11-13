# P2.52/54 — Canonical source picking and metric unit guard

**Repository:** `DB-Ducbao113/Podium-Effet-De-Sol`  
**Branch:** `feat/engineering-inside-machine-v2`  
**Release gate:** G2 HOLD (DEV-only); no merge/deploy authorization.

## Observed integration defect

The Three.js pointer event is world-space, and `root.worldToLocal()` correctly
removes the preview transform. However, **the Model B GLB is authored in raw
nonmetric showroom coordinates**. Previous code put that raw Model B tuple
straight into `Landmark.modelBM`, which is explicitly in metres. The P2.51
rigid fit was therefore operating across incompatible units when users
picked points on screen.

A separate P2.8 source trap: `exploded` mode temporarily translates actual
mesh object positions for display. A picked point in that mode is no longer
a landmark in the original, assembled P2.8 source root.

## Implementation

- Add `assemblyPointPicking.ts` as the single source-space point conversion
  policy. Model B local raw XYZ is multiplied once by the calibrated
  `normalizedShellScale` (m/source-unit); original P2.8 local XYZ is returned
  unchanged at CAD scale = 1. The function returns a new tuple.
- Reject uncalibrated Model B picks, nonfinite or extreme XYZ, invalid shell
  scales, and P2.8 picks taken in the translated `exploded` presentation.
  The non-translating `assembled`, `tyre-hidden` and
  `mechanism-core` review presentations remain valid for visible meshes.
- Wire that policy into `AssemblyPreviewStage.tsx` immediately after the
  GLB-root `worldToLocal` conversion, before passing a picked tuple to React.
- Require the actual decoded source-wheel calibration before importing
  landmark JSON, manually fitting picked pairs, or accepting target XYZ
  from the source geometry. Refuse placeholder provenance
  `UNVERIFIED_SURFACE_PICK` on import.
- When changing corner presentation, end the active pick action and discard
  any unfinished P2.8 pick. Disable original CAD picks while exploded.
  Clearing manual point pairs also clears the derived registration state.
- Clarify the UI labels: native Model B geometry bounds are **source units**,
  while newly selected normalized root-local points are **metres**.

## Tests and verification

- Authored six Vitest cases in `assemblyPointPicking.test.ts`, covering:
  Model B normalization, immutable P2.8 scale-one tuples, unchanged
  non-exploded cutaway positions, exploded rejection, missing calibration,
  and invalid/overflow XYZ.
- Independent local TypeScript `tsc --noEmit --strict --target ES2022` check
  of the point-picking helper and its exact `CornerPresentation` union:
  **PASS**.
- Independent Node.js built-in assertions of the same conversion and
  rejection contract: **PASS** (8 assertion groups).
- Full application TypeScript/Vitest, real WebGL raycast review and
  owner-only SHA-matched P2.8 browser evaluation: **NOT RUN** in this
  connector-only environment. Do not represent standalone tests as
  full integration QA.

## Owner-source acceptance still required

1. Run full typecheck and targeted Vitest in a cloned repo with installed
   dependencies:
   `npm run typecheck --workspace=@peds/web`
   and
   `npm run test --workspace=@peds/web -- src/dev/assemblyPreview/assemblyPointPicking.test.ts`.
2. Review body scaling and source-root transforms in real Chromium with
   the original Model B/P2.8 GLBs. Pick a point on both models, rotate
   orbit controls, and repeat. Root-local values should remain stable.
3. Check all confirmed source identities and hardpoint correspondences
   against owner mechanical geometry. Wheel visual normalization is
   not mechanical fit certification.
4. Test cutaway and exploded transitions without contaminating saved
   landmarks or retaining registrations after failed source replacement.

**G2 HOLD.** No validated chassis hardpoints, cross-source STEP clearance,
full four-corner assembly or complete F1 cinematic review produced.
