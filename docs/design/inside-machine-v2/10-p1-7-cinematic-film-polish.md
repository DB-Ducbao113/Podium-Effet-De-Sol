# P1.7 — Cinematic polish: film director, continuous lens and cinema viewport

**Target repository:** `DB-Ducbao113/Podium-Effet-De-Sol`  
**Feature branch:** `feat/engineering-inside-machine-v2`  
**Route:** DEV-only `/engineering/p1-front-left`  
**Status:** CODE/LOOKDEV IMPLEMENTED · BROWSER VISUAL SIGNOFF OPEN · RELEASE HOLD

## Artistic goal

The owner's `animejs.mp4` clip is the benchmark for *visual discipline*: a sharp mechanical hero, considered studio reflections, deliberate separation, a pale CAD interlude, macro details, and a convincing assembled finale. A technically functioning viewer with hard-cut camera poses is not enough.

This iteration changes the **cinematography**, without moving any original GLB vertex or modifying the source R4.5 manifest.

## Micro-steps completed (implementation, not image signoff)

### P1.7.1 — One deterministic film director

New `p1/P1FilmDirector.ts` defines source-timeline-controlled exposure, focal field of view, key/fill/rim intensity and vignette at eight progressive beats. Rewinding always reproduces the same illumination; it never accumulates frame-by-frame state or spins independent artificial animations.

| Progress | Intent | Lens treatment | Lighting |
|---:|---|---|---|
| 0% | Hero reveal | medium 35.5° | low ambient, warm rim and cool key |
| 18% | Center Lock | narrow 33° | sharpen metal/counterlight |
| 40% | Nut extracted | 34° | lift cool contour contrast and keep the lock readable |
| 54% | Wheel fully extracted | 35.5° | open the composition before CAD transition |
| 69% | Blueprint complete | 34° | broad fill, minimal warm accent, neutral technical exposure |
| 80% | Brake/hub macro | tight 32.5° | preserve detail without theatrical glow |
| 86% | Rebuild begins | 33° | return from technical white |
| 100% | Assembly restored | 35.5° | **exact same** hero look as at 0% |

These values are **proposed artistic parameters**, not video-derived measurement, not genuine race-car photometry.

### P1.7.2 — Continuous camera, not six independent pauses

`p1/pilotMotion.ts` now interpolates the six existing author-anchored camera positions and targets with a nonuniform damped cubic Hermite spline. Each original camera anchor stays exact; velocity remains continuous across intermediate chapter boundaries, reducing the stop-start motion seen with repeated smoothstep.

The mathematical camera remains **fully seekable** in either direction. The camera rig uses a slightly faster follow during guided playback, plus an eased move for manual component Focus. Camera FOV is driven by film cues and accounts for source-mesh focus separately.

### P1.7.3 — Coordinated light + exposure

`P1WheelStage.tsx` uses the P1.7 cue values for all three studio lights, ambient/hemisphere lighting and the existing ACES tone-mapping exposure. Exposure writes occur in the Three renderer frame callback; they do not modify React state or external pages.

The background and component Blueprint transitions remain on the existing immutable progress. `P1StudioEnvironment` is **not constructed on PERFORMANCE** to avoid a procedural PMREM allocation on weaker graphics.

### P1.7.4 — Cinema Mode

The DEV pilot gains an explicit `CINEMA MODE` toggle:
- Full-width 3D scene for the complete vehicle and wheel film.
- Hide the right-side inspection panel **only in cinema mode**; no state or model is destroyed.
- Keep playback controls, chapter navigation and progress accessible below.
- Use restrained film-bar framing and radial vignette (zero in the technical blueprint beats).
- Switching in/out preserves progress and source geometry, clears conflicting Orbit/part focus.
- Mobile header uses a shorter Exit label rather than pushing controls off-screen.

### P1.7.5 — Editorial cut rhythm

The primary chapter title now mounts once for each actual film scene/focused component. A 420ms opacity/vertical-reveal animation supports shot changes without moving the GLB or manufacturing fake scan/telemetry effects. `prefers-reduced-motion` removes title animation and snaps camera easing to the target as in P1.5.

## What is still unverified

- The **visual look** of the new continuous spline with the actual 3D R4.5 mesh: some camera segments might need position/focus adjustment for clipping.
- Hero and macro exposure: with the existing studio PMREM, the P1.7 values may be overly bright on specific display gamma/graphics combinations.
- The mobile cinematic full-width stage, labels and header require real 375/768px browser capture.
- Actual 24-second uninterrupted WebGL video and visual scoring against the user-provided Anime.js reference are still OPEN.
- Existing mechanical risks remain: hub/shaft engagement not verified, the hub-interface pivot is invalid in the authored manifest, and R4.5 declares `reassemblyPass=false` despite source-frame spot checks.
- 44-triangle Center Lock is low-poly; lights cannot create genuine additional geometry. Close-up faceting may need a separate source-authored mesh review.

## Manual visual review (no CI)

Use the DEV-only `/engineering/p1-front-left` with the owner's locally installed verified R4.5 assets. Review the following on **SOURCE MATERIALS** and **P1.6 / CINEMATIC**:

1. **0% Hero:** compare 0% to 100%; the same composition, paint and final model pose must be visible.
2. **18% Lock:** transition should push in without a hard stop at the shot boundary.
3. **40–54% Extraction:** lock stays visually clear of the wheel while the camera keeps the subject fully visible.
4. **69–80% Blueprint/Macro:** the white CAD change must feel like part of the same camera move; typography stays readable and is not painted onto the wheel surface.
5. **86–100% Rebuild:** wheel, lock, camera and studio reflections all return together without a jump.
6. **Cinema Mode:** panel collapses, film fills stage, controls remain reachable and restoring the inspector does not reset timeline.
7. **375, 768, 1440, 1920 px:** inspect cropping, text overlap, six-shot timeline, focus return and fullscreen composition.
8. **Reduced motion / PERFORMANCE:** skip unnecessary title motion and procedural studio PMREM; no unskippable 5–7s splash.
9. Compare an uncut walkthrough directly with the real reference video. Accept only when every cinematic dimension rates at least 4/5.

## Scope and release

- No changes to R4.5 GLBs, texture binaries, commercial team branding, homepage, Showroom, Championship, API, production route, or global styles.
- Every P1.7 commit carries `[skip ci]`.
- **No CI was run, checked, changed, or awaited** in this experimental iteration, as requested.
- No merge, deploy or promotion of the pilot into the live Engineering route.

**P1.7 code: implemented. Cinematic visual gate: HOLD.**
