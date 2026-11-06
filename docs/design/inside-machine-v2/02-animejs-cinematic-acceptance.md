# Inside the Machine V2 — Cinematic Reference & Visual Acceptance Gate

**Status:** Binding visual acceptance contract. Not a claim of completed scene/render work.  
**Reference:** User-provided `animejs.mp4`, ~59.1 s, 1920 × 1080, recorded browser footage from animejs.com.  
**Target:** `/engineering` inside `DB-Ducbao113/Podium-Effet-De-Sol` DEV feature branch.  
**Owner requirement:** The result must feel as carefully authored, sharply rendered, and visually cinematic as the referenced video, not merely be a functional exploded-view viewer.

## 1. What the actual reference shows

The video is **not a Formula 1 breakdown**. It is the Anime.js website presenting a mechanical/cylindrical technical object and motion-design demos. Extract principles, do not copy its brand, full layout or circular demo art.

| Clip region (approximate) | Observable treatment | F1 adaptation |
|---|---|---|
| 0–4 s | Dark interface with strong central circular motion / progression, restrained typography | Quick stage entry and high-contrast F1 silhouette; do NOT force a long preloader |
| 4–8 s | Black-on-black mechanical parts; angled cinematic assembly with staggered separation | Select a genuine wheel/brake/suspension group and reveal material breakup through rim/key lighting |
| 8–13 s | Bright near-white CAD/line-art mechanical view with fine technical callout leaders | **Blueprint state**: mechanically identical pose and camera trajectory, pale background, crisp dark edges, 3D-anchored part labels |
| 16–32 s | Dark technical motion demos with multicolor radial tracks and controlled microanimations | Derive restrained scroll/progress indications and responsive microfeedback; DO NOT surround the F1 car with decorative neon rings |
| 36–44 s | Mechanical object reappears on a light field with component separation and modular layout | Highly readable exploded inspection / isolated module view; no clipped parts or guessed internals |
| 48–56 s | Strong dark hero composition, sharp focal object, simple copy and minimal modules | Reassembly finale, minimal headline, clear focal car; never drown the car in HUD panels |

**Critical observation:** The impact comes from **cinematography, negative space, consistent component geometry, deliberate changes in lighting/background, and controlled movement**. Polygon count or neon quantity are not substitutes.

## 2. Non-negotiable F1 visual language

- Backgrounds: `#080D15` graphite hero; `#EEF3F5` technical blueprint. Avoid undifferentiated #000 that hides the Model B chassis.
- Main accent: ignition `#FF5635`, only for active hardware labels, key status and select emphasis. Cyan `#56D4E9` exclusively for diagrams and true UI data.
- Material separation: tyre rubber ≠ ceramic/carbon brake ≠ satin machined metal ≠ carbon-composite suspension ≠ original painted bodywork.
- No arbitrary RGB chrome, indiscriminate bloom, ungrounded scanning overlays, glowing all edges, or fake physical hologram.
- Key + fill + rim lighting must provide a readable silhouette in both dark and blueprint states. No base color is allowed to be swallowed by darkness.
- Typography: bold compact engineering display for 1 dominant title; smaller sans body and monospace for verifiable part IDs/sequence. No floating clutter over the center of the 3D object.
- Model B base livery remains consistent from every angle and every chapter. Do not invent team logos or decal positions.

## 3. First cinematic pilot: FRONT_LEFT_WHEEL (MUST pass before other 58 component designs)

### Canonical shots and motion beats

| Shot | Relative range | Exact visual intent | Visual gate |
|---|---|---|---|
| A. Hero establish | 0.00–0.12 | Wide front-left three-quarter F1 hero. Silver rim light separates tire, carbon and dark chassis. | Immediately readable silhouette; no muddy center. |
| B. Mechanical lock | 0.12–0.25 | Camera advances smoothly into wheel center; center lock highlighted by geometry-grounded line. | No camera snap / impossible focal jump. |
| C. Exploded transition | 0.25–0.54 | Center lock → wheel outer → hub → rotor → caliper → links → mount staged on a **single constrained axle** where physically applicable. | Parts stay visually connected; no clipping in sampled frames. |
| D. Blueprint morph | 0.54–0.69 | Maintain exact world geometry and framing while lights/material treatment transition to pale CAD, with slim leader lines. | No black flash, no frame of missing model, no displaced label. |
| E. Precision inspection | 0.69–0.86 | Orbit slowly through controlled macro angle while a selected brake/hub interface remains legible. | Disc vents only if actual topology exists; text unobscured. |
| F. Reassembly finale | 0.86–1.00 | Reverse the normalized transforms to the immutable baseline; return to cinematic lighting. | At 100% the wheel is fully assembled; no residual offset/rotation. |

**Separate motion domains:** guided chapter progress vs user drag/inspection mode must not fight. Sliders must seek deterministically in both directions; no accumulated per-frame transforms.

**Frame accuracy:** all design cues are a suggested target choreography, not a claim that the video used these times. No exact Anime.js source-code matching is implied.

### Interaction quality

- Scrubbing manually across A→F or F→A must use the same immutable geometry and camera path.
- Wheel focus must be one click, reversible; exit from inspection returns to the stored story progress and camera.
- Copy is bilingual where the existing feature is bilingual.
- If high-quality materials or full internal geometry are unavailable, show an **explicit illustrative schematic**, not invented engine internals.
- State changes never introduce unnecessary 5–7 s unskippable intro; first usable interface should appear before model decoding finishes.

## 4. Render-driven QA: cannot pass from code inspection only

Capture evidence directly from the actual WebGL canvas at **375, 768, 1440 and 1920 px**. Save at least these matched stills:

1. Initial 0% 3/4 hero (same F1 vehicle tone as original).
2. 25% center-lock macro.
3. 50% multi-part wheel explosion.
4. 60% dark → blueprint mid-transition.
5. 70% full blueprint with readable leaders.
6. 85% precision close-up.
7. 100% fully assembled wheel with matching origin geometry.
8. 100% → 0% reverse on the same camera for exact transform comparison.

For each still, inspect the model at **100% and 200% pixel scale** for silhouette clarity, material hierarchy, jagged/soft edges, label positioning, z-fighting, interpenetration and clipping.

Record a single continuous uncut walkthrough showing all six beats and scrubbing backward. Screenshot-only handpicked frames are insufficient evidence of cinematic motion.

### Owner review scoring (0–5 in each dimension)

| Dimension | 0–1: NO GO | 4–5: reviewable quality |
|---|---|---|
| Readability / contrast | Tire, caliper, rotor merge into one dark mass | Each is distinct without decorative glow |
| Materials | Plastic-looking uniform grey | Plausible roughness/material identity at macro distance |
| Camera choreography | Unexplained orbit jump or camera fight | Single coherent, slow, deliberate visual narrative |
| Exploded movement | Arbitrary flying objects / clipping | Measured axial spacing and credible mounting relation |
| Blueprint | Wireframe noise, texture leakage, unreadable labels | Clean CAD edges + restrained typographic leaders |
| Final composition | HUD overwhelms the car | Car/mechanics remain the primary focal point |
| Performance / input | 3D breaks scrolling on weak devices | Stable interaction, available fallback, no stalls |

**Acceptance rule:** None of the first six visual dimensions may score below **4/5**. Performance and accessibility remain independent hard gates. A functionally correct but visually mediocre scene must be rejected.

### Engineering release gates

- Preserve all existing REV4.2 75-transform behavior, wheel-first reverse logic, source attribution and quality lock.
- Validate semantic IDs and source authority before replacing REV4.2 binaries with R4.5. R4.5 unproven shaft/hub engagement must remain labeled.
- Exact 0→1→0 matrix roundtrip under deterministic timeline, no duplicate meshes/ghost fragments on final frames.
- Check mobile text overlap, pointer behavior, reduced-motion alternatives, keyboard and WebGL fallback.
- Profile-specific FPS / GPU memory / draw-call measurement on real hardware; desktop target ~60 FPS and low-spec target ~30 FPS are targets requiring measurement, **not reported results**.
- Lint, typecheck, tests, asset/secret scan, production isolation, build and owner visual review.

## 5. Work order with no visual shortcuts

**P1.0** Draw a matched storyboard using captures from the user video and source-accurate vehicle diagrams; define camera anchors and light/material reference stills.  
**P1.1** Produce a single front-left wheel hero frame with actual Model B/R4.5 geometry; reject until edges/materials look premium.  
**P1.2** Implement center-lock and wheel extraction, capture four samples; only then add hub/brake/caliper/links.  
**P1.3** Implement matching CAD/blueprint treatment from the *same mesh*, avoid sudden object replacements.  
**P1.4** Animate reversible camera and lighting transitions; test manual scrub; clip + label QA.  
**P1.5** Record browser walkthrough and per-device evidence; submit to owner gate.  
**P2+** Mirror material and animation patterns to other corners only after P1 acceptance.

### Current state

This document is a **quality contract**. It does not certify that the R4.5 geometry was rerendered or that the final cinematic experience has been achieved. Existing V2 work is a scoped visual layer and component plans; real asset/material/camera lookdev and owner visual QA remain OPEN. **RELEASE HOLD**.
