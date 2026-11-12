# P2.38A–B — Model B four-wheel source scene assembly acceptance

**Date:** 2026-11-12  
**Branch:** `work/engineering-four-corners-local`  
**Status:** Source code and local audit written; real Chromium/GLB visual acceptance **HOLD**.

## Why this patch exists

P2.35F correctly reported 94 unique native source CAD meshes from the original P2.8 (59), P2.12 (19) and P2.14 (16) decoded GLB assets. **Those 94 source mesh names do not prove the preview actually mounted four wheel assemblies**: P2.8 is cloned into two front stations and filtered into two rear wheel-end proxy stations, while P2.12/P2.14 are instantiated twice at the rear. A scene with one missing mount could report a misleading 94/94 source status.

## P2.38B: count actual source mesh nodes in the rendered scene

- `mountedCadSceneAudit.ts` audits `visual.meshes` returned by the real `createWheelVisual` construction path, rather than trusting upload manifests.
- Both front positions must each mount **59 original P2.8 source meshes**.
- Both rear stations must mount an equal, positive count of genuine P2.8-derived wheel-end visual proxy meshes; the count depends on the real source part categories.
- The partial `P2.12 only` path correctly mounts **19 original rear-toe meshes per station**.
- When native P2.14 is loaded, **four old annular placeholder-bearing source meshes must be replaced**. Each rear position must mount precisely **15 P2.12 + 16 P2.14 = 31 unique native source mesh instances**, not 19+16=35.
- Duplicate original mesh names at one station, a missing front wheel part, mismatched left/right rear proxies, missing or duplicated split joints, and incorrectly loaded P2.14-only parts fail validation.
- Source audit metadata remains explicit: `mechanicalMateCertified:false`, `genuineRearSuspensionAvailable:false`, `rearUsesFrontSourceWheelEndProxy:true`.

Stage emits a fail-closed audit with `onMountedCadAudit`; `ModelBAssemblyPage` displays the actual number of assembled source mesh **instances**, and exposes machine-readable per-wheel source counts. This is additional evidence beyond the 94 unique source mesh identities.

**Executed:** 8/8 independent Node V8 tests PASS against the real GitHub-committed `auditMountedCadScene` function body (pure TypeScript annotations stripped for execution). Repo Vitest was authored but not run.

## P2.38A: real local Chromium acceptance

Added `apps/web/scripts/verify-model-b-cad-assembly.mjs`, invoked with:

```bash
npm ci
npm run dev --workspace=@peds/web
# After the project's existing native SHA-verified source staging is complete,
# run from a separate local terminal:
PEDS_CHROMIUM_PATH=/usr/bin/chromium \
 npm run qa:model-b:cad-assembly --workspace=@peds/web
```

The test requires DEV-only loopback `/__peds-model-b-cad/index.json` and all original 59/19/16 source assets. The Vite plugin serves the seven strictly whitelisted endpoints from ignored `.local-assets/model-b-scroll-preview`; nothing is copied to production.

In desktop 1440×900 and mobile 390×844, the test:
1. Waits for SHA-verified original Model B GLB, 94 decoded CAD source meshes, four measured wheel stations and 31 visible rear source meshes per station.
2. Verifies the **actual mounted scene audit**: 59 P2.8 front parts per side, symmetric P2.8 wheel-end rear proxies, 15 P2.12 + 16 P2.14 per rear, and `mounted=180+2*rearProxyCount`.
3. Requires the exact original Model B Git blob identity, four old rear proxies removed and `mechanicalMateCertified:false` at every provenance layer.
4. Captures eight forward/reverse scroll frames × two viewports, uses PNG pixel analysis to reject blank/offscreen full-car views and detects scene changes.
5. Opens the authentic CAD part catalog and inspects a named source part while verifying the UI still says `VISUAL ONLY · G2 HOLD`.
6. Writes 16 PNG screenshots and desktop/mobile JSON evidence to a local ignored `artifacts/` directory.

**The new Chromium program was syntax-checked but was not run on the actual car.** The assistant runtime lacks the original Model B GLB and original 59/19/16 CAD source files and installed app dependencies; no manufactured full-car screenshot or assembly video is claimed.

## Reproduction tests

```bash
npm run typecheck --workspace=@peds/web
npx vitest run \
 apps/web/src/dev/modelBAssembly/mountedCadSceneAudit.test.ts \
 apps/web/src/dev/modelBAssembly/sourceWorldReveal.bounds.test.ts \
 apps/web/src/dev/modelBAssembly/sourceWorldReveal.three.test.ts
```

No GitHub Actions, merge or deploy. Mechanical P2.34 G2 HOLD is unchanged.
