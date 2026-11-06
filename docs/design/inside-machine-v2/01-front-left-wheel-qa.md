> **Binding visual gate (mandatory):** [Anime.js cinematic reference and review contract](./02-animejs-cinematic-acceptance.md). No component may be marked PASS on functional QA alone. A captured motion walkthrough, macro/blueprint/hero stills and a minimum 4/5 score in every visual category are required.\n\n# V2-W01 — Front-left wheel: first visual-quality proof

**Location:** `Podium-Effet-De-Sol/apps/web/src/dev/insideMachineI1`  
**Implementation branch:** `feat/engineering-inside-machine-v2`  
**Source:** user-supplied R4.5 manifest, all 7 exact semantic IDs  
**State:** DESIGN CONTRACT WRITTEN / RENDER & GEOMETRY QA NOT STARTED

## One-corner design target

Create a premium technology-teardown demonstration with clean silhouette and precisely timed wheel/nut/hub/brake reveals. Existing REV4.2 runtime and its wheel-first reassembly remain authoritative until R4.5 asset audit and browser benchmarks pass.

**Appearance:** clear body silhouette, titanium microhighlights, matte rubber, visible brake details, no decorative neon flood or invented telemetry. Review in three views: `IGNITION HERO`, `X-RAY BLUEPRINT`, `PRECISION MACRO`.

**Global cadence:** `NUT → WHEEL OUTER → HUB → BRAKE DISC → CALIPER → SUSPENSION LINKS → HUB INTERFACE`. This is a proposed visual investigation sequence, **not a verified mechanical maintenance order**.

## Seven separate implementation tickets

### V2-01-01 — Center-lock nut

- Semantic ID: `FRONT_LEFT_WHEEL.CENTER_LOCK_NUT` · GLB node: `PEDS_CENTER_LOCK_NUT`
- Lookdev: Titanium satin with controlled bevel and micro-reflection.
- Motion: Stationary axle / unlock micro-rotation only after geometric validation / axial exit +Y.
- Component acceptance: No intersection with outer wheel; snap-back exact; flag unproven shaft fitment.

- [ ] M0 — Snapshot original local/world matrix; verify name, mesh ownership, dimensions and provenance.
- [ ] M1 — Check normals, faceting, watertight edges, disconnected islands and geometric fit.
- [ ] M2 — Tune material under cool key, warm rim and blueprint lights; capture three stills.
- [ ] M3 — Confirm axis Z-up authoring→Y-up renderer, pivot anchor, no geometric collision.
- [ ] M4 — Record hero camera focus and world-space label anchor at 390px and 1440px.
- [ ] M5 — Scrub 0→25→50→75→100→75→50→25→0; zero pose matrix difference must be within tolerance.
- [ ] M6 — Measure draw calls, p95 frame time, triangle and texture budget in HIGH/BALANCED/PERFORMANCE.
- [ ] M7 — Save before/after, macro shots, playback video, transform diff and owner-review verdict.

### V2-01-02 — Wheel outer

- Semantic ID: `FRONT_LEFT_WHEEL.WHEEL_OUTER` · GLB node: `PEDS_WHEEL_OUTER`
- Lookdev: Tire rubber dark but with readable sidewall; satin wheel rim.
- Motion: Outer wheel follows same axle, no tilt and no rubber geometry distortion.
- Component acceptance: Sidewall and rim edge legible on dark and light; stays concentric.

- [ ] M0 — Snapshot original local/world matrix; verify name, mesh ownership, dimensions and provenance.
- [ ] M1 — Check normals, faceting, watertight edges, disconnected islands and geometric fit.
- [ ] M2 — Tune material under cool key, warm rim and blueprint lights; capture three stills.
- [ ] M3 — Confirm axis Z-up authoring→Y-up renderer, pivot anchor, no geometric collision.
- [ ] M4 — Record hero camera focus and world-space label anchor at 390px and 1440px.
- [ ] M5 — Scrub 0→25→50→75→100→75→50→25→0; zero pose matrix difference must be within tolerance.
- [ ] M6 — Measure draw calls, p95 frame time, triangle and texture budget in HIGH/BALANCED/PERFORMANCE.
- [ ] M7 — Save before/after, macro shots, playback video, transform diff and owner-review verdict.

### V2-01-03 — Wheel hub

- Semantic ID: `FRONT_LEFT_WHEEL.WHEEL_HUB` · GLB node: `PEDS_WHEEL_HUB`
- Lookdev: Gunmetal satin with contrasting circular bore outline.
- Motion: Expose hub after wheel separation; no fabricated gear mechanics.
- Component acceptance: Mating points explicitly unproven; no display as real shaft locking assembly.

- [ ] M0 — Snapshot original local/world matrix; verify name, mesh ownership, dimensions and provenance.
- [ ] M1 — Check normals, faceting, watertight edges, disconnected islands and geometric fit.
- [ ] M2 — Tune material under cool key, warm rim and blueprint lights; capture three stills.
- [ ] M3 — Confirm axis Z-up authoring→Y-up renderer, pivot anchor, no geometric collision.
- [ ] M4 — Record hero camera focus and world-space label anchor at 390px and 1440px.
- [ ] M5 — Scrub 0→25→50→75→100→75→50→25→0; zero pose matrix difference must be within tolerance.
- [ ] M6 — Measure draw calls, p95 frame time, triangle and texture budget in HIGH/BALANCED/PERFORMANCE.
- [ ] M7 — Save before/after, macro shots, playback video, transform diff and owner-review verdict.

### V2-01-04 — Brake disc

- Semantic ID: `FRONT_LEFT_WHEEL.BRAKE_DISC` · GLB node: `PEDS_BRAKE_DISC`
- Lookdev: Carbon-brake low sheen, etched vent geometry if actually present.
- Motion: Disc separates enough for front & side macro inspection.
- Component acceptance: No fake vent texture presented as mesh; brake/carbon material does not glow continuously.

- [ ] M0 — Snapshot original local/world matrix; verify name, mesh ownership, dimensions and provenance.
- [ ] M1 — Check normals, faceting, watertight edges, disconnected islands and geometric fit.
- [ ] M2 — Tune material under cool key, warm rim and blueprint lights; capture three stills.
- [ ] M3 — Confirm axis Z-up authoring→Y-up renderer, pivot anchor, no geometric collision.
- [ ] M4 — Record hero camera focus and world-space label anchor at 390px and 1440px.
- [ ] M5 — Scrub 0→25→50→75→100→75→50→25→0; zero pose matrix difference must be within tolerance.
- [ ] M6 — Measure draw calls, p95 frame time, triangle and texture budget in HIGH/BALANCED/PERFORMANCE.
- [ ] M7 — Save before/after, macro shots, playback video, transform diff and owner-review verdict.

### V2-01-05 — Brake caliper

- Semantic ID: `FRONT_LEFT_WHEEL.BRAKE_CALIPER` · GLB node: `PEDS_BRAKE_CALIPER`
- Lookdev: Titanium/gunmetal differentiated from darker carbon rotor.
- Motion: Clear caliper from rotor with small controlled lift.
- Component acceptance: No rotor-caliper contact or clipping at inspection frames.

- [ ] M0 — Snapshot original local/world matrix; verify name, mesh ownership, dimensions and provenance.
- [ ] M1 — Check normals, faceting, watertight edges, disconnected islands and geometric fit.
- [ ] M2 — Tune material under cool key, warm rim and blueprint lights; capture three stills.
- [ ] M3 — Confirm axis Z-up authoring→Y-up renderer, pivot anchor, no geometric collision.
- [ ] M4 — Record hero camera focus and world-space label anchor at 390px and 1440px.
- [ ] M5 — Scrub 0→25→50→75→100→75→50→25→0; zero pose matrix difference must be within tolerance.
- [ ] M6 — Measure draw calls, p95 frame time, triangle and texture budget in HIGH/BALANCED/PERFORMANCE.
- [ ] M7 — Save before/after, macro shots, playback video, transform diff and owner-review verdict.

### V2-01-06 — Suspension links

- Semantic ID: `FRONT_LEFT_WHEEL.SUSPENSION_LINKS` · GLB node: `PEDS_SUSPENSION_LINKS`
- Lookdev: Matte composite on arms, metallic joints, clean bevel normals.
- Motion: Last piece to move; local joints must not stretch.
- Component acceptance: Check both endpoint connections at assembled pose and visual continuity on scrub.

- [ ] M0 — Snapshot original local/world matrix; verify name, mesh ownership, dimensions and provenance.
- [ ] M1 — Check normals, faceting, watertight edges, disconnected islands and geometric fit.
- [ ] M2 — Tune material under cool key, warm rim and blueprint lights; capture three stills.
- [ ] M3 — Confirm axis Z-up authoring→Y-up renderer, pivot anchor, no geometric collision.
- [ ] M4 — Record hero camera focus and world-space label anchor at 390px and 1440px.
- [ ] M5 — Scrub 0→25→50→75→100→75→50→25→0; zero pose matrix difference must be within tolerance.
- [ ] M6 — Measure draw calls, p95 frame time, triangle and texture budget in HIGH/BALANCED/PERFORMANCE.
- [ ] M7 — Save before/after, macro shots, playback video, transform diff and owner-review verdict.

### V2-01-07 — Hub mounting interface

- Semantic ID: `FRONT_LEFT_WHEEL.HUB_MOUNT_INTERFACE` · GLB node: `PEDS_R43_FRONT_LEFT_WHEEL_HUB_INTERFACE_CONTROL`
- Lookdev: Satin titanium at true source-owned interface only.
- Motion: Slow reveal after links; no pretend bolt sequence if absent.
- Component acceptance: MANIFEST BLOCK: shaftHubMechanicalEngagementProven=false; do not pass until proven or labeled schematic.

- [ ] M0 — Snapshot original local/world matrix; verify name, mesh ownership, dimensions and provenance.
- [ ] M1 — Check normals, faceting, watertight edges, disconnected islands and geometric fit.
- [ ] M2 — Tune material under cool key, warm rim and blueprint lights; capture three stills.
- [ ] M3 — Confirm axis Z-up authoring→Y-up renderer, pivot anchor, no geometric collision.
- [ ] M4 — Record hero camera focus and world-space label anchor at 390px and 1440px.
- [ ] M5 — Scrub 0→25→50→75→100→75→50→25→0; zero pose matrix difference must be within tolerance.
- [ ] M6 — Measure draw calls, p95 frame time, triangle and texture budget in HIGH/BALANCED/PERFORMANCE.
- [ ] M7 — Save before/after, macro shots, playback video, transform diff and owner-review verdict.

## Cross-component geometry review

- At progress 0, all seven retain identical original transforms; no part may detach just because it is selected.
- All motion is derived from immutable baselines and correct coordinate conversion, not accumulated per-frame deltas.
- Inspect hub/shaft interface separately: R4.5 reports `shaftHubMechanicalEngagementProven=false`, so no claim of mechanically accurate locking.
- Do not repaint whole chassis to hide dark materials. Keep one livery across camera shots and compare with the original baseline.
- Mirror only after P1 owner approval; right-side offsets must invert correctly.
- If a mesh lacks appropriate depth, fallback to educational schematic rather than invented geometry.
- Label from actual object-world anchors; no HUD projected on curved surfaces as if it is a decal.
- On mobile, avoid tooltip occlusion; inspection sheet can be dismissed without losing the 3D position.

## Gate P1

- [ ] 7/7 geometry provenance verified.
- [ ] 7/7 macro still sets and 7/7 selected-focus shots captured.
- [ ] 0→1→0 matrix restoration PASS and zero clipping at specified sample frames.
- [ ] Triple graphics profiles pass; min 30 FPS target on representative lower-tier hardware measured.
- [ ] Contrast, keyboard and reduced-motion checks pass.
- [ ] No browser warnings, unhandled errors, or Showroom regressions.
- [ ] Owner signs off one-corner quality before working on W2.

**Decision:** HOLD. This document and `frontLeftWheelV2.ts` are design contracts, not a claim that all seven visual assets are already complete.
