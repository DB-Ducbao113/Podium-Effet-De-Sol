# PODIUM EDS — MODEL B LIVERY V2
## Code audit, reference freeze and implementation specification

**Date:** 2026-11-04 (Asia/Ho_Chi_Minh)  
**Repository:** DB-Ducbao113/Podium-Effet-De-Sol  
**Target branch ONLY:** `feat/homepage-racing-motion-v1`  
**Audited baseline HEAD:** `cfa4ade140bee8c42e4de156f82101efa7af2e8c`  
**Status:** AUDIT + IMPLEMENTATION SPEC; NOT an implementation or release approval.

## 0. Locked owner decisions

1. One **standard 2026 season livery** for each of the 11 constructors, with a consistent, documented variant across every reference angle.
2. Preserve the frozen source and byte identity of Model B; its geometry may differ from 2026 real cars. Adapt geometry-relative logo positioning/size, not the branding's aspect ratio.
3. Aim for every **source-verified and permissible** sponsor mark, but only on a suitable inspected surface. If no safe/readable surface exists, record **unplaced** rather than forcing words through folds or into the air.
4. Do not silently mirror independent left/right markings; each side needs its own evidence and geometry QA.
5. Remain on the named feature branch. Do not modify homepage motion assets, push to another branch, merge, deploy, or replace the Model B GLB as a side effect.

### What "standard" means here

Use **the team's official launch / earliest regular-race 2026 baseline**, with a per-team dated `canonicalReferenceSet` and `variantId = season-default-2026`. Do not mix photographs from one-off GP liveries, different launch concepts or later permanent updates inside that same set. Example: Cadillac launched with a split black/white livery, then publicly discussed a revised look by 18 Jul 2026. Current P6 files describe *both*; the revised look must NOT overwrite the launch baseline without an explicit variant decision. Record `event-special` and `season-revision` as future separate variants only.

**Reference caveat:** 'official' is not a synonym for 'free to redistribute.' External reference URLs are editorial evidence, not asset-use permission.

## 1. Verified code topology on the target branch

| Source | Verified behavior | Engineering implication |
|---|---|---|
| `apps/web/src/components/showroom/ShowroomView.tsx` | In DEV, `/showroom` loads `P6ReviewShowroom` unless `?review=model-b`; production loads `ModelBShowroom` | Improve P6 locally first; no implicit production rollout |
| `apps/web/src/dev/p6/README.md` | P6 11-team study and 51 artwork imports are **local owner review only** | Keep provenance/rights/release gates |
| `apps/web/src/dev/p6/teamLiveries.ts` | 11 approximate 2026 sampled palettes, team metadata and reference URL | Initial study, not verified official HEX |
| `apps/web/src/dev/p6/paintAtlas.ts` | 3-panel orthographic paint maps in Model B world units, not original GLB UVs | Preserve pattern coherence; test seams and region transitions |
| `apps/web/src/dev/p6/liveryDefinitions.ts` | Sponsor registry with manual `SurfaceAnchorMap`, `placed-study`/`unplaced`, `sourceUvVerified: false` | Placement is not accepted/verified by the existing status |
| `apps/web/src/dev/p6/liveryRuntime.ts` | `DecalGeometry`, raycaster placement, UV atlas, special planar/applique wing marks and selected conforming UV-grid marks | Reuse renderer but introduce geometric/visual acceptance |
| `apps/web/src/dev/p6/officialArtwork.ts` | Artwork sources tracked individually; numerous imports from local `reference-assets` | Verify per-logo rights, variants, color/alpha and actual 2026 on-car occurrence |
| `apps/web/src/dev/commercial-b/modelBExperience.ts` | 12 *EDS-branded palette presets*, not 11 sourced sponsor-rich 2026 liveries | Do not mistake color presets for completed F1 liveries |
| `apps/web/src/dev/commercial-b/modelBMaterials.ts` | Material-name recoloring only | No sponsor/decal placement in this path |
| `apps/web/src/dev/commercial-b/modelBLoader.ts` | DEV source model vs optimized public GLB; rotates, recenters, scales and clones materials | New surface-space decisions must use prepared Model B coordinates and matrices |
| `apps/web/src/data/showroom/teamLiveries.ts` | Mixed old F1 model metadata: W15, RB20, MCL38, AMR25, A525, C44 etc. | Do NOT silently import this metadata as the 2026 canonical source |
| `apps/web/src/data/showroom/teamSponsors.ts` | Historical text/sponsor values, Cadillac placeholder drivers 99/98 | Not a vetted 2026 sponsor authority; isolate or migrate carefully |
| `apps/web/src/components/showroom/F1CarTextures.ts` | Very large procedural UV generator explicitly targeted at older C42 GLTF primitives | Not interchangeable with Model B meshes/UV islands |
| `apps/web/src/utils/teamColors.ts` | Accessible text palettes for UI; e.g. Audi green and Cadillac amber | Do not use UI colors as 3D paint |
| `docs/asset-licenses.md` | Model B source/attribution, explicit trademark and owner approval caveats | Preserve license/rights gate independently of code QA |

**Actual geometry evidence limit:** Model B's binary GLB and physical mesh normals/UV/tangent geometry were **not decoded** in this repository API audit. Names, expected surfaces and code comments were inspected; no real-world flatness or decal distortion verdict can yet be certified.

## 2. Confirmed defect/risk backlog

### BLOCKER — R01: Contradictory Cadillac variant
- `p6/liveryRuntime.ts::zoneColor`: code comment explicitly says split left-white / right-black launch study.
- `p6/teamLiveries.ts`: describes updated Belgium-onward white upper / black lower.
- `p6/liveryDefinitions.ts`: Cadillac entries tagged `updated midseason`.
- Fix: freeze `season-default-2026` to one source set; separate data keyed by `variantId`. Never mix independent versions per camera angle.

### BLOCKER — R02: Geometry suitability not evaluated before wordmark placement
- `liveryRuntime.ts::decal` raycasts + clips by side. It does not enforce a maximum surface normal variance or image Jacobian/stretch bound.
- `conformingSideMark` drapes a 24×8 grid over valid hit points; it checks hit coverage but no curvature, fold, thickness or legibility threshold.
- `fittedWingMark` places a planar applique at fixed x = ±0.627 for side marks; this may float or intersect on another mesh shape.
- Fix: preflight geometry and reject invalid candidate placements; preserve readable text vs treating all graphics as equivalent.

### HIGH — R03: Reference-side verification is incomplete
- `liveryDefinitions.ts::partners` generates both physical sides by default and appends “Left-side photograph still needs confirmation.”
- Individual entries openly note incorrect/approximate shape, unreadable positions and missing left-side sources.
- Fix: per-side, per-logo status + evidence and independent acceptance; never accept a `placed-study` by default.

### HIGH — R04: Sponsor inventory coverage and provenance
- Team logos and one or a few partner marks are defined for many teams while McLaren has substantially more detailed entries.
- Source metadata often points to a generic team page rather than a uniquely identified exact photo angle.
- Fix: record photo IDs/URLs and actual on-car sponsor instances, confidence and rights. Do not infer that every commercial partner appears on every part of the car.
- Exclude age-restricted promotional marks and any unapproved third-party artwork from public delivery. Represent these as `blocked-policy` or `blocked-rights` in internal QA without an auto-render fallback.

### HIGH — R05: Historical sources may contaminate V2
- `teamLiveries.ts`, `teamSponsors.ts`, and `F1CarTextures.ts` reflect multiple generations or different chassis.
- Fix: one typed `Season2026Livery` dataset isolated from legacy C42 texture helpers; do not change unrelated editorial metadata automatically.

### HIGH — R06: Sponsor/paint lifecycle & performance need proof
- Runtime constructs atlas, decal geometries, textures and GPU material objects on team changes.
- Fix: test repeated switching, stale asynchronous requests, context loss, geometry/texture disposal, draw-call changes, memory and frame p95 on lower-end devices. No optimization claims without measurement.

## 3. Reference acquisition and freeze requirements

For every team create `canonicalReferenceSet`:
- 2026 team, model name, published date, photo credit, source URL, capture angle, claimed livery variant, and a confidence label.
- Minimum required **views**: left side, right side, front, rear, top, front-left three-quarter, front-right three-quarter; add rear three-quarter and detail views where logos are cropped or unreadable.
- Each angle must depict the **same dated livery design**. If a gallery lacks a view, seek an equivalent photo from that design period; do not fill gaps using a GP special or other season.
- Label `source-is-concept` when the photos show a design on a launch mockup rather than an actual racing chassis (important for some launches).
- Derive region and color relationships before sampling HEX. Lighting, camera white balance, surface finish and tone mapping mean sampled pixels are not intrinsically paint codes.
- Separate `source verified`, `on-car occurrence verified`, `asset cleared for display`, `placement verified`.

Seed authoritative discovery links:
- McLaren MCL40 2026 launch: https://www.mclaren.com/racing/formula-1/2026/mcl40-launch/
- Alpine A526 official angle gallery: https://www.formula1.com/en/latest/article/gallery-see-all-the-angles-of-alpines-2026-f1-car.29Ovl5O6FJcTNQgwE4Fuwx
- Cadillac design revision history (DO NOT mix into frozen launch): https://www.formula1.com/en/latest/article/why-cadillac-have-decided-to-switch-up-their-livery.2yJrSHrgmbFpUCW3lZiMYQ

Every other `teamLiveries.ts` reference URL is an **existing candidate**, not an audited photo set. Review and attach exact views before calling the reference set complete.

## 4. Geometry-first sponsor placement algorithm

### Stage A — Mesh inventory, once per versioned GLB
Scan prepared model, recording:
- mesh ID/name, material, vertex/index/triangle count, source UV presence, world bounds, average/maximum curvature proxy, connected components and available surface area;
- normals transformed with the correct normal matrix; front/back and local side orientation;
- candidate patches for sidepod L/R, engine cover L/R/top, nose top/L/R, rear wing front/back/top, endplates L/R, halo/cockpit, airbox, etc.;
- shared paint mesh may contain **many** topologically distinct panels; do not assume one material equals one continuous planar surface.

### Stage B — Candidate surface scoring
For every approved sponsor artwork and source-relative panel, calculate:
- raycast hit coverage and continuity;
- normal divergence/curvature across prospective logo footprint;
- UV deformation as edge/area stretch and aspect-ratio distortion;
- overlaps with mesh boundaries, vents, high-curvature lips, other decals and silhouette;
- visibility, contrast and text readability at documented camera distances;
- signed surface clearance to detect floating applique / z-fighting.

**Initial review thresholds, to calibrate on real GLB (not measured results):**
- Text/wordmark patch normal spread target <= 12°;
- projected area coverage >= 90%;
- local text stretch ratio target within 0.90–1.10;
- clipping area <= 2%;
- visually inspect at native mobile and 1080p desktop sizes, across nearest and farthest presets.
A non-text pictogram can accept moderate curvature after visual inspection. If a source logo needs larger bending, use approved UV baking on a continuous surface; if it cannot remain legible, mark unplaced with a reason.

### Stage C — Placement policy and fallbacks
1. Match the source's **semantic panel** (not raw pixel position or forced real-car scale).
2. Find the best inspected patch within the panel on Model B; allow translation/uniform scaling.
3. Keep original logo aspect ratio, orientation and color inversion from the relevant *verified* source variant.
4. If necessary, choose a nearby homologous panel with similar orientation and document the deviation.
5. Project to the inspected surface (DecalGeometry on near-planar zones; conforming local UV geometry or UV bake on validated gentle curvature).
6. Do not bridge disconnected surfaces, sharp folds or centerline just to make one text logo fit.
7. If no acceptable patch exists, use `unplaced-geometry` rather than inventing a text placement. Store candidate alternatives and QA screenshots.
8. Never silently mirror distinct left/right sponsor arrangements.

### Proposed data model
```ts
type LiveryVariantId = 'season-default-2026';
type Verification = 'candidate' | 'source-verified' | 'geometry-verified' | 'visual-accepted' | 'blocked-rights' | 'blocked-policy' | 'unplaced-geometry';
type PaintRegion = { name: string; swatch: string; finish: 'gloss' | 'satin'; polygonSourceId: string };
type SponsorInstance = {
  id: string;
  artworkKey: string;
  sourcePhotoId: string;
  referenceSide: 'left' | 'right' | 'front' | 'rear' | 'top';
  semanticPanel: string;
  priority: 'primary' | 'secondary' | 'detail';
  verification: Verification;
  placement?: {
    targetMesh: string;
    connectedPatchId: string;
    technique: 'decal' | 'conforming-uv' | 'uv-bake';
    position: [number, number, number];
    rotation: [number, number, number];
    scale: number;
  };
  note?: string;
};
type Season2026Livery = {
  teamId: string;
  variantId: LiveryVariantId;
  sourceSetId: string;
  paintRegions: PaintRegion[];
  sponsors: SponsorInstance[];
};
```
No unverified sponsor should enter the final rendered registry merely because an artwork file exists.

## 5. Implementation phases in exact order

### P0 — Audit and freeze (no visual change)
- Define canonical team/variant reference sets from original official 2026 launches; freeze Cadillac baseline explicitly.
- Produce 11 sponsor inventories, left/right photo evidence, existing-artwork mapping, rights decisions, missing-view queues.
- Snapshot baseline screenshots/metrics before rewriting renderer.

### P1 — Add DEV geometry diagnostics
- Add `apps/web/src/dev/p6/modelBSurfaceAudit.ts` with one-time surface-patch extraction and metrics.
- Add visual debugging: color-coded candidate patches, sample grid, curvature / clipping / normal warnings, offset vectors.
- Add deterministic test fixtures for planar, gently curved, disconnected and sharp-fold mesh examples.

### P2 — Normalize immutable 2026 data
- Replace mixed per-file hardcoded metadata with typed `livery2026/teams.ts`, `sources.ts`, `sponsors.ts` in P6/local review.
- Import only true 2026 display identities and art; preserve `TEAM_TEXT_PALETTE` accessibility rules and EDS presets separately.
- Store measurements per canonical GLB SHA/version; do not assume a change to the model's scale leaves anchor values valid.

### P3 — Upgrade projector and art pipeline
- Wrap `decal`, `conformingSideMark` and `fittedWingMark` behind geometry acceptance.
- Eliminate fixed-plane applique positions without clearance proof. Retain the near-planar technique where validated.
- Preserve projection-side clip, UV atlas, sRGB, alpha handling, overlay render order and model-space paint zones.
- Replace manual-only fallback with explicit status + reason + review overlay.
- Cap geometry/texture complexity, cache by team/variant/model version, dispose on navigation, protect against stale team-switch tasks.

### P4 — Team-by-team liveries
- Implement 11 teams with a frozen reference set; paint masks first, then verified primary logos, then smaller sponsor instances.
- Confirm each source angle independently; no fake symmetric sponsor mirroring.
- Add before/after 7-view contact sheets, blocked/unplaced ledger and visual delta notes per team.

### P5 — Release gates / integration
- 11 teams × 7 primary views = **77 minimum review images** (+ closeups).
- Tests: projection patch coverage/curvature, logo aspect, sidedness, source/variant consistency, atlas alpha/color, switching/disposal, reduced motion, weak-GPU fallback.
- Run root checks: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run security:secrets`, `npm run security:assets`, `npm run build`, `npm run cloudflare:dry-run`; verify relevant targeted tests and baseline performance on real browsers.
- Do not promote P6 into production merely because tests pass; require visual owner acceptance, asset provenance clearance, and release approval.

## 6. Definition of done

- 11/11 teams have one immutable canonical 2026 source set; all selected reference views belong to that same design variant.
- Every *rendered* sponsor has exact source evidence, approved artwork status, verified geometry patch and visual approval.
- Unplaceable or blocked marks are visible in the review report, not quietly substituted, distorted or merged.
- No text floats off the chassis or spans unrelated surfaces; no left/right artwork bleed, stretch, mirrored unverified occurrence, z-fighting or clipping at camera presets.
- Wheel/rubber/carbon finishes remain physically plausible; old C42 UV helpers do not leak into Model B.
- Performance and GPU resources remain within **measured** baseline budgets; reduced-motion and quality modes work.
- No change to frozen Model B GLB, homepage racing-motion experience, deployment, production route or unrelated data.

## 7. QA evidence and reporting

Per-team report:
```text
team-id/
  canonical-reference-set.md
  source-photo-manifest.json
  sponsor-inventory.csv
  patch-candidates.json
  screenshot-01-left.png
  screenshot-02-right.png
  screenshot-03-front.png
  screenshot-04-rear.png
  screenshot-05-top.png
  screenshot-06-front-three-quarter.png
  screenshot-07-rear-three-quarter.png
  distortion-and-occlusion.json
  performance-comparison.json
  owner-acceptance.md
```
Keep non-cleared media in the local review area, not public assets; Git stores permitted manifests/reports only.

## 8. Immediate execution scope after this spec

- **Allowed now:** source verification, code inventory, non-destructive DEV audit/diagnostics, typed schemas, local screenshots and tests on the selected feature branch.
- **Not yet done:** decode Meshopt GLB and measure every actual surface; verify all sponsor occurrences; render 77 accepted screenshots; implement all team decals; execute repository CI; secure third-party art clearance.
- **Not authorized by this spec:** touching EDS-G01, editing home-motion logic, public deployment, bypassing QA / rights or merging branches.

This file records the implementation plan and code-level risks only. It is deliberately not a claim that 2026 artwork is complete or ready for release.
