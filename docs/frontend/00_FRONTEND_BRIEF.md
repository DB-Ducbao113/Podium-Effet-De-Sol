# PEDS | F1 FRONTEND INTENT AND NON-NEGOTIABLE UX

**Owner goal:** a contemporary, visually powerful Formula 1 website with responsive editorial layouts, dynamic interactive scenes and modern 3D technology. **This is a planning design brief, not the final visual design approval.**

## Creative concept to explore, not yet approved

Working concept: **Race Control × Engineering Lab × Motorsport Editorial**.

- **Structure:** high signal-to-noise ratio; information visible and actionable first, cinematic backgrounds subordinate to navigation and real data.
- **Tone:** speed, precision, mechanical depth, technical instruments, telemetry-inspired numbers, high contrast, strong typographic hierarchy.
- **Motion:** meaningful race-light reveal on deliberate entry, gentle feedback for interaction, brief route transitions, cinematic scene-level movement only where justified.
- **3D:** one premium deep-interaction Showroom, lightweight optional Home storytelling, explanatory Engineering visuals; always lazy-load with poster/low-GPU fallback.
- **Responsive:** phone is not a scaled desktop; content hierarchies, controls and 3D mode adapt, while functional routes remain reachable.
- **Integrity:** data source provenance, licensed assets and design constraints override aesthetic ideas.

### Information architecture proposal

**Desktop:** global top bar (brand, primary destinations, season/context, language) + optional contextual sidebar/rail (current feature actions, filters, 3D controls only where useful) + main stage/content + footer. Do **not** duplicate every top-level link in a permanent sidebar.

**Tablet:** condensed top bar; contextual rail collapses or moves behind a clear control; avoid squeezing result tables.

**Mobile:** navigation and tasks remain reachable by a drawer/bottom affordance, while existing <=860px MobileAllInOne behavior must be examined before any redesign. Preserving deep links, data and scroll semantics is required.

### Proposed visual language (illustrative, NOT final locked tokens)

- Carbon/dark technical canvas with disciplined contrasting light editorial sections.
- Racing red/orange/amber signals used selectively for hierarchy, call-to-action, and explicit status.
- Prominent condensed racing display typography; tabular, monospaced telemetry metrics; calm body copy.
- Controls communicate precision (clear alignment and state) rather than constant glow, fake HUD noise or excessive particles.
- Motion system tiers: **essential** (state changes), **supporting** (hover/reveal), **cinematic** (hero/3D). The user must be able to reduce motion and skip nonessential intro.

## Strict UX loading semantics

| Situation | User-visible contract | Never do |
|---|---|---|
| First Home document entry | Optional branded F1 starting lights then Home reveal; skip available | Hide content for an arbitrary long timer |
| F5 / refresh Home | Follow explicitly chosen reload policy; do not lose selected data or scroll semantics | Confuse network loading with an intro animation |
| Direct deep link other than Home | Show requested content/skeleton immediately | Display Home intro over Results/Showroom |
| Internal route navigation | Brief lightweight transition; loading shown only if needed | Replay full document preloader on every click |
| Slow network/API | Per-module skeleton, stale/empty/error as appropriate | Spinner forever or fabricated official data |
| Model/WebGL loading | Reserved canvas slot with poster/status and fallback | Block full website behind model download |
| Render exception | Safe error panel, retry/home and recover | Print component stack trace to production screen |
| Offline/timeout | Honest state and retry, cached content when valid | Claim live data while offline |

Existing `F1StartLightsPreloader` and `DocumentIntroController` already implement Home-only logic, including reload and skip. Audit the current behavior before deciding improvements. Existing `ErrorBoundary` currently renders technical error details; plan to remove them from production UI safely (with tests), not via unrelated refactor.

## Interaction and tech philosophy

- Reuse React, Vite, Three.js/R3F, Drei, animejs and existing components where practical. Do not install “trendy” libraries without specific gaps.
- Evaluate modern CSS and View Transitions API as **feature-detected enhancements**, not as critical browser requirements.
- Respect `prefers-reduced-motion`, keyboard-only focus, touch control, source descriptions and accessible error feedback.
- Suggested quality targets: CWV good thresholds LCP <=2.5s, INP <=200ms, CLS <=0.1 at p75 **when real field measurements exist**. Treat lab tests separately and do not certify field metrics from synthetic runs.
- Build and draw calls are budgets to measure, not stylistic claims. Desktop 3D may target fluid 60 fps, mobile adaptive 30–60 fps where hardware allows; fallback beats forcing heavy WebGL.

## Non-negotiable assets/product boundaries

- Original brand/logo kept and not distorted.
- Existing protected production homepage video/poster bytes must not be re-encoded without owner permission.
- Model B production Showroom remains attributed and hash-locked; no unapproved “own design” claim.
- Withdrawn EDS-G01 derived imagery stays withdrawn.
- DEV P6 showroom and Inside Machine routes are not proof of shipped production design.
- F1 classification and engineering claims remain verifiable, never invented for presentation.

## Creative approval checkpoint

Before implementation of F07 global style or any major route redesign, approve: layout wireframes, navigation/sidebar roles, Home fold, palette/type direction, motion storyboard, 3D role, mobile page architecture and source asset list.

## References

- [MDN View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)
- [Chrome Motion Guidance](https://developer.chrome.com/docs/modern-web-guidance/guides/ui-behaviors/motion)
- [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [Google Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals)
