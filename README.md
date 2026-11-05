# Podium Effet De Sol

Formula 1 editorial, results and interactive car experience in an npm workspace.

## Current state

The previous visual roadmaps have been retired so a new product and design plan can be written from the current code. The active development branch is `rebuild`. The application still contains the existing Home, Championship, Showroom, Engineering, Teams and Drivers experiences.

## Repository

- `apps/web`: React, Vite and Three.js frontend.
- `apps/api`: Cloudflare Worker API.
- `apps/jobs`: manually invoked F1 data synchronization jobs.
- `packages`: shared contracts and security code.
- `tools`: repository checks and development utilities.
- `docs`: current architecture, security, asset provenance and QA records.

Model B is the Showroom runtime. Private source and review assets stay in `source-assets/` and `.local-assets/`. See [architecture](docs/architecture.md), [design status](DESIGN.md), [security](docs/security.md) and [asset licenses](docs/asset-licenses.md).

## Local development

Requires Node.js 22+ and npm.

```bash
npm ci
npm run dev
```

## Checks

```bash
npm run lint
npm run typecheck
npm run test
npm run security:secrets
npm run security:assets
npm run build
npm run cloudflare:dry-run
```

The jobs are manual: `npm run sync:sessions -- --dry-run` and `npm run sync:2026 -- --dry-run --force`.
