# Podium EDS design contract

## Direction

Podium EDS uses an AERO / RACING EDITORIAL visual language: an operational race-engineering field rather than a decorative automotive poster. Obsidian and titanium surfaces carry the interface, crimson marks decisions and active state, and cool technical light is reserved for 3D depth and measurement context.

## Typography

- Display: `Barlow Condensed`, weights 600, 700 and 800. Use for hero, page and section titles. Vietnamese display copy uses a minimum line-height of 1.
- Body and UI: `Space Grotesk Variable`, weights 400–700. Body copy is 16px/1.6; long-form copy is 17–18px/1.7 and capped at 68ch. UI copy is 14px/1.45; labels never fall below 12px/1.3.
- Data: `IBM Plex Mono`, weights 500 and 600. Timings, points, ranks and measurements use lining tabular numerals.
- All three families are self-hosted from Fontsource `5.3.0`, include Vietnamese subsets and use OFL-1.1 metadata. The fallback stack must remain legible when local font files are blocked.

The only CSS font tokens are `--peds-font-display`, `--peds-font-body` and `--peds-font-mono`. Tailwind `font-sans` and `font-body` resolve to the body token; `font-display` and `font-mono` resolve to their matching tokens.

## Composition and interaction

The Homepage first viewport pairs an editorial headline with the existing original EDS-G01 renderer, not a second WebGL implementation. A local SVG remains the adaptive fallback. Motion uses Anime.js for one authored opening sequence and honors `prefers-reduced-motion`; content remains visible before animation initialization.

Navigation behaves like an instrument rail. Championship standings promote the first three classified entries into a podium field, while results remain a dense, keyboard-accessible classification document. Focus states, text spacing, bilingual layout and 200%/400% zoom must remain usable.

## Release boundary

Visual acceptance requires matched browser evidence in English and Vietnamese. Build or test success alone does not approve the redesign. Showroom model behavior and Model B source assets remain outside this typography batch.
