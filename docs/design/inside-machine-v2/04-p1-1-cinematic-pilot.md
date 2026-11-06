# P1.1 — Front-left wheel cinematic WebGL pilot

**Repo:** `DB-Ducbao113/Podium-Effet-De-Sol`  
**Branch:** `feat/engineering-inside-machine-v2`  
**PR:** #4 (Draft)  
**Status:** IMPLEMENTED IN CODE / AWAITING LIVE BROWSER VISUAL QA — **RELEASE HOLD**

## Exactly what was implemented

- DEV-only route: `/engineering/p1-front-left`, linked from existing Engineering's **Advanced** panel.
- A separately loaded real R4.5 optimized Meshopt GLB selected from the existing trusted `ASSET_URLS` namespace, verified against the existing `MANIFEST_URL`. **No binary files are copied to public assets.**
- Seven source child nodes of `FRONT_LEFT_WHEEL`, moving from immutable local transforms and source-authored Blender Z-up offsets, converted to GLB Y-up. The exact original transforms are restored at 0% **and** 100%.
- Six camera anchors based on the verified front-left wheel pivot, continuously interpolated without discrete camera switches.
- Cinematic 24-second playback controlled by the same 0–100% slider: Hero → Wheel Lock → Exploded → Blueprint → Macro → Reassemble.
- Blueprint uses **Three.js `EdgesGeometry(..., 48)`** restricted to actual wheel meshes, not all triangulated car surfaces. A declarative pale background and translucent technical surfaces make the blueprint switch reversible.
- Scoped PBR lookdev material overrides for source-verified names: rubber, brake carbon, titanium, graphite, existing crimson caliper; proposed carbon-composite on links. **Cloned material instances only**, with disposal on unmount.
- Inspector with seven named parts, selected geometry edge emphasis, localized VI/EN copy, orbit mode, reset, progressive inspection shortcuts, three profile levels and low-spec DPR.
- Explicit loading/error/retry/context-loss fallback. First-frame readiness is set from the actual R3F frame callback, not when the GLB download merely completes.
- No changes to Showroom, Championship, API, or REV4.2 storytelling route.

## How to inspect locally

From a checkout of the feature branch, with the same locally verified R4.5 Meshopt assets already required for REV4.2:

```sh
npm ci
npm run dev
```

Open the dev URL printed by Vite and navigate to `/engineering`, select **Advanced → P1.1 Wheel Cinematic Pilot**. The direct URL is `/engineering/p1-front-left`.

The app intentionally excludes this pilot from production builds via `import.meta.env.DEV`. If a local source is unavailable, pilot must show a useful error; never substitute a different GLB.

## Required live acceptance at P1.1

Run on **375, 768, 1440, 1920 px** with HIGH, BALANCED, PERFORMANCE:

| Capture | Progress | Expected result |
|---|---:|---|
| HERO-00 | 0.00 | Body and front-left tyre silhouette distinguishable |
| LOCK-18 | 0.18 | Center nut framed, no impossible lens jump |
| EXPLODE-42 | 0.42 | Separations distinct and component order sensible |
| TRANSITION-62 | 0.62 | No black flash; dark and pale materials blend |
| BLUEPRINT-73 | 0.73 | Contour/feature lines, **not raw triangulation net** |
| MACRO-80 | 0.80 | Disc/caliper/hub readable without false mechanical detail |
| REBUILD-93 | 0.93 | Parts accurately converge and camera moves back |
| ASSEMBLED-100 | 1.00 | Exact source zero pose; no geometry offset or rotation |

Also record an **uncut** playback video with backward scrub. Inspect each frame at 100% and 200% pixel scale. Save screenshots, timing and transform evidence under a local review folder **not committed to public web assets**.

### Pass/hold criteria

1. No missing GLB/manifest semantic node, unhandled runtime error, WebGL context regression or stale clone left after profile changes.
2. All 7 parts return to the original local matrix (numeric tolerance established in QA). A schematic source limitation must remain labelled, notably shaft-hub fitment.
3. Material hierarchy visible in all three visual modes. No car-color drift across angles.
4. All cinematic dimensions at least 4/5: silhouette, material, camera, detachment, clean blueprint, composition.
5. DPR/triangles/draw calls/frametime recorded. The suggested 60fps desktop/30fps low-spec targets require measured device evidence.
6. Accessibility: keyboard operations, disabled playback until loaded, reduced-motion mode and functioning 3D fallback.
7. REV4.2 Engineering production exclusion, site navigation, Showroom, Championship and article routes remain unchanged.

### Open technical risks

- A real browser run with the user's locally installed R4.5 Meshopt GLBs has **not** been executed by this GitHub-only editing session. No screenshots or video can yet certify the desired cinematic appearance.
- Actual R4.5 mechanical shaft–hub fitment is not proven; source contract `animation.reassemblyPass=false` also needs a complete browser-based round-trip revalidation.
- `EdgesGeometry(48)` reduces coplanar triangle noise but must be inspected at actual DPR/zoom; topology-dependent triangles can remain around curved surfaces.
- Model has no external studio HDRI environment; current three-point light rig and source materials are an implementation candidate, not approved lookdev.
- This is a local pilot, **not** a final page replacement or public production release.

**Decision:** GATE P1.1 stays **HOLD** until direct WebGL screenshots, playback and owner review. The feature branch remains isolated; PR is Draft.
