# Architecture

This document records the current API and workspace boundaries. The next product and visual direction has not been defined.

## Dependency direction

```text
HTTP adapter -> interface -> application -> domain
                         \-> infrastructure

web feature -> shared UI/types
jobs -> verified upstream source -> web data modules
```

The API domain and application layers do not import React, Vite, or Cloudflare runtime types. The Worker interface uses standard Web Fetch API `Request` and `Response` objects.

## Applications

### `apps/web`

The current UI is organized into these feature slices:

- `components/showroom`: Model B Showroom and shared 3D layout.
- `dev/commercial-b`: Model B loader, paint and Adaptive Graphics modules shared with the Showroom.
- `components/championship`, `data/championship`, `services`: championship and result workflows.
- `components/engineering` and `data/engineeringArticles.json`: engineering content.
- `components/pages`, `data/teams`, `data/drivers`: Teams and Drivers.
- `components/common`, `components/layout`, `components/seo`: shared UI.
- `App.tsx` and `main.tsx`: routing and providers.

The DEV review route serves Model B from `PEDS_MODEL_B_PATH`, the frozen local source when present, or the checked-in public GLB. Production serves that same verified GLB through the Worker asset route. The removed EDS-G01 GLB is absent from the source tree; the build guard still rejects any legacy copy in client output.

### `apps/api`

- `domain`: immutable proxy policies and business constraints.
- `application`: cache/single-flight orchestration and stale handling.
- `infrastructure`: bounded cache and timeout-aware upstream HTTP implementation.
- `interfaces/http`: Web Fetch API method, CORS, DTO/query validation, and response mapping.
- `worker.ts`: same-origin API router, bounded best-effort abuse protection, JSON API boundary, and security headers.

Contracts remain `/api/jolpica` and `/api/openf1`. Upstream origins are constants and cannot be supplied by clients.

### `apps/jobs`

The two F1 synchronization sources remain independent and manually invoked. Their output paths point explicitly to `apps/web/src`. No migration workflow can commit or push generated data.

## Shared packages

- `@peds/contracts`: runtime-independent HTTP request/response contracts.
- `@peds/security`: query-shape, bounds, and origin validation.

## Deployment compatibility

One Cloudflare Worker serves `/api/openf1`, `/api/jolpica`, and the allowlisted Model B asset under `/models/`; Cloudflare Static Assets serves the Vite client from `apps/web/dist/client`. `not_found_handling: single-page-application` supports direct SPA navigation, while `run_worker_first` covers `/api`, `/api/*`, and `/models/*`. Static security/cache policy lives in `apps/web/public/_headers`; Worker responses receive equivalent API-safe headers in code. No Node compatibility is required, and `no_nodejs_compat` is explicit.

The top-level Wrangler environment is local development. `env.production` has a distinct Worker name, same-origin-only CORS by default, and no routes, domain, schedules, or cloud resource bindings. No deployment is configured or triggered.
