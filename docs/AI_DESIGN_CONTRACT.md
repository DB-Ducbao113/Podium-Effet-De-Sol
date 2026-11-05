# PEDS | DESIGN AND PRODUCT CONTRACT FOR AI

**Status: AS-IS snapshot; NOT a newly approved design system.** The authoritative high-level position is `DESIGN.md`: prior creative roadmaps retired; replacement art direction requires an explicit owner decision. This document separates (A) enduring approved constraints, (B) observed current UI implementation, (C) open design decisions.

## A. Non-negotiable product identity

- Brand: **PODIUM — Effet de Sol**, independent F1-oriented editorial/engineering/interactive site, unofficial/non-endorsed.
- Canonical project logo: owner-supplied `public/logo/logo.png` and its variants. Preserve aspect ratio, provenance, and official/independent distinction.
- **Production showroom car = Model B**, with its real attribution recorded. Do **not** label it proprietary EDS-G01 or repurpose as Home's self-built model.
- Owner's **EDS-G01** model is withdrawn from active experience. Specifically revoked: generating/restoring visual derivatives of EDS-G01 without owner approval. Historical docs may reference it; do not interpret such references as permission to ship it.
- F1 race results, classification, car specifications and editorial technical facts must not be fabricated or portrayed as first-party FIA/F1 metrics when unverified.
- Accessibility essentials: readable type, focus indication, semantic controls, keyboard navigation, reduced-motion behavior and meaningful fallback when WebGL fails.

## B. Current interface anatomy (source observed, not locked final design)

| Surface | Current composition | Read / edit owner |
|---|---|---|
| Global shell | header/navbar, page transition, scroll strip, footer, route SEO, custom 404 | `App.tsx`, `components/layout/*`, `components/common/F1PageTransition.tsx`, `components/seo/RouteSeo.tsx` |
| Home | cinematic brand hero, next-race/race-control, season overview, discovery/engineering story links | `components/home/HomeView.tsx`, `PodiumBrandHero.tsx` and scoped home CSS |
| Championship | dark editorial data experience: season controls, standings, calendar, results and classifications | `ChampionshipView.tsx`, `ChampionshipStandings.tsx`, `ChampionshipCalendar.tsx`, `RaceResults.tsx` |
| Showroom | Model B 3D stage, livery/hotspots, camera/graphics controls | `ShowroomView.tsx`, `ModelBShowroom.tsx`, `dev/commercial-b/*` |
| Teams/Drivers | season-aware editorial directories and profiles with P5 visual utilities | `StandaloneProfileDirectory.tsx`, `TeamDetailPage.tsx`, `DriverDetailPage.tsx`, `components/p5/*` |
| Engineering | article index / technical anatomy; DEV-only Inside the Machine trial | `components/engineering/*` and `dev/insideMachineI1/*` |
| About | project positioning, architecture/editorial attribution | `components/pages/AboutPage.tsx` |
| Mobile primary routes | <=860px Home/Season/Showroom may render as single multi-section hub | `hooks/useMobileHub.ts`, `components/mobile/MobileAllInOne.tsx` |

### Current styling implementation facts

- CSS variable palette is in `apps/web/src/index.css` and Tailwind aliases in `apps/web/tailwind.config.js`; elements combine dark carbon/ivory/orange/red/amber cues and some lighter studio surfaces.
- Some classes still carry labels such as IGNITION, V7/V8/V9, H1/P4/P5. **Those are historical code names, not active creative approval.** Do not rebrand/rebuild the site based on a retired label.
- Typography: Barlow Condensed (display), Space Grotesk (UI), Manrope (body), IBM Plex Mono (numbers/technical accents) via self-hosted Fontsource. Custom font-fallback metrics exist to reduce CLS.
- Styling is mixed: Tailwind utilities + component CSS (e.g. `homepageH1.css`, `championshipF4.css`, `p5.css`, `navbarV4.css`) + global tokens. Prefer component-scoped fixes, avoid global selectors when not needed.
- Effects include animejs, CSS transitions and R3F/Three.js; check reduced motion, WebGL fallback and mobile resource use before making animation changes.
- Navigation supports EN/VI; text is partly centralized in `i18n/translations.ts` and partly local in components. Do not change one language only unless explicitly requested.

## C. Visual acceptance and editing discipline

For **existing screen fixes**, compare against the current UI and specific task acceptance criteria; do **not** invent a replacement homepage or new design tokens.
Before any visual edit, inspect route in `App.tsx` and component hierarchy. Search existing classes/variables; propose exact modified selectors + affected viewports.
- Keep visual hierarchy, readable contrast, responsive reflow, 200–400% text zoom where relevant, semantic heading order, accessible focus/interactive targets.
- Desktop at 1440/1920, tablet 768/1024, mobile 360/390; test breakpoint **860/861** because primary route composition changes there.
- Don't fix an individual spacing problem by changing global `:root` typography/scales unless explicitly approved.
- No placeholder “official team sponsor” logos, track photos, technical measurement labels or stock-render swaps without licensing/provenance.
- For 3D, verify mouse/touch/keyboard controls, loading, context loss, FPS profile, graphics preference persistence and static fallback.
- For Home film, **do not re-encode or replace protected MP4/poster** without owner approval.

## D. New design direction: pending decisions (DO NOT AUTOFILL)

No new visual design brief has been approved yet. Agent should preserve current functionality until a user task explicitly authorizes a design change. New design work needs:
1. Target page(s) and user journeys.
2. Reference / intended visual language and brand constraints.
3. Desktop and mobile layout plan with content hierarchy.
4. Components reused vs replaced, and whether global tokens change.
5. Exact asset/source provenance and protected-asset review.
6. Interaction/motion performance targets and accessibility.
7. Screenshots or verified browser QA, comparison with approved reference.
8. Owner approval before a wholesale visual migration.

Any approved design decision must be written to `DESIGN.md` before it is treated as canonical across routes. A prompt about “make this button sharper” does not approve changing the whole creative direction.

## E. Not design requirements

- The names “IGNITION”, “P4”, “P5”, “V9”, “AERO-01” appearing in legacy classes are not proof of future features or marketing copy.
- The development Showroom P6 review and local Inside the Machine assets are not evidence that those variants ship in production.
- A browser screenshot of an older version does not prove the current `rebuild` production UI.
