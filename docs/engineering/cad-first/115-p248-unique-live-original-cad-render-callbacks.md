# P2.48 — Prevent duplicate and stale original CAD point render evidence

**Date:** 2026-11-13  
**Branch:** `work/engineering-four-corners-local`  
**Source patch:** implemented, pushed  
**Actual Model B + P2.8/P2.12/P2.14 Chromium/WebGL visual acceptance:** HOLD  
**P2.34 mechanical G2:** BLOCKED/HOLD

## Defects fixed

P2.47 improved source CAD QA by counting `THREE.Points.onAfterRender` callbacks rather than just scheduled `BufferGeometry.drawRange` point counts. Two edge cases remained:

1. **Duplicate callback inflation.** A real THREE.Points object can be processed more than once during one render frame (for example if additional rendering passes or repeat callbacks occur). P2.47 would count the same sampled P2.8 geometry twice and could overstate real source-dot coverage and GPU draw calls.
2. **Old source data contaminating replacement scene.** An original P2.8 wheel source is replaced or a CAD inspection changes while a stale source Points callback remains queued. P2.47 did not verify that the callback's point object still belongs to the mounted four-wheel scene before counting it.

## Changes

- `sourceCadRenderEvidence.ts` gains `recordUniqueSourceCadAfterRender()`. It accepts a callback only for a currently mounted original source point object, checks that the object's identity is not already in the current frame's seen set, then invokes the existing source geometry/drawRange/opacity validator. Duplicate or disposed-source callbacks do not update the renderer evidence counter. An invisible source overlay does not consume its identity before a valid draw.
- `ModelBAssemblyStage.tsx` stores the per-frame identity set in `useRef(new Set<object>())`. Each R3F `useFrame` clears the set at the same time as the real callback counts. Every build callback is checked against `buildSourceDots.current`; the selected X-ray callback is checked against `selectedSourceDots.current`. An outdated layer fails closed; even 3 callbacks from one valid point object only contribute one source-dot count.
- `sourceCadVertexDots.ts` removes the source Points `onAfterRender` callback before detaching and disposing its viewer-owned geometry and material. The original source GLB mesh, vertex buffer, identities and transforms remain untouched.
- `sourceCadRenderEvidence.test.ts` adds five Vitest cases: duplicate callback suppression, obsolete-source rejection, 1,000 per-frame resets, same-name hardware at different stations, and invisible/invalid native source callbacks.
- `sourceCadVertexDots.test.ts` adds a callback-disconnection + original-source-preservation lifecycle case.

## Tests actually executed in this patch

A byte-for-byte copy of the GitHub-saved `sourceCadRenderEvidence.ts` was placed in the assistant's local test container. Its `git hash-object` matched GitHub blob `2a1fb1905f542d2d8b625975e1bec62c797bbfc6`.

Executed:
```bash
tsc --strict --noEmit --target ES2022 --module ESNext sourceCadRenderEvidence.ts
node --experimental-strip-types --test sourceCadRenderEvidence.node.test.mjs
```

- **TypeScript strict: PASS.**
- **10/10 native Node test cases: PASS.**
- Coverage: one live original P2.8 mesh counted once per frame; replaced source mesh callbacks ignored; distinct original hardware at different stations accepted despite identical mesh names; 1,000 frame resets; zero-alpha native source dots not counted; original CAD inspection distinct from assembly; malformed point identity; source sample buffer bounds; malformed input rejection; **10,000 frame cycles × 28 actual source-layer identities × 3 duplicate callbacks**, with each object counted exactly once per frame.

The repo's new Vitest cases are authored but were **not run** against the full monorepo. Native THREE/React app typecheck and the authentic 28-frame GLB/Chromium browser acceptance were not performed here because the complete source checkout and private 59/19/16 CAD binaries were not available in the assistant environment.

## Honest evidence boundaries

An `onAfterRender` callback is evidence that Three.js processed the viewer-owned authentic sampled point object in a render pass, **not** proof of visible rendered pixels or a mechanically valid part assembly. Final scene review still requires the real WebGL screenshot and original CAD mesh provenance checks. P2.8-derived rear wheel-end remains a disclosed visual proxy; genuine rear mechanical G2 remains BLOCKED/HOLD.

No GitHub Actions, merge or deployment.
