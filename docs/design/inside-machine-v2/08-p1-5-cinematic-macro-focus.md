# P1.5 — Cinematic Macro Focus / seven-component investigation

**Target:** `DB-Ducbao113/Podium-Effet-De-Sol` · branch `feat/engineering-inside-machine-v2` · PR #4 (Draft)  
**Scope:** DEV-only `/engineering/p1-front-left`. The existing REV4.2 Engineering story is not replaced.

## What changed

### 1. Seven source-dependent camera lenses

`P1MacroLenses.ts` defines seven candidate 3D camera directions and min/max distances. `P1CameraRig.tsx` reads the actual rendered GLB node bounding box (and mesh geometry descendants) instead of trusting the partly-invalid R4.5 `pivotWorld` values.

- Center Lock: near-axial macro, tight framing.
- Wheel Outer: larger tyre+rim composition.
- Hub: face/mounting interface framing.
- Brake Disc: oblique disc face, clear rotor silhouette.
- Brake Caliper: offset high three-quarter inspection.
- Suspension Links: inward three-quarter angle to show mechanical joints.
- Hub Mount Interface: illustrative mechanical interface, no assumed shaft engagement.

Camera distance is derived from the transformed bounding sphere plus the vertical **and horizontal** perspective field of view. This protects narrow mobile canvases from cropping parts. World-space look target and camera position are smoothly eased with refresh-independent damping while the user is paused. Reduced-motion preference snaps to the intended frame without forced camera movement.

### 2. Non-destructive Focus / Return to Film

Selecting one part in the right-side inspector:
1. Pauses the cinematic playback.
2. Keeps a single semantic selected-part ID.
3. Switches to full-corner mode if the selected part is outside the first two P1.2 components.
4. Opens the 54% separated frame when necessary.
5. Moves the camera toward the real part without modifying the original model transforms.

The **RETURN TO FILM** control and the **Escape** key restore the story camera at the same timeline position. Timeline scrubbing, scene rail jumps and Play also cancel Focus. Orbit stays independent, allowing users to manipulate the current composition.

### 3. Targeted studio catchlight

`P1MacroFocusLight.tsx` adds one restrained neutral light at the real source geometry center to distinguish small hub/brake surfaces. It never casts shadows and is omitted completely in PERFORMANCE quality. It does not add fake scan lines, speed metrics, particles or continuously glowing bodywork.

### 4. Node-anchored callouts for all seven parts

`P1PartAnnotations.tsx` now supports every semantic part. In regular guided film mode, the two existing annotations appear during the wheel teardown; in Focus mode, **only the selected part's label** is shown, preventing a cluttered cinematic frame. World-space anchors are computed from actual descendant mesh bounds, so the invalid hub-interface pivot does not misplace labels.

### 5. Cinematic editorial copy

The dominant stage heading changes from a generic chapter title to the selected hardware name while Focus is active. The film-strip progress and source identity remain in place.

## Source and stability boundaries

- Original R4.5 GLBs and manifest are untouched.
- Material cloning, studio PMREM, source SHA-256 checks, P1.2 nut clearance correction and deterministic original-position restoration remain in force.
- No changes to Showroom, Championship, Homepage, API or jobs.
- All commits use `[skip ci]`. The user explicitly requested no CI wait; **no CI workflow was modified, run manually or checked in this iteration**.
- This is an implemented **interactive lookdev**, not a claim of final Anime.js-level visual acceptance.

## Visual review checkpoints (still OPEN)

At `/engineering/p1-front-left` in DEV, with locally verified R4.5 Meshopt assets:

1. Select Center Lock from 0% — the camera should settle into the actual nut without cutting the tyre/rim.
2. Select Wheel Outer — a wider camera should fit the tyre and its source-anchored label.
3. Select Brake Caliper — the mode should switch to ALL 7 PARTS, reveal the caliper and frame it from its own lens.
4. Select Hub Mount Interface — focus must use actual geometry, **not** manifest pivot `[0,0,0]`.
5. Press Escape and then select Return to Film — camera returns to the current story frame without a snap or transform reset.
6. Turn on Orbit then return to guided inspection — no competing camera controllers.
7. Repeat at 375, 768, 1440 and 1920 pixels; check annotation clipping and lens composition.
8. Repeat in PERFORMANCE and with reduced motion; no dynamic macro light or forced camera easing.
9. Compare directly with the mechanical cinematic sections of the user-provided Anime.js video before advancing to further parts.

**Status:** P1.5 code pushed; visual inspection still pending. PR #4 stays Draft. Release **HOLD**. No CI wait.
