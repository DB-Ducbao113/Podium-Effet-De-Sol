# Podium Effet De Sol

Clean-architecture migration workspace for the Podium Effet De Sol Formula 1 editorial and 3D experience.

## Repository status

This repository is in **LOCAL MIGRATION — OWNER GATE**. Cloudflare deployment, Git integration, domains, and schedules are intentionally disabled. The legacy production repository and its Vercel configuration are untouched.

## Structure

```text
apps/web       React, Vite, Three.js and React Three Fiber frontend
apps/api       Cloudflare Worker plus domain/application/infrastructure/interface layers
apps/jobs      Explicitly invoked F1 data synchronization jobs
packages       Shared HTTP contracts and security primitives
tools          Repository security and public-asset boundary checks
docs           Minimal architecture, security, migration and license records
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

Model B remains a local development candidate. Copy the frozen candidate to `.local-assets/model-b-eds-optimized-v1.glb` or set the server-only `PEDS_MODEL_B_PATH`. Never expose that path through a `VITE_*` variable.

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
