# Podium EDS design contract

## Direction

Podium EDS uses an AERO / RACING EDITORIAL visual language: an operational race-engineering field rather than a decorative automotive poster. Obsidian and carbon surfaces carry the interface, ignition orange marks active state, ivory carries editorial type, and racing red is reserved for filled actions and racing marks. Cool technical light remains reserved for 3D depth and measurement context.

## Brand identity lock

- Original PODIUM EDS logo is canonical.
- IGNITION mockups are layout and visual references, not brand identity replacements.
- No agent may modify or replace the official logo without explicit owner approval.

The official raster logo and its original assets (`apps/web/public/logo/logo.png` and companions) must not be redrawn, retyped, recolored, recreated, cropped, distorted or deleted. Navigation may adjust only display height, padding and container; preserve the intrinsic aspect ratio and render the artwork without upscaling.

## Asset locks (P4–P8 and all future work)

**MODEL B — OWNER SELECTED.** On 04/11/2026 the owner selected the attributed, rights-cleared Model B as the canonical car. The Homepage V5 may reuse the **exact verified Model B GLB** through `loadModelB` (the same loader as Showroom). Do not substitute, rewrite, re-export, retime or derive new cinematic assets from Model B unless separately approved. Homepage rendering may use lower DPR and camera presets, but must preserve geometry/material identity.

**EDS-G01 RETIRED.** EDS-G01 is no longer an active model. Never restore it to Showroom or Homepage, use it as a fallback, or derive artwork from it. Historical manifests and any legacy static paths are archival references; delete remaining files only after a dependency audit confirms zero active consumers.

**HOMEPAGE VIDEO REMOVED — OWNER OVERRIDE 04/11/2026.** The owner explicitly removed Tokyo Drift/H3.2 from Homepage render/import/playback. Existing archived video and poster bytes remain untouched. The Homepage V5 hero is an interactive Model B 3D viewport, lazy-loaded on desktop and available on demand on mobile, with AERO/CHASSIS/POWER camera views. These are conceptual camera angles, not independent exploded assemblies or measured physical data. Reduced motion and WebGL error fallbacks are mandatory.

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

The Homepage first viewport is a compact (desktop approximately 61svh with 490–650px bounds) interactive Launch Control scene in `PodiumBrandHero` plus `HomeHudScene` and a lazy `HomeModelBStage`, with no drift video or raster hero background. Model B uses demand rendering, bounded DPR and approximate camera views. The floating Navbar groups the six original destinations into four spaced desktop categories (Overview / Championship / The Grid / Engineering) with all routes available in dropdowns and mobile navigation; brand, keyboard, language and mobile hub contracts remain intact. Below it, Race Control and Title Fight provide only essential real-data previews; circuit map and driver portrait media slots remain intentionally blank until the owner approves visual assets. Deep data and image galleries belong to linked destination pages. Motion honors `prefers-reduced-motion`; content remains visible before animation initialization.

Shared primitives consume the tokens above: `Button` (primary, outline, secondary, ghost, danger), `Tabs` (tab and chip), `Card` (panel rule), `SectionHeading` (display heading and eyebrow), the table header/row rule, and the global focus ring. Pages must not introduce parallel colour or type scales.

Navigation behaves like an instrument rail. Championship standings promote the first three classified entries into a podium field, while results remain a dense, keyboard-accessible classification document. Focus states, text spacing, bilingual layout and 200%/400% zoom must remain usable.

## Release boundary

Visual acceptance requires matched browser evidence in English and Vietnamese. Build or test success alone does not approve the redesign. Showroom model behavior and Model B source assets remain outside this typography batch.
