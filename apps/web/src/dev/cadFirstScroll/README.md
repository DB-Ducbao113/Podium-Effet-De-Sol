# CAD-FIRST P1–P5 — DEV scroll

Route: /engineering/cinematic-rebuild, development only.
Source: Project CAD-first. Never Model B / R4.5 / concept car.

The old R4.5 scroll route and its source files were removed. Existing historical insideMachineI1 remains untouched; it is not imported by this page.

Current validated CAD foundation in the repository: **P2.8 = 59 solids of ONE FRONT CORNER**. A front corner is not the full car. The project-local P2.9 19-part joint, P3 material, P4 cinematic and P5 QA prototypes likewise are not a full-car CAD source.

The route accepts existing P28_remate_manifest.json and matched P2.8 GLB, validates byte length and SHA-256, optionally accepts the source static B-Rep audit by SHA-256, and scrubs authentic named GLB parts. Geometry and materials are not replaced. No binaries are published.

A future genuine whole-car manifest must use schema podium-eds.cad-first.full-car.v1 with per-profile hashes, an explicit per-part node/system mapping and complete coverage of 13 required vehicle systems. Runtime verifies actual GLB nodes. The contract is a **gate, not completed whole-car geometry**.

Run locally: npm run lint, npm run typecheck, npm run test, npm run build. The focused Vitest spec is cadSource.test.ts. Browser WebGL and real FPS are still NOT verified. No CI, merge, or deployment.
