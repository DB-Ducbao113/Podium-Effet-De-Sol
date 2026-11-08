# P2.9 — independent rear upright, native CAD first (owner DEV review)

Project: **Podium Effet De Sol**, repository `DB-Ducbao113/Podium-Effet-De-Sol`  
Branch: `work/engineering-four-corners-local`  
Scope: **original rear carrier proposal**, not four complete certified rear-corner assemblies.  
Gate: **G2 HOLD / mechanical approval NOT GRANTED / no deploy**.

## Source and design

- `tools/cad-first/p2_9_rear_upright.py`: independent one-piece rear upright with an open 71.5 mm radius bearing bore, upper/lower/toe mounting eyes with actual through-holes, and connected load-path webs.
- `tools/cad-first/test_p2_9_rear_upright.py`: native single-solid B-Rep validity, mounting bores, nominal P2.4 bearing/rotor envelope screening, STEP roundtrip, three mesh tiers and SHA/source guard.
- Original source coordinate frame: **X forward, Y up, +Z outboard**, rear/inboard `-Z`. STEP millimetres; GLB metres. P2.8 wheel-end original scale remains `1`. This is **not** the Model B raw showroom-unit frame.
- Provisional upper/lower/toe datum centres are declared in the source and manifest; **none is measured from actual Model B chassis hardware**. The design is not based on any manufacturer's CAD.
- Neither P2.8 original 59-solid source geometry nor the Model B exterior is modified.

## Source build (local, no GitHub Actions)

From this repository with CadQuery, NumPy and trimesh installed:

```powershell
python tools/cad-first/test_p2_9_rear_upright.py
python tools/cad-first/p2_9_rear_upright.py --out ".local-assets/cad-first/p29-upright-review"
```

The build will refuse to overwrite a nonempty output folder. It exports:

- `P29_rear_upright_proposal.step` — native STEP, one project-authored B-Rep solid;
- `P29_rear_upright_manifest.json` — source STEP SHA-256 and 3 GLB digests;
- `P29_rear_upright_high.glb`, `P29_rear_upright_balanced.glb`, `P29_rear_upright_performance.glb`.

For local CAD + browser integration with **the separate original P2.8 package**:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/review-four-corners-local.ps1
```

The local runner rebuilds/verifies P2.9, loads the exact source at both rear wheel centres in `/engineering/assembly-preview`, and requires real Three.js mesh parse before recording. It does not invoke CI, GitHub Actions, PR, merge or deployment.

## Browser integration

In `/engineering/assembly-preview`: first import original P2.8 59-part manifest and matching source GLB; then import generated **P2.9 rear upright manifest and GLB**. The source guard requires proper GLB 2.0, SHA, exact one-node name, an original STEP fingerprint and truthful certification flags. Only two rear stations receive P2.9, using each measured Model B centre and proper rigid rotation (never a negative-determinant mirror). An existing front-source wheel-end can remain visible alongside the independently authored rear upright as a **temporary visual proxy**.

## Actual local source verification in ChatGPT execution, November 8, 2026

- Native STEP: **1 valid solid**, roundtrip PASS.
- Native bearing and three mounting bores: PASS.
- Preliminary separate source-envelope tests against *simplified* P2.4 bearing and rotor annuli: no volumetric overlap.
- High/balanced/performance GLB: **5,118 / 1,936 / 1,118 triangles**, all watertight and winding-consistent, exact same semantic mesh ID.
- Native CAD source unit tests: **4/4 PASS** with Python and CadQuery in the task execution container.
- Source files and optional browser loader committed on the work branch.
- **Not run**: this repository's complete npm/Vitest/TypeScript/build, actual owner's original 59-solid P2.8 source/STEP cross-part Boolean clearance, browser WebGL record, complete rear suspension kinematics and structural fatigue analysis.

## Engineering blockers

1. Upper/lower/toe body-side chassis hardpoints must be measured/verified against an engineering chassis, rather than a polygon showroom shell.
2. Independent rear upper/lower wishbones, toe link, CV/driveshaft interface, steering link orientation, lower wishbone and real load-path retention remain to be authored.
3. The actual P2.8 wheel-end source needs cross-source native intersection and bearing fit audits, not just the nominal-envelope screening above.
4. Coupled vertical bump, rear wheel rotation, static clearances, stress and realistic 2026 regulation checks remain unverified.
5. Owner-visible browser macro/whole-car review, mobile/desktop QA, and full scroll choreography have not been accepted.

**Status: source-verified P2.9 rear upright proposal only; G2 HOLD, release HOLD.**
