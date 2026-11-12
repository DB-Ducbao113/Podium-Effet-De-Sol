# P2.36 — Unified Model B scroll mapping and local browser review

**Date:** 2026-11-12.
**Branch:** `work/engineering-four-corners-local`.
**P2.34 source84 mechanical G2:** BLOCKED/HOLD.
**P2.35F visual-source coverage audit:** implemented; WebGL visual acceptance outstanding.

## P2.36A — One position mapping, three controls

The `ModelBAssemblyPage.tsx` previously calculated scroll progress manually from `-getBoundingClientRect().top / range`, the chapter rail destination with a separate manual equation, and the keyboard/touch scrub slider with `assemblyScrollTop()`. Separate equations risk a chapter jump, scrollbar and slider reporting different progress values.

All three controls now use the same `assemblyScrollTop` / `assemblyScrollProgress` functions in `assemblyScrubPosition.ts`. Slider drag clamps to [0,1], gets the DOMRect only once and updates the shared `progressRef` with the same bounded value used by the browser. Real page scrolling is inverted to the exact same model, including when navigating backward and in portrait layout.

Existing `assemblyScrubPosition.test.ts` gains two additional tests for chapter fractions [0,.15,.30,.50,.69,.85,1] across desktop/mobile/short track dimensions and for a descending 1,001-position DOMRect scroll sequence.

**Local pure TypeScript compilation:** PASS (`tsc --strict --noEmit`).
**Actual independent Node tests on the exact pure scroll algorithm:** 6/6 PASS, including 1,001 keyboard points, all seven chapters across four viewport layouts, 1,001 reverse DOMRect positions, input validation and bounds. Local test copies live in `/mnt/data/p236a`.
**Repository Vitest and TypeScript web build:** NOT EXECUTED here due unavailable full frontend checkout/dependencies.

## P2.36B — Browser QA program for the real GLB

Added `apps/web/scripts/verify-model-b-source-only.mjs` and the package command `qa:model-b:source-only`.

The script:
1. Launches Playwright Chromium against a **local Vite DEV server** and forces `?sourceOnly=1` so the test does not silently consume private imported CAD.
2. Waits for the SHA-1-verified original Model B GLB to finish decoding.
3. Asserts `OWNER_EXTERIOR_ONLY` visual source state, 0/94 decoded CAD, original source-only reveal, mechanical G2 false.
4. Exercises eight forward/reverse scroll points on desktop (1440x900) and mobile (390x844).
5. Saves 16 screenshots of the actual WebGL canvas to `artifacts/model-b-source-only/`, checks that the canvas changes across chapters and fails on uncaught browser JavaScript errors.
6. Never uploads original GLB or any CAD source, and never invokes GitHub Actions.

The script was syntax-parsed successfully after removal of its four ESM imports (the remaining async module body compiles). **It was NOT executed against the app**: Chromium executable exists in this environment, but the complete GitHub checkout, dependencies and GLB binary were not available locally. Browser screenshots have **not** been produced. Visual rendering is therefore NOT approved.

## Manual execution — real checkout

```bash
npm ci
npm run typecheck --workspace=@peds/web
npx vitest run apps/web/src/dev/modelBAssembly/assemblyScrubPosition.test.ts
npm run dev --workspace=@peds/web
# In another terminal:
PEDS_CHROMIUM_PATH=/usr/bin/chromium \
  npm run qa:model-b:source-only --workspace=@peds/web
```

Source-only visual QA must PASS before any frontend acceptance claim. The original CAD P2.8/P2.12/P2.14 layers must be staged and separately visually inspected to validate the source-equipped assembly. Even a browser PASS would not certify G2 or native 84-solid CV mechanical mates.

## Gate

**P2.36 source implementation: complete for A+B; browser acceptance: HOLD.**
No merge, deploy or GitHub Actions executed.
