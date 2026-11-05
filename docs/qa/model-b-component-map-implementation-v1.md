# PODIUM EDS — Model B Component Paint-Layout V1 (Code Implementation)

**Date:** 2026-11-05  
**Branch:** `feat/homepage-racing-motion-v1`  
**Status:** IMPLEMENTED REVIEW FOUNDATION / NOT VISUALLY APPROVED  
**Owner decision:** Fix exact paint-block composition on every part of each team's *standard early-season 2026 livery* **before** aligning partner logos.

## What this commit delivers

1. `modelBComponentMap.ts`: **30 semantic design families**, expanded to **54 independently reviewable surfaces** (left/right and four wheel instances). Includes nose sidewalls, intake lip, shoulder, sidepod face, undercut, engine-cover side/top/spine, halo, wing faces, rims, tire sidewalls, floor edge and diffuser. Each has design notes, required photo angles, sponsor eligibility and priority.
2. `paintLayoutReview.ts`: **11 constructors × 30 groups** with a review status for every pair. The initial backlog explicitly records 38 specific source/code issues across 11 teams; all remaining cells are **photo-review-required**, never automatically 'pass'. Each finding distinguishes official design description from a code-geometry risk or missing photo.
3. `ModelBPaintLayoutInspector.tsx` (Advanced tab): select any design family; see evidence, criticality, which L/R physical surfaces it expands to, relevant reference angles, which logo surfaces may be suitable later, and navigate left/right/front/rear/top camera views. UI is metadata-only and performs **zero per-frame raycasts**.
4. **Paint-only by default:** P6 review now hides sponsor decals and experimental wheel overlays. Sponsor atlas creation is deferred until the user explicitly checks **Show existing sponsor/wordmark overlays**. This avoids decoding sponsor images on the paint-layout first pass.
5. **First concrete layout correction:** remove the unsourced blue rear-wing color patch from Ferrari's standard SF-26 study in both side and top paint projections. Do not mistake this for per-flap mesh verification.
6. **Additional finish correction:** Racing Bulls uses a satin/matte-inspired white finish, aligned with the official team's matte-white launch description.
7. P6 authoring no longer forces the updated Cadillac mid-season image into the canonical February launch reference; missing baseline image stays missing rather than secretly substituting the wrong variant.
8. Tests for group integrity, physical side uniqueness, per-team 'not approved' counts and official-source finding evidence are in `modelBComponentMap.test.ts`.

## Important distinctions, grounded in user-provided visual example

- **Purple-edged front / nose area:** `nose-side-left/right` and `fw-center/fw-outer`; check nose-side and wing junction separately.
- **Cyan-edged body:** `sidepod-upper-left/right`, `sidepod-main-face-left/right`, engine-cover side; separate shell vs vertical panel.
- **Yellow intake outline:** `sidepod-inlet-lip-left/right` is a CRITICAL independent detail; never merge into whole sidepod, paint through opening, or assume left equals right.
- **Pink upper back shape:** `engine-cover-side-left/right`, `engine-cover-top`, `airbox-surround`; maintain body graphics across upper/side transitions.
- **Wheel region in view:** `wheel-cover`, `rim-accent` and `tire-sidewall` for each of four wheels. Rubber markings, wheel paint and body paint must be distinct.

**Reference caution:** The user example is a shape/component analysis image, NOT the canonical paint livery for any 2026 constructor. Its outline highlight colors are **annotation colors**, never target body colors.

## Team-specific priority order

| Team | Initial major paint-layout issues |
|---|---|
| Mercedes | AMG rhombus pattern on upper sidepod, three-pointed-star engine-cover pattern, low PETRONAS flow line |
| Williams | White on sidepod AND front/rear wings, black rear sweep framed by thin red/white keyline; preserve separate cyan Barclays field |
| Racing Bulls | Matte white/blue contour geometry; separate large team identity graphic from paint block and commercial sponsor wordmark |
| Cadillac | February baseline asymmetric physical left/right, complex nose/upper-body split; no mid-season variant mixing |
| Ferrari | White cockpit/airbox interface and dark rear wing; isolate each wing face |
| McLaren | Papaya/anthracite sculpted panels, complex intake/shoulder and wing-flap transitions; unapproved wheel effects hidden |
| Red Bull | Bull-and-sun main team identity composition integrated with cover paint; rear wing face separate |
| Aston Martin | Green/carbon floor transitions and lime line along inlet/shoulder; launch concept vs running car |
| Alpine | Nose/halo pink regions independently mapped to real surfaces |
| Haas | Red/black diagonal polygons crossing sidepod/cover and wing flaps |
| Audi | Silver/red/dark carbon cuts across front/side/rear without generic panel spill |

## Source evidence used for the first confirmed gaps

- Williams official: https://www.williamsf1.com/articles/5363520c-1e22-4d62-a568-7f1c7b6ff529/atlassian-williams-f1-team-reveals-bold-new-racing-livery-for-2026
- Mercedes official: https://www.mercedesamgf1.com/news/mercedes-amg-f1-season-launch-2026-a-new-era-begins
- Racing Bulls official: https://www.redbull.com/us-en/visa-cash-app-racing-bulls-2026-f1-livery-launch
- Ferrari launch gallery: https://www.formula1.com/en/latest/article/gallery-check-out-every-angle-of-ferraris-2026-f1-car.7HdOPtJJwN5VHJ8XAWVtuS
- Formula 1 gallery registry for all 11: `apps/web/src/dev/p6/standard2026References.ts`

Photos show the REAL 2026 chassis/launch design. Model B is a DIFFERENT chassis. We preserve relative identity and cross-surface continuity, not exact chassis dimensions. Do not mix livery variants across source angles.

## Work explicitly not done yet

- No binary GLB triangle/UV/normal-surface scan was executed; **54 entries are semantic slots with `meshName: null`, not 54 verified Model B mesh patches**.
- No source photo manifest of full L/R/front/rear/top/3-quarter views has been individually approved.
- No complete redesign of the 11 teams' masks or manual 11 × 8 = 88-view matching renders has been approved.
- No sponsor position may be considered approved merely because a panel says 'possible-after-geometry-audit'.
- GitHub API wrote the source and tests, but local Vitest, TypeScript, lint, build and real browser drag/performance testing have **not been executed in this environment**.
- No production route change, deployment or merge; the frozen GLB remains intact.

## Local test / review sequence

```bash
git switch feat/homepage-racing-motion-v1
git pull --ff-only origin feat/homepage-racing-motion-v1
npm ci
npm run typecheck --workspace=@peds/web
npm run test --workspace=@peds/web -- modelBComponentMap.test.ts standard2026Paint.test.ts
npm run dev --workspace=@peds/web
```

Open `http://localhost:5173/showroom`, change all 11 teams, open **Advanced → Paint layout · component audit**, and inspect the 30 semantic groups. Sponsors are hidden by default. Use the gallery link and left/right/front/rear/top buttons to generate the next side-by-side QA evidence.

**Next implementation gate:** map these 54 semantic slots to actual prepared Model B patches and source-photo regions (on-demand/offline, not per-frame); then replace the world-coordinate generic polygon masks with per-component bounded shapes, starting with Mercedes, Williams, Cadillac and the user-identified sidepod intake-lip transition.
