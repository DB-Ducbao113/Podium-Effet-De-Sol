# Podium EDS design contract

## Direction

Podium EDS uses an AERO / RACING EDITORIAL visual language: an operational race-engineering field rather than a decorative automotive poster. Obsidian and carbon surfaces carry the interface, ignition orange marks active state, ivory carries editorial type, and racing red is reserved for filled actions and racing marks. Cool technical light remains reserved for 3D depth and measurement context.

## Brand identity lock

- Original PODIUM EDS logo is canonical.
- IGNITION mockups are layout and visual references, not brand identity replacements.
- No agent may modify or replace the official logo without explicit owner approval.

The official raster logo and its original assets (`apps/web/public/logo/logo.png` and companions) must not be redrawn, retyped, recolored, recreated, cropped, distorted or deleted. Navigation may adjust only display height, padding and container; preserve the intrinsic aspect ratio and render the artwork without upscaling.

## Homepage V8 owner override — AEROCORE (04/11/2026)

The owner explicitly approved Concept C (Hybrid AEROCORE) on `feat/homepage-racing-motion-v1`. This overrides V7's **Homepage-specific CSS/SVG-only and track imagery requirements**, not the brand/asset locks. Keep the existing V7 HTML section layout, copy, navigation and controls. The Homepage background may use **one lazy, isolated WebGL Canvas** solely for original abstract carbon geometry, aerodynamic ribbons, programmable light and scroll camera. Never render a car, track, road, Model B, EDS-G01, showroom stage or licensed media in this background. Disable the optional WebGL experience for reduced motion, constrained mobile and unsupported browsers; keep an accessible CSS fallback. Never introduce Three.js into the initial Home UI shell. Do not modify Showroom or its assets.

## Asset locks (P4–P8 and all future work)

**MODEL B — SHOWROOM ONLY (OWNER CLARIFICATION 04/11/2026).** Model B is the approved canonical 3D car, but belongs in Showroom, not on Homepage. Homepage must not import Model B's loader, GLB, livery module, Showroom WebGL Canvas, duplicate car stage or EDS-G01. The separately isolated abstract AEROCORE V8 WebGL background is not a Model B scene. Keep original Model B bytes/hash and Showroom behavior unchanged.

**EDS-G01 RETIRED.** EDS-G01 is no longer an active model. Never restore it to Showroom or Homepage, use it as a fallback, or derive artwork from it. Historical manifests and any legacy static paths are archival references; delete remaining files only after a dependency audit confirms zero active consumers.

**HOMEPAGE VIDEO REMOVED — OWNER OVERRIDE 04/11/2026.** Tokyo Drift/H3.2 and its poster are not rendered or imported by Homepage. Original archived assets remain intact. The owner's V7 correction requires a cinematic, reactive racing background behind the **entire Homepage** (Hero, Race Control, Title Fight and Explore), not a 3D environment inside a Model B panel. The original V7 implementation used CSS/SVG track perspective. The owner's subsequent V8 AEROCORE override retires that road/track imagery in favor of an isolated, lazy-loaded abstract WebGL aerodynamic world, while preserving an attractive static CSS fallback without WebGL.

**BRAND LOCK.** Never modify or replace the original PODIUM EDS logo or its companion raster assets. This extends the brand identity lock above and applies to every phase.

Violations are release blockers. The withdrawn P4 artwork was recorded with per-file bytes and SHA-256, then permanently deleted from `scratch/` with owner approval on 04/11/2026. The historical record remains in `docs/asset-manifests/p4-eds-g01-withdrawn.json`.

## Palette and tokens

The canonical palette is defined once in `apps/web/src/index.css` under `:root`; the source is `docs/IGNITION_Design_Spec.md` §1 as approved through D1.

| Token | Value | Use |
|---|---|---|
| `--peds-color-carbon` | `#0A0C10` | field and panel base; the page canvas remains the existing cinematic void |
| `--peds-color-ignition` | `#FF4A18` | active rails, underlines, progress and primary CTA; pair with carbon text |
| `--peds-color-racing-red` | `#E51B37` | filled danger and racing marks; pair with white text |
| `--peds-color-ivory` | `#F4F0E8` | primary text on dark surfaces |
| `--peds-color-signal` | `#B7FF37` | live or data state only, never decoration |

`--peds-color-accent` remains the legacy fill red in P1 while pages migrate; `--peds-color-focus` remains brake amber. Contrast floors: ivory on canvas at least 4.5:1; carbon on ignition at least 4.5:1; white on racing red at least 4.5:1. White text on ignition does not meet the floor and is not allowed.

Spacing, grid, radius, border, focus and motion tokens are `--peds-space-1…24`, `--peds-grid-gutter`, `--peds-container-content/wide/full`, `--peds-radius-sm…xl`, `--peds-border-hairline`, `--peds-focus-ring-width/offset/color`, and `--peds-motion-fast/base/slow`. Reduced motion collapses the motion durations to `--peds-motion-reduced` and keeps the same content and state changes.

## Typography

- Display: `Barlow Condensed`, weights 600, 700 and 800. Use for hero, page and section titles. Vietnamese display copy uses a minimum line-height of 1.
- UI: `Space Grotesk Variable`, weights 400–700. Navigation, controls, labels and table headers.
- Body: `Manrope Variable`, weights 400–700. Body copy is 16px/1.6; long-form copy is 17–18px/1.7 and capped at 68ch. UI copy is 14px/1.45; labels never fall below 12px/1.3.
- Data: `IBM Plex Mono`, weights 500 and 600. Timings, points, ranks and measurements use lining tabular numerals.

The only CSS font tokens are `--peds-font-display`, `--peds-font-ui`, `--peds-font-body` and `--peds-font-mono`. Tailwind `font-sans` and `font-body` resolve to the body token; `font-ui`, `font-display` and `font-mono` resolve to their matching tokens. All four families are self-hosted from Fontsource `5.3.0`, include Vietnamese subsets and use OFL-1.1 metadata. The fallback stack must remain legible when local font files are blocked.

## Composition and interaction

The Homepage first viewport is a compact (approximately 58svh bounded at 460–605px desktop) text-led Launch Control Hero with original SVG/CSS racing-energy composition, not a car showcase. A single HomeCinematicBackground is mounted at the root of HomeView, beneath **all** Homepage sections. Scroll-reactive depth and a continuous racing path run behind Race Control, Title Fight and Explore; content remains HTML with clear contrast. Navbar remains the spacious V5 grouped control bar; existing route, keyboard and language contracts remain intact. Driver-photo and circuit-map media slots stay blank. Reduced motion disables movement, and hiding the tab pauses loops.

Shared primitives consume the tokens above: `Button` (primary, outline, secondary, ghost, danger), `Tabs` (tab and chip), `Card` (panel rule), `SectionHeading` (display heading and eyebrow), the table header/row rule, and the global focus ring. Pages must not introduce parallel colour or type scales.

Navigation behaves like an instrument rail. Championship standings promote the first three classified entries into a podium field, while results remain a dense, keyboard-accessible classification document. Focus states, text spacing, bilingual layout and 200%/400% zoom must remain usable.

### Homepage V7 full-page cinematic review contract

- The background is **one root-level atmosphere shared by all sections**, not an isolated Hero component. It must have visible visual continuity behind Race Control, Title Fight and Explore.
- Hero focuses on kinetic F1 racing identity: original start lights, corner/aero lines and animated trajectory. Model B/EDS-G01 are not imported to Homepage, and no Showroom 3D stage is duplicated.
- Use CSS perspective and SVG paths only; no second WebGL renderer, video, model fetch, heavy reflection pass or unlicensed background photograph. Mouse parallax and scroll depth are capped; moving layers must ignore pointer events.
- Reduced motion must render the full visual without movement; video-free Hero works on WebGL-disabled devices; screen-reader navigation remains unchanged.
- Keep verified data and real page routes unchanged. Empty driver portraits and circuit-map frames stay for a later asset pass.
- QA: verify the entire page on mobile and desktop, 200%/400% zoom, readable content overlays, scroll from Hero to Explore, tab-hide pause, menu interactions and WebGL-disabled behavior. CI alone never implies visual acceptance.

## Release boundary

Visual acceptance requires matched browser evidence in English and Vietnamese. Build or test success alone does not approve the redesign. Showroom model behavior and Model B source assets remain outside this typography batch.
