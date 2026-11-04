# Podium Effet De Sol

Podium Effet De Sol Formula 1 editorial and 3D experience, organized as an npm workspace.

## Repository status

This checkout is on `migration/clean-architecture`. Local changes require QA and owner review before a push or deployment. The Cloudflare configuration does not define a production route or scheduled data job.

## Structure

```text
apps/web       React, Vite, Three.js and React Three Fiber frontend
apps/api       Cloudflare Worker plus domain/application/infrastructure/interface layers
apps/jobs      Explicitly invoked F1 data synchronization jobs
packages       Shared HTTP contracts and security primitives
tools          Repository security and public-asset boundary checks
docs           Architecture, security, migration history and asset provenance
wrangler.jsonc Cloudflare Worker, Static Assets, SPA and environment configuration
```

## Local development

Requirements: Node.js 22+ and npm.

```bash
npm ci
npm run dev
```

`npm run dev` uses the Cloudflare Vite plugin, so `/api/*` executes in the local Workers runtime. A production-like local check is available after a build:

```bash
npm run cloudflare:local
```

The owner selected Model B for the Showroom. Its frozen source and attribution record remain under `source-assets/models/model-b/`; the byte-identical runtime GLB is `apps/web/public/models/model-b-eds-optimized-v1.glb`. The local DEV review middleware still supports the server-only `PEDS_MODEL_B_PATH`. The production build excludes EDS-G01 GLB. Deployment remains subject to the normal QA and owner gates.

Inside the Machine is the Engineering experience in local development: `npm run dev` serves it at `/engineering` with no extra flag. The previous Engineering index remains available at `/engineering/insights` and car anatomy at `/engineering/car-anatomy`. Its identity-checked runtime set is read from `.local-assets/inside-the-machine/runtime/set-85d8e47c5b420e88/` by a serve-only Vite middleware and is never copied into the public build output. Production builds keep the existing Engineering experience pending the separate rights and performance release gates.

P5 seasonal artwork review appears by default in DEV when the 429 local source images under `.local-assets/p5-review/` are present. Set `VITE_P5_LOCAL_REVIEW=0` to hide it locally. The images are excluded from Git and production output. Set `PEDS_VERIFY_LOCAL_ASSETS=1` when running the two P5 visual manifest tests to require every local image and verify its size and SHA-256; normal CI checks the manifest structure without requiring private review media.

## Verification

```bash
npm run lint
npm run typecheck
npm run test
npm run security:secrets
npm run security:assets
npm audit --audit-level=high
npm run build
npm run cloudflare:dry-run -- --env=""
```

## Data jobs

Data jobs are manual during migration:

```bash
npm run sync:sessions -- --dry-run
npm run sync:2026 -- --dry-run --force
```

They update `apps/web/src` only after source-specific validation. No schedule or auto-push workflow is enabled.

See [architecture](docs/architecture.md), [security](docs/security.md), [migration](docs/migration.md), and [asset licenses](docs/asset-licenses.md).
