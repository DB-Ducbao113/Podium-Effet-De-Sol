# Plan D migration record

## Status

**LOCAL MIGRATION — OWNER GATE. No stage, commit, push, merge, deploy, Cloudflare resource creation, domain connection, or auto-deploy connection has occurred.**

Source: `DB-Ducbao113/F1-Overview`, branch `commercial-peds`, SHA `abd0252c6c6e7acc11d5bbb6118b1bea7daec9ed`, plus preserved B6–B8 local changes.
Target: `DB-Ducbao113/Podium-Effet-De-Sol`, local branch `migration/clean-architecture`.

## Architecture change

The previous single-package tree mixed frontend, platform handlers, sync scripts, and shared validation. The npm workspace separates `apps/web`, `apps/api`, `apps/jobs`, and shared contracts/security packages. D7 replaces the target repository's Vercel-only adapters and analytics packages with one Cloudflare Worker using Web Fetch API and Static Assets. The UI and route behavior are intentionally preserved.

## Migrated

- Frontend routes, Championship/F1 Results, Engineering, Teams, Drivers, VI/EN, EDS-G01 Showroom.
- Local-only Model B Meshopt preview and B6–B8 Adaptive Graphics modules/tests.
- Jolpica and OpenF1 contracts with new domain/application/infrastructure/interface separation.
- Two data synchronization jobs, disabled from automatic execution.
- Required original runtime images, branding, EDS-G01 GLB, configs, lockfile, CI, and functional tests.

## Excluded

- Old `.git` history and remote configuration.
- Scratch, QA screenshots, contact sheets, videos, benchmark evidence, archives, and generated reports.
- Historical D1/D2/D3 visual experiments and capture scripts.
- Model A, Model B `.blend`, unapproved commercial GLB upload, C42, EDS-G02, and EDS-G03.
- Docker publishing and write-capable/scheduled data workflows.
- 126 legacy WebP assets not used by the commercial production path; retained only in ignored local rollback storage.

## API compatibility

The endpoint names and successful JSON contracts remain unchanged. New tests verify path/endpoint allowlists, exact origin handling, unknown parameter rejection, fixed upstream origins, page-size bounds, and error responses.

## Verification snapshot

| Check                             | Result                                                                             |
| --------------------------------- | ---------------------------------------------------------------------------------- |
| TypeScript strict workspace check | PASS                                                                               |
| Unit/API/security tests           | PASS — see current D7 owner report                                                 |
| ESLint                            | PASS                                                                               |
| Secret scan                       | PASS                                                                               |
| Public asset boundary             | PASS                                                                               |
| npm dependency audit              | PASS in online run — 0 vulnerabilities                                             |
| Production build                  | PASS                                                                               |
| Commercial visual isolation       | PASS                                                                               |
| Browser smoke                     | PASS for 8 local routes; external fonts/Jolpica NOT RUN due sandbox network denial |
| Cloudflare Wrangler local runtime | PASS for local routing/headers/fallback; remote edge PENDING                       |
| Scheduled pipelines               | NOT RUN by policy                                                                  |

Detailed command logs and generated inventories remain under ignored local `scratch/plan-d/`.

## Size

The migration source manifest contains 500 tracked/untracked nonignored files totaling 30,110,920 bytes. After D7, the target upload allowlist contains exactly 346 files totaling 4,805,884 bytes, excluding `.git`, dependencies, build output, scratch, and local-only assets.

## Rollback

The source worktree and remote are untouched. Delete or abandon only the independent target clone after owner direction; no source history rewrite is required. Local-only candidate and legacy assets remain recoverable under `.local-assets`.

## Residual risks

- Tailwind 4 removes dependency advisories but increases built CSS from about 112 KB/19.5 KB gzip to 157 KB/24.3 KB gzip; browser visual parity must be checked.
- Commercial rights for Model B remain blocked.
- Preview deployment, serverless routing, global rate limiting, external API behavior, and production headers are unverified.
- The data jobs retain legacy internal transformation code even though orchestration and placement are separated; further domain extraction can be considered only after owner approval.

## Recommendation

**HOLD** until owner acceptance of the Cloudflare migration, CSS/security trade-off, asset-license blockers, and a future non-production Cloudflare edge verification. This is not production approval.
