# P2.36C — Pixel-level Model B WebGL visual review

Date: 2026-11-12. Work branch: `work/engineering-four-corners-local`.

## Reason

The earlier source-only Chromium smoke accepted any two screenshots with different SHA-256 hashes. Slight timing, antialiasing or canvas noise could change a PNG hash while the authentic F1 remained invisible or offscreen. It also did not measure whether the 16 emitted screenshots contained actual visible non-background content.

## Implementation

- `apps/web/scripts/model-b-frame-audit.mjs` uses the installed `sharp` decoder on canvas PNGs, not a screenshot of page text overlays. It compares pixels against the renderer's actual background `#080e18`, reports source silhouette bounds, visible foreground area and mean brightness, and rejects blank/nearly blank frames.
- The full-car final frame must occupy at least 8% canvas width and 4% height. These are conservative smoke thresholds, not a proof of framing perfection or any physical CAD mate.
- `modelBFrameDifference()` counts pixels with a material RGB color difference rather than relying solely on PNG byte hashes.
- `verify-model-b-source-only.mjs` calls those checks at all eight scroll/reverse samples for each desktop/mobile viewport, outputs 16 screenshots and a machine-readable per-viewport `*-audit.json` report, and fails on blank/offscreen frames, absent chapter motion or browser JS errors.
- `model-b-frame-audit.test.mjs` contains six Node tests using generated PNG fixtures.
- `apps/web/package.json` exposes `npm run qa:model-b:frame-audit --workspace=@peds/web`.

## Verified locally, without the real F1 asset

The six PNG fixture tests were actually run with Node's test runner and globally available Sharp: **6/6 PASS**. An initial error in the mismatched-dimensions fixture (passing unresolved Promises to the decoder) was detected, fixed and retested.

A real local Chromium binary (144.0.7559.96) and Python Playwright launched successfully. Canvas screenshots were captured from an intentionally synthetic local QA fixture: blank background rejected, a visible shape accepted, and a moved shape measured at **15.63% changed pixels**, PASS. This checks the image-quality detector only. It is NOT a rendered Model B car.

The GitHub repository's real Model B GLB, app npm dependencies and actual Vite source scene were not available in this sandbox. Therefore **the app's real source-only Chromium test remains NOT EXECUTED; frontend visual acceptance is HOLD**. No physical CAD source, car render or production screenshot was fabricated.

## Local full-app acceptance

```bash
npm ci
npm run qa:model-b:frame-audit --workspace=@peds/web
npm run dev --workspace=@peds/web
# In a second terminal:
PEDS_CHROMIUM_PATH=/usr/bin/chromium npm run qa:model-b:source-only --workspace=@peds/web
```

Result is a local 16-screenshot `artifacts/model-b-source-only/` record plus desktop/mobile JSON audits. Do not call a full-car render PASS without the actual source GLB.

No GitHub Actions, merge or deploy. P2.34 mechanical G2 remains BLOCKED/HOLD.
