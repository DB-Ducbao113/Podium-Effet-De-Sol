# V8.2 — Model-free F1 Cinematic Hero asset contract

The React Hero is an original 2.5D artwork with pointer-driven CSS transforms; it does not load Model B, GLB, Three.js or a second WebGL Canvas.

## Owner artwork delivery

The approved asset zip, provided separately in the ChatGPT conversation, contains a transparent illustration and asset manifest.

Extract the ZIP into the repository root. This creates only:
- `apps/web/public/media/homepage/f1-hero/peds-aero01-car.webp`
- `apps/web/public/media/homepage/f1-hero/peds-aero01-asset-manifest.json`

The companion SVG is already committed as a lightweight fallback. Do not treat that fallback as visual sign-off for the photorealistic artwork.

Expected WebP:
- 1310 x 542 px
- 109674 bytes
- SHA-256: `d0db1797adaa1a05f465f2db70a7b2082a4656871b10ebc176b6dab71aee5fe8`

The car is an original AI-generated concept illustration, not a physically orbitable 3D model. Do not make false F1 telemetry/downforce claims, and do not replace the official Podium EDS site logo with decorative artwork.

## Gate

Keep the user's existing V8.2-00 local baseline, PHASE-00.md, README.md, review-assets.json and Showroom untouched. Require browser screenshots in four viewports, reduced-motion and pointer tests, comparison to baseline, lint, typecheck, unit tests, build, and real-device profiling. The current branch remains draft until the raster artwork is committed and visually accepted.
