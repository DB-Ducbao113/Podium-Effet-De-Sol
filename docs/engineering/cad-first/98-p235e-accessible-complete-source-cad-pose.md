# P2.35E — Reduced motion preserves complete imported CAD assembly

Branch: `work/engineering-four-corners-local`. P2.35/54 IN PROGRESS.

## Correctness defect fixed

P2.35D disabled the original shell's separation and particle dust when reduced motion was active, but still animated imported P2.8 wheel parts, P2.12 rear toe parts, and P2.14 joint parts. In the early chapters, source CAD parts were displaced, spun and hidden, contrary to a reduced-motion view of a complete vehicle.

## Implementation

- Added `accessibleAssemblyPose.ts` with `accessibleAssemblyFraction` and `accessibleShellOpacity`. Under reduced motion, the CAD part fraction is fixed to 1 and the original shell is fully opaque. Under normal motion, the authored timeline values remain unchanged.
- Integrated the assembly fraction for each P2.8, P2.12 and P2.14 source CAD mesh, including screw-spin input and visibility. All imported parts now remain at their existing measured visual final poses in reduced-motion mode; no invented hardware or source transformations are introduced.
- Used the same accessible fraction for the showroom tyre replacement mask, so the fully assembled imported tyres do not duplicate original showroom tyres.
- Added five authored Vitest cases covering reduced-motion final poses, normal timeline, nonfinite progress, full shell opacity and normal fading.

## Verification

The GitHub branch was updated. Tests were authored but app Vitest, TypeScript build, browser QA and actual source GLB visual inspection were not executed in this environment. Mechanical G2 of P2.34 remains BLOCKED/HOLD. No merge, deploy or GitHub Actions.
