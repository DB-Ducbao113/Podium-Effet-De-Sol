# P6 V2 local Showroom review

`http://localhost:5173/showroom` renders this 11-team livery study in Vite DEV. The production Showroom uses the owner-selected Model B asset. `?review=model-b` opens the earlier Model B material review in DEV.

The runtime and its 51 referenced artwork files are self-contained in this directory. It does not import from `scratch/`. The frozen Model B file is still loaded through the existing DEV-only `/__peds-review/model-b.glb` route from `source-assets/models/model-b/model-b-eds-optimized-v1.glb`; preserve that source asset when organizing the repository.

`officialArtwork.ts` records the source for each copied mark. The photos, brand marks, and derived artwork remain limited to local owner review. The historical ten-team sponsor and visual gaps still require owner review; the old `scratch/` QA report was disposed of with the approved cleanup. Do not treat a successful build or working team selector as visual approval.

## Model B Livery V2 — first implementation slice (2026-11-04)

This branch now runs a **geometry-first sponsor preflight** before P6 decals are created:

- `modelBSurfaceAudit.ts`: 5×5 real mesh raycasts per candidate; measures coverage, world-space normal spread, projected letter stretch and planar depth range. Requires the centre of the mark to have a surface.
- When the source anchor fails, the runtime tries uniform scale 0.88/0.72 and small same-panel translations. It does **not** distort the artwork aspect ratio or cross to a different mesh.
- Invalid or restricted artwork is not rendered; each rejection is recorded as `unplaced` or `blocked`, rather than inserting a floating/illegible wordmark.
- Flat wing appliques follow measured surface-hit positions instead of hard-coded X coordinates; an additional shallow-depth preflight is mandatory.
- `standard2026References.ts`: one official 2026 launch gallery per team. `official2026PhotoIndex.json` records 67 individual gallery images plus dated regular-race photos for all 11 teams; a missing angle remains unverified.
- Cadillac opens on the `season-current-2026-11-06` paint study anchored to **10 Belgium race-weekend images**: three F1 photos dated 17 July and seven Cadillac team photos from its [Belgium page](https://www.cadillacf1team.com/2026-belgium) and race reports. Four later race photos are comparison evidence only. The team photos document front, rear and both side profiles; overhead and underside remain unverified. The **February 2026 split white-left / black-right launch** remains selectable. Belgium paint withholds launch decals until matching logo placements are checked.
- Mercedes W17 paint now includes a lower PETRONAS green flow line, top-sidepod rhombi and an engine-cover three-pointed-star field, using the [official 2026 design description](https://www.mercedesamgf1.com/news/mercedes-amg-f1-2026-challenger-w17-revealed) and launch renders. A [Mexico City race photo](https://www.mercedesamgf1.com/news/in-pictures-the-best-images-from-mexico-city-2026) corroborates the regular silver/black/green scheme after the Austin special. This is still a Model B paint study; paint seams and sponsor placement need same-angle review.
- `main.tsx`: P6 Advanced tab shows placed/adapted/unplaced/blocked counts. For detailed metrics, open browser DevTools and run `window.__P6_LIVERY_DEBUG__()` on the local review page; `placementAudit` includes each attempted anchor, coverage, normals, stretch and reason.

**What the counters mean:** A `placed` result means sampled geometry and decal creation checks passed; it does **not** mean the sponsor, photo angle, artwork rights or final visual legibility has been accepted.

**Checks to run in a local checkout with licensed review assets:**

```bash
npm ci
npm run typecheck --workspace=@peds/web
npm run test --workspace=@peds/web -- modelBSurfaceAudit.test.ts standard2026References.test.ts
npm run lint
npm run build
```

Open `http://localhost:5173/showroom?author=1` in DEV, switch through all 11 teams and use the P6 Advanced tab plus canonical gallery links. Compare both sides, front, rear, top and three-quarter cameras; report poor coverage, clipped text, z-fighting and paint-mask seams. `?review=model-b` still opens the unaffected material-only review.

**Environment limitation:** Repository CI only triggers on push to `main` / `migration/**` or a pull request. This feature branch's commits do **not** automatically run the repository's existing CI workflow. The tests above are committed but **have not been executed in this connector-only audit environment**. The P6 artwork `reference-assets` files are local owner-review resources and not present in the Git tree; do not treat a GitHub-only build as the complete local visual QA.

**Release lock:** No production integration, GLB alteration, homepage motion change, branch merge, or deployment was performed.

## Performance hotfix — default load must remain responsive (2026-11-05)

The geometry preflight introduced in V2 was too expensive to run synchronously during every team load: 25 triangle raycasts per candidate, multiplied by up to 11 retry placements per logo, all on the main thread. On the large shared Model B mesh this can freeze the UI.

**Hotfix contract:**

- Ordinary `/showroom` and `/showroom?author=1` use the original fast anchored decal path; they **do not run the 25-point surface scan or automatic fitting**.
- This is a temporary performance safeguard. Their decal status is `provisional`, not `placed`/geometry-certified.
- A single targeted raycast locates each preview wing mark; extra detailed authoring checks are never implicit.
- The conforming projection grid is 12 × 4 cells (65 sample rays) for ordinary preview, versus 24 × 8 (225 sample rays) in detailed review mode.
- `/showroom?author=1&surfaceQa=1` explicitly opts into expensive detailed scans in DEV only. Avoid this query during routine UI testing. It is not suitable for production. Detailed QA should ultimately move into an offline build-time/exportable geometry audit rather than blocking WebGL rendering.
- `/showroom?review=model-b` remains the color/material-only fallback in DEV, independent of the P6 geometry checks.
- The test `modelBSurfaceAudit.test.ts` asserts the expensive flag is false for ordinary and author mode and never enabled in production.

**Validation still required:** Checkout the feature branch locally, run typecheck/test/build, open the Showroom and measure load-to-interaction, frame p95 and team-switch latency on a weaker device. This hotfix was committed through the GitHub connector and does **not** claim measured performance or passing CI.

## Interaction + 11-team paint consistency patch — 2026-11-05

**Problem 1: 50–60 displayed FPS, but Model B will not orbit.** The P6 DEV `?author=1` code used a canvas capture-phase `pointerdown` handler to relocate an already-selected decal, consuming pointer events before Drei OrbitControls. This is independent of rendering FPS. Fix: **normal left drag always rotates the camera**; only `Shift + left drag` invokes decal placement. The author panel now says so; decorative labels and loading status are non-interactive, and the canvas uses `touch-action:none` to allow touch rotation. Studio orbit controls explicitly enable rotation and stop preset transitions as soon as the user drags.

**Problem 2: inconsistent 2026 colors.** Previously `teamLiveries.ts`, `paintAtlas.ts` and the runtime's Cadillac fallback used conflicting hardcoded RGB values. This created mismatches between swatches, paint regions and quick transitions even before source-photo approval. Fix:
- `standard2026Paint.ts` is the sole source of the 11 teams' paint-role swatches (primary, secondary, accent, side, cover, nose, wing, dark, light, detail and finish).
- `teamLiveries.ts` spreads those values into each selectable team's runtime data; `paintAtlas.ts` consumes exactly the same source for all three projections. 109 individual atlas color literals were replaced.
- `liveryRuntime.ts::zoneColor` preserves the February asymmetry by default. The Belgium-onward Cadillac variant has its own color mapping and atlas, so it cannot overwrite the frozen launch source.
- Studio uses neutral key/fill lighting and white rim by default. Optional Team lighting is decorative and **not** color-reference accurate.
- Existing body-mask geometry and sponsor anchors remain provisional; the shared palette stops conflicting *colors* but does not prove every polygon follows the source's real panel boundaries.

**How to inspect:**
- `/showroom`: drag to rotate; change all 11 teams; inspect both physical sides and top view.
- `/showroom?author=1`: drag to rotate; `Shift+drag` to move selected decal. Use `window.__P6_VIEW__('left')` and `window.__P6_VIEW__('right')` to compare asymmetry.
- `/showroom?review=model-b`: isolated older material-only DEV route for fallback and regression comparison.
- Test targets: `authorPointerIntent.test.ts`, `standard2026Paint.test.ts`, `standard2026References.test.ts`, `modelBSurfaceAudit.test.ts`.
- Suggested root commands in a full local checkout: `npm ci && npm run lint && npm run typecheck && npm run test && npm run build`. Actual browser interactivity, screenshot QA and real-device performance remain **unverified** until executed locally.

The palette values are visually estimated colors matched to one 2026 launch design per constructor, **not manufacturer-certified paint codes**. The authoritative source registry stores official 2026 image galleries but still requires explicit per-image multi-angle/rights review. This patch does not merge, deploy, modify the frozen Model B GLB or update the commercial release route.

## Paint-layout V1: 30 groups / 54 independent surfaces (2026-11-05)

**Now implemented:** `modelBComponentMap.ts`, `paintLayoutReview.ts`, `ModelBPaintLayoutInspector.tsx`, `modelBComponentMap.test.ts`; detailed implementation/report: `docs/qa/model-b-component-map-implementation-v1.md`.

- 11 teams × 30 component review groups. **38 actionable findings; no visual approvals**. Every other group remains unverified, never silently passed.
- Advanced → **Paint layout · component audit** opens the per-part selector, correct left/right/top/front/rear views, photo requirements, specific issues and source links.
- P6 **starts paint-only**: the runtime skips sponsor atlas loading and decal geometry entirely until the explicit optional branding toggle is enabled. No per-frame geometry analysis was added.
- Small special zones are first-class: nose side walls (purple highlight), sidepod intake lip (yellow highlight), upper/outer sidepod (cyan highlight), engine cover/airbox (pink highlight), plus four individual wheel-sidewall/cover/rim entries.
- Initial verifiable layout/finish corrections: Ferrari rear wing dark instead of an unverified blue rear region in both side/top atlas; Racing Bulls white has satin/matte-inspired finish; updated Cadillac author reference no longer masquerades as debut.
- These groups are **semantic review slots** (`geometryEvidence: 'semantic-only'`, `meshName: null`), not confirmed GLB mesh boundaries. Do not bake the wrong polygon from this early-stage map.

**Recommended local validation:** `npm run typecheck --workspace=@peds/web`; `npm run test --workspace=@peds/web -- modelBComponentMap.test.ts`; then inspect `/showroom` with the Advanced part selector and neutral Studio lights. Full browser/GLB multi-angle visual QA remains to be done before sponsor placement.

## Eleven-team current logo review (2026-11-06)

The DEV selector now opens the dated current-review target for all 11 teams. Nine teams reuse their launch-era decal anchors as **provisional visual proxies** because the indexed current race photos do not establish both sides and top. Mercedes has separate Mexico anchors. Cadillac's Belgium revision stays paint-only: the available TWG artwork and other current sponsor marks are not cleared for placement. The launch variant remains selectable for every team.

| Team | Current DEV logo result | Remaining evidence or geometry issue |
| --- | --- | --- |
| McLaren | 17 projected; two narrow-halo marks unplaced, two restricted marks blocked | Current photo is front-only; side/top and partner positions are unverified. |
| Ferrari | 11 projected | Current photo is an unresolved front quarter; side/top positions are unverified. |
| Mercedes | 4 Mexico projections; two oversized side stars hidden | Right-side Mexico photo is indexed; physical left remains mirrored and top is unverified. |
| Red Bull | 7 projected | Current photo is front-only; side/top positions are unverified. |
| Racing Bulls | 7 projected | Current side in the index is unresolved; both physical sides need confirmation. |
| Aston Martin | 5 projected | Launch gallery depicts a concept chassis; current image is an unresolved front quarter. |
| Alpine | 7 projected | Current photo is front-only; BWT/eni placement needs same-angle review. |
| Williams | 9 projected | Atlassian still warps across Model B's cover; current side is unresolved. |
| Haas | 4 projected | Current photo is an unresolved front quarter; both sides need confirmation. |
| Audi | 5 projected | Current photo is an unresolved front quarter; side positions need confirmation. |
| Cadillac | 0 current projections; 12 logo observations remain unplaced | Belgium-side photos exist, but matching artwork and the TWG scale/identity are unresolved. |

The counts above are **projection counts, not visual approvals**. The browser review captured physical left, right and top for all 11 in `.local-assets/qa/p6-all-logos-2026/`; it found no page errors or failed requests. Headless Chrome on a software renderer does not establish real-device performance. No Model B binary, public asset, production Showroom, or release permission changed.

## Wheel and rear-endplate design study

The DEV runtime now draws medium-yellow sidewall lettering and a narrow compound ring on each of Model B's four measured wheel positions, independent of sponsor visibility. Rubber remains dark and matte; the older rainbow McLaren ring is removed. This is an illustrative medium-compound presentation for all 11 cars, not a claim about the tyres fitted at a particular race. [Pirelli's 2026 tyre description](https://press.pirelli.com/pirelli-reveals-2026-f1-tyres-a-fresh-logo-design-and-new-compounds/) confirms the white/yellow/red compound coding and revised sidewall graphics; the local lettering is a hand-drawn approximation, pending artwork rights and owner visual review.

The McLaren Dropbox mark and the Racing Bulls, Alpine and Williams right rear-endplate marks use smaller footprints on Model B's outer wing face. They are still review projections rather than verified 2026 sponsor placements. Close-up browser evidence is stored in `.local-assets/qa/p6-all-logos-2026/wheel-*-right.png` and `wheel-mclaren-rear.png`.

## Rear wing team-name fallback

The fixed Model B rear endplate has a narrow, comparatively flat lower strip; its upper curved area is not treated as a logo plane. DEV now draws each team's name on that strip on both physical sides. On the right, existing Dropbox, VISA, eni or Komatsu artwork takes precedence while sponsor preview is enabled. Cars without a rear-facing main-wing wordmark also receive a centered team name on the main wing. These names are generated canvas text for this local design study, not official team artwork or evidence of a race-specific sponsor layout. The visual audit is in `.local-assets/qa/p6-all-logos-2026/rearname-*-{left,right,rear}.png`.
