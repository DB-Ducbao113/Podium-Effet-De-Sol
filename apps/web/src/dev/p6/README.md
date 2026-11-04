# P6 V2 local Showroom review

`http://localhost:5173/showroom` renders this 11-team livery study in Vite DEV. The production Showroom uses the owner-selected Model B asset. `?review=model-b` opens the earlier Model B material review in DEV.

The runtime and its 51 referenced artwork files are self-contained in this directory. It does not import from `scratch/`. The frozen Model B file is still loaded through the existing DEV-only `/__peds-review/model-b.glb` route from `source-assets/models/model-b/model-b-eds-optimized-v1.glb`; preserve that source asset when organizing the repository.

`officialArtwork.ts` records the source for each copied mark. The photos, brand marks, and derived artwork remain limited to local owner review. The historical ten-team sponsor and visual gaps still require owner review; the old `scratch/` QA report was disposed of with the approved cleanup. Do not treat a successful build or working team selector as visual approval.

## Model B Livery V2 — first implementation slice (2026-11-04)

This branch now runs a **geometry-first sponsor preflight** before P6 decals are created:

- `modelBSurfaceAudit.ts`: 5×5 real mesh raycasts per candidate; measures coverage, world-space normal spread, projected letter stretch and planar depth range. Requires the centre of the mark to have a surface.
- When the source anchor fails, the runtime tries uniform scale 0.88/0.72 and small same-panel translations. It does **not** distort the artwork aspect ratio or cross to a different mesh.
- Invalid or restricted artwork is not rendered; each rejection is recorded as `unplaced` or `blocked`, rather than inserting a floating/illegible wordmark.
- Flat wing appliques follow measured surface-hit positions instead of hard-coded X coordinates; an additional shallow-depth preflight is mandatory.
- `standard2026References.ts`: one official 2026 livery gallery per team; galleries are **external-only**, and individual view coverage/rights remain unverified.
- Cadillac's default study is frozen to its **February 2026 split white-left / black-right launch**. Midseason revisions must be represented as a separate future variant.
- `main.tsx`: P6 Advanced tab shows placed/adapted/unplaced/blocked counts. For detailed metrics, open browser DevTools and run `window.__P6_LIVERY_DEBUG__()` on the local review page; `placementAudit` includes each attempted anchor, coverage, normals, stretch and reason.

**What the counters mean:** A `placed` result means sampled geometry and decal creation checks passed; it does **not** mean the sponsor, photo angle, artwork rights or final visual legibility has been accepted.

**Checks to run in a local checkout with licensed review assets:**

```bash
npm ci
npm run typecheck --workspace=@peds/web
npm run test --workspace=@peds/web -- modelBSurfaceAudit.test.ts standard2026References.test.ts
npm run lint
npm run build
```

Open `http://localhost:5173/showroom?author=1` in DEV, switch through all 11 teams and use the P6 Advanced tab plus canonical gallery links. Compare both sides, front, rear, top and three-quarter cameras; report poor coverage, clipped text, z-fighting and paint-mask seams. `?review=model-b` still opens the unaffected material-only review.

**Environment limitation:** Repository CI only triggers on push to `main` / `migration/**` or a pull request. This feature branch's commits do **not** automatically run the repository's existing CI workflow. The tests above are committed but **have not been executed in this connector-only audit environment**. The P6 artwork `reference-assets` files are local owner-review resources and not present in the Git tree; do not treat a GitHub-only build as the complete local visual QA.

**Release lock:** No production integration, GLB alteration, homepage motion change, branch merge, or deployment was performed.
