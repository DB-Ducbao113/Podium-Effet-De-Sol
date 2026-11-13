# P2.7 — Original double-wishbone CAD subassembly

**Project:** Podium EDS / Inside the Machine  
**Branch:** `feat/engineering-inside-machine-v2` (Draft PR #4)  
**Decision:** 8-solid A-arm **subassembly** CAD and sampled collision audit PASS; full-corner integration, coupled steering and continuous dynamics HOLD.  
**Release:** No CI, merge, or deploy.

## Why this phase was necessary

The earlier P2.7 hardpoint solver had found 31 mathematical positions at ±15 mm bump, but the P2.6 front-left corner still used simplified rods without a real double-wishbone CAD master. A numeric displacement without source solids is not a verified mechanism.

P2.7 now models a standalone original source assembly, independent of rights-uncleared F1/Formula SAE CAD:

- Upper arm forged body with two separately bored chassis-side pivot sleeves and an outer joint bore.
- Lower arm forged body with the same joint hierarchy, independently authored.
- Four named annular bushings, with actual 3D holes and deliberate radial clearance.
- Two machined outer joint studs, each with a through bore and separate head.
- **8 independent connected B-Rep solids**, not cylinders or shader overlays substituted into an old GLB.

**CAD dimensions** are millimetres, **GLB geometry** metres. The sampled 31 kinematic poses store the actual solved outer hardpoint coordinates in the manifest. The frontend applies source-pivot Z-axis rotation to each forged arm, leaves chassis bushings fixed, and translates the studs to the solved end positions. The P2.6 corner itself remains untouched.

## Real source evidence (local)

- Native STEP successfully round-tripped into OpenCascade/CadQuery: **8/8 connected valid solids, 69 CAD faces**.
- Thirty-one sampled bump positions: −15, −14, ..., +15 mm, all preserve authored rod length constraints (nonlinear root solver).
- **31 × 28 = 868** unique pair opportunities considered; **186** AABB-positive cases actually intersected as OpenCascade B-Rep Booleans.
- First version FAILED, with repeated upper/lower stud-to-arm intersections including a 105.34 mm³ lower-arm penetration.
- Reworking the real stud length and extending the **outer arm through-bore to 60 mm** removed the unwanted overlap. Re-run: **0 unresolved intersections above 0.05 mm³; 0 Boolean errors**.
- Actual original CAD study profiles:

| Tier | Native CAD-derived triangles | GLB bytes |
|---|---:|---:|
| HIGH | **18,822** | 398,500 |
| BALANCED | **6,994** | 153,060 |
| PERFORMANCE | **3,954** | 90,020 |

All three are freshly tessellated from new B-Rep instances, preserve 8 exact semantic part names and pass local SHA-256 matching their source manifest. Owner preview PNG uses a deterministic offscreen projection of actual GLB mesh triangles, not an AI-made model and **not a Chrome WebGL screenshot**.

## Repository implementation

- `tools/cad-first/p2_7_wishbone_cad.py`: original STEP authoring + real B-Rep bores/pivot sleeves + 31 constrained poses + 3 GLB source tiers.
- `tools/cad-first/p2_7_wishbone_audit.py`: STEP re-import, all-pair AABB screening, native B-Rep intersections on 31 motion samples, profile part ID and SHA validation.
- `apps/web/src/dev/cadFirstP2/P27WishboneRig.tsx`: source-name-specific A-arm transforms; restores original transform on unmount.
- `apps/web/src/dev/cadFirstP2/P2CadLabPage.tsx`: new P2.7-specific −15…+15 mm sample scrub, only when 8-source-part P2.7 manifest + matching GLB are loaded.
- `apps/web/src/dev/cadFirstP2/P2CadViewer.tsx`: P2.7 rig **replaces** P2.6 film/wheel-spin rig for this source; no invalid mixed-motion assumption.
- Source binaries and image evidence remain in the owner-only ZIP, not in the public frontend.

## Local recreation on Windows

```powershell
cd "E:\Formula 1\Podium-Effet-De-Sol"
.\.venv-cad\Scripts\Activate.ps1
python tools\cad-first\p2_7_wishbone_cad.py --out ".local-assets\cad-first\wishbone-p2-7"
python tools\cad-first\p2_7_wishbone_audit.py --folder ".local-assets\cad-first\wishbone-p2-7"
npm run dev --workspace=@peds/web -- --host 127.0.0.1 --port 5184
```

At `http://127.0.0.1:5184/engineering/cad-lab`, load `P27_wishbone_manifest.json` followed by `P27_wishbone_balanced.glb`, then scrub **P2.7 / SOURCE A-ARM STUDY**.

This source is only an educational double-wishbone subassembly and should never be labeled a complete F1 front corner.

## Remaining program after P2.7

**P2.8 — Full-corner re-mating (HOLD):** Design hardpoint-compatible source upright joint bodies, add the actual A-arms to the 53-solid P2.6 STEP, remove displaced legacy rods, use a common authoritative coordinate frame, and validate assembled-pose and sampled bump/steering collision pairs *including the brake, rim and tyre*. Zero subassembly intersections is not evidence of a collision-free full corner.

**P2.9 — Credible functional hardware (OPEN):** verify bearing geometry and tolerance assumptions, control-arm joint retainers, realistic brake cylinder seals, rotor airflow, tire bead/suspension articulation, loaded travel. Do not equate plausibility with certified engineering.

**P3 — Hyperrealism and reference match (OPEN):** needs real WebGL screenshots and cinematic owner review at macro angles, physically detailed materials and mesh bevels, measured GPU profile; this standalone A-arm study does not prove photorealism.

**P4/P5 — Website/QA and approval (OPEN):** browser typechecks, actual device profiles, graphical capture and final signoff. No CI per owner request. Public production remains unaffected.

**Conclusion:** P2.7 standalone B-Rep subassembly and sampled internal clearance are confirmed. The authentic dynamic whole-corner vehicle mechanism remains **NOT VERIFIED**.
