# P2.3 — Mechanical Precision: 58 B-Rep solid front-left study

**Project:** Podium EDS / Engineering CAD-first  
**Branch:** `feat/engineering-inside-machine-v2` · PR #4 Draft  
**Scope:** DEV-only `/engineering/cad-lab`  
**Decision:** CAD geometry pilot implemented. Mechanical certification and cinematic WebGL acceptance **HOLD**.  
**CI:** Not run, edited, checked or awaited as requested.

## Why P2.3 exists

P2.2 contained 49 individually editable CAD bodies, but the lock nut had an oversized smooth bore, both bearing races were simple rings, and the caliper lacked machined piston bores. High-quality shading cannot repair these geometric omissions. P2.3 replaces these **source B-Rep solids** and adds nine new named objects, instead of adding shader tricks.

| Feature | P2.2 source | P2.3 original CAD |
|---|---|---|
| Center lock | Male 3D helix, smooth oversized female hole | Separate male helix and **real helical female groove removed from nut B-Rep** |
| Bearing | Inner/outer cylinders and twelve ball spheres | Two **toroidal raceway grooves**, a ball retainer with **12 cut pockets**, and two separate shields |
| Caliper | Two body castings, pads and bridges | **Four separate pistons**, four independently machined bores in the existing castings and two retaining pins |
| Solid source | 49 B-Rep solids | **58 independently named B-Rep solids** |
| Whole vehicle | Model B absent from current P2 source | Remains independent educational CAD, no F1 OEM claim |

## Geometry actually checked in the local generator

- CAD master imports back through CadQuery/OpenCascade: **58 solids, all 58 valid, 578 B-Rep faces**.
- Female nut helical cutter removes **3,597.1973 mm³** of B-Rep. This is a real 3D helix and not a bump/normal map.
- Inner race toroidal cutter removes **2,926.3857 mm³**.
- Outer race toroidal cutter removes **3,578.6554 mm³**.
- Twelve ball-retainer pockets are individually subtracted from a single valid retainer solid.
- **Four** caliper pistons and **two** pad-retaining pins exist as distinct source bodies.
- **Zero measured intersection volume** for selected source pairs: male stud/nut, twelve balls/races, twelve balls/retainer, and four pistons/caliper bodies.
- Study clearances: ball-to-groove geometry radius difference **0.10 mm**; piston-to-bore nominal radial gap **0.10 mm**.

**Critical qualification:** 0.10 mm is a chosen *illustrative CAD parameter*, not an SKF/OEM bearing clearance, manufacturing tolerance, hydraulic piston specification or validated physical fit. Zero overlap for selected bodies is NOT a full-assembly collision, thread-torque, stress, bearing-preload or thermal validation. A real high-performance front corner has considerably more detail and evidence than this model.

## Three source-identical, independently regenerated LOD exports

| Quality | Triangles | Named parts | GLB bytes |
|---|---:|---:|---:|
| HIGH | 264,319 | 58 | 4,199,832 |
| BALANCED | 58,629 | 58 | 1,151,732 |
| PERFORMANCE | 26,629 | 58 | 599,352 |

All three preserve the same named source part IDs and metre unit scale. File SHA-256 values are in the generated manifest. The STEP master uses mm.

## Files and reproducibility

`tools/cad-first/p2_3_precision_upgrade.py` creates these native files by extending original P2.2 code rather than reusing its low-poly GLB:
- `P2_3_front_left_precision_master.step`
- `P2_3_front_left_high.glb`
- `P2_3_front_left_balanced.glb`
- `P2_3_front_left_performance.glb`
- `P2_3_precision_manifest.json`

Use **separate Python invocations** to prevent OpenCascade B-Rep tessellation caches from accidentally flattening the differences between LOD tiers:

```powershell
cd "E:\Formula 1\Podium-Effet-De-Sol"
python tools/cad-first/p2_3_precision_upgrade.py --out ".local-assets/cad-first/front-left-p2-3" --init
python tools/cad-first/p2_3_precision_upgrade.py --out ".local-assets/cad-first/front-left-p2-3" --profile HIGH
python tools/cad-first/p2_3_precision_upgrade.py --out ".local-assets/cad-first/front-left-p2-3" --profile BALANCED
python tools/cad-first/p2_3_precision_upgrade.py --out ".local-assets/cad-first/front-left-p2-3" --profile PERFORMANCE
python tools/cad-first/p2_3_precision_upgrade.py --out ".local-assets/cad-first/front-left-p2-3" --finalize
python tools/cad-first/p2_3_audit_precision.py --folder ".local-assets/cad-first/front-left-p2-3" --report ".local-assets/cad-first/front-left-p2-3/audit.json"
```

The review binaries are deliberately **not committed** to GitHub and are distributed in the owner-only P2.3 evidence archive.

## UI: review the real internal source geometry

DEV `/engineering/cad-lab` now supports:
- load the P2.3 manifest, followed by any of the SHA-matching GLBs;
- isolate each part independently;
- explode/restore the illustrative CAD sources via the existing 0–100% slider;
- **INSPECT INTERNAL SECTION**: movable GPU clip plane reveals internal race, piston and thread mesh. This is a technical visualization, **not a sealed native B-Rep section**;
- show local manifest's numeric geometry proof with explicit disclaimer; does not pretend the browser has certified it.

## Realistic engineering caveats and P2.4 gate

1. Current center lock is a generic threaded nut/stud demonstration, **not a genuine modern Formula 1 single-nut quick-release design**. Real retention/locking mechanism, secondary lock, torque and fatigue are unknown.
2. Bearing balls, grooves and cage can be inspected, but contact mechanics, micron-scale radial clearance, preload, grease, temperature and actual retention are unproven.
3. Caliper piston bodies and bores are visible, but hydraulic seals, pressure channels, pad pin interference, seal compression and load capacity are not modeled.
4. Still need full assembly interpenetration analysis and common mating frames, suspension kinematics, realistic tire-to-rim bead geometry, detailed brake ventilation and heat shields.
5. Hyperreal cinematic shading and browser FPS require real owner visual acceptance. The current images are **offline VTK renders of the actual source GLBs**, not a live Chrome/WebGL acceptance.
6. Do not export this illustrative CAD as manufacturer-certified F1 hardware or authorize fabrication from it.

**Release:** Draft / HOLD. No Model B restoration, CI run, merge or deployment.
