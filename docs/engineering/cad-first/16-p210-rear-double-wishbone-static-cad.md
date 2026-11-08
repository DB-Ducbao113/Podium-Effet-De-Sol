# P2.10 — independent original rear double wishbones / static CAD source

**Project:** Podium Effet De Sol (`DB-Ducbao113/Podium-Effet-De-Sol`)  
**Branch:** `work/engineering-four-corners-local`  
**Status:** local native CAD geometry pass; **G2 mechanical HOLD; no merge, release or deploy**.

## Components authored in P2.10

**10 new separate native B-Rep solids:**

- `P210_REAR_UPPER_A_ARM_FORGED`, `P210_REAR_LOWER_A_ARM_FORGED`: two genuine fused A-shaped control arms, independently authored for the rear, not copied from front P2.7.
- Four inner pivot bushings (`*_CHASSIS_PIVOT_BUSHING_A/B`).
- Two outer bearing inserts (`*_OUTER_SPHERICAL_BEARING_PROPOSAL`); annular visualization **does not prove** actual spherical articulation.
- Two bored upright connecting pins (`*_OUTER_JOINT_PIN`).

**Existing source retained:** `P29_REAR_UPRIGHT_BEARING_CARRIER_PROPOSAL`, reused from P2.9 with its own source code and hardpoint proposal. The combined source has **11** independently named CAD bodies. No new P2.8 wheel-end, fastener, tyre, rotor, or Model B exterior is fabricated. **10 new solids**, not 11; do not double-count the P2.9 upright.

## Coordinate frame and provenance

- Native CAD: millimetres, rear wheel-local axes **X forward, Y up, Z outboard**, inboard direction `-Z`.
- GLB: metres, semantic mesh names preserved, no authoring-to-preview uniform CAD scale other than mm→m.
- Body/chassis pivot positions `ARM_PICKUPS_MM` are **project-authored illustrative pickup locations**. They are not measurements of the owner's Model B exterior or actual chassis pickup hardware.
- P2.9 outer upright bore datums are imported **directly from `p2_9_rear_upright.py`**; original bearings and P2.8 wheel assembly remain unchanged.
- Physical steering/toe, push/pullrod, chassis load path, driveshaft/CV and dynamic suspension are not included or certified.

## Actual P2.10 CAD evidence in task container

- 11/11 native STEP solids valid after round-trip.
- All **55** unique body pairs enumerated; 43 excluded by nonintersecting AABB, 12 evaluated by exact OCC B-Rep Boolean; 0 unresolved positive-volume overlaps over **0.05 mm³**, 0 Boolean errors.
- Explicit central bore, outer pin and inner bushing clearance/connectedness checks.
- THREE GLB tiers, each all 11 mesh IDs and watertight/consistent winding:
  - HIGH: **23,776** triangles;
  - BALANCED: **8,802** triangles;
  - PERFORMANCE: **5,000** triangles.
- 4/4 native Python/CadQuery tests PASS on the corrected A-shaped source geometry.
- This is a source-authored **single static pose** CAD audit, **not** dynamic interference, a joint retaining design, or a vehicle mechanical certification.

## Source and local commands

```powershell
python tools/cad-first/test_p2_10_rear_wishbone.py
python tools/cad-first/p2_10_rear_wishbone.py --out ".local-assets/cad-first/p210-rear-suspension-source"
```

Output: `P210_rear_upright_wishbone_static_master.step`, `P210_rear_suspension_static_audit.json`, `P210_rear_suspension_manifest.json`, 3 `P210_rear_suspension_*.glb` LODs. Refuses to overwrite a nonempty folder. Requires CAD build dependencies from `tools/cad-first/requirements.txt`.

The DEV page `/engineering/assembly-preview` now imports P2.10's exact manifest and SHA-matching GLB **after** the existing original P2.8 source. The 11 original source nodes are independently instantiated at the two separately measured Model B rear wheel centres. P2.10 contains P2.9, so the P2.9-only instance is suppressed to avoid duplicate uprights. P2.8 wheel/brake proxy at the rear stays **visual only** and is not counted as an authentic rear wheel assembly.

For full local owner review with original P2.8:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/review-four-corners-local.ps1
```

It now builds/verifies P2.9 **and** P2.10, requires unit/type/build checks, imports source-locked original files, records actual local Chromium WebGL frames and fails if the P2.10 11-part source is not loaded and exported by the browser. No GitHub Actions are used on this work branch.

## HOLD gates before accepting P2.10

1. No verified chassis-side pickup points from an engineering chassis model; body Model B showroom GLB cannot supply trustworthy structural hardpoints.
2. No independent P2.8 original 59-solid STEP cross-part Boolean audit against this 11-body rear proposal.
3. Joint retention, bore/pin tolerance stack, angular bearing motion, torque, material thickness, stress and fatigue unverified.
4. No bump/travel camber/toe/roll kinetic geometry or dynamic intersection scans.
5. No verified real wheel/rotor/CV/gearbox interface and no FIA clause-by-clause assessment.
6. No actual current-session owner-model P2.8 + P2.10 full Vite browser run, TypeScript/Vitest/build execution or MP4; code for the local runner exists but successful execution is not claimed.
7. Owner visual acceptance of whole-car presentation and 0→100→0 scroll remains pending.

**Gate: G2 HOLD.** Production release prohibited.
