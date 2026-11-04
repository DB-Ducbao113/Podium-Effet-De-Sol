# V9-01 / Visual Laboratory — Execution Contract

**Branch:** \`feat/home-v9-living-machine\`, forked from the existing Homepage feature branch. This is an isolated, nonproduction lab. Do not merge into production or deploy without owner visual signoff.

## Design promise

Three original procedural 3D systems, no downloaded model:
- **Pressure Membrane:** shader-deformed surface with pointer-localized displacement and Fresnel-style grazing light.
- **Velocity Field:** geometrically deep streamlines, pulsing fluid shader and velocity-responsive deflection.
- **Carbon Architecture:** beveled aerodynamic extrusion fins using instanced drawing with authored exploded configurations.

Each effect must be distinguishable in a developer-only interactive lab. One renderer, one Canvas. Never load Model B or duplicate the hero car as geometry. Maintain the approved WebP on Home and provide static fallback if it is missing.

## V9 preview contract

Developer-only \`/__home-v9-lab\` is the material laboratory. Developer-only \`/?v9=1\` is the first opt-in integrated world preview behind current Home + Footer. A main-route production build must retain V8 until owner accepts screenshots.

Scene anchors: \`launch-control\`, \`race-control\`, \`championship-overview\`, \`eds-engineering\`, \`eds-explore\`, \`peds-credits\`.

## Gates

- 0: no uncommitted media leakage, no Showroom/Championship modification
- 1: lint / TypeScript / SSR and pure-state tests
- 2: browser screenshots across 360/390/768/1024/1440/1920px; desktop pointer and scroll
- 3: context loss, reduced motion, low-memory and data saver fallback
- 4: frame-time profiling on a midrange laptop; verify no double Canvas context
- 5: visual approval before replacing V8 and deploying

Owner-local \`peds-aero01-car.webp\` is not present in GitHub as of phase initiation. Lab material approval is independent of this missing image; integrated Hero approval is not.
