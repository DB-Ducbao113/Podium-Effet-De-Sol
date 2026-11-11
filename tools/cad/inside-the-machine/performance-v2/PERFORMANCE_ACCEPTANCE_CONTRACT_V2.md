# Podium EDS — Inside the Machine
## Performance Acceptance Contract V2 — Owner Decision Package

**Date:** 2026-10-29  
**Scope:** ITM-I2-R1 local isolated worktree and future controlled DEV qualification  
**Status:** **APPROVED AS DEV REVIEW/QA CONTRACT; NOT YET A PRODUCTION RELEASE WAIVER**  
**Release status:** **HOLD / NO-GO**  
**No tracked repository, CI, or release policy has been modified by this package.**

### 1. Decision and rationale

Replace *raw rAF P95 ≤ 16.7 ms as the sole technical assessment* of an approximately 60 Hz interactive scene with a calibrated, refresh-aware, multi-signal acceptance contract for the next DEV evidence run. **Do not erase or rewrite the legacy result:** ITM-I2-R1 remains **FAIL** under the historical binding contract; the new contract may be used for DEV review, but requires implementation, testing, and an explicit separate production release decision.

The app's previously reported ~60 Hz **idle and active rAF P95 ≈16.8 ms** can arise from browser refresh cadence and timestamp granularity. `requestAnimationFrame` is not a GPU duration measurement. Conversely, the reported **full six-chapter P95 ≈33.5 ms** represents potentially frequent skipped display cycles and is not acceptable without further investigation. F3 and I2-R1 corrected two different first-use shader stalls in local tests; neither means all motion scenarios are smooth.

### 2. Mandatory measurement setup

- Measure one real hardware-backed GPU and browser at a time. Record GPU model, driver/ANGLE renderer, OS, browser version, viewport, DPR, graphics tier, power state, visible tab, actual or calibrated refresh and test commit/worktree.
- On the **same tab, display setting and run**, collect **at least 10 seconds** of idle rAF samples to estimate the refresh period **P = median(idle rAF intervals)**. The clock resolution must be recorded. A throttled/background tab invalidates a run.
- Capture both **window rAF presentation intervals** and **real R3F/render and pose-update activity**. Idle rAF cannot prove the 3D scene rendered. Reject harness runs without real model progression.
- Record first-load-to-interactive-ready separately, including font, poster, GLB decode, actual shader preparation and browser restoration. **Never hide pre-ready work**, but do not misclassify deliberately poster-covered compilation as an interactive stall.
- Test fresh first real scroll, warmed full six-chapter scroll, full reassembly, isolation/orbit, quality restart and WebGL context restore. A full-scroll run must cover all six chapters with verified real pose updates; a reassembly run must verify all 75 transform records return exactly.
- Run at least **five valid fresh first-scroll trials** and **five valid complete traversals/reassembly trials per target GPU/tier**; retain all valid trials, including failures. Use **≥15 s** of active evidence for each continuous scenario, with timed screenshots disabled. Randomize/counterbalance ordering when comparing revisions.
- Scope target refresh modes explicitly. **60 Hz is the first qualification target. 120/144 Hz and physical mobile remain NOT QUALIFIED until separate real measurements.** Do not infer a GPU or display PASS from another refresh mode.

### 3. V2 contract thresholds (candidate desktop tier, measured display P)

| Gate | Rule | Reason / interpretation |
|---|---|---|
| Calibration | P from measured idle median; >=10 s visible idle samples | Avoid treating nominal 16.667 ms as an exact browser callback period |
| Cadence delta | active rAF P95 - matched idle rAF P95 <= **max(0.5 ms, 0.05P)** | Allows measured scheduler jitter, not a second lost vsync |
| Missed refresh | Count active intervals > **1.5P**; **<=2%** per valid continuous scenario/trial | A 33 ms interval on a 60 Hz display counts as missed even if average FPS looks healthy |
| P99 tail | active rAF P99 <= **2P + 0.5 ms** | Constrains frequent double-period outliers |
| Worst frame | no active interval > **3P + 0.2 ms** | Catches severe freezes independently of P95/P99 |
| Long Tasks | **0 active main-thread tasks >=50 ms** | First input and active scrolling must not be interrupted by heavy main-thread work |
| First input | input → first changed, visible model frame <= **2P + 0.5 ms** in fresh trials | Proves the model reacted, not merely that a scroll handler fired |
| Functional integrity | chapter 1→6 observed, actual scene progress, exact 75-transform reassembly, no blank Canvas | Prevents false performance PASS from frozen/inactive scenes |
| GPU/CPU evidence | CPU trace and non-disjoint WebGL GPU timer where supported; otherwise **NOT MEASURED** | Does not infer GPU cost from rAF alone |

**These numbers are proposed project QA policy thresholds, not universal browser or Khronos standards.** They are intentionally strict about frequent 33 ms frame drops, initial user freezes and hidden/inactive test harnesses. They must not be relaxed post hoc to get a PASS. For 120/144 Hz, recalibrate P and explicitly qualify the intended update cadence/tier; do not accept a low-tier deliberate frame cap as missed-vsync data without a declared cadence model and separate owner-approved target.

### 4. Per-run and phase decisions

- **PASS V2 (DEV, one GPU/tier only):** every applicable required threshold passes in **all valid required trials**, measurements are complete, and no material WebGL/context/resource regression is observed.
- **FAIL V2:** a valid trial breaches any mandatory threshold (including a full-traversal P95 ~33.5 ms due to repeated missed refresh). A failing trial must not be omitted or averaged away.
- **INCOMPLETE:** missing valid sampling, matching idle calibration, actual active motion, full chapter coverage, device identification, or required scenario coverage. When GPU timers are unsupported, label that metric NOT MEASURED with corroborating CPU/rAF traces; do not fabricate GPU figures.
- **DEV local integration acceptance** is separate from **production release**. Passing V2 on a desktop does not clear physical Android/iOS, 120/144 Hz, integrated accessibility, CI, two automated data sources, Cloudflare Preview, resource/thermal or security gates.
- **Legacy contract reporting:** always print `LEGACY_P95_16_7 = FAIL/PASS` alongside `V2 = PASS/FAIL/INCOMPLETE` until a separate owner decision changes the production release policy. Existing historical reports stay intact.

### 5. Current evidence disposition (no new benchmark claimed)

| Area | Available evidence | Status under V2 |
|---|---|---|
| ITM-I2-R1 first interaction | Connector Points/LineSegments prewarm; 5/5 first-scroll retests with no Long Task or missed refresh, CPU worst 3.3–4.7 ms, GPU worst 7.59–14.11 ms | Promising **scoped** evidence, not complete V2 qualification |
| Matched ~60 Hz idle and short active | Idle ~16.8 ms; active rAF ~16.8 ms | Suggests raw 16.7 ms threshold is ill-calibrated; not sufficient alone |
| Full six-chapter traversal | Reported P95 ~33.5 ms and ~33 ms tails | **FAIL pending a complete repeat under V2**; do not assert PASS |
| Isolated worktree Model B | Provisioned; Showroom HTTP 200, ITM GLBs verified; issue reclassified `ENVIRONMENT_PROVISIONING_ERROR — RESOLVED` | PASS provisioning; separate from performance |
| Physical Android/iOS, 120/144 Hz, CI, Cloudflare Preview | Not run | NOT QUALIFIED / NOT RUN |

### 6. Authorized next action (no public release)

Implement the V2 instrumentation and reporter **only in the isolated ITM worktree**. Preserve the existing Model B assets, six chapters, semantic transforms, Quality Lock, shader preparation and Showroom code. Reproduce full-traversal 33 ms tails, obtain credible GPU/CPU attribution, fix only demonstrated defects, and run the complete active-motion V2 matrix. No stage/commit/push/merge/PR/deploy. Stop at OWNER REVIEW. A separate owner decision is required before changing production CI/release rules or enabling any remote deployment.

### 7. External technical references

- MDN: `requestAnimationFrame` generally follows display refresh and is not a per-frame GPU timer: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
- MDN Long Tasks: tasks of >=50 ms can impair input and scrolling: https://developer.mozilla.org/en-US/docs/Web/API/PerformanceLongTaskTiming
- Khronos WebGL2 `EXT_disjoint_timer_query_webgl2`: https://registry.khronos.org/webgl/extensions/EXT_disjoint_timer_query_webgl2/
