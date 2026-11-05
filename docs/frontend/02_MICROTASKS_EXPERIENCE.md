# PEDS — FRONTEND MICRO-TASK PLAN (EXPERIENCE)

**Planning only.** Complete foundations F00–F06 before global motion, 3D or full page redesign; exceptions require documented dependency justification and explicit user task. No licensed media/model replacement, F1-data rewrite or preview release is authorized.

## F07 — DESIGN TOKENS, TYPOGRAPHY AND REUSABLE COMPONENTS

**Dependency:** F00 + F01–F06 baseline; require visual direction approval before major restyle.

**Source to inspect:** index.css, tailwind.config.js, main.tsx, components/ui/*, typographyContract.test.ts, DesignSystem.test.tsx.

**Typical patch scope:** UI primitives/styles only with approved token migration; never global rewrite for one component.

**Phase exit test:** Reusable state gallery, typography/contrast/zoom QA, no visual regressions.

| ID | Small, independently verifiable work item | Acceptance / DoD |
|---|---|---|
| F07.01 | Define racing-inspired color roles proposal | Canvas/surface/text/accent/status tokens have purpose, not decoration |
| F07.02 | Inventory and resolve conflicting legacy token roles | Mapping exists; do not delete live aliases before consumer migration |
| F07.03 | Define type scale and font usage | Barlow display, Space Grotesk UI, Manrope body, IBM Mono metrics mapped to contexts |
| F07.04 | Define responsive type ramps | Headlines scale without overflow or Vietnamese clipping |
| F07.05 | Define spacing, border and elevation roles | 4/8-point spacing logic and semantic radius/shadow scale |
| F07.06 | Define iconography style rules | Lucide sizing/weight and text labels standardized |
| F07.07 | Define interaction states palette | Hover/focus/active/disabled/loading/error distinct and accessible |
| F07.08 | Define Button sizes/variants | One shared primitive where appropriate; state tests cover variants |
| F07.09 | Define Card variants for editorial/data/3D | Consistent padding and interaction affordance without deep nesting |
| F07.10 | Define Modal/Dialog rules | Focus trap, escape, backdrop semantics and mobile scroll handling |
| F07.11 | Define Dropdown/Select rules | Keyboard and touch behavior tested |
| F07.12 | Define Tabs segmented/data navigation rules | aria roles, selected state and query synchronization |
| F07.13 | Define Table/DataRow density rules | Monospaced numeric alignment and horizontal compact behavior |
| F07.14 | Define Tooltip and overlay content constraints | No essential information available only on hover |
| F07.15 | Define form fields, filter chips and toggles | Labels/errors/selected/disabled consistent |
| F07.16 | Publish component showcase and tests | Variants have side-by-side QA evidence before widespread migration |

**Phase review:** run targeted + full applicable gates; attach screenshot/test evidence; do not mark complete for a merely pre-existing component. Unresolved blocking gate = HOLD.

## F08 — MOTION LANGUAGE AND TRANSITION ORCHESTRATION

**Dependency:** F04 + F06 + F07.

**Source to inspect:** F1PageTransition.tsx, PodiumBrandHero.tsx, hooks/useReducedMotion.ts, useMotionGate.ts, animejs effects.

**Typical patch scope:** Motion utilities and scoped CSS; no mass animation across all sections.

**Phase exit test:** State transition tests and motion QA in keyboard/reduce/slow devices.

| ID | Small, independently verifiable work item | Acceptance / DoD |
|---|---|---|
| F08.01 | Define 3 motion intensity levels | Essential state, supporting interaction and cinematic scenes separate |
| F08.02 | Define short durations/easing proposal | Transitions consistent and skippable, no forced wait |
| F08.03 | Define global motion preference contract | prefers-reduced-motion respected by JS/CSS/3D |
| F08.04 | Define hover microinteraction standard | Hover never only way to discover action |
| F08.05 | Define click/tap pressed feedback | No accidental double-action due to animation |
| F08.06 | Define scroll reveal trigger rules | Once/repeat policy and visibility thresholds specified |
| F08.07 | Define reveal fallback without IntersectionObserver | Content never stays opacity 0 permanently |
| F08.08 | Define route transition fallback | Stable route change when experimental APIs unavailable |
| F08.09 | Evaluate View Transitions API as optional enhancement | Feature detection and focus/history checks, not mandatory dependency |
| F08.10 | Implement focus restoration after navigation | Page title/main context announced or focus placed appropriately |
| F08.11 | Define layered cinematic transition restraint | No simultaneous navbar wipe + page wipe + scroll entrance overload |
| F08.12 | Define numeric data animation constraints | Numbers truthful, stable and not repeatedly reset |
| F08.13 | Define graphics/settings modal transition | GPU work does not start during hidden animation |
| F08.14 | Run CPU-throttled motion QA | Animation degradation preserves controls and content |
| F08.15 | Run reduced-motion and rapid-navigation regression | No ghost overlays, trapped focus or stale transitions |

**Phase review:** run targeted + full applicable gates; attach screenshot/test evidence; do not mark complete for a merely pre-existing component. Unresolved blocking gate = HOLD.

## F09 — 3D PLATFORM, ASSET PIPELINE AND ADAPTIVE GRAPHICS

**Dependency:** F04–F08; licensed Model B boundary.

**Source to inspect:** ModelBShowroom.tsx, dev/commercial-b/*, dev/insideMachineI1/*, public/models/README.md, docs/asset-licenses.md.

**Typical patch scope:** Runtime and scoped scenes only; locked model bytes and source assets RED.

**Phase exit test:** Visual controls, context loss, memory and FPS on real devices; no asset hash change.

| ID | Small, independently verifiable work item | Acceptance / DoD |
|---|---|---|
| F09.01 | Inventory existing 3D scene responsibilities | Home/Showroom/Engineering scenes and production imports identified |
| F09.02 | Define 3D content role per page | Showroom interactive, Home decorative/lazy, Engineering explanatory |
| F09.03 | Define immutable model/brand provenance policy | Model B license/identity check and excluded EDS-G01 material documented |
| F09.04 | Define progressive enhancement tiers | Static poster, reduced motion, performance and full interactive tiers |
| F09.05 | Define WebGL availability detection behavior | Fallback displayed immediately without crash |
| F09.06 | Define lazy scene entry boundaries | First route paint doesn't eagerly mount hidden scenes |
| F09.07 | Define model loader readiness states | Fetching/decoding/ready/failure distinct |
| F09.08 | Define 3D loading placeholder geometry | Canvas region reserves dimensions without CLS |
| F09.09 | Define camera preset language | Front/side/top/cockpit/etc names and expected framing |
| F09.10 | Define pointer/touch orbit behavior | Drag/pinch does not block page scroll unexpectedly |
| F09.11 | Define keyboard controls or alternative actions | 3D key interactions usable or equivalent controls provided |
| F09.12 | Define hotspot behavior and occlusion rules | Labels/modal do not overlap or become inaccessible |
| F09.13 | Define lighting/material quality tiers | Readable car geometry in each preset without expensive excess |
| F09.14 | Define adaptive quality budget and triggers | DPR/shadows/effects respond to measured frame time |
| F09.15 | Define resource cleanup and context loss lifecycle | No accumulating WebGL contexts or orphaned geometries |
| F09.16 | Define fallback image and attribution location | Attribution and static fallback always accessible |
| F09.17 | Measure draw calls, memory, frame time and load time | Before/after metrics recorded; no invented FPS claims |
| F09.18 | Test 3D route switching, recovery and responsive | Home→Showroom→Engineering repeated navigation stable |

**Phase review:** run targeted + full applicable gates; attach screenshot/test evidence; do not mark complete for a merely pre-existing component. Unresolved blocking gate = HOLD.

## F10 — HOME PAGE STORYBOARD AND VERTICAL SLICES

**Dependency:** F07–F09 foundation; per-section design approval.

**Source to inspect:** HomeView.tsx, PodiumBrandHero.tsx, HomeRaceControl.tsx, HomeSeasonOverview.tsx, HomeStoryLinks.tsx, scoped CSS.

**Typical patch scope:** components/home/* and impacted tests; no protected hero film/model replacements.

**Phase exit test:** Home content + intro + CTAs at phone/desktop, source correctness, motion budget.

| ID | Small, independently verifiable work item | Acceptance / DoD |
|---|---|---|
| F10.01 | Agree Home section hierarchy and story goal | Prioritized first viewport and CTA map approved |
| F10.02 | Define hero content and cinematic frame | Original logo/film asset rights respected |
| F10.03 | Define hero responsive crop/text safety | No title clipping at 320/390/1440 |
| F10.04 | Define hero entrance timing after preloader | Animation does not replay or block controls unexpectedly |
| F10.05 | Define primary CTA behavior | Explore season and Showroom links route correctly |
| F10.06 | Define live/next race card content hierarchy | Actual season data source and date labels visible |
| F10.07 | Define next-race loading/stale/offline variants | No fabricated live timing; fallback explicit |
| F10.08 | Define season overview tile layout | Points/rank/time readable in responsive grid |
| F10.09 | Define editorial discover cards | Engineering/Teams/Drivers navigation clear |
| F10.10 | Define Home-specific scroll choreo | Section reveals prioritize comprehension over constant motion |
| F10.11 | Define mobile Home hub section entry | Anchors and lazy content maintain scroll placement |
| F10.12 | Run complete Home browser and source accuracy QA | Visual, console, reduced-motion and valid navigation verified |

**Phase review:** run targeted + full applicable gates; attach screenshot/test evidence; do not mark complete for a merely pre-existing component. Unresolved blocking gate = HOLD.

## F11 — CHAMPIONSHIP DATA UX: RESULTS, CALENDAR, STANDINGS

**Dependency:** F05–F08 + verified data contracts.

**Source to inspect:** ChampionshipView.tsx, RaceResults.tsx, WeekendResults.tsx, ChampionshipCalendar.tsx, ChampionshipStandings.tsx, resultSelection.ts, stores/services/tests.

**Typical patch scope:** Feature views/CSS; no standings baseline or write-capable sync changes without explicit source approval.

**Phase exit test:** Cross-year and edge-case results, mobile tables, timezone, source freshness.

| ID | Small, independently verifiable work item | Acceptance / DoD |
|---|---|---|
| F11.01 | Define Championship page summary and visual hierarchy | Season selection and tab navigation discoverable |
| F11.02 | Define season switcher behavior | 2024/2025/2026 and current query preserved intentionally |
| F11.03 | Define Results tab hierarchy | Race, Qualifying, Practice, Sprint sessions distinguished |
| F11.04 | Define unavailable-session presentation | No phantom tabs for empty results |
| F11.05 | Define race-card interactions and modal deep link | Direct and in-app navigation converge on same classification |
| F11.06 | Define results table density/numeric alignment | Positions, gaps and penalties readable without fabricated units |
| F11.07 | Define DNF/DNS/DSQ visual semantics | Non-ranked drivers preserved and properly labeled |
| F11.08 | Define provisional vs verified result badges/copy | Provenance/staleness truthful |
| F11.09 | Define Calendar cards and month navigation | Timezone/date behavior correct across locales |
| F11.10 | Define circuit map/globe fallback | 2D fallback when WebGL unsupported |
| F11.11 | Define standings drivers and constructors table | Sorting, ranks and points visible on narrow viewports |
| F11.12 | Define status/error/empty overlays for session fetch | Partial API failures preserve available data |
| F11.13 | Define Championship side controls by route | Desktop rail optional, mobile tab/filter drawer no duplicated nav |
| F11.14 | Define accessible table fallback for small screens | No critical columns disappear silently |
| F11.15 | Run race/standings regression tests | No double-count of Sprint, no baseline cutoff regressions |
| F11.16 | Run 2024–2026 route and tab QA | All years, query variants, 860 breakpoint and deep links verified |

**Phase review:** run targeted + full applicable gates; attach screenshot/test evidence; do not mark complete for a merely pre-existing component. Unresolved blocking gate = HOLD.

## F12 — SHOWROOM 3D EXPERIENCE

**Dependency:** F09 + F07–F08.

**Source to inspect:** ShowroomView.tsx, ModelBShowroom.tsx, CameraController.tsx, CompactShowroomLayout.tsx, dev/P6ReviewShowroom.tsx.

**Typical patch scope:** Scoped showroom interactions and styles; locked GLB immutable.

**Phase exit test:** DEV review vs production model behavior, controls, attribution, fallback, frame-time.

| ID | Small, independently verifiable work item | Acceptance / DoD |
|---|---|---|
| F12.01 | Define production vs DEV Showroom comparison | Explicit which variant is being designed; no accidental promotion |
| F12.02 | Define viewport composition for car and controls | Car frame visible while choosing camera/livery |
| F12.03 | Define camera preset selection interaction | Preset moves camera without nausea or state loss |
| F12.04 | Define orbit constraints and reset action | Camera returns to defined home position |
| F12.05 | Define livery preview/selection state | Selection persists as intended and correct model material updates |
| F12.06 | Define hotspot discovery and technical info | Keyboard/touch accessible hotspots and explanatory content |
| F12.07 | Define graphics mode control | AUTO/HIGH/BALANCED/PERFORMANCE understandable |
| F12.08 | Define initial 3D poster/fallback | No persistent empty canvas while model unavailable |
| F12.09 | Define context-lost and GPU-disabled recovery | Fallback or retry works, no browser crash |
| F12.10 | Define attribution and asset provenance UI | License/credit visible without misrepresenting original model |
| F12.11 | Test desktop/mobile 3D interaction and memory | Repeated enter/exit, resize and reduced motion safe |
| F12.12 | Test final production build vs DEV review | Production Showroom uses Model B, never preview-only P6 by mistake |

**Phase review:** run targeted + full applicable gates; attach screenshot/test evidence; do not mark complete for a merely pre-existing component. Unresolved blocking gate = HOLD.

## F13 — ENGINEERING EDITORIAL AND INSIDE THE MACHINE

**Dependency:** F07–F09.

**Source to inspect:** EngineeringIndexPage.tsx, EngineeringArticlePage.tsx, EngineeringAnatomyPage.tsx, dev/insideMachineI1/*.

**Typical patch scope:** engineering feature/DEV trial only as authorized; no unpublished source asset promotion.

**Phase exit test:** DEV/production separate, article sources, chapter/canvas fallbacks.

| ID | Small, independently verifiable work item | Acceptance / DoD |
|---|---|---|
| F13.01 | Define production Engineering IA | Index, anatomy, articles differentiated |
| F13.02 | Define DEV Inside Machine story boundary | Explicitly not a production route without approval |
| F13.03 | Define editorial article heading/reading layout | Readable long-form on phone and desktop |
| F13.04 | Define bilingual title/summary/source presentation | Technical statements attributed and EN/VI accurate |
| F13.05 | Define engineering illustration contract | Diagrams labeled illustrative when not official |
| F13.06 | Define car-anatomy chapter navigation | Chapter position and deep link deterministic |
| F13.07 | Define interactive chapter progressive disclosure | Technical details remain readable without 3D |
| F13.08 | Define scroll-pinned 3D narrative behavior | Scrolling controls section and does not trap keyboard |
| F13.09 | Define chapter component selection/highlight | Accessible selected state and fallback |
| F13.10 | Define degraded graphics behavior | No hard dependency on ignored local review assets for production |
| F13.11 | Test direct engineering links and fallback | Production index and article, DEV trial verified separately |
| F13.12 | Test chapter/scroll interactions on responsive | No blank frames, broken scroll, or hidden citations |

**Phase review:** run targeted + full applicable gates; attach screenshot/test evidence; do not mark complete for a merely pre-existing component. Unresolved blocking gate = HOLD.

## F14 — TEAM, DRIVER, CAR AND ABOUT PROFILE PAGES

**Dependency:** F07–F08 + approved layout patterns.

**Source to inspect:** StandaloneProfileDirectory.tsx, TeamDetailPage.tsx, DriverDetailPage.tsx, CarDetailPage.tsx, AboutPage.tsx, components/p5/*.

**Typical patch scope:** Page-specific views + CSS; data modifications require verifiable source.

**Phase exit test:** Valid/invalid IDs, season filters, source images, responsive and return paths.

| ID | Small, independently verifiable work item | Acceptance / DoD |
|---|---|---|
| F14.01 | Define Teams directory grid and filter hierarchy | Teams discoverable without excessive scroll |
| F14.02 | Define Drivers directory grid and filter hierarchy | Driver names/team/year remain legible |
| F14.03 | Define season context across directories | Selected year reflected in visible source data |
| F14.04 | Define profile card interaction states | Hover/touch/focus equivalent |
| F14.05 | Define Team detail content order | Overview, drivers, car, performance clear |
| F14.06 | Define Driver detail content order | Identity, team, season form, results clear |
| F14.07 | Define Car detail technical specification layout | Values/units and sources not invented |
| F14.08 | Define profile image fallback/credit | Missing visuals show intentional state and attribution |
| F14.09 | Define route IDs/unknown profile fallbacks | Invalid IDs cannot cause white screen |
| F14.10 | Define compare/link navigation between related entities | Team↔Driver↔Car links retain clear back path |
| F14.11 | Define About and editorial disclaimer layout | Independence and licensing visible |
| F14.12 | Define visual sharing rules across profile pages | One reusable card style avoids unrelated global changes |
| F14.13 | Verify 2024/2025/2026 data context | No mistaken team/driver transfer across seasons |
| F14.14 | Verify EN/VI layout at long names | No truncation of essential facts |
| F14.15 | Run profile route and responsive QA | Valid and invalid IDs, mobile, footer, keyboard checked |

**Phase review:** run targeted + full applicable gates; attach screenshot/test evidence; do not mark complete for a merely pre-existing component. Unresolved blocking gate = HOLD.

## F15 — END-TO-END QA, PERFORMANCE, ACCESSIBILITY AND RELEASE READINESS

**Dependency:** F01–F14 implemented and approved.

**Source to inspect:** tools/browser-smoke.mjs, tools/cloudflare-browser-smoke.mjs, apps/web/vite.config.ts, .github/workflows/ci.yml, docs/AI_DEVELOPMENT_WORKFLOW.md.

**Typical patch scope:** Tests, docs, narrow performance fixes only; no automatic deploy.

**Phase exit test:** Exact SHA with CI PASS + manual browser evidence + exceptions documented.

| ID | Small, independently verifiable work item | Acceptance / DoD |
|---|---|---|
| F15.01 | Write site-wide route inventory test matrix | Every production route, alias and 404 listed |
| F15.02 | Define Playwright browser runner portability | No Windows-only hard-coded executable dependency |
| F15.03 | Smoke desktop full app | Home, Season, Showroom, Engineering, Profiles, About reach correct content |
| F15.04 | Smoke mobile <=860 hub | Direct links and navigation behave at key widths |
| F15.05 | Test breakpoint transitions at 860 and 861 | No duplicated sections, orphaned canvas or scroll trap |
| F15.06 | Test direct reload/back/forward | Correct intro policy, state persistence and route content |
| F15.07 | Test network offline/timeout/429/5xx | Accurate states, accessible retry, no misleading live data |
| F15.08 | Test 3D unsupported and context loss | Static fallback and navigation preserved |
| F15.09 | Test keyboard focus and overlays | Nav, sidebar, dialogs, filters and error actions pass |
| F15.10 | Test 200%/400% zoom and screen-reader labeling | No lost content or focus under sticky UI |
| F15.11 | Test prefers-reduced-motion | No high-intensity automatic movement blocks content |
| F15.12 | Measure page bundle and lazy-route distribution | 3D assets do not flood unrelated initial routes |
| F15.13 | Measure LCP, INP, CLS per representative route | Report lab vs field separately, target good CWV at p75 when data available |
| F15.14 | Measure interactive scene FPS/frame time on named devices | Quality tier/fallback tied to measured behavior |
| F15.15 | Validate third-party image/model/font licensing and asset isolation | No unapproved private or withdrawn file in production output |
| F15.16 | Run full automated gates | Lint/typecheck/tests/coverage/secrets/assets/audit/build/dry-run logs recorded |
| F15.17 | Audit changed files against GREEN/AMBER/RED policy | No unauthorized global/asset/data/CI changes |
| F15.18 | Verify exact rebuild commit and Github Actions | Local vs remote vs production distinguished; no auto deploy |

**Phase review:** run targeted + full applicable gates; attach screenshot/test evidence; do not mark complete for a merely pre-existing component. Unresolved blocking gate = HOLD.

