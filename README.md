# Podium — Effet de Sol

Independent Formula 1 editorial, race data, 3D technical showroom, and engineering disassembly web application built as an npm workspace for Cloudflare Workers Static Assets.

## Architecture

- `apps/web`: React 18 + TypeScript + Vite 6 + Three.js (`@react-three/fiber`) SPA with lazy-loaded 3D routes (`/showroom`, `/engineering`), prerendered bilingual engineering articles, and automatic edge IP timezone detection.
- `apps/api`: Zero-dependency Cloudflare Worker (`no_nodejs_compat`) providing `/api/timezone`, same-origin `/api/jolpica/*` and `/api/openf1/*` proxies with caching/rate-limiting, security headers, and `/models/*.glb` asset gating.
- `apps/jobs`: Manually invoked F1 data synchronization scripts (never auto-scheduled).
- `packages/contracts`, `packages/security`: Shared TypeScript contracts and input/origin validation.
- `tools/ci`: Secret scanner and public asset boundary verification scripts.
- `docs`: Architecture ([docs/architecture.md](docs/architecture.md)), security ([docs/security.md](docs/security.md)), ADRs (`docs/adr/`), and asset provenance ([docs/asset-licenses.md](docs/asset-licenses.md), `docs/asset-manifests/`).

Active 3D runtime uses `FP-04 RB` (`apps/web/public/models/fp04rb-*.glb`). Private source and review assets stay outside version control in `source-assets/` and `.local-assets/`. See [DESIGN.md](DESIGN.md).

## Local development

Requires Node.js `>=22` and npm.

```bash
npm ci
npm run dev
```

Run local Cloudflare Worker + production static assets preview:

```bash
npm run cloudflare:local
```

## Verification checks

```bash
npm run lint
npm run typecheck
npm run test:coverage
npm run security:secrets
npm run security:assets
npm run security:audit
npm run build
npm run cloudflare:dry-run
npm run cloudflare:dry-run:prod
```

## Deploying to Cloudflare

Preview deploy (default `noindex` safe):

```bash
npx wrangler login
npm run build
npx wrangler deploy --env production
```

Live custom-domain production deploy (enables sitemap + search indexing):

```bash
VITE_SITE_URL=https://your-domain.com VITE_ALLOW_INDEXING=true VITE_DEPLOYMENT_CONTEXT=production npm run build
npx wrangler deploy --env production
```

Manual F1 data sync dry-runs: `npm run sync:sessions -- --dry-run` and `npm run sync:2026 -- --dry-run --force`.
