# Homepage V9 — Creative & Interaction Audit

**Status:** code review only; visual approval remains pending. Reviewed components: HomeView, PodiumBrandHero, F1HeroStage, HomeJourneyMotion, HomeRaceControl, HomeSeasonOverview, HomeStoryLinks and density CSS.

## Immediate correction

The global compact pass previously compressed the F1 stage to 260–322px desktop and 335–435px Hero. A special exception now protects the Hero visual. Real F1 WebP is required in the preview worktree; GitHub currently has only the SVG fallback.

## Problems to solve, ordered

1. **Hero:** The vehicle has a flat 2.5D silhouette. Pointer tilts, moving SVG lines and lighting are present, but the effect does not explain where airflow moves around the car. Make the approved car the hero, tie flow vectors to identifiable surfaces, and remove excess reticle text. Keep full-image containment.
2. **Race Control:** The next race and result data are real, but the decorative SVG curve is not a circuit map. Replace it with grounded local track geometry, when available, or label it honestly as decorative signal imagery.
3. **Title Fight:** Driver picture and constructor mark slots are empty spans. Fill with approved real assets or legible initials/logos. Use team colors and true points to create an actual visual rivalry, rather than two similar list panels.
4. **Explore:** Four identical link tiles lack visual hierarchy. Lead with Showroom and Inside the Machine as two distinct cinematic portals; provide Drivers/Teams as smaller editorial links.
5. **Story:** Both the Hero chapter navigation and the fixed Journey rail express progress. Consolidate them. Change one coherent airflow motif between scenes instead of keeping multiple unrelated moving lines.
6. **Footer:** Keep the legal links and official brand but make the ending feel conclusive, not a second Hero.

## Proposed interaction language — THE UNSEEN FORCE

The unique design signature should be **ground effect**, not decorative sci-fi widgets.

- Scene 1: F1 entry, smooth bounded cursor response, paint highlights constrained by real transparency, no fake 3D orbit promise.
- Scene 2: Same strand becomes a true circuit outline alongside validated race schedule.
- Scene 3: Visual energy becomes points comparison, team color and approved driver imagery.
- Scene 4: Lightweight technical layer splits into front wing, floor and diffuser diagrams; each reveals a real concept then links to engineering.
- Scene 5: Asymmetric destination cards for Showroom and Engineering, with supporting Drivers/Teams links.

Motion should react to the reader, show visible cause/effect, pause offscreen, and provide reduced-motion and low-power alternatives. Use the existing Anime.js capabilities and CSS/SVG where possible, without adding another persistent 3D renderer or altering Showroom Model B.

## QA gates

- Verify approved `peds-aero01-car.webp` is actually loaded, not silent SVG fallback.
- Compare visual captures at 360, 390, 768, 1024, 1440 and 1920px.
- Confirm car not clipped at any width, no overlap, CTA links remain clickable, keyboard navigation and zoom reflow intact.
- Test pointer, scroll, reduced-motion, data-saver and weak GPU.
- Run lint, typecheck, tests, build and assets/security checks.
- No merge or production deploy before visual acceptance.

This is not a screenshot audit. It describes code-supported limitations and a proposed redesign direction.
