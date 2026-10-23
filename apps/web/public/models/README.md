# 3D model inventory

- Commercial runtime asset: `eds-g01.glb` (original EDS-G01; remains the default).
- Postponed development artifact: `eds-g02.glb` (original EDS-G02; retained for local D-view
  comparison only, removed from production `dist/` by the build guard; no further geometry
  development is planned).
- Legacy comparison only: `c42.v2.glb` (approximately 2.1 MiB; excluded from the
  commercial build). Its geometry and marks must not be used for EDS-G02 authoring.

## Provenance required before public release

The source geometry before optimization is an exact Git blob match for `c42.glb` from:

- Source: https://github.com/markste-in/c42
- Author/maintainer: Mark Stein (`markste-in`, `mail@markste.in`)
- Original commit: `6c87b04a9c2738e33c1167801e9d9c164e7b0035`
- Original Git blob: `d5eb8a4c16a1cd6bf84a265e4614d5b2905d4c35`
- License: WTFPL v2 (`LICENSE.md` in the source repository)
- Original asset: `c42.glb`, 18,320,948 bytes

The repository states that its files are based on the AR model presented by Alfa
Romeo. Team names, liveries, and trademarks remain the property of their respective
owners and are not granted by the open-source code/model license.

The optimization process (Meshopt/WebP conversion and removal of embedded textures)
does not change or replace the original model license.
