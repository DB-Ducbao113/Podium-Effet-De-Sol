# P2.36A/54 — Direct assembly scrub control (P2.35 stopped after C)

Date: 2026-11-12. Branch: `work/engineering-four-corners-local`.

## Phase transition

P2.35A–C added source-only body choreography, staggered source mesh motion, and restoration of individual original GLB material transparency. No further P2.35D patch was justified: the remaining verification requires an actual browser, not more micro-patches. P2.35 is **implementation delivered, browser QA pending**, not certified as complete. P2.34 mechanical G2 remains BLOCKED/HOLD.

## P2.36A implementation

The existing Model B footer showed a passive progress bar; users had to scroll through a 735svh document to inspect one assembly pose. P2.36A replaces it with an accessible HTML `input[type=range]` that directly scrubs the **same** page scroll coordinate, retaining the existing React progress reference and Three.js frame animation. It supports keyboard arrow controls and pointer drag, exposes a visible keyboard focus outline, and honors existing page scroll choreography without an independent competing animation state.

- `assemblyScrubPosition.ts`: pure normalized forward/reverse mapping between track offset, viewport height and progress, with finite input validation and clamping.
- `ModelBAssemblyPage.tsx`: direct slider interaction updates actual window scroll and the live assembly progress. Existing chapter navigation and scrolling remain.
- `modelBAssembly.css`: focus-visible, touch-sized slider thumb and neutral track.
- `assemblyScrubPosition.test.ts`: four Vitest tests for exact positions, 1,001 reversible positions, clamping, and invalid input.

## Verification

A standalone local TypeScript compile with `tsc --target es2022 --module esnext` succeeded. The compiled JavaScript was executed under Node.js v22.16.0; **4/4 independent test groups PASS**, including **1,001/1,001 scroll roundtrips**. These checks validate the coordinate mapping only. The authored Vitest suite, full app TypeScript build, actual GLB render, keyboard accessibility in a browser, and Chromium screenshots/video have **not** been executed in this environment.

## Limitations

The scrubber changes visual timeline navigation only; it does not invent F1 parts, complete rear wheel-end source geometry, certify mechanical mates or close P2.34. No merge, deploy or GitHub Actions.

**P2.36/54 IN PROGRESS.**
