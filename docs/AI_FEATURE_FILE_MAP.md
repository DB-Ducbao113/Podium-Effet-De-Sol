# PEDS | ROUTE → FEATURE → OWNER FILE MAP

Purpose: given a user requirement, identify **the smallest relevant source/test/style set before editing**. This is a navigation index grounded in `rebuild` source as of 2026-11-05, **not** permission to edit every listed file. See `docs/AI_EDIT_POLICY.md`.

## 1. Canonical routes

| Route / entry | Purpose & actual behavior | Start reading | Likely editable file family (if task scope matches) |
|---|---|---|---|
| `/` | Home hero, next-race/race-control, season overview, story/explore | `src/components/home/HomeView.tsx` | `src/components/home/*`, relevant home CSS, home tests |
| `/season/:year` | Championship tabs/selected season; supported 2024–2026 | `src/App.tsx` → `src/components/championship/ChampionshipView.tsx` | feature tab files and focused tests |
| `/season/:year?tab=standings` | driver/constructor standings | `ChampionshipStandings.tsx`, `StandingsTable.tsx` | standings UI; data only if factual change |
| `/season/:year?tab=calendar` | rounds, race card/journey, timezone | `ChampionshipCalendar.tsx`, `RaceCalendar.tsx` | championship calendar, timezone utils/tests |
| `/season/:year?tab=results` | available sessions / race classifications | `RaceResults.tsx`, `WeekendResults.tsx` | results selection helpers, focused regression tests |
| `/season/:year/race/:round` | selected-race modal | `App.tsx` → `RaceClassificationModal.tsx` | modal and classification helpers/tests |
| `/showroom` | 3D Model B / optional DEV P6 review | `ShowroomView.tsx`, `ModelBShowroom.tsx` | showroom + `dev/commercial-b/*` only when model runtime needs change |
| `/teams` / `/drivers` | season-aware directories | `TeamsDirectoryPage.tsx` / `DriversDirectoryPage.tsx` | `StandaloneProfileDirectory.tsx`, `components/p5/*` |
| `/teams/:teamId` | detailed team profile and car | `TeamDetailPage.tsx` | pages/profile visuals, required data/tests |
| `/drivers/:driverId` | driver profile, season record | `DriverDetailPage.tsx` | pages/profile visuals, required data/tests |
| `/cars/:carId` | car specifications | `CarDetailPage.tsx` | car detail UI and car catalog if specifically correcting facts |
| `/engineering` | DEV Inside the Machine; production EngineeringIndex | `App.tsx` → `InsideMachineTrialPage.tsx` / `EngineeringIndexPage.tsx` | target the intended environment only |
| `/engineering/car-anatomy` | interactive car anatomy | `EngineeringAnatomyPage.tsx` | anatomy component/chapters/CSS/tests |
| `/engineering/:slug` | editorial article | `EngineeringArticlePage.tsx` | engineering content and article rendering |
| `/engineering/insights` | **DEV-only** index path | `App.tsx` / `EngineeringIndexPage.tsx` | not a production route without approved routing change |
| `/about` | project independence/credits | `AboutPage.tsx` | page, translations/copy only when requested |

Aliases/redirects in `App.tsx`: `/season` and `/championship` → `/season/2026`; `/gallery` → `/showroom`; `/live`, `/archive`, `/timing` → current results. Unknown path → NotFound. Treat these as routing contracts.

## 2. File owners by visible feature

| Requirement / symptom | Inspect this chain IN ORDER | Test or contract to rerun | Normally do NOT edit |
|---|---|---|---|
| Home hero text, animation, image | `HomeView.tsx` → `PodiumBrandHero.tsx` → `HomeCinematicBackground.tsx` / `HomeRacePulseScene.tsx` → `podiumHeroR1.css`, `homeHeroV7.css`, `homepageH1.css` | `HomeLandingV3.test.tsx`, `HomeCinematicV7.test.tsx`, visual browser QA | season baselines, model GLB, API |
| Home next race/countdown | `HomeRaceControl.tsx`, `HomeRaceCountdown.tsx`, `FeaturedRace.tsx` → `utils/raceSchedule.ts` → store/data | countdown/featured-race tests + clock/timezone edge cases | raw standings/season snapshots unless source error proven |
| Homepage exploration/season overview | `HomeSeasonOverview.tsx`, `HomeStoryLinks.tsx`, `HomeEngineeringReveal.tsx`, associated CSS | respective *.test.tsx; responsive QA | global tokens unless approved |
| Results tabs missing/empty | `RaceResults.tsx` → `WeekendResults.tsx` → `resultSelection.ts` → `resultsDataRegression.test.tsx` → `data/championship/*`/service when needed | `resultSelection.test.ts`, `resultsDataRegression.test.tsx`, `sessionCountSettling.test.ts` | static baseline updates without official evidence |
| Standings points wrong | `ChampionshipStandings.tsx` → `store/useChampionshipStore.ts` → `services/standingsEngine.ts` → `baselineCutoff.ts` → provenance snapshot | `standingsEngine.test.ts`, `sprint-standings.test.ts`, full results regression | CSS-only work must not touch scoring |
| Calendar date/time wrong | `ChampionshipCalendar.tsx`, `RaceCalendar.tsx`, `TimezoneSelector.tsx` → `utils/championshipTimezone.ts` / `utils/raceSchedule.ts` → calendar snapshot | `RaceCalendar.test.tsx`, `championshipTimezone.test.ts`, `raceSchedule.test.ts` | live API only for verified missing source |
| Team/driver card layout | `StandaloneProfileDirectory.tsx` → `components/p5/*` CSS → individual page | `P5DirectoryV2.test.tsx`; responsive QA | F1 stats/IDs, asset manifest |
| Team/driver wrong identity/team | `data/teams.ts`, `data/teamSeasons.ts`, `data/drivers.ts`, `types/*`, season reference | impacted data tests, ID-link/navigation QA, source citation | reassign IDs or results without authoritative source |
| Car profile specs | `CarDetailPage.tsx` → `data/cars/{index,catalogEntry,2024,2025,2026}.ts` | page behavior/affected data tests | Showroom 3D mesh does not imply true car specification |
| Showroom orbit/livery/hotspot | `ModelBShowroom.tsx`, `CameraController.tsx`, `LiverySelector.tsx`, `HotspotDetailsModal.tsx` → `dev/commercial-b/{modelBLoader,modelBMaterials,modelBExperience,qualityProfiles}.ts` | `modelBLoader.test.ts`, `modelBMaterials.test.ts`, `F1CarTextures.test.ts`, visual/fps QA | protected GLB byte edits / unrelated Home visuals |
| Engineering anatomy chapter | `EngineeringAnatomyPage.tsx` → `anatomyChapters.ts` → `engineeringAnatomy.css` | `anatomyChapters.test.ts`, `engineeringAnatomyBoundary.test.ts` | DEV InsideMachine unless task targets it |
| Engineering article content | `EngineeringArticlePage.tsx` → `data/engineeringArticles.{ts,json}` | `engineeringArticles.test.ts`, SEO/links | factual claims without source |
| DEV Inside the Machine | `dev/insideMachineI1/{App,ThreeStage,storyboard,assetPaths,provenance,engineeringContent}.tsx/ts` | `storyboard.test.ts`, local asset identity + performance QA | production asset promotion or /engineering route changes implicitly |
| Navbar / global layout | `components/layout/{Navbar,Footer,navItems}.tsx/ts` → `App.tsx` → `MobileAllInOne.tsx` | `Navbar.test.tsx`, `Footer.test.tsx`, cross-route mobile QA | route tree if only changing icon/spacing |
| Translation/text switch | `useNavigationStore.ts` → `i18n/translations.ts` and local strings | all affected routes both EN/VI; SEO lang and overflow | rewriting editorial facts |
| SEO/OG/canonical | `components/seo/{RouteSeo,routePath}.tsx/ts` → `config/site.ts` → SEO build scripts | `RouteSeo.test.ts`, build and generated artifacts | indexing settings by default |
| Proxy/OpenF1/Jolpica | `services/{openF1Service,f1DataService}.ts` → `apps/api/src/interfaces/http/*` → policy/cache | API unit/negative/security tests; Worker smoke | direct upstream browser calls, CORS/CSP weakening |
| F1 snapshot ingestion | `apps/jobs/src/*` → `results-engine/*` → `data/championship/*` | source verification, replay/regressions + dry-run only | automatic write to verified snapshots without explicit approval |

**Root for paths in this table:** UI files are under `apps/web/src/` unless full prefix shown.

## 3. Shared dependencies: read before touching

- Routing: `apps/web/src/App.tsx`, `components/layout/navItems.ts`, `hooks/useMobileHub.ts` and `components/mobile/MobileAllInOne.tsx`. `useMobileHub` uses `max-width: 860px` and changes behavior of primary pages, not just CSS.
- Data: `src/store/useChampionshipStore.ts`, `src/services/f1DataService.ts`, `src/services/standingsEngine.ts`, `src/data/championship/*`, `src/types/*`; tests for data normalization, standings, sprint, availability.
- UI system: `src/components/ui/{Button,Card,Container,Dropdown,Modal,Tabs,StatePanel,Tooltip}.tsx`, `src/index.css` and `tailwind.config.js`.
- Runtime 3D: `src/components/showroom/*` and `src/dev/commercial-b/*`; even though path says `dev`, some modules are used in production by `ModelBShowroom`. **Do not bulk-delete `src/dev`**.
- Security: `apps/api/src/worker.ts`, `apps/api/src/interfaces/http/*`, `packages/security/src/index.ts` and `apps/web/public/_headers`.
- Build: `apps/web/vite.config.ts`, `wrangler.jsonc`, `apps/web/scripts/*`; local-asset plugins are development-only and have identity validation.
- Source assets: `src/config/originalVisualAssets.ts`, `docs/asset-licenses.md` and `src/data/visualAssets/*Manifest.json`.

## 4. Required search protocol before edits

```bash
git branch --show-current
git status --short
rg -n "RequestedText|FunctionOrComponent|route" apps/web/src apps/api/src packages
rg -n "import .*Name|from ['\"][^'\"]+['\"]" apps/web/src/components
rg --files apps/web/src | rg "RaceResults|Championship|\.test\."
```

Workflow (not merely a search):
1. Locate **route entry** in `App.tsx` and determine DEV/production + mobile hub variant.
2. Trace **render owner** (page → component → shared UI/styles).
3. Trace **data owner** (props/store → selector/service → snapshots/API/contracts), only if data-related.
4. Trace **test owner** (nearby *.test.* plus relevant contract tests). Capture baseline.
5. Make a proposed **allowlist of files to change** with reason per file. Distinguish READ-ONLY dependencies from edit targets.
6. If work expands beyond allowlist, re-evaluate impact and request approval for protected/cross-cutting changes when required; no shotgun edits.
7. Validate that only intended source/test/doc paths changed, and that build artifacts, generated data or unrelated assets were not modified.

## 5. Example change-scope decisions

**“Sửa màu nút kết quả tại Championship”** → read `App.tsx` → `ChampionshipView.tsx` + `championshipC1.css` / `championshipF4.css`, `Button.tsx` when shared styling is actually used. Edit the **smallest local component/CSS**, plus tests if behavior changes. Do NOT touch standings, `index.css`, Worker or assets for this request.

**“Result tab R19 trống”** → reproduce availability by season/session → `RaceResults.tsx`, `WeekendResults.tsx`, `resultSelection.ts` → `f1DataService` / `results-engine` only if issue is data; do not invent results, overwrite verified snapshots, or run sync-to-write by default.

**“Mobile navbar overlaps Showroom”** → read `useMobileHub.ts`, `MobileAllInOne.tsx`, `Navbar.tsx`, `ShowroomView.tsx` and scoped CSS. Fix specific overflow/stacking issue; test widths 360/390/768/860/861/1440.

**“Optimize Model B loading”** → characterize `modelBLoader.ts`, `ModelBShowroom.tsx`, `vite.config.ts` and model identity manifest. Optimize JS/render behavior after measuring; **not** transcode or replace immutable GLB as a side effect.

## 6. Maintaining this map

Any approved change to routing, module ownership, state/storage, data pipeline, public asset contracts or DEV/production mapping must update this file and `docs/AI_PROJECT_BLUEPRINT.md` in the same task. If code has moved, file map must be refreshed before applying old guidance.
