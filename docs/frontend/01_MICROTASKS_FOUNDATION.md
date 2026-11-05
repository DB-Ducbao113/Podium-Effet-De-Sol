# PEDS — FRONTEND MICRO-TASK PLAN (FOUNDATION)

**Planning only.** Not an authorization to rewrite UI. Branch: `rebuild`. Follow `AGENTS.md`, `docs/AI_EDIT_POLICY.md` and `docs/AI_DEVELOPMENT_WORKFLOW.md`. Tasks are ordered by phase; **one microtask = one narrow behavior or deliverable**. IDs persist across revisions. Check status in `TASK_BOARD.md` only with evidence.

The page/feature owner list is indexed in `docs/AI_FEATURE_FILE_MAP.md`.

## F00 — PRODUCT INTENT, UI INVENTORY AND WIREFRAME CONTRACT

**Dependency:** None; before all design tasks.

**Source to inspect:** App.tsx, Navbar.tsx, MobileAllInOne.tsx, DESIGN.md, docs/AI_DESIGN_CONTRACT.md.

**Typical patch scope:** Documentation and wireframe specs only; no application UI code.

**Phase exit test:** Written route/state matrix and owner-reviewable wireframes.

| ID | Small, independently verifiable work item | Acceptance / DoD |
|---|---|---|
| F00.01 | Catalogue every production route and aliases | Route list matches App.tsx including 404 and query parameters |
| F00.02 | Catalogue DEV-only routes and review flags | DEV/production difference table covers /engineering and /showroom |
| F00.03 | Capture current desktop page hierarchy | Screenshot/evidence list names header, content, footer and overlays |
| F00.04 | Capture current mobile <=860 hub behavior | Identify primary routes that compose MobileAllInOne |
| F00.05 | Inventory current global CSS variables and fonts | Existing palette/type tokens listed without declaring them approved |
| F00.06 | Inventory existing navigation components | Navbar, navItems, mobile hub and footer behavior mapped |
| F00.07 | Inventory existing intro, transition and state components | DocumentIntroController, preloader, StatePanel, ErrorBoundary catalogued |
| F00.08 | Define site-wide user journeys | Home→Results, Home→Showroom, Results→Driver, Engineering→Article journeys specified |
| F00.09 | Define primary vs secondary navigation roles | No duplicate actions or incoherent hierarchy between top bar and sidebar |
| F00.10 | Draft desktop App Shell wireframe | Annotated zones for header, content, contextual sidebar, footer |
| F00.11 | Draft tablet App Shell wireframe | Indicate rail collapse and preserved content priorities |
| F00.12 | Draft mobile App Shell wireframe | Indicate drawer/bottom access while retaining existing mobile hub semantics |
| F00.13 | Write explicit approved-vs-proposed visual decisions | Only confirmed user goals recorded as approved; specifics marked pending |
| F00.14 | Approve phase F00 acceptance baseline before styling | Plan has testable component order and no pending layout ambiguity |

**Phase review:** run targeted + full applicable gates; attach screenshot/test evidence; do not mark complete for a merely pre-existing component. Unresolved blocking gate = HOLD.

## F01 — APP SHELL AND GRID

**Dependency:** F00 approved.

**Source to inspect:** App.tsx, main.tsx, Container.tsx, Navbar.tsx, Footer.tsx, index.css, useMobileHub.ts.

**Typical patch scope:** Scoped layout components/styles; App.tsx only if shell integration explicitly needed (AMBER).

**Phase exit test:** Baseline layout all major routes at 390, 861, 1440; no horizontal overflow.

| ID | Small, independently verifiable work item | Acceptance / DoD |
|---|---|---|
| F01.01 | Define AppShell region responsibilities | header/main/aside/footer hierarchy documented, one primary main landmark |
| F01.02 | Define max content width variants | normal, data-wide and full-bleed 3D containers fit intended pages |
| F01.03 | Define horizontal grid and gutters | Widths and spacing follow token proposals at all target breakpoints |
| F01.04 | Implement safe root min-height and viewport strategy | No clipping with mobile browser toolbars or short content |
| F01.05 | Implement header slot without changing navigation behavior | Header reservation prevents content hiding underneath sticky chrome |
| F01.06 | Implement content column wrapper | Every route has consistent content start and clear optional full-bleed opt-out |
| F01.07 | Implement contextual side-region slot | Aside can be absent without blank gap or structural layout shift |
| F01.08 | Implement footer slot and page-end spacing | Footer remains reachable on short and long pages |
| F01.09 | Implement skip-to-content anchor | Keyboard skip link moves focus to main content |
| F01.10 | Define stacking context and overlay layering contract | Header, drawers, modals, preloader and 3D never fight via ad-hoc z-indices |
| F01.11 | Define page scroll ownership | Only one intentional root scroll for ordinary pages; no nested scroll traps |
| F01.12 | Preserve existing route lazy-loading boundaries | No unnecessary eager loading of 3D or feature routes |
| F01.13 | Verify route shell under empty/loading states | Layout does not collapse when content asynchronous or absent |
| F01.14 | Verify desktop shell across Home, Results, Showroom, Engineering | Same foundational chrome with intentional page-specific exceptions |

**Phase review:** run targeted + full applicable gates; attach screenshot/test evidence; do not mark complete for a merely pre-existing component. Unresolved blocking gate = HOLD.

## F02 — NAVBAR AND PRIMARY NAVIGATION

**Dependency:** F01.

**Source to inspect:** components/layout/Navbar.tsx, navItems.ts, navbarH1.css, navbarV4.css, App.tsx, useNavigationStore.ts.

**Typical patch scope:** Navbar.tsx, navItems.ts, scoped navbar CSS and nearby tests; App.tsx only when route contracts change.

**Phase exit test:** Mouse/keyboard/screen-reader behavior and direct-link/reload smoke.

| ID | Small, independently verifiable work item | Acceptance / DoD |
|---|---|---|
| F02.01 | Write navbar information architecture | Primary destinations and submenu hierarchy documented |
| F02.02 | Define brand/wordmark lockup dimensions | Existing official logo remains legible without distortion |
| F02.03 | Define navbar desktop height and gutters | Logo, links and controls never collide at approved widths |
| F02.04 | Define active route detection | Nested /season/query tabs resolve to correct selected state |
| F02.05 | Define focus and hover states for link | Visible state without movement that obscures text |
| F02.06 | Implement current-page indication semantics | aria-current used on applicable links |
| F02.07 | Implement dropdown open by intended inputs | Mouse and keyboard operation deterministic |
| F02.08 | Implement dropdown close by Escape/outside intent | No trapped menu after Escape and route change |
| F02.09 | Implement arrow/tab focus order | No inaccessible hidden link or unexpected tab skipping |
| F02.10 | Implement season-aware link targets | Nav destinations preserve intended selected season |
| F02.11 | Implement language switch presentation | EN/VI labels remain readable without truncating essential content |
| F02.12 | Implement sticky/scroll state without jump | No cumulative layout jump when navbar changes style |
| F02.13 | Implement reduced-motion nav behavior | Animations disabled or simplified without losing state change |
| F02.14 | Run cross-route navigation tests | Root, season tabs, showroom, profiles, engineering, about reachable |

**Phase review:** run targeted + full applicable gates; attach screenshot/test evidence; do not mark complete for a merely pre-existing component. Unresolved blocking gate = HOLD.

## F03 — SIDEBAR, CONTEXT RAIL AND MOBILE DRAWER

**Dependency:** F01 + F02; role defined in F00.

**Source to inspect:** Navbar.tsx, App.tsx, MobileAllInOne.tsx, useMobileHub.ts, components/ui/Dropdown.tsx.

**Typical patch scope:** New scoped sidebar components if approved; shell slot and nav tests; do not modify data pipeline.

**Phase exit test:** Expanded/collapsed/hidden states and focus trapping across 860/861 breakpoint.

| ID | Small, independently verifiable work item | Acceptance / DoD |
|---|---|---|
| F03.01 | Choose sidebar function by route | Contextual controls vs global navigation explicitly distinguished |
| F03.02 | Define sidebar desktop placement | Side region does not cover content or duplicate Navbar actions |
| F03.03 | Define rail collapsed dimensions | Collapsed icons remain labeled via tooltip/accessible name |
| F03.04 | Define expanded width and content rules | Readable grouping and stable main content dimensions |
| F03.05 | Implement expand/collapse state | No layout jump or focus loss during toggle |
| F03.06 | Decide persistence of sidebar preference | Document session/local persistence or intentionally none |
| F03.07 | Implement route-aware sidebar content | Results filters and Showroom controls do not appear on unrelated routes |
| F03.08 | Implement overlay/drawer alternative for narrow screens | No forced tiny desktop rail at <=860 |
| F03.09 | Implement drawer open/close keyboard interactions | Menu button, Escape, close button work |
| F03.10 | Implement drawer focus entry and return | Focus returns to trigger; hidden content cannot receive focus |
| F03.11 | Implement scroll locking while drawer is open | Body restores its previous scroll after close |
| F03.12 | Implement active link selection in sidebar | Selections match actual route/search state |
| F03.13 | Verify sidebar hidden/unavailable semantics | Full content width, no blank rail and no redundant announcements |

**Phase review:** run targeted + full applicable gates; attach screenshot/test evidence; do not mark complete for a merely pre-existing component. Unresolved blocking gate = HOLD.

## F04 — INITIAL LOAD, F5 RELOAD AND PAGE TRANSITIONS

**Dependency:** F01 + F02; before animation polish.

**Source to inspect:** F1StartLightsPreloader.tsx, DocumentIntroController.tsx, documentIntroState.ts, documentReload.ts, startLightsTiming.ts, F1PageTransition.tsx, App.tsx.

**Typical patch scope:** Existing common intro/state files and related tests; avoid modifying immutable hero media.

**Phase exit test:** Reload matrix, skip, reduced motion, slow-network behavior with actual browser.

| ID | Small, independently verifiable work item | Acceptance / DoD |
|---|---|---|
| F04.01 | Define lifecycle states of document entry | Document load, home intro, route suspense, data load, 3D load all distinct |
| F04.02 | Document current F5 behavior for Home | Exact current policy and sessionStorage behavior recorded before change |
| F04.03 | Define desired F5 vs first-visit policy | Only Home has branded intro unless owner explicitly changes policy |
| F04.04 | Define intro trigger/skip/replay modes | Query overrides, Escape/Space, skip button and session state predictable |
| F04.05 | Define preloader visual storyboard | Five-light sequence, progress cue and handoff specified without blocking content |
| F04.06 | Define accessibility for intro dialog | Focus management, labeling and keyboard dismissal contract |
| F04.07 | Define reduced-motion intro fallback | No forced flashing/long blocking animation when reduce selected |
| F04.08 | Define resource-ready vs animation-finished semantics | Intro never pretends network completion or delays rendering indefinitely |
| F04.09 | Define watchdog/failure fallback | Slow or failed load must expose usable error/content and permit skip |
| F04.10 | Preserve browser page refresh semantics | Reload must not reset application data or fake network state |
| F04.11 | Define client-side route transition distinct from reload | No full screen intro for ordinary internal navigation |
| F04.12 | Prevent transition overlap/double animations | Rapid route changes settle to latest route with no stale overlay |
| F04.13 | Define 3D lazy-loading placeholder separate from initial intro | 3D model load state cannot block global navigation |
| F04.14 | Create deterministic intro timing tests | Fake timers assert milestones, dismiss once, skip and cleanup |
| F04.15 | Run reload test on Home and direct non-Home deep links | F5, Ctrl+R, navigation, browser back/forward and no intro on deep links |
| F04.16 | Run throttled network QA with reduced motion | No white/black permanent screen and accessible content |

**Phase review:** run targeted + full applicable gates; attach screenshot/test evidence; do not mark complete for a merely pre-existing component. Unresolved blocking gate = HOLD.

## F05 — LOADING, ERROR, EMPTY, OFFLINE AND RECOVERY STATES

**Dependency:** F01 + F04.

**Source to inspect:** ErrorBoundary.tsx, StatePanel.tsx, App.tsx, components/ui/StatePanel.tsx, services/openF1Service.ts, store/useChampionshipStore.ts.

**Typical patch scope:** Scoped states + tests; API/service only if reproducing actual contract bug.

**Phase exit test:** Each state force-triggered in tests/browser and recovery checked.

| ID | Small, independently verifiable work item | Acceptance / DoD |
|---|---|---|
| F05.01 | Define unified async state vocabulary | idle/loading/success/empty/error/stale/partial documented |
| F05.02 | Define global shell loading state | Lazy route fallback has accessible status and stable height |
| F05.03 | Define route-level skeleton geometry | Hero/table/profile skeletons match final bounds to reduce CLS |
| F05.04 | Define component-level loading spinner policy | Spinners reserved for short indeterminate actions, not entire screens |
| F05.05 | Define empty dataset state | Clear message/action without implying API failure |
| F05.06 | Define upstream timeout state | Specific retry path for latency without infinite loop |
| F05.07 | Define offline state | Use available cached content or transparent offline message |
| F05.08 | Define stale-data state | Shows timestamp/provenance; never labels stale data live |
| F05.09 | Define partial data state | Available content remains visible; missing sections labeled |
| F05.10 | Define not-found 404 state | Wrong URLs show navigation path home; no dead ends |
| F05.11 | Define route-chunk import failure state | Reload/retry affordance and no fatal blank page |
| F05.12 | Define Render ErrorBoundary strategy | Route-level recovery isolates failures when appropriate |
| F05.13 | Prevent raw stack traces in production UI | User sees safe error, technical details stay in guarded logs |
| F05.14 | Define retry button busy/disabled behavior | No duplicated requests, clear retry feedback |
| F05.15 | Define success and action feedback | Status and live-region announcements without noisy animation |
| F05.16 | Write deterministic tests for fallback variants | Assert semantics, actions, empty/timeout/stale conditions |
| F05.17 | Run browser fault injection | Block data requests and 3D model, verify fallback and recovery |
| F05.18 | Check focus and language of all states | EN/VI labels, focus location, aria-live do not spam |

**Phase review:** run targeted + full applicable gates; attach screenshot/test evidence; do not mark complete for a merely pre-existing component. Unresolved blocking gate = HOLD.

## F06 — RESPONSIVE RULES AND MOBILE-FIRST REGRESSION

**Dependency:** F01–F05.

**Source to inspect:** hooks/useMobileHub.ts, MobileAllInOne.tsx, Navbar.tsx, Footer.tsx, components/styles, index.css.

**Typical patch scope:** Feature/component-scoped responsive styles and tests; 860px hub semantics AMBER.

**Phase exit test:** Responsive matrix 320–1920, 860/861 boundary, 200/400% zoom, orientation & touch.

| ID | Small, independently verifiable work item | Acceptance / DoD |
|---|---|---|
| F06.01 | List existing breakpoints and actual 860px switch | CSS breakpoints vs useMobileHub behavior documented |
| F06.02 | Define responsive layout rules at 320/360/390 | No clipping of navigation or first action |
| F06.03 | Define 430–767 mobile wide adaptation | Cards and content preserve readable spacing |
| F06.04 | Define 768–860 mobile hub behavior | Single hub remains functional despite tablet width |
| F06.05 | Define 861–1023 non-hub layout | Primary pages mount separately; no missing links |
| F06.06 | Define 1024–1279 compact desktop layout | Contextual rail collapses and data tables remain navigable |
| F06.07 | Define 1280–1599 desktop content placement | Readable wide content and balanced image/3D space |
| F06.08 | Define 1600–1920 ultrawide layout | No stretched typography or unbounded line lengths |
| F06.09 | Define portrait vs landscape header strategy | Viewport changes do not trap open drawer |
| F06.10 | Define notch/safe-area padding | Controls not covered on mobile browser UI |
| F06.11 | Define touch targets | At least WCAG 2.2 AA constraints; project target >=44 CSS px for primary controls |
| F06.12 | Define scroll behavior for hub anchors | No wrong section after lazy-load or resize |
| F06.13 | Test 860→861 live resize transition | No broken route, stale focus, lost state, or forced reload |
| F06.14 | Test standalone deep links on mobile | /showroom and /season direct URL navigate expected hub sections |
| F06.15 | Test text zoom 200% | Primary navigation, labels and controls reflow without loss |
| F06.16 | Test text zoom 400% | No critical action hidden by fixed header or clipping |
| F06.17 | Test reduced motion across mobile/desktop | Animations do not block navigation or section changes |
| F06.18 | Record viewport screenshots and overflow checks | Evidence per route/viewport including 860 and 861 |

**Phase review:** run targeted + full applicable gates; attach screenshot/test evidence; do not mark complete for a merely pre-existing component. Unresolved blocking gate = HOLD.

