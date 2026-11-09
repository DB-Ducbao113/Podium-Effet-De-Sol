# PODIUM design system baseline — review draft

Status: **audit framework, not an approved visual direction**. Source: `rebuild` at `b79dbbbe`, with local changes. This document records the current system and the checks needed before adopting site-wide rules. It does not approve a global restyle.

## Current foundations

| Role                  | Current source                                                                                                                       | Review rule                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Brand and surfaces    | `DESIGN.md`; `apps/web/src/index.css` (`--peds-color-*`)                                                                             | Keep the canonical logo, dark and light reading surfaces, and truthful unofficial branding. Check contrast on the rendered surface. |
| Type                  | `--peds-font-display` Barlow Condensed; `--peds-font-ui` Space Grotesk; `--peds-font-body` Manrope; `--peds-font-mono` IBM Plex Mono | Display for titles, UI for controls, body for prose, mono for data. Measure the _rendered_ size after density and visual zoom.      |
| Space, radius, motion | `--peds-space-*`, `--peds-radius-*`, `--peds-motion-*` in `index.css`                                                                | Use role-based spacing and states; verify narrow layouts, keyboard focus and reduced motion.                                        |
| Shared pieces         | `components/ui/{Button,SectionHeading,Tooltip}` and feature CSS                                                                      | Compare feature controls to shared components before adding another local variant. Preserve route-specific needs.                   |
| Responsive            | `styles/densityV2.css`, `styles/visualZoom.css`, feature CSS                                                                         | Check 320, 390, 768, 860, 861, 1024, 1440 and 1920 px, plus 200% and 400% text zoom.                                                |

## Findings from this pass

| Priority          | Evidence                                                                                                                                                                                                                           | Effect                                                                                                                                                                                   | Next owner / microtask                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| P2, fixed locally | Calendar header had 0 px measured gap between `h2` and progress text at 390 and 1440 px; `.results-simple-head h2` used `line-height: 1` and the paragraph had no margin. Simulated 400% root text size also overflowed at 390 px. | The lines collided and large text pushed the controls beyond the header.                                                                                                                 | `championshipC1.css`, F11.09. Recheck both languages and breakpoints.                                     |
| P2, open          | `styles/densityV2.css` reduces desktop root type to 75%; `styles/visualZoom.css` applies a further 0.75 visual zoom.                                                                                                               | Small control labels and metadata can become hard to read even when their source size uses `rem`. Calendar header now has a scoped legibility floor; other routes need a measured audit. | F00.05, F07.03–F07.04, F15 typography QA. Do not change the global scale during a Calendar fix.           |
| P2, open          | Calendar and footer styles contain local literal colors and font sizes alongside root tokens and shared UI components.                                                                                                             | Similar roles can drift across routes.                                                                                                                                                   | F07.01–F07.03: map existing literals to semantic roles after visual comparison; do not bulk-replace them. |
| P3, open          | `SectionHeading` has shared type and action rules; Calendar uses `.results-simple-head` with its own hierarchy.                                                                                                                    | Page headings need an explicit rule for when the shared component or a feature variant applies.                                                                                          | F07 component inventory and F11.01.                                                                       |

## Evaluation contract for each route

1. Record route, environment (DEV/production), language, viewport, text zoom, screenshot and actual computed font sizes.
2. Check order: page title → status/context → primary task → secondary controls → source/attribution. No heading or status text may collide or depend on color alone.
3. Check control labels and states at their rendered size; keyboard focus, disabled state, reduced motion and touch targets must remain usable.
4. Compare surface, text, line, accent and focus colors to the semantic tokens, then measure contrast. A literal is acceptable only when it has a documented feature role.
5. Run a route-specific before/after browser check. Record overflow and layout at 860/861 px, plus the production variant when DEV differs.

## Scorecard for the next review pass

Score each dimension `0 = broken`, `1 = inconsistent`, `2 = meets the rule`, or `NV = not verified`. Record a screenshot and concrete computed value for every score; do not turn untested routes into a site-wide average.

| Dimension               | Pass condition                                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Hierarchy and type      | Title, supporting status and controls have distinct roles; supporting text remains readable after actual visual scaling and EN/VI wrapping. |
| Spacing and composition | Related items group together, unrelated groups separate, and no element overlaps or overflows from 320 to 1920 px.                          |
| Color and semantics     | Text/focus contrast is measured; status is not expressed by color alone; colors have stable roles across routes.                            |
| Controls                | Click and keyboard targets, focus, disabled/error states and return paths are clear at desktop and touch widths.                            |
| Motion and media        | Reduced motion keeps content usable; 3D/media loading and failure states have a meaningful fallback.                                        |
| Truth and provenance    | F1 data labels, visuals, attribution and DEV-only content match their verified source and release status.                                   |

| Route group                                                                       | Design review status                                                             |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Calendar header, `/season/2026?tab=calendar`                                      | Scoped layout fix inspected in Edge; full Calendar page score pending.           |
| Home, Results, Standings, Showroom, Engineering, Teams, Drivers, Cars, About, 404 | `NV`; inspect each route and production/DEV difference before a site-wide score. |

## Coverage status

This pass inspected the Calendar heading in Edge at 320, 390, 768, 860, 861 and 1440 px. Source inventory covered the global tokens and shared UI components. Simulated 200% and 400% root text sizes at 390 and 1440 px no longer overflow the Calendar header; actual browser zoom was not tested. The other routes, actual browser zoom, iOS Safari and production build visuals are **NOT VERIFIED** for this design audit. Site-wide scores and a replacement art direction are intentionally pending that evidence and owner review.
