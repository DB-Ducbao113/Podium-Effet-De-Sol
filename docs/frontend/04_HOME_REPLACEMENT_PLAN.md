# PEDS | F10 HOME REPLACEMENT — APPROVED-BRIEF DESIGN PLAN

**Owner instruction:** "Tạo plan hoàn chỉnh xong rồi, thì hãy bắt đầu công việc thiết kế website để thay thế trang home của tôi hiện tại" — produce a complete plan, then build a new Home that replaces the current one.

**Phase:** F10 (Home page storyboard and vertical slices). **Branch:** `rebuild`. **Risk:** MEDIUM (visible UI, no data/API/asset/global change).

**Creative direction (proposed for owner review, grounded in the sanctioned brief concept):**
`Race Control × Engineering Lab × Motorsport Editorial`, expressed as **"PEDS RACE COMMAND"** — a night-race pit-wall instrument panel rendered as motorsport editorial. This commits to the existing canonical IGNITION palette and the four contracted self-hosted families; it does **not** introduce a new brand, new fonts, new libraries, new data, or new media.

> Governance note: `DESIGN.md` records that no replacement direction is approved yet. This document is the concrete F10 design proposal the owner asked for. Implementation stays inside the GREEN `components/home/*` allowlist and preserves every durable boundary below; the canonical `DESIGN.md` direction line is updated only after the owner accepts the rendered result.

## 1. Non-negotiable boundaries preserved

| Boundary | How the redesign honors it |
|---|---|
| Canonical logo (`public/logo/*`, RED) | Untouched; Home does not re-brand. |
| Protected hero film `hero-h3-2.mp4` / poster (RED) | Never imported by Home (owner override 04/11/2026). Hero stays the original **AERO-01 2.5D** illustration. |
| Model B GLB (RED) | Never mounted on Home; Showroom 3D remains a CTA destination only. |
| Withdrawn EDS-G01 (RED) | Not referenced or regenerated. |
| F1 truth | `nextRace`, standings, sessions and latest verified result come from the existing store/data contracts; no fabricated timing. |
| Typography contract | Only `--peds-font-display/ui/body/mono`; no remote fonts, no legacy aliases, no synthetic 650/900/950 weights. |
| Visual zoom | Every `vw/vh/svh` outside `max-width` bands divided by `var(--peds-visual-zoom)`. |
| Accessibility | Keyboard focus rings, reduced-motion `off` tier, ARIA labels, EN/VI copy, ≥44px touch targets. |
| Durable test markers | `HomeRacePulseScene` + `r1-cinema__scene` + `RACE/BEYOND/LIMITS.` + `LAUNCH CONTROL` + AERO-01 stage attributes; `data-asset-slot="circuit-map"`; calendar link; standings `category=drivers/constructors` with no `<img>`. |

## 2. Color system (derived from the subject, mapped to canonical tokens)

- **Dominant field:** night-race carbon `--peds-color-canvas #05070b` / `--peds-color-carbon #0a0c10` carrying the largest surfaces.
- **Dominant accent family (largest accent fields):** ignition `#ff4a18` → burnt-orange `#ff6a00` → racing-red `#e51b37` multi-stop gradients on CTAs, chapter rules, leader bars and the energy rail.
- **Full-chroma accents:** signal acid-green `#b7ff37` (verified / live status), electric blue `#65C5E6`/`#56B5E8` (aero vectors / telemetry), brake-amber `#ffb347` (focus / caution), scarlet `#ff4d37` (leader / danger).
- **Semantic status:** done `#6fbf8f`, live `#ff8952`, upcoming neutral `--peds-color-text-subtle` (existing session states preserved).
- **Neutrals:** warm ivory text `#f4f0e8`; cool surfaces `#0d1422` / `#131a27` / `#1a2333`; lines `#2a3242` / `#465166`; muted `#a8b0bf` / subtle `#7f899b`.
- Borders, icons, glows and the custom scrollbar borrow the ignition/blue palette; no flat default gray. Chart-like score bars use leader amber + ignition + blue, separable by luminance and direct labels.

## 3. Type roles

- **Display:** Barlow Condensed 700/800 (italic accent) — chapter titles, hero headline, countdown digits.
- **UI:** Space Grotesk Variable — eyebrows, nav, buttons, labels.
- **Body:** Manrope Variable — descriptive copy.
- **Telemetry:** IBM Plex Mono 500/600, `tabular-nums` — points, countdown, session times, round indices, circuit coordinates.

## 4. Section hierarchy / wireframe (chapter ids unchanged for the journey engine + section nav)

```
┌──────────────────────────────────────────────────────────────┐
│ 01 / LAUNCH CONTROL  (id=launch-control, pinned 220vh)         │
│  eyebrow: /// THE F1 EXPERIENCE · SEASON 2026 · R{next}        │
│  H1: RACE / BEYOND / LIMITS.        [AERO-01 2.5D car stage]   │
│  CTAs: Explore season → /season/2026?tab=results              │
│        Showroom 3D → /showroom                                │
│  instrument strip: NEXT GP | CHAMPIONSHIP LEADER | ROUNDS     │
│  scroll hint + energy rail (scrubs with pin progress)         │
├──────────────────────────────────────────────────────────────┤
│ 02 / RACE CONTROL  (id=race-control, pinned 300vh)             │
│  next GP identity + circuit vector map (scrub draw)           │
│  countdown digits (mono) + session timeline (sequential scrub)│
│  latest verified result card → /season/2026/race/{round}      │
├──────────────────────────────────────────────────────────────┤
│ 03 / THE TITLE FIGHT  (id=championship-overview, pinned 260vh) │
│  Drivers top-3 score bars  |  Constructors top-3 score bars   │
│  leader glow + mono points; VIEW ALL → standings categories   │
├──────────────────────────────────────────────────────────────┤
│ 04 / EXPLORE  (id=eds-explore, pinned 240vh)                   │
│  gateway cards: Showroom · Engineering · Drivers · Teams      │
│  pointer tilt + scroll fan-in; swipe pager on mobile          │
└──────────────────────────────────────────────────────────────┘
```

**First viewport priority:** brand headline + AERO-01 car + two primary CTAs + a live season instrument strip. Information is actionable first; cinematic background is subordinate.

## 5. Motion storyboard (reuse the existing journey engine)

- **Tiers:** `off` (reduced-motion) / `lite` (≤850px, saveData, deviceMemory≤4, text-zoom 200/400) / `full` (pinned). Frames are `display:contents` unless `full`, so content is never stuck invisible.
- **Essential:** state changes (session active, countdown tick, hover/focus feedback).
- **Supporting:** staged hero entrance after `peds:intro-complete`, chapter reveals, score-bar scrub, card fan-in.
- **Cinematic:** pinned chapter floors with `--home-pin-progress` scrub (car parallax, circuit draw, session sequence, leader glow). One scroll rAF, no perpetual JS loop, no new WebGL context on Home.
- Intro/reload/deep-link semantics unchanged (`DocumentIntroController`, Home-only).

## 6. 3D role

Home stays **2.5D** (AERO-01 DOM/SVG illustration with pointer parallax + rev). No WebGL canvas on the Home critical path (durable test forbids `<canvas>` in hero). The premium interactive 3D lives in Showroom, reached by CTA. This matches F09.02 (Home decorative/lazy, Showroom interactive).

## 7. Mobile architecture

- `lite` tier keeps the original document flow (no pinning); chapters stack, instrument strip wraps, countdown/session rows stack, explore becomes a swipe rail with pager.
- Hub anchors (`#championship-overview` etc.) and `chapterScrollTarget` keep scroll placement. No horizontal overflow at 360/390. Touch targets ≥44px.

## 8. Source asset list (all existing + licensed; no new media)

- Hero: `/media/homepage/f1-hero/peds-aero01-car.webp` + `peds-aero01-fallback.svg` (original AERO-01).
- Circuit vectors: existing `getSeasonCircuit` / `findCircuitByName` SVG paths (original local EDS visualization).
- Explore fallbacks: `/images/home/explore/engineering-flow.svg`, `driver-helmet.svg`, `team-garage.svg`; `/images/p4/template/rc-hero-1344.webp`.
- Decorative field: CSS/SVG gradients + grain (no raster assets).

## 9. GREEN file allowlist (actual diff must stay inside this)

- `components/home/PodiumBrandHero.tsx` — new editorial frame + instrument strip (keep durable markers).
- `components/home/HomeRaceControl.tsx` — pit-wall composition (keep circuit-map slot, calendar link, data hooks).
- `components/home/HomeSeasonOverview.tsx` — battle bars (keep categories, no `<img>`, data hooks).
- `components/home/HomeStoryLinks.tsx` — gateway cards (keep routes/fallbacks).
- `components/home/HomeView.tsx` — composition + new CSS import order.
- `components/home/homeCommandV2.css` — **new** design-system layer (imported last so it wins the cascade).
- `components/home/journey/homePinnedChapters.css` — only if scrub hooks need class alignment.
- Impacted home `*.test.tsx` — update structure assertions, add new behavior tests; keep durable guardrails green.

**Read-only dependencies:** store/*, data/championship/*, utils/raceSchedule, hooks/useReveal/useReducedMotion, journey engine + scrub registry, hero2d/F1HeroStage, HomeRacePulseScene, HomeRaceTrackScrub, HomeSessionTimeline, index.css tokens. **No AMBER/RED edits.**

## 10. Acceptance (Given/When/Then)

- **AC1** Given the new Home, when rendered at 1440/1920, then the four chapters show the Race Command composition with the canonical palette/type, no overflow, and the AERO-01 hero intact.
- **AC2** Given full tier, when scrolling each chapter, then pin-progress scrub drives car parallax / circuit draw / session sequence / score bars / card fan-in smoothly (one rAF).
- **AC3** Given reduced-motion or ≤850px, then frames are `display:contents`, content is fully visible, no pinning, no perpetual animation.
- **AC4** Given EN and VI, when toggling language, then all copy switches and nothing clips at 360/390.
- **AC5** Given the data contracts, then next race/standings/sessions/latest result are real and links route correctly (calendar, standings categories, race round, showroom).
- **AC6** Given the durable guardrails, then `HomeLandingV3`, `commercialVisualIsolation`, `typographyContract`, `assetLocks`, `visualZoom` tests stay green.

## 11. Gates

Targeted home tests → full matrix (`lint`, `typecheck`, `test:coverage`, `security:secrets/assets/audit`, `build`, `cloudflare:dry-run`, `git diff --check`); `format:check` reported with pre-existing baseline distinguished. Real-browser QA at 360/390/768/860/861/1024/1440/1920, EN/VI, reduced-motion, intro matrix, console/network/asset checks; screenshots under `.local-assets/`. No commit/push/deploy without authorization; report local vs remote honestly.