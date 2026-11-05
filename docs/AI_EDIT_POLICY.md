# PEDS | EDIT BOUNDARIES AND FILE OWNERSHIP POLICY

Purpose: prevent AI-driven broad rewrites, unreviewed production changes, asset rights violations and accidental regression. **Approval is per task/impact**, not a blanket “never edit any important file”. Read `docs/AI_FEATURE_FILE_MAP.md` first.

## 1. Three editing zones

### GREEN — routine scoped edits allowed by an explicit implementation task

Within the **specific feature owner** named in the task:
- `apps/web/src/components/<feature>/**/*.{tsx,ts,css}` and matching `*.test.ts[x]`.
- `apps/web/src/components/pages/*`, `engineering/*`, `championship/*`, `home/*`, `showroom/*`, `p5/*`, **only when related to the requested page**.
- Pure helpers in `apps/web/src/utils/*`, `hooks/*`, and dedicated tests, **if actually in the traced import/data path**.
- Add dedicated test files, feature-scoped docs and QA evidence description. Local evidence belongs in ignored folder, not accidental public assets.
- Within existing API paths, safe isolated error/validation fixes may be implemented **when the task explicitly requests the API issue**, with contract/negative tests and full security gate; API is HIGH-risk in quality checklist.

“GREEN” never means permission to edit all feature folders at once. Before editing, name each intended file and why.

### AMBER — change only when the task requires it and after explicit impact analysis

- **Cross-route files:** `apps/web/src/App.tsx`, `components/layout/{Navbar,Footer,navItems}`, `components/ui/*`, `components/mobile/MobileAllInOne.tsx`, global `src/index.css`, `src/styles/*`, `tailwind.config.js`, `i18n/translations.ts`.
- **Data/state/contracts:** `store/*`, `services/*`, `data/{championship,teams,drivers,teamSeasons,cars}/*`, `types/*`, `packages/{contracts,security}/*`, `results-engine/*`.
- **Critical edge routes/config:** `apps/api/src/*`, `apps/web/public/_headers`, `wrangler.jsonc`, `apps/web/vite.config.ts`, `src/config/site.ts`, SEO build / prerender scripts.
- **Dependency/build policy:** `package.json`, `package-lock.json`, `tsconfig*`, `eslint.config.js`, `.github/workflows/*`, `tools/*`, `apps/web/scripts/*`.
- **Asset manifests/provenance records:** `docs/asset-licenses.md`, `docs/asset-manifests/*`, `apps/web/src/data/visualAssets/*`.

Required before AMBER edits: identify affected consumers and tests, describe the invariant and regression risk, show why GREEN files alone are insufficient, and state expected public/security/data effect. If the task does not explicitly encompass that scope, **stop before making AMBER changes and report additional approval needed**. Explicit request like “change API validation” may authorize scoped API work, but never silently reduce security or update factual baselines.

### RED — never modify/publish as an incidental step; explicit owner approval for each exceptional change

- **Immutable owner-selected shipped media:** `apps/web/public/media/homepage/hero-h3-2.mp4` and `hero-h3-2-poster.png`; recorded byte/hash guard in `docs/asset-licenses.md`.
- **Frozen protected model binary:** `apps/web/public/models/model-b-eds-optimized-v1.glb` and its local `source-assets/models/model-b` identity; do not alter bytes/license attribution/expected hash or substitute another model without owner-directed model replacement.
- **Canonical logo/artwork:** `apps/web/public/logo/*` (source identity and aspect ratio) — only replace/rebrand on explicit asset/branding instruction with proof/owner review.
- **Withheld and withdrawn content:** `source-assets/*`, `.local-assets/*`, withdrawn EDS-G01-derived P4 cinematic visuals and retired EDS-G01 GLB must **not** be moved into public/build or regenerated implicitly. Historical withdrawal records must not be erased.
- **Secrets:** real `.env`, `.dev.vars`, tokens, signing keys, vendor credentials, local absolute source paths — never commit, print or copy into frontend `VITE_*` vars.
- **Unrequested high-impact operations:** remote deploy, cloud resource change, destructive `git`, npm dependency forced security fix, running data-sync that **writes verified results**, database migration or third-party publication.

Only owner-approved authorization, a documented migration/release plan, verified provenance/security review, and appropriate tests can lift a RED boundary. **Some prohibitions remain absolute** (never publish secrets or knowingly misrepresent facts).

## 2. Change proposal mini-template (AI must fill before edits)

```text
REQUEST / ACCEPTANCE CRITERIA:
TARGET ENVIRONMENT: DEV / production / both
ROUTE + USER FLOW:
PRIMARY OWNER FILES (GREEN):
READ-ONLY DEPENDENCIES:
OPTIONAL AMBER FILES + JUSTIFICATION:
RED FILES IMPACTED: none / STOP for owner approval
DATA OR UI CONTRACTS THAT MUST REMAIN:
TARGETED TESTS + FULL GATES + BROWSER MATRIX:
EXPECTED DIFF (files only):
```

No implementation starts until a sensible allowlist exists. Agent can amend the list after finding a justified dependency, but **cannot silently escalate into AMBER/RED**.

## 3. Explicit scope rules

1. **Change visual** ≠ permission to rewrite state, data, API, locks, dependency versions, or unrelated routes.
2. **Change logic** ≠ permission to restyle all pages, rename IDs or rebase Git.
3. **Refactor** ≠ permission to alter public behavior or data meaning.
4. **Fix security** ≠ permission to turn off CSP, CORS, validation, tests, lint, or diagnostic logging that protects users.
5. **Add tests** ≠ permission to delete failing tests, change valid expected values without evidence, or mock away behavior.
6. **Fix a bug in one season** ≠ permission to recalculate all seasons or rewrite official standings.
7. **Change graphics** ≠ permission to ship candidate preview asset, swap Model B into Home, or revive withdrawn EDS-G01 material.
8. **Edit a docs map** ≠ proof code and production behave as documented; link to actual source and verify with tests.

## 4. Git and output boundaries

- Working branch: `rebuild`. Record branch and dirty status first. If wrong branch, **do not edit**.
- Never overwrite unrelated user changes. `git status --short` before/after. Scope diff with `git diff --name-only` and `git diff --stat`.
- Do not commit/push/merge/reset/rebase/stash/deploy unless the actual task authorizes that operation. GitHub CI is triggered for `rebuild` when commits are pushed; a local pass alone is not remotely verified.
- Generated bundles `dist/`, `coverage/`, `.wrangler/`, `node_modules/` and private screenshots/review files are not patch targets.
- Naming, file formatting and changes to package lockfile must be intentional; **no entire-repo Prettier rewrite** for a tiny fix.
- If a changed file is outside the approved allowlist, explain it; revert only your own out-of-scope changes without discarding prior user work.
- After task, perform checks in `docs/AI_DEVELOPMENT_WORKFLOW.md` and report local vs remote state honestly.

## 5. Specific sensitive ownership

| Contract | Owning source | Only change when | Must verify |
|---|---|---|---|
| SPA routes, DEV feature visibility | `App.tsx`, `navItems.ts`, `useMobileHub.ts` | route/mobile-navigation task | direct navigation, SEO, production build, 404 |
| Language, timezone, persisted client data | `store/*`, `utils/championshipTimezone.ts` | preference/state bug or feature | browser persistence, SSR/test fallback, both languages |
| F1 truth / standings | `services/standingsEngine.ts`, `data/championship/*`, `baselineCutoff.ts` | sourced data bug / authorized refresh | ID mapping, sprint double-count, season regression |
| Public API safety | `apps/api/*`, `packages/security/*`, `_headers` | server/API/security task | negative tests, CORS, query bounds, headers, audit |
| 3D visual asset identity | `ModelBShowroom.tsx`, `dev/commercial-b/*`, `vite.config.ts`, `public/models/*` | approved Showroom/asset task | hash/size, licensing, graceful fallback, graphics QA |
| Original brand/media | `public/logo/*`, `public/media/homepage/*` | owner explicit branding/media request | attribution, byte constraints, responsive/fallback |
| Build/deploy/SEO | `vite.config.ts`, `wrangler.jsonc`, `scripts/*`, `RouteSeo.tsx` | infrastructure/SEO task | build, dry-run, no unexpected public output |

## 6. Escalation and exception record

For high-impact requested change record:
```text
Exception ID:
Requested owner instruction:
Files / contracts:
Reason and source evidence:
Why local/feature-only change is insufficient:
Risk and rollback:
Tests / security / licensing / release acceptance:
Explicit approval status: APPROVED / PENDING
```
A vague “make it better” or “fix UI” is not an approval to bypass RED.
