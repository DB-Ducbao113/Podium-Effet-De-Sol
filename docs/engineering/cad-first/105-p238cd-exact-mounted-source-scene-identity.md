# P2.38C–D — Exact source identity and scene carrier acceptance

Date: 2026-11-12. Work branch: `work/engineering-four-corners-local`.

## Defect found

P2.38B checked mounted CAD source mesh **counts** but did not prove that the 59 source mesh IDs at each front wheel, the rear P2.8 wheel-end proxy IDs or the P2.12/P2.14 rear-joint IDs actually matched their original source manifests. A front wheel containing 59 made-up names could report a passing count. An incorrectly attached clone or a hidden parent was likewise not detected by a count check.

## Changes implemented

1. New `mountedCadIdentity.ts` checks the exact source names and stations of all mounted mesh instances, based on the original SHA-verified import manifests and actual `visual.meshes` source nodes. Each front wheel must contain precisely the original 59 P2.8 names. Each rear wheel must contain precisely the correctly filtered wheel-end proxy subset from those same P2.8 original names. When P2.12 alone exists, all 19 rear source names must appear per station. When P2.14 is added, each rear wheel must contain the authentic surviving 15 P2.12 IDs and the exact 16 P2.14 IDs. It does not accept fictitious replacement names with the same count.
2. `ModelBAssemblyStage.tsx` checks this identity alongside existing mounted counts, plus scene-graph ancestry: every source mesh must be an actual descendant of the appropriately named four-wheel carrier. It rejects hidden parent groups, empty/invalid source position attributes, wrong carrier world placement relative to the actual `layoutFourCorners(fit)` translation/yaw, and mismatched CAD click-inspector metadata. The acceptance flag is only set when every check succeeds.
3. `ModelBAssemblyPage.tsx` only exposes the source CAD catalog and verified original-CAD assembly claims after both P2.8 decoding and the mounted scene identity gate. If the 94 import names pass but the scene fails, `modelBChapterTruth.ts` explicitly shows `CAD_SCENE_AUDIT_HOLD` instead of claiming CAD assembly. Replacing source files clears stale mount audit status.
4. The local Chromium CAD QA script requires `data-model-b-mounted-source-identity=PASS` before accepting the scene.
5. Added `mountedCadIdentity.test.ts` (12 Vitest cases) and updated `modelBChapterTruth.test.ts` with an audit HOLD check across all six scroll chapters.

## Verification evidence

- **Executed: 12/12 independent V8 pure-function checks PASS**, invoking the exact saved GitHub `mountedCadIdentity.ts` function body with only its TypeScript type annotations removed.
- Tests cover valid 4-wheel P2.8, P2.12-only rear, P2.12+P2.14 rear, same-count fake or substituted source IDs, former P2.13 bearing placeholders, wrong station, duplicate ID, invalid source proxy manifest, incomplete P2.14, unknown source kind and empty name.
- Source-control files were fetched back from GitHub after commit.
- **Not executed**: the repository's actual Vitest suite, full TypeScript app build and the nested Three.js/Chromium CAD scene. All require the full source checkout and original P2.8/P2.12/P2.14 GLB binaries. Do not claim visual G2 PASS from the pure audit.

## No mechanical claims

94 verified source mesh IDs are **not** 94 certified physical installation mates. P2.8 remains a front-source rear wheel-end visual proxy. P2.34 source84 CV Mechanical G2 remains BLOCKED/HOLD. The code creates no replacement car, fasteners or certified suspension geometry.

## Reproduction in real checkout

```bash
npm ci
npm run typecheck --workspace=@peds/web
npx vitest run apps/web/src/dev/modelBAssembly/mountedCadSceneAudit.test.ts apps/web/src/dev/modelBAssembly/mountedCadIdentity.test.ts apps/web/src/dev/modelBAssembly/modelBChapterTruth.test.ts
npm run dev --workspace=@peds/web
# When native SHA-pinned 59/19/16 source CAD is staged in .local-assets:
npm run qa:model-b:cad-assembly --workspace=@peds/web
```

No GitHub Actions, merge or deployment.

**P2.38 source code complete. Authentic GLB browser acceptance HOLD.**
