# Podium EDS — Model B + original P2.8 run readiness (2026-11-08)

**Repository:** `DB-Ducbao113/Podium-Effet-De-Sol`  
**Branch:** `feat/engineering-inside-machine-v2`  
**Delivery:** DEV-only, no merge, no production deploy.

## Actual execution status

| Scope | Result | Evidence |
|---|---|---|
| Existing showroom Model B path and P2.8 project-authored CadQuery sources | Located in the GitHub source tree | `apps/web/public/models/model-b-eds-optimized-v1.glb`, `tools/cad-first/p2_*.py` |
| Local owner-private P2.8 STEP/GLB binaries in current ChatGPT runtime | **ABSENT** | Runtime asset gate recorded in conversation |
| Source regeneration orchestration | Authored/committed, NOT executed with original repo | `tools/cad-first/rebuild_owner_p28.py` |
| Source/archive discovery (no overwrite; ZIP path safety) | Authored/committed; not executed on Windows owner's disk | `tools/cad-first/locate_owner_p28.py` |
| Three.js overlay / manual source landmarks / reversible wheel mesh hiding | Authored and pushed | `apps/web/src/dev/assemblyPreview/` |
| Original-root visual registration export | Authored and pushed | `AssemblyPreviewStage.tsx`, `AssemblyPreviewPage.tsx` |
| Standalone mesh AABB diagnostic | **Local synthetic tests PASS; owner source not run** | `tools/cad-first/audit_assembly_mesh.py`, `test_audit_assembly_mesh.py` |
| TypeScript / Vitest / production build | **NOT EXECUTED in active repo working tree** | Built into the owner runner as hard prerequisites |
| Actual owner browser video | **NOT CREATED** | Recorder script committed; owner source files inaccessible in execution runtime |
| Mechanical G2 and final full-car acceptance | **HOLD** | No validated cross-source hardpoints, complete suspensions or 18-chapter whole-car film |

## Owner Windows single-command run

In Windows PowerShell, with the full project cloned/checked out on this feature branch:

```powershell
cd "E:\Formula 1\Podium-Effet-De-Sol"
powershell -ExecutionPolicy Bypass -File scripts\review-original-fullcar.ps1
```

The command installs Python/npm/CAD/browser dependencies if missing, searches for the original owner P2.8 in `.local-assets`, `scratch`, local project archives and existing P2.8 ZIPs, reuses the exact source when valid, or regenerates it by the original P2.6/P2.7/P2.8 scripts in a new private folder.

It then runs SHA and STEP audits, synthetic tool tests, TypeScript, targeted Vitest, full web build, real Chromium loading/recording, four viewport captures (390, 768, 1440, 1920), and saves an independent mesh-overlap diagnostic.

**Outputs on success** under `.local-assets/cad-first/modelb-p28-final-owner-review/`:

- `review-gates.json` — exact executed QA and blocker statuses;
- `source-preflight.json` — source STEP/GLB integrity + original part IDs;
- `visual-overlap-aabb.json` — original-root placement and ALL visual AABB candidates (not mechanical collisions);
- `modelb-p28-real-browser.mp4` — browser staging preview of Model B + P2.8;
- `p28-source-scroll-real-browser.mp4` — P2.8 original source part-by-part 0→100→0 scroll (not a whole-car 18-chapter film);
- `browser/responsive-390.png`, `responsive-768.png`, `responsive-1440.png`, `responsive-1920.png` — actual browser QA images;
- `browser/browser-evidence.json` — browser errors/asset loading and source provenance.

No output/video is claimed until this command succeeds. The scripts refuse missing or mismatched original source assets; a video created from a synthetic/rejected clay model is prohibited.

## Outstanding work after successful staging

1. Review Model B tyre/rim geometry and actual 59-solid P2.8 coordinates; capture valid axle/hardpoint correspondences in metres and lock rigid placement. Do not accept graphical-centroid overlap.
2. Resolve structural upright joint/lug, 2026-spec source fit and coupled steering/bump, then test full native source interactions.
3. Add missing authentic rear assemblies, PU/gearbox/cooling and four-corner architecture without duplicating the already authored fasteners.
4. Build the actual 18-chapter full-car WebGL scroll from accepted source nodes. P2.8-only scroll is not a full car.
5. Record full-car browser 0→100→0 and owner macro inspection on real model, with measured desktop/mobile QA. Owner must explicitly approve final result before any merge/deploy.

**Gate G2 HOLD, final review HOLD.** This report records executable infrastructure, not a completed F1 car or delivered final video.
