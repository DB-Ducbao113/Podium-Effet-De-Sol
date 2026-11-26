# Security

## Trust boundaries

- Browser input is untrusted.
- API query keys and values are allowlisted and bounded before any upstream call.
- Jolpica and OpenF1 origins are fixed in server code.
- CORS permits same-origin or exact entries from `ALLOWED_ORIGINS`; CORS is not authentication.
- API responses expose stable error messages, never stack traces or local paths.
- Timeouts, bounded cache sizes, stale age limits, and OpenF1 single-flight behavior constrain resource use.
- OpenF1 page size is capped at 500; Jolpica page size is capped at 100.

## Secrets

- `.env*` is ignored except `.env.example`.
- Server secrets must never use the `VITE_*` prefix.
- The committed example contains names and placeholders only.
- `tools/scan-secrets.mjs` scans source-sized files for common token/private-key patterns.
- CI uses `persist-credentials: false` and repository permission `contents: read`.

## Browser policy

`apps/web/public/_headers` configures CSP, HSTS, `nosniff`, same-origin frame protection, strict referrer policy, and a restricted permissions policy for Static Assets. API responses apply a stricter CSP in Worker code. Frontend `connect-src` is same-origin because upstream calls are proxied through the Worker. `script-src 'wasm-unsafe-eval'` and `worker-src blob:` preserve Three.js/Meshopt compatibility without allowing arbitrary external scripts.

## Supply chain

CI runs lint, TypeScript, tests, secret scan, public-asset boundary validation, production build, and `npm audit --audit-level=high`. Security gates are not marked `continue-on-error`.

The migration upgraded Vite to 6.4.5, Tailwind CSS/PostCSS integration to 4.3.3, and pinned `source-map-js` 1.2.2 to resolve the detected high-severity advisories. Any future high or critical finding blocks acceptance unless the owner approves a documented exception.

## Known limits

- No authentication is added because the current public read-only data contracts do not require user identity.
- The in-memory fixed-window limiter is bounded and tested but isolate-local; it is not a global distributed rate limit. Cloudflare dashboard/WAF rate limiting remains REMOTE PENDING.
- Production headers, real edge caching, quotas, and custom-domain behavior require a non-production Cloudflare preview after owner approval.
