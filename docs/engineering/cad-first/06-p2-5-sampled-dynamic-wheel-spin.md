# P2.5 — Sampled dynamic wheel-spin clearance (native CAD)

**Repository:** `DB-Ducbao113/Podium-Effet-De-Sol`  
**Branch:** `feat/engineering-inside-machine-v2`  
**DEV route:** `/engineering/cad-lab`  
**Status:** Sampled axial wheel-spin B-Rep audit **PASS**. Steering, suspension, continuously swept collision, physical mechanical fit and browser visual approval **OPEN**.  
**CI / merge / deploy:** None requested or performed. All commits use `[skip ci]`.

## What was actually tested

Original source: P2.4 53-solid project-authored front-left CAD; STEP SHA-256 `e2ebaab92bd78c7e9aec2cf8319c695894b94d5fcb1b797470140618ca6f0734`. The exact original P2.4 static collision audit and source manifest are SHA-linked in the P2.5 motion evidence. No Model B or third-party CAD has been reintroduced.

### Rigid motion constraints used

| Group | Solids | Applied pose |
|---|---:|---|
| WHEEL_ROTATION | 21 | Wheel, rim, hub, central stud/nut, rotor/hat and rotor fasteners, inner race rotate together about world/source +Z |
| BEARING_ORBIT | 13 | Twelve rolling balls plus the cage orbit at HALF wheel angle, an illustrative *idealized* phase law |
| STATIC | 19 | Outer race, dust shields, caliper/pistons, upright and rods remain stationary |

A 53-part assembly has **1,378 possible pairs**. Pairs that belong to the same rigid group inherit the full source SHA-verified P2.4 static assembly check: 459 unchanged relative-pose pairs. The other **919 cross-group pairs** are candidates for acquiring new overlap under motion. Each sample uses an axis-aligned bounding-box broadphase to reject disjoint pairs; every surviving candidate undergoes an OpenCascade B-Rep Boolean intersection.

### Actual P2.5 results

- **24 sampled poses**: every 15°, from 0° to 345°.
- **3,036 exact dynamic B-Rep intersections** over the 23 nonzero poses (132 candidate B-Rep pairs each).
- **0** intersections exceeding **0.05 mm³**, **0** Boolean errors.
- 0° neutral pose inherited the exact **P2.4 1,378-pair static audit** (after checking its SHA-256).
- Local execution for 24-pose evidence: approximately **53 seconds**, without CI.
- Identical result in an earlier coarser eight-pose, 45° pass: 924 exact dynamic B-Rep checks and zero overlaps/errors.

**Interpretation:** PASS for these **discrete motion samples and explicit model assumptions**, not proof of collision-free movement across every intermediate continuous angle. No tolerance-stack allowance or minimum separating distance is asserted. The 0.05 mm³ cutoff is a reporting threshold, not a manufacturing specification.

## Deliberately not simulated or certified

- Steering axis, kingpin inclination, steering tie-rod angular constraints and Ackermann geometry: **no authored hinge/mate frames exist** in the current P2.4 assembly. Any numeric steering motion without these would be invented.
- Wheel vertical suspension travel: a realistic two-wishbone linkage requires actual joint points, control-arm pivots and chassis anchorage, currently absent.
- Rolling-bearing contact physics: half-angle orbital motion is an intentionally simplified demonstration, not real rolling/sliding dynamics.
- Structural load, heat growth, tyre deformation, caliper hydraulic pressure, fastener torque and fatigue: **not evaluated**.
- Every unsampled angle: **not proven** by sampled checks.

## Deliverables committed to branch

- `tools/cad-first/p2_5_dynamic_clearance.py`: reproducible SHA-linked source B-Rep 15° sampled sweep; each modeled part has a recorded `WHEEL_ROTATION`, `BEARING_ORBIT` or `STATIC` group. The report records exact candidate pairs, success/failure and unverified assumptions.
- `apps/web/src/dev/cadFirstP2/P2MotionGroups.ts`: explicit source semantic-group mapping for the local WebGL visual study.
- `apps/web/src/dev/cadFirstP2/P2ExplodeRig.tsx`: rotate relevant named meshes around the authored axle, from the original pose each frame. World-space positions and quaternions are recomputed, never accumulated, and restored on unmount.
- `P2CadViewer.tsx` and `P2CadLabPage.tsx`: wheel-angle slider from 0° to 359°, active only for the 53-part P2.4 source and when Exploded is at 0%. The report upload validates P2.4 manifest/static-audit SHA-256 plus sampled angles before reporting the limited PASS/FAIL.
- `p2CadLab.css`: isolated motion slider and source-evidence panel.

The report is **local-user-provided evidence**, not server-signed telemetry. The browser does not itself perform OpenCascade Boolean operations; source-based integrity metadata ties the report to the selected source. Do not call it an independent WebGL clearance test.

## Reproduce on Windows without CI

Use the already-generated P2.4 model and source files, e.g. from the owner-only P2.4 archive. From the repository root:

```powershell
cd "E:\Formula 1\Podium-Effet-De-Sol"
.\.venv-cad\Scripts\Activate.ps1
$dir = ".local-assets\cad-first\front-left-p2-4"
python tools\cad-first\p2_5_dynamic_clearance.py `
  --folder $dir `
  --report "$dir\P2_5_dynamic_spin_audit.json" `
  --step-degrees 15
```

The tool requires local P2.4 native STEP, its SHA-matching `P2_4_fit_manifest.json`, the original static audit, and the generator dependencies installed. It never fetches external CAD.

### Review in DEV

1. Load `P2_4_fit_manifest.json`.
2. Load its matching `P2_4_static_fit_audit.json` for the 1,378-pair static baseline.
3. Load the original P2.4 `P2_4_front_left_balanced.glb` or HIGH/PERFORMANCE.
4. Keep **EXPLODED CAD STUDY = 0%**. Move **P2.5 / SAMPLED WHEEL SPIN** between 0–359°; compare fixed caliper/upright with spinning wheel/rotor and illustrated bearing orbit.
5. Load matching `P2_5_dynamic_spin_audit_15deg.json`. The viewer must validate source and static SHA links before displaying sample summary.
6. Check SOURCE IDs and section view, and inspect reference offline images. No assumption of WebGL 60 fps.

Diagnostic screenshot board is from original P2.4 BALANCED GLB with tyre hidden for mechanical visibility, rendered by offscreen VTK. It is NOT a screenshot from Chrome/React Three Fiber.

## Actual next CAD requirement

**P2.6 source kinematic architecture:** add independently modeled chassis-side upper/lower A-arm pivots, outer ball-joint frames and steering tie-rod constraints. Solve physically consistent upright transformations before measuring interference for suspension bump/rebound and steering. A rigid "tilt the corner by 10°" is not a substitute for mate constraints. Any collision during wheel travel requires remodeling real clearances in B-Rep source, not ignoring it in GLSL.

After mechanically meaningful motion is authored and reviewed, proceed to the owner's eventual objective: hyperreal industrial surface modeling and cinematic macro photometry. Until then, the geometry is Formula-style educational CAD, not authentic F1 manufacturer data.

**Release decision: Draft / HOLD, no merge, no deploy, no CI.**
