# P2.12 threaded v2 — native RH/LH female thread repair

Repository: `DB-Ducbao113/Podium-Effet-De-Sol`. Branch: `work/engineering-four-corners-local`.  
Supersedes: [P2.12 smooth-bore v1](18-p212-rear-toe-adjuster-static-cad.md).  
Scope: **native CAD-thread geometry repaired, static verification PASS; dynamic and mechanical G2 HOLD**.

## Changed design

- Retains exactly 19 independently authored source solids: 14 retained P2.9–P2.11 native solids and five P2.12 parts, replacing the old fixed P2.11 tubular toe rod.
- Previously the sleeve and jamnuts had plain cylindrical bores. Now the single-piece sleeve has two truly subtracted **opposite-hand female V-grooves**; the two independent hex locknuts also contain real female helical grooves.
- The RH external male crest spans axial source coordinates `s=45..79 mm`, and the LH crest `s=89..123 mm`. Thread nominal pitch is `2 mm/revolution`; groove phases agree at static source position. B-Rep creation uses one simultaneous cut of both sleeve grooves to prevent invalid intermediate topology.
- Female thread bore minor radius: **9.05 mm**; groove major radius: **10.08 mm**; external male crest radius **9.62 mm**. Nominal crest radial clearance **0.46 mm**, shank-to-female-minor-radius clearance **0.20 mm**.
- The sleeve's physical 3D material removal is guarded between 500 and 900 mm³. Each locknut must remove more than 40 mm³ through its own groove cut; shape must remain one valid source B-Rep solid.
- With an intentionally misphased half-turn of the outer rod, exact B-Rep intersection is positive; a corrective pitch/2 = 1 mm translation restores a zero-overlap nominal phase. This establishes actual helicoidal interface geometry rather than a texture/shader illusion.

## Executed native CAD evidence in task container

- Native 19-solid source assembly: **19 connected valid solids; STEP roundtrip 19/19**.
- **171/171 static pairs** enumerated; 147 separated by AABB; 24 OCC exact intersections; **zero positive-volume static overlaps greater than 0.05 mm³**, zero Boolean errors.
- GLB profiles from the actual revised source, 19 distinct names with watertight winding: **HIGH 76,302**, **BALANCED 29,828**, **PERFORMANCE 16,734 triangles**.
- Python tests pass when run in separate processes. A single-process combined unittest previously timed out after the second case, so the local QA wrapper now runs **each** test in its own Python/OCCT process and refuses to report pass if one fails.
- A separate attempted coupled quarter-turn sleeve motion at ±90° showed about **1.715 mm³** of interference for one rod direction at each extreme. This is a real remaining blocker; **do not claim validated toe adjustment travel**.

## Reproduction (local, no GitHub Actions)

```powershell
python tools/cad-first/run_p212_tests_isolated.py --out ".local-assets/cad-first/p212-threaded-v2-qa.json"
python tools/cad-first/p2_12_toe_adjuster.py --out ".local-assets/cad-first/p212-threaded-v2"
```

Outputs: `P212_rear_toe_adjuster_static_master.step`, `P212_rear_toe_adjuster_manifest.json`, `P212_rear_adjuster_static_audit.json` and HIGH/BALANCED/PERFORMANCE `P212_rear_adjuster_*.glb`. Generator refuses to overwrite an existing nonempty folder.

The DEV `/engineering/assembly-preview` reader accepts `podium-eds.p2.cad-first.rear-toe-adjuster-threaded.v2` only, with source GLB SHA-256 and 19 semantic mesh identities. The updated local Chromium recorder verifies v2's real internal thread flags and retains `G2 HOLD` in exported evidence.

## What is **not** complete

1. Actual coupled toe-adjustment kinematics: fix the ±90° end-of-groove interference before accepting any travel claim or animation.
2. Real chassis pickup coordinates, rear toe-angle linkage, authentic Model B structural assembly and full P2.8 rear wheel-end B-Rep integration.
3. Bearing axial retention, thread flank contact/backlash, thread tolerance/preload, jamnut torque, stress, metal fatigue, impact, temperature and manufacturing feasibility.
4. Owner's complete npm/Vitest/TypeScript WebGL/browser/video full-car run remains unverified in this connector session; local QA scripts are committed but **their complete full-car execution is not claimed**.
5. FIA/OEM authenticity, production approval, and vehicle release are not established.

**Result:** actual female thread topology is repaired in P2.12 threaded v2. The mechanism is not yet approved for real mechanical use; **G2 HOLD and no deploy/merge**.
