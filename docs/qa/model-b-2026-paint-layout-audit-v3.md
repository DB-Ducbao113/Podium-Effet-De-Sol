# Podium EDS — Model B 2026 PAINT LAYOUT audit V3
**Audit date:** 2026-11-05  
**Repository/branch:** DB-Ducbao113/Podium-Effet-De-Sol · `feat/homepage-racing-motion-v1`  
**Scope:** **Paint-map topology, panel design, color-block shapes, transitions, left/right/top and front/rear consistency only.** Sponsor placement is OUT OF SCOPE until paint passes.  
**Status:** NOT APPROVED. Static source audit + external early-2026 reference comparison; **no rendered GLB capture, no UV/triangle geometry measurement**. Do not interpret as seven-angle visual acceptance.

## Essential distinction
The V2 palette refactor changed *which hexadecimal color* is sampled, not *where paint regions begin and end*. The current runtime still renders a shared 3-panel world-projection atlas with hand-authored polygons. Matching HEX values does not mean matching livery composition.

### Source-derived code facts
- `apps/web/src/dev/p6/paintAtlas.ts`: 512×512 **per panel** (left/right/top), total 1536×512 image, world `z = [-2.525,2.525]`, `y = [0,1.1]`, `x = [-1.1,1.1]`. Uses fixed world-polygon coordinates, not semantic chassis patches.
- `sides = [0,1]` and common polygons for both physical sides **for the first 10 teams**. Cadillac is the only team with distinct left/right top-level fills. Mirroring is a hypothesis, **not confirmed** by matching side photographs.
- `apps/web/src/dev/p6/liveryRuntime.ts`: custom shader blends side and top samples by **surface normal and world x**, using team-specific lateral blending widths. This can make a paint boundary cut through a sidepod or wing irrespective of part seams. Camera rotation itself does not change the shader's intended mapping; source/geometry matching is still unverified.
- `apps/web/src/dev/p6/liveryDefinitions.ts`: `sourceUvVerified: false` explicitly. Large team identity drawings are often treated as separate decals, not part of the paint-mask layer.
- `apps/web/src/dev/p6/standard2026Paint.ts` is one color token source, but **does not** define spatial design/shape.
- `apps/web/src/dev/p6/standard2026References.ts` has a gallery per team but labels all `photoIndexStatus: needs-angle-audit`; count of photos in a gallery is NOT proof that front, both sides, rear, top and 3/4 are all covered.
- `apps/web/src/dev/p6/liveryRuntime.ts::addMcLarenWheelDetails` adds team-specific wheel ring and lettering; other wheel/rim presentations do not yet have equivalent per-team surface mapping. Rubber is a separate material and generally should NOT be body-painted.

## Meaning of QA flags
- **FAIL-LAYOUT:** direct difference between code's paint design and verifiable early-2026 identity/visual source.
- **HIGH-RISK:** substantial shape/coverage issue apparent from coding approach; exact failure still needs real side-by-side GLB screenshot.
- **UNVERIFIED:** credible role/region but cannot approve silhouette, boundary, size or both sides from available evidence.
No percentages or final visual scores are assigned until repeatable same-camera screenshots exist.

## Components to map independently (all 11 teams)

| Code | Paint surface | Required source angles | Acceptance |
|---|---|---|---|
| FW-T | Front wing upper elements: center, each outer flap | Front / top / 3/4 | Proper patterns on distinct flaps, not one rectangular block |
| FW-F | Front wing front face, underside if visible | Front / low 3/4 | Preserve unpainted carbon; avoid arbitrary extension of top colors |
| FW-E-L/R | Front-wing endplates, left/right | Front + both sides | Both faces follow evidence, no unverified mirroring |
| NS-T | Nose cone upper, from tip to cockpit | Top/front | Continuous transition to cockpit, correct tip/center split |
| NS-L/R | Nose sidewalls, each side | Both side profiles | Match actual position of boundaries |
| SUSP | Suspension, brake ducts, wheel-edge structures | Front + side | Carbon vs paint; no spillover from nose/wing mask |
| CK-H | Cockpit surround and halo | Top/front/3/4 | Paint halo separately from upper chassis and airbox |
| SP-L/R | Sidepod main vertical panels, left/right | Both side profiles | Dominant block area, curvature and silhouette correct |
| SP-U | Sidepod shoulder/top surface, intake and leading edge | Top + 3/4 | No abrupt seam when normal changes or mesh folds |
| EC-L/R | Engine cover sides, left/right | Both side profiles | Shape/scale match photo, not blindly mirrored |
| EC-T | Engine cover top, dorsal spine, airbox | Top/rear/3/4 | Distinguish painted sections from carbon |
| FL-E-L/R | Floor edge and upper floor near sidepods | Low side + 3/4 | Keep carbon/floor design distinct |
| RW-T | Rear wing upper face/main flap | Top/rear 3/4 | Match actual full-width distribution |
| RW-R | Rearward-facing wing plane/underside | Rear | Separate layout; do not assume upper face same |
| RW-E-L/R | Rear-wing endplates | Both sides/rear | Independently mapped |
| DF | Rear lower body/diffuser | Rear/low 3/4 | Unpainted carbon or colored bodywork as seen |
| WH-L/R | Wheel rim/hub/cover surfaces; tire sidewall separately | Side / front / rear | Treat tire rubber + markings separately; do not count as generic body paint |

## 11-team source-vs-current-layout findings

| Team | 2026 signature composition to preserve (NOT just HEX) | Current atlas/code state and required correction | QA |
|---|---|---|---|
| Ferrari SF-26 | Red nose/sidepods; white cockpit surround and upper engine/airbox; dark front and rear wings; inspect both wing faces and engine-cover shoulders. | `paintAtlas.ts` uses white body polygon and white top cockpit patch, **but introduces a separate blue rear-end region**. Verify/remove/resize this zone against SAME dated gallery; verify white/red seam and carbon wings. | **HIGH-RISK** rear-wing paint and white perimeter |
| McLaren MCL40 | Long papaya nose, black front-wing center, papaya wing accents, carbon around cockpit/sidepods and broad orange/black sculpted patches; continuation visible in top view. | Atlas includes complex but manually guessed papaya/anthracite polygons and extra teal/blue rectangles; physical sides are cloned. Compare front wing per flap and papaya shoulder silhouettes; do not infer colored rectangles from partner decals. | **HIGH-RISK**, especially top/side junction |
| Mercedes W17 | Silver nose/shoulders, black center/spine, low PETRONAS flow line, **AMG rhombus pattern on upper sidepods**, star motif on engine cover. | Current atlas has broad silver polygon and simple turquoise strips, but **no dedicated rhombus/star paint graphic masks**. Side/top gradient boundaries still approximated. | **FAIL-LAYOUT** (missing major graphics) |
| Red Bull RB22 | Royal/dark glossy blue with large red/yellow bull-and-sun graphic crossing upper body, rich blue nose, contrasting wing surfaces. | Atlas uses blue base plus dark front/rear blocks; the bull/sun is treated as a separate logo/decal via `liveryDefinitions.ts`, not an integrated paint composition. Must design bull graphics and underlying color panels as a unified continuous livery layer before ordinary sponsors. | **HIGH-RISK** large identity artwork/cover |
| Racing Bulls VCARB 03 | White main chassis, strong Ford blue surfaces/stripes, high-impact **yellow/red bull graphic at airbox/upper cover/nose region**, carbon wing portions. | Atlas has white/blue/dark polygons only and no yellow/red painting in these panels. The team mark is a decal. Large upper painted graphic layout missing. | **FAIL-LAYOUT** |
| Aston Martin AMR26 | British Racing Green across nose/sidepods/engine cover, dark carbon/floor/wing, narrow lime outlining; launched on a *concept* car. | Atlas models a dark floor and lime thin path but no panel-specific seam/mask proof; launch concept may differ from real running bodywork. Need compare fixed design paint on actual race car without mixing special liveries. | **HIGH-RISK**, per-part continuity unknown |
| Alpine A526 | Blue engine cover and sidepod, pink sections across nose/halo/side areas/rear wing, clear top/side segmentation. | Polygon set has pink nose and several side/wing shapes but placement uses generic side/top projection. Confirm physical pink coverage on halo, wing endplate, top and rear against same launch design; no current photo-by-photo approval. | **HIGH-RISK**, needs top + side proof |
| Williams FW48 | Gloss blue main body; **large white area over sidepod and wing(s)**; black flow toward rear; thin red/white heritage keyline. | Current mask paints a **limited white lower rear patch** and a larger cyan sidepod field. The launch communication explicitly describes white across sidepod, front and rear wings; current area balance and red/white keyline are not faithfully represented. | **FAIL-LAYOUT** |
| Haas VF-26 | White nose/chassis; black front-wing central/outboard regions, bold black/red angular transitions, red upper/rear highlights. | Lots of hardcoded hand-drawn red/black polygons are present, including wings, but no separate per-flap/endplate mapping; top and side graphics are unmeasured and could cross folds. Need front wing geometry and rear 3/4 QA. | **HIGH-RISK** |
| Audi R26 | Titanium silver nose/front, red geometric sidepod zone, exposed dark-carbon upper/rear chassis and wings, sharp cut boundaries. | Current atlas reproduces an approximate silver-front/red-side/dark-rear hierarchy, **but boundaries and red wedge are only world-coordinate polygons**, not Audi's precise geometric cuts, and side projection is copied to both sides. | **HIGH-RISK**, potentially closest high-level block hierarchy |
| Cadillac debut 2026 | Asymmetric left-light/right-dark split, continuing through nose/upper body/wing details; intricate monochrome cuts and front geometry. | Current atlas uses near-solid opposite color columns and **an abrupt x=0 top split**. It lacks several split/gradient/angled breaks in upper body, nose and wing. Earlier midseason version is excluded; ensure source images all show February debut. | **FAIL-LAYOUT** for detailed front/top cuts |

Reference photos and authoritative description URLs (single early-2026 standard livery only):
- Ferrari January 23 launch 7 views: https://www.formula1.com/en/latest/article/gallery-check-out-every-angle-of-ferraris-2026-f1-car.7HdOPtJJwN5VHJ8XAWVtuS
- McLaren February 9 launch + *official overhead*: https://www.mclaren.com/racing/formula-1/2026/mcl40-launch/
- Mercedes January 22 gallery: https://www.formula1.com/en/latest/article/gallery-check-out-every-angle-of-mercedes-new-livery-for-2026.70sm6Znl139u64MesOt5Vf
- Mercedes team's paint-graphics description: https://www.mercedes-amg.com/en/w17
- Red Bull January 16 gallery: https://www.formula1.com/en/latest/article/gallery-every-angle-of-red-bulls-2026-livery.2wkyYJ754lp5juGmqEYlaf
- Racing Bulls January 16 gallery: https://www.formula1.com/en/latest/article/gallery-check-out-every-angle-of-racing-bulls-2026-livery.4sFYb6zqwZulpzrmxlc2m3
- Aston Martin February 9 concept gallery: https://www.formula1.com/en/latest/article/gallery-check-out-every-angle-of-aston-martins-2026-livery.33hwCL69EtT4X6xpBUTkBA
- Alpine January 23 gallery: https://www.formula1.com/en/latest/article/gallery-see-all-the-angles-of-alpines-2026-f1-car.29Ovl5O6FJcTNQgwE4Fuwx
- Williams February 3 launch and design notes: https://www.formula1.com/en/latest/article/first-look-williams-show-off-their-new-livery-for-2026-f1-season.4tY1qBa2lWI35hqxV6AH1g
- Williams gallery: https://www.formula1.com/en/latest/article/gallery-check-out-every-angle-of-williams-new-livery-for-their-2026-f1-car.5I6ZzmDjZPrMpl9UByTQAV
- Haas January 19 gallery: https://www.formula1.com/en/latest/article/gallery-check-out-every-angle-of-haas-livery-design-for-2026.F8aBXbh0IdujXCPIf6ArC
- Audi January 20 gallery: https://www.formula1.com/en/latest/article/gallery-all-the-angles-of-audis-2026-f1-car.4i5FnqGOoH5jo67PRpyEud
- Audi team description: https://www.audif1.com/en/car/r26
- Cadillac February 9 gallery: https://www.formula1.com/en/latest/article/gallery-see-all-the-angles-of-cadillacs-2026-livery.7oVj9gp6OSXescXdqEQVCt

## Approval gates BEFORE any sponsor layer

### P0 — Reference lock
- For each team, choose **one version**, one date range, one source-manifest ID. Record actual photo URLs/images, angles, source credits and whether photo is launch concept vs running car; missing views remain `unverified`.
- Never match a top from a special GP paint to a side from regular season; no midseason Cadillac revision in the debut baseline.
- Extract manually annotated 2D color-region silhouettes for each view (nose, wing top/face, halo, sidepod upper/vertical, engine cover, rear wing etc.), excluding logos in the *color layout* audit.
- Large graphic shapes that define the team's livery (e.g. Red Bull sun/bull, Mercedes stars/AMG diamonds) are **paint graphics** for this audit and must be validated BEFORE commercial wordmarks.

### P1 — Mesh semantic surface map
- On prepared frozen Model B, list every mesh/material, connected component, front/back, available UV, geometric normal, local/world bounds.
- Tag target semantic surfaces `noseTop`, `noseSideL/R`, `frontWingUpperCenter/L/R`, `frontWingFaces`, `sidepodUpperL/R`, `sidepodL/R`, `engineCoverL/R/Top`, `halo`, `airbox`, `floorEdges`, `rearWingUpper/Rear/EndplatesL/R`, `wheelRim/Hub`, `tireSidewall`, etc.
- Avoid painting bare tires with chassis colors. Store explicit mapping when real wheel covers/hubs contain team-color details.

### P2 — Per-surface livery masks
- Preserve the frozen GLB and material treatment; do not replace the model. Prefer UV/mesh island masking or reliable surface-aware baking, not one global `z,y,x` polygon that crosses an unrelated surface.
- Keep two-sided regions separate in the data model even when symmetric in the *approved* source, and do not assume color extends from upper faces to lower wing faces.
- Draw **base coverage → trim/keylines → large team graphic shapes → clearcoat/carbon finish**, with logos and partner wordmarks postponed.
- Per region record anchor mesh/patch ID, photos L/R/top, normalized proportions along **that component** (rather than fixed real-car lengths), shape polygon/spline, material finish, confidence, and fallback if a Model B surface is absent.

### P3 — Validation / no premature approval
- Render **11 teams × 8 comparison camera angles** = 88 minimum same-light screenshots (L, R, front, rear, top, front 3/4 left, front 3/4 right, rear 3/4).
- Match camera, neutral Studio light, resolution and perspective; place source and Model B side-by-side with semantic color-boundary overlays.
- Review wing face/back, sidepod top/side seam, nose centerline, halo transitions, engine cover, floor/diffuser, wheel hubs/rims; pass/fail **per surface** rather than a single score.
- Preserve orbit interaction, reduced motion, texture budgets and stable FPS; no expensive runtime geometry scanning by default.
- Until sources/GLB renders and screenshots are actually inspected, **NO TEAM is declared complete**.

## Immediate decision (audit only)
**Stop additional sponsor placement and stop palette-only tweaks.** The next implementation must be per-part color-layout mapping, starting with confirmed gaps in Williams, Mercedes, Racing Bulls and Cadillac, followed by Ferrari/McLaren and remaining teams. Do not merge/deploy until actual Model B GLB renders are approved. This report contains **no code change and does not claim runtime visual QA**.
