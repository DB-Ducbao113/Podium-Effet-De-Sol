# PEDS | FRONTEND TASK CONTRACT, DEPENDENCIES AND QUALITY GATES

This document defines **how one microtask is picked, changed, checked and checked off**. The microtasks themselves are in `01_MICROTASKS_FOUNDATION.md` and `02_MICROTASKS_EXPERIENCE.md`. The checkbox board is `TASK_BOARD.md`.

## 1. Microtask unit

Exactly **one task ID per implementation request** by default, e.g. `F04.05`. A group of tasks requires an explicit batch and separate result per ID.

Before editing the agent must produce:

```text
ID:
Intent:
User flow / route:
DEV or production or both:
Expected behavior:
Current behavior verified from code:
Dependency phase / preceding task evidence:
Primary owner file(s):
Read-only related files:
AMBER/RED boundary and approval:
Acceptance (Given/When/Then):
Focused tests to add/run:
Browser routes/viewports/failure scenarios:
Out-of-scope:
```

Each task's **default implementation target** is one primary component or one behavior contract, not a broad site rewrite. Touching 2–3 related files (component, scoped CSS, test) is fine; cross-cutting files require justification. The task table's "Acceptance" column gives a minimum, not permission to ignore accessibility/security.

## 2. Phase gates

| Gate | After phase | Required tangible output |
|---|---|---|
| M0 | F00 | current route inventory; desktop/tablet/mobile annotated wireframes; design options + decisions; no code changes |
| M1 | F01–F03 | App Shell, navbar and sidebar/drawer UX; keyboard navigation and mobile layout documented/tested |
| M2 | F04–F06 | Home intro/reload matrix, route loading/error/recovery states, viewport/860 breakpoint evidence |
| M3 | F07–F08 | approved tokens/typography/primitives, motion contract, reduced-motion and keyboard evidence |
| M4 | F09 | verified 3D readiness/loading/camera/graphics/fallback and licenses |
| M5 | F10–F14 | independently approved/tested Home, Championship, Showroom, Engineering, Directory/Profile routes |
| M6 | F15 | full browser matrix, accessibility, fault injection, performance, security, local + GitHub rebuild verification |

**No next phase is “done” only because components exist.** Current repo already has preloader, 3D, navbar and state components; their new design acceptance is still unverified and unchecked.

## 3. Approved file change policy

Use `docs/AI_FEATURE_FILE_MAP.md` and `docs/AI_EDIT_POLICY.md` to trace exact owners and GREEN/AMBER/RED rules. Never edit broad global style, shared routing/state, data snapshots, Worker config, protected model/video or logo merely because a task is called “modernize UI”.

High-impact example:
- `F02.07` navbar dropdown: `components/layout/Navbar.tsx` + scoped CSS + `Navbar.test.tsx`.
- `F03.09` drawer keyboard: approved new `components/layout/SidebarDrawer.tsx` + tests; touch `App.tsx` only when shell integration genuinely needed.
- `F04.14` intro test: `documentIntroState.test.ts`, `F1StartLightsPreloader.test.tsx`, only change timing code if tests expose a bug.
- `F05.13` hide error stack in production: `components/common/ErrorBoundary.tsx` + focused tests; preserve developer diagnostics in appropriate logs, not user interface.
- `F06.13` breakpoint transition: `useMobileHub.ts`, `MobileAllInOne.tsx` only when test proves defect; do not globally change 860px silently.
- `F09.17` 3D metrics: `dev/commercial-b/frameMetrics.ts` and viewer only; **not** protected `public/models/*.glb`.
- `F11.15` standings regressions: mostly tests; no fake fixes in `baselineCutoff.ts`.

## 4. Required verification for every completed task

1. Before: `git branch --show-current`, `git status --short`, HEAD and scoped baseline screenshots/tests.
2. Implement only approved file allowlist and explicitly re-review if import/behavior trace expands scope.
3. Focused tests (Vitest) plus complete applicable root checks: `npm run lint`; `npm run typecheck`; `npm run test:coverage`; `npm run security:secrets`; `npm run security:assets`; `npm run security:audit`; `npm run build`; `npm run cloudflare:dry-run`; `git diff --check`. Check formatter status and distinguish inherited failures.
4. For visible UI: real Chrome/Edge/other available browser. QA viewport 320, 360, 390, 768, 860, **861**, 1024, 1280, 1440, 1920; inspect primary route + its interaction, overflow, screenshot, focus, EN/VI, 200%/400% zoom where relevant. Browser not available = `NOT VERIFIED`, not PASS.
5. For Home intro, additional matrix: first visit, F5/Home, Ctrl+R/Home, direct deep link, SPA navigation, skip Escape/Space, reduced-motion, hard reload under slow network, race load failure, visible/background tab.
6. For 3D: loading/decoding errors, WebGL unsupported, context lost, retry, static fallback, mobile input, graphics tier, resize, release/dispose, adaptive measured FPS.
7. For data page: stale/empty/partial, source attribution, 429/503/timeouts, true results and season cutoff maintained.
8. After the **last** edit: review `git diff`, current branch, local HEAD, uncommitted vs unpushed commits, `origin/rebuild` where reachable and CI for exact pushed SHA. Never claim remote done if work is only local.
9. Store evidence per task in a structured report (small Markdown in `docs/qa/frontend/` if authorized, screenshots under ignored local paths). **Do not commit generated private or unlicensed art.**

## 5. Definition of status

- `TODO`: not accepted; even if earlier implementation exists.
- `IN PROGRESS`: active with clear owner/acceptance.
- `BLOCKED`: dependency or approval missing.
- `IMPLEMENTED / HOLD`: code exists, required gate failing or not tested.
- `LOCAL VERIFIED`: source/test/static/browser gates applicable to this microtask demonstrably pass locally.
- `REMOTE VERIFIED`: changes present in exact `origin/rebuild` commit and matching GitHub Actions PASS, manual gates already evidenced.
- `RELEASE VERIFIED`: only with explicitly approved deployment and smoke; never infer from GitHub CI.

Task board checkbox `[x]` only after **REMOTE VERIFIED** for implementation tasks, or **approved design deliverable** for F00 plan tasks (with named evidence). In an agent run without push approval, leave checkbox unchecked and report LOCAL VERIFIED.

## 6. Evidence record per task

```text
PEDS-FRONTEND MICRO-TASK REPORT
Task ID:
Task title:
Dependency status:
Affected route(s):
Expected outcome and actual result:
Before screenshot/test reference:
Changed file allowlist vs actual diff:
Tests added:
Focused test outcome:
Full quality checks:
Browser, width, EN/VI, reduced motion:
Fault injection (if relevant):
3D/performance (if relevant):
Approved design/asset exceptions:
Current branch + local SHA:
origin/rebuild SHA / CI:
Final state:
Evidence links/paths:
```

## 7. Separate design review from code work

F00 includes documentation and wireframes, **not** application code changes. A visual direction draft is not approval to replace current CSS or public media. For page redesign phase F10+ use `/peds-map <task ID and page>` to create the file allowlist, review proposed geometry/content, then use `/peds-work <ID>` with the design approved. Do not perform “all pages redesign” in a single instruction.

## 8. Performance and accessibility reference targets

- [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals): field p75 good targets LCP ≤2.5s, INP ≤200ms, CLS ≤0.1. Lab values are diagnostic and not field certification.
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/): keyboard, visible focus, focus not obscured and usable target sizes; project's chosen primary touch target ≥44×44 CSS px is more conservative than WCAG AA 24px criterion (which has exceptions).
- [MDN View Transitions](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API): optional enhancement; source warns of focus/reading position implications in SPA transitions.
- [Chrome Motion Guidance](https://developer.chrome.com/docs/modern-web-guidance/guides/ui-behaviors/motion): favor compositor-friendly transform/opacity; honor prefers-reduced-motion and pause persistent animation.
