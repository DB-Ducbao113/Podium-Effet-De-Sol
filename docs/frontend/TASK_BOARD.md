# PEDS — FRONTEND ATOMIC TASK BOARD

**All unchecked on creation.** Historical components existing in source do not count as completion. Follow acceptance and evidence policy in `03_ACCEPTANCE_PROTOCOL.md`.

## F00 — PRODUCT INTENT, UI INVENTORY AND WIREFRAME CONTRACT (14)

- [ ] **F00.01** — Catalogue every production route and aliases
- [ ] **F00.02** — Catalogue DEV-only routes and review flags
- [ ] **F00.03** — Capture current desktop page hierarchy
- [ ] **F00.04** — Capture current mobile <=860 hub behavior
- [ ] **F00.05** — Inventory current global CSS variables and fonts
- [ ] **F00.06** — Inventory existing navigation components
- [ ] **F00.07** — Inventory existing intro, transition and state components
- [ ] **F00.08** — Define site-wide user journeys
- [ ] **F00.09** — Define primary vs secondary navigation roles
- [ ] **F00.10** — Draft desktop App Shell wireframe
- [ ] **F00.11** — Draft tablet App Shell wireframe
- [ ] **F00.12** — Draft mobile App Shell wireframe
- [ ] **F00.13** — Write explicit approved-vs-proposed visual decisions
- [ ] **F00.14** — Approve phase F00 acceptance baseline before styling

## F01 — APP SHELL AND GRID (14)

- [ ] **F01.01** — Define AppShell region responsibilities
- [ ] **F01.02** — Define max content width variants
- [ ] **F01.03** — Define horizontal grid and gutters
- [ ] **F01.04** — Implement safe root min-height and viewport strategy
- [ ] **F01.05** — Implement header slot without changing navigation behavior
- [ ] **F01.06** — Implement content column wrapper
- [ ] **F01.07** — Implement contextual side-region slot
- [ ] **F01.08** — Implement footer slot and page-end spacing
- [ ] **F01.09** — Implement skip-to-content anchor
- [ ] **F01.10** — Define stacking context and overlay layering contract
- [ ] **F01.11** — Define page scroll ownership
- [ ] **F01.12** — Preserve existing route lazy-loading boundaries
- [ ] **F01.13** — Verify route shell under empty/loading states
- [ ] **F01.14** — Verify desktop shell across Home, Results, Showroom, Engineering

## F02 — NAVBAR AND PRIMARY NAVIGATION (14)

- [ ] **F02.01** — Write navbar information architecture
- [ ] **F02.02** — Define brand/wordmark lockup dimensions
- [ ] **F02.03** — Define navbar desktop height and gutters
- [ ] **F02.04** — Define active route detection
- [ ] **F02.05** — Define focus and hover states for link
- [ ] **F02.06** — Implement current-page indication semantics
- [ ] **F02.07** — Implement dropdown open by intended inputs
- [ ] **F02.08** — Implement dropdown close by Escape/outside intent
- [ ] **F02.09** — Implement arrow/tab focus order
- [ ] **F02.10** — Implement season-aware link targets
- [ ] **F02.11** — Implement language switch presentation
- [ ] **F02.12** — Implement sticky/scroll state without jump
- [ ] **F02.13** — Implement reduced-motion nav behavior
- [ ] **F02.14** — Run cross-route navigation tests

## F03 — SIDEBAR, CONTEXT RAIL AND MOBILE DRAWER (13)

- [ ] **F03.01** — Choose sidebar function by route
- [ ] **F03.02** — Define sidebar desktop placement
- [ ] **F03.03** — Define rail collapsed dimensions
- [ ] **F03.04** — Define expanded width and content rules
- [ ] **F03.05** — Implement expand/collapse state
- [ ] **F03.06** — Decide persistence of sidebar preference
- [ ] **F03.07** — Implement route-aware sidebar content
- [ ] **F03.08** — Implement overlay/drawer alternative for narrow screens
- [ ] **F03.09** — Implement drawer open/close keyboard interactions
- [ ] **F03.10** — Implement drawer focus entry and return
- [ ] **F03.11** — Implement scroll locking while drawer is open
- [ ] **F03.12** — Implement active link selection in sidebar
- [ ] **F03.13** — Verify sidebar hidden/unavailable semantics

## F04 — INITIAL LOAD, F5 RELOAD AND PAGE TRANSITIONS (16)

- [ ] **F04.01** — Define lifecycle states of document entry
- [ ] **F04.02** — Document current F5 behavior for Home
- [ ] **F04.03** — Define desired F5 vs first-visit policy
- [ ] **F04.04** — Define intro trigger/skip/replay modes
- [ ] **F04.05** — Define preloader visual storyboard
- [ ] **F04.06** — Define accessibility for intro dialog
- [ ] **F04.07** — Define reduced-motion intro fallback
- [ ] **F04.08** — Define resource-ready vs animation-finished semantics
- [ ] **F04.09** — Define watchdog/failure fallback
- [ ] **F04.10** — Preserve browser page refresh semantics
- [ ] **F04.11** — Define client-side route transition distinct from reload
- [ ] **F04.12** — Prevent transition overlap/double animations
- [ ] **F04.13** — Define 3D lazy-loading placeholder separate from initial intro
- [ ] **F04.14** — Create deterministic intro timing tests
- [ ] **F04.15** — Run reload test on Home and direct non-Home deep links
- [ ] **F04.16** — Run throttled network QA with reduced motion

## F05 — LOADING, ERROR, EMPTY, OFFLINE AND RECOVERY STATES (18)

- [ ] **F05.01** — Define unified async state vocabulary
- [ ] **F05.02** — Define global shell loading state
- [ ] **F05.03** — Define route-level skeleton geometry
- [ ] **F05.04** — Define component-level loading spinner policy
- [ ] **F05.05** — Define empty dataset state
- [ ] **F05.06** — Define upstream timeout state
- [ ] **F05.07** — Define offline state
- [ ] **F05.08** — Define stale-data state
- [ ] **F05.09** — Define partial data state
- [ ] **F05.10** — Define not-found 404 state
- [ ] **F05.11** — Define route-chunk import failure state
- [ ] **F05.12** — Define Render ErrorBoundary strategy
- [ ] **F05.13** — Prevent raw stack traces in production UI
- [ ] **F05.14** — Define retry button busy/disabled behavior
- [ ] **F05.15** — Define success and action feedback
- [ ] **F05.16** — Write deterministic tests for fallback variants
- [ ] **F05.17** — Run browser fault injection
- [ ] **F05.18** — Check focus and language of all states

## F06 — RESPONSIVE RULES AND MOBILE-FIRST REGRESSION (18)

- [ ] **F06.01** — List existing breakpoints and actual 860px switch
- [ ] **F06.02** — Define responsive layout rules at 320/360/390
- [ ] **F06.03** — Define 430–767 mobile wide adaptation
- [ ] **F06.04** — Define 768–860 mobile hub behavior
- [ ] **F06.05** — Define 861–1023 non-hub layout
- [ ] **F06.06** — Define 1024–1279 compact desktop layout
- [ ] **F06.07** — Define 1280–1599 desktop content placement
- [ ] **F06.08** — Define 1600–1920 ultrawide layout
- [ ] **F06.09** — Define portrait vs landscape header strategy
- [ ] **F06.10** — Define notch/safe-area padding
- [ ] **F06.11** — Define touch targets
- [ ] **F06.12** — Define scroll behavior for hub anchors
- [ ] **F06.13** — Test 860→861 live resize transition
- [ ] **F06.14** — Test standalone deep links on mobile
- [ ] **F06.15** — Test text zoom 200%
- [ ] **F06.16** — Test text zoom 400%
- [ ] **F06.17** — Test reduced motion across mobile/desktop
- [ ] **F06.18** — Record viewport screenshots and overflow checks

## F07 — DESIGN TOKENS, TYPOGRAPHY AND REUSABLE COMPONENTS (16)

- [ ] **F07.01** — Define racing-inspired color roles proposal
- [ ] **F07.02** — Inventory and resolve conflicting legacy token roles
- [ ] **F07.03** — Define type scale and font usage
- [ ] **F07.04** — Define responsive type ramps
- [ ] **F07.05** — Define spacing, border and elevation roles
- [ ] **F07.06** — Define iconography style rules
- [ ] **F07.07** — Define interaction states palette
- [ ] **F07.08** — Define Button sizes/variants
- [ ] **F07.09** — Define Card variants for editorial/data/3D
- [ ] **F07.10** — Define Modal/Dialog rules
- [ ] **F07.11** — Define Dropdown/Select rules
- [ ] **F07.12** — Define Tabs segmented/data navigation rules
- [ ] **F07.13** — Define Table/DataRow density rules
- [ ] **F07.14** — Define Tooltip and overlay content constraints
- [ ] **F07.15** — Define form fields, filter chips and toggles
- [ ] **F07.16** — Publish component showcase and tests

## F08 — MOTION LANGUAGE AND TRANSITION ORCHESTRATION (15)

- [ ] **F08.01** — Define 3 motion intensity levels
- [ ] **F08.02** — Define short durations/easing proposal
- [ ] **F08.03** — Define global motion preference contract
- [ ] **F08.04** — Define hover microinteraction standard
- [ ] **F08.05** — Define click/tap pressed feedback
- [ ] **F08.06** — Define scroll reveal trigger rules
- [ ] **F08.07** — Define reveal fallback without IntersectionObserver
- [ ] **F08.08** — Define route transition fallback
- [ ] **F08.09** — Evaluate View Transitions API as optional enhancement
- [ ] **F08.10** — Implement focus restoration after navigation
- [ ] **F08.11** — Define layered cinematic transition restraint
- [ ] **F08.12** — Define numeric data animation constraints
- [ ] **F08.13** — Define graphics/settings modal transition
- [ ] **F08.14** — Run CPU-throttled motion QA
- [ ] **F08.15** — Run reduced-motion and rapid-navigation regression

## F09 — 3D PLATFORM, ASSET PIPELINE AND ADAPTIVE GRAPHICS (18)

- [ ] **F09.01** — Inventory existing 3D scene responsibilities
- [ ] **F09.02** — Define 3D content role per page
- [ ] **F09.03** — Define immutable model/brand provenance policy
- [ ] **F09.04** — Define progressive enhancement tiers
- [ ] **F09.05** — Define WebGL availability detection behavior
- [ ] **F09.06** — Define lazy scene entry boundaries
- [ ] **F09.07** — Define model loader readiness states
- [ ] **F09.08** — Define 3D loading placeholder geometry
- [ ] **F09.09** — Define camera preset language
- [ ] **F09.10** — Define pointer/touch orbit behavior
- [ ] **F09.11** — Define keyboard controls or alternative actions
- [ ] **F09.12** — Define hotspot behavior and occlusion rules
- [ ] **F09.13** — Define lighting/material quality tiers
- [ ] **F09.14** — Define adaptive quality budget and triggers
- [ ] **F09.15** — Define resource cleanup and context loss lifecycle
- [ ] **F09.16** — Define fallback image and attribution location
- [ ] **F09.17** — Measure draw calls, memory, frame time and load time
- [ ] **F09.18** — Test 3D route switching, recovery and responsive

## F10 — HOME PAGE STORYBOARD AND VERTICAL SLICES (12)

- [ ] **F10.01** — Agree Home section hierarchy and story goal
- [ ] **F10.02** — Define hero content and cinematic frame
- [ ] **F10.03** — Define hero responsive crop/text safety
- [ ] **F10.04** — Define hero entrance timing after preloader
- [ ] **F10.05** — Define primary CTA behavior
- [ ] **F10.06** — Define live/next race card content hierarchy
- [ ] **F10.07** — Define next-race loading/stale/offline variants
- [ ] **F10.08** — Define season overview tile layout
- [ ] **F10.09** — Define editorial discover cards
- [ ] **F10.10** — Define Home-specific scroll choreo
- [ ] **F10.11** — Define mobile Home hub section entry
- [ ] **F10.12** — Run complete Home browser and source accuracy QA

## F11 — CHAMPIONSHIP DATA UX: RESULTS, CALENDAR, STANDINGS (16)

- [ ] **F11.01** — Define Championship page summary and visual hierarchy
- [ ] **F11.02** — Define season switcher behavior
- [ ] **F11.03** — Define Results tab hierarchy
- [ ] **F11.04** — Define unavailable-session presentation
- [ ] **F11.05** — Define race-card interactions and modal deep link
- [ ] **F11.06** — Define results table density/numeric alignment
- [ ] **F11.07** — Define DNF/DNS/DSQ visual semantics
- [ ] **F11.08** — Define provisional vs verified result badges/copy
- [ ] **F11.09** — Define Calendar cards and month navigation
- [ ] **F11.10** — Define circuit map/globe fallback
- [ ] **F11.11** — Define standings drivers and constructors table
- [ ] **F11.12** — Define status/error/empty overlays for session fetch
- [ ] **F11.13** — Define Championship side controls by route
- [ ] **F11.14** — Define accessible table fallback for small screens
- [ ] **F11.15** — Run race/standings regression tests
- [ ] **F11.16** — Run 2024–2026 route and tab QA

## F12 — SHOWROOM 3D EXPERIENCE (12)

- [ ] **F12.01** — Define production vs DEV Showroom comparison
- [ ] **F12.02** — Define viewport composition for car and controls
- [ ] **F12.03** — Define camera preset selection interaction
- [ ] **F12.04** — Define orbit constraints and reset action
- [ ] **F12.05** — Define livery preview/selection state
- [ ] **F12.06** — Define hotspot discovery and technical info
- [ ] **F12.07** — Define graphics mode control
- [ ] **F12.08** — Define initial 3D poster/fallback
- [ ] **F12.09** — Define context-lost and GPU-disabled recovery
- [ ] **F12.10** — Define attribution and asset provenance UI
- [ ] **F12.11** — Test desktop/mobile 3D interaction and memory
- [ ] **F12.12** — Test final production build vs DEV review

## F13 — ENGINEERING EDITORIAL AND INSIDE THE MACHINE (12)

- [ ] **F13.01** — Define production Engineering IA
- [ ] **F13.02** — Define DEV Inside Machine story boundary
- [ ] **F13.03** — Define editorial article heading/reading layout
- [ ] **F13.04** — Define bilingual title/summary/source presentation
- [ ] **F13.05** — Define engineering illustration contract
- [ ] **F13.06** — Define car-anatomy chapter navigation
- [ ] **F13.07** — Define interactive chapter progressive disclosure
- [ ] **F13.08** — Define scroll-pinned 3D narrative behavior
- [ ] **F13.09** — Define chapter component selection/highlight
- [ ] **F13.10** — Define degraded graphics behavior
- [ ] **F13.11** — Test direct engineering links and fallback
- [ ] **F13.12** — Test chapter/scroll interactions on responsive

## F14 — TEAM, DRIVER, CAR AND ABOUT PROFILE PAGES (15)

- [ ] **F14.01** — Define Teams directory grid and filter hierarchy
- [ ] **F14.02** — Define Drivers directory grid and filter hierarchy
- [ ] **F14.03** — Define season context across directories
- [ ] **F14.04** — Define profile card interaction states
- [ ] **F14.05** — Define Team detail content order
- [ ] **F14.06** — Define Driver detail content order
- [ ] **F14.07** — Define Car detail technical specification layout
- [ ] **F14.08** — Define profile image fallback/credit
- [ ] **F14.09** — Define route IDs/unknown profile fallbacks
- [ ] **F14.10** — Define compare/link navigation between related entities
- [ ] **F14.11** — Define About and editorial disclaimer layout
- [ ] **F14.12** — Define visual sharing rules across profile pages
- [ ] **F14.13** — Verify 2024/2025/2026 data context
- [ ] **F14.14** — Verify EN/VI layout at long names
- [ ] **F14.15** — Run profile route and responsive QA

## F15 — END-TO-END QA, PERFORMANCE, ACCESSIBILITY AND RELEASE READINESS (18)

- [ ] **F15.01** — Write site-wide route inventory test matrix
- [ ] **F15.02** — Define Playwright browser runner portability
- [ ] **F15.03** — Smoke desktop full app
- [ ] **F15.04** — Smoke mobile <=860 hub
- [ ] **F15.05** — Test breakpoint transitions at 860 and 861
- [ ] **F15.06** — Test direct reload/back/forward
- [ ] **F15.07** — Test network offline/timeout/429/5xx
- [ ] **F15.08** — Test 3D unsupported and context loss
- [ ] **F15.09** — Test keyboard focus and overlays
- [ ] **F15.10** — Test 200%/400% zoom and screen-reader labeling
- [ ] **F15.11** — Test prefers-reduced-motion
- [ ] **F15.12** — Measure page bundle and lazy-route distribution
- [ ] **F15.13** — Measure LCP, INP, CLS per representative route
- [ ] **F15.14** — Measure interactive scene FPS/frame time on named devices
- [ ] **F15.15** — Validate third-party image/model/font licensing and asset isolation
- [ ] **F15.16** — Run full automated gates
- [ ] **F15.17** — Audit changed files against GREEN/AMBER/RED policy
- [ ] **F15.18** — Verify exact rebuild commit and Github Actions

**Total: 241 microtasks across 16 phases.**
