# P2.12 threaded v2 — native RH/LH female thread repair

Repository: `DB-Ducbao113/Podium-Effet-De-Sol`. Branch: `work/engineering-four-corners-local`.  
Supersedes: [P2.12 smooth-bore v1](18-p212-rear-toe-adjuster-static-cad.md).  
Scope: **native CAD-thread geometry repaired, static verification PASS; dynamic and mechanical G2 HOLD**.

## Changed design

- Retains exactly 19 independently authored source solids: 14 retained P2.9–P2.11 native solids and five P2.12 parts, replacing the old fixed P2.11 tubular toe rod.
- Previously the sleeve and jamnuts had plain cylindrical bores. Now the single-piece sleeve has two truly subtracted **opposite-hand female V-grooves**; the two independent hex locknuts also contain real female helical grooves.
- The RH external male crest spans axial source coordinates `s=45..79 mm`, and the LH crest `s=89..123 mm`. Thread nominal pitch is `2 mm/revolution`; groove phases agree at static source position. B-Rep creation uses one simultaneous cut of both sleeve grooves to prevent invalid intermediate topology.
- Female thread bore minor radius: **9.05 mm**; groove major radius: **10.08 mm**; external male crest radius **9.62 mm**. Nominal crest radial clearance **0.46 mm**, shank-to-female-minor-radius clearance **0.20 mm**.
- Both female grooves are subtracted first, then **four cylindrical thread-runout reliefs** are cut in a second OCCT operation (radius 10.12 mm, at source s = 56–58.5, 77.5–80, 88–90.5 and 109.3–112 mm). Total sleeve material removal is guarded at 1,100–1,450 mm³; every body must remain a single valid native B-Rep solid. Each locknut removes more than 40 mm³ through its own actual female thread groove.
- With an intentionally misphased half-turn of the outer rod, exact B-Rep intersection is positive; a corrective pitch/2 = 1 mm translation restores a zero-overlap nominal phase. This establishes actual helicoidal interface geometry rather than a texture/shader illusion.

## Executed native CAD evidence in task container

- Native 19-solid source assembly: **19 connected valid solids; STEP roundtrip 19/19**.
- **171/171 static pairs** enumerated; 147 separated by AABB; 24 OCC exact intersections; **zero positive-volume static overlaps greater than 0.05 mm³**, zero Boolean errors.
- GLB profiles from the actual revised source, 19 distinct names with watertight winding: **HIGH 76,302**, **BALANCED 29,828**, **PERFORMANCE 16,734 triangles**.
- Native CAD unit tests are designed to run in separate Python/OCCT processes; the local wrapper runs **six** source tests including helical phase and sampled screw-pair travel, recording all PASS/FAIL details and refusing success on any timeout.
- The first no-runout v2 candidate showed **~1.715 mm³** of interference at opposite quarter-turn endpoints. After the four thread runouts, **six isolated B-Rep screw-pair configurations** (both rods at −90°, 0°, +90° sleeve rotation with opposite pitch-derived axial translations) have **zero positive overlap**. The independent `p2_12_thread_sweep.py` emits verified JSON. **This is thread-pair motion only, not vehicle toe-angle kinematics or full 19-solid dynamic proof.**

## Reproduction (local, no GitHub Actions)

```powershell
python tools/cad-first/run_p212_tests_isolated.py --out ".local-assets/cad-first/p212-threaded-v2-qa.json"
python tools/cad-first/p2_12_toe_adjuster.py --out ".local-assets/cad-first/p212-threaded-v2"
```

Outputs: `P212_rear_toe_adjuster_static_master.step`, `P212_rear_toe_adjuster_manifest.json`, `P212_rear_adjuster_static_audit.json` and HIGH/BALANCED/PERFORMANCE `P212_rear_adjuster_*.glb`. Generator refuses to overwrite an existing nonempty folder.

The DEV `/engineering/assembly-preview` reader accepts `podium-eds.p2.cad-first.rear-toe-adjuster-threaded.v2` only, with source GLB SHA-256 and 19 semantic mesh identities. The updated local Chromium recorder verifies v2's real internal thread flags and retains `G2 HOLD` in exported evidence.

## What is **not** complete

1. Real chassis-connected toe-adjustment kinematics: only isolated RH/LH screw-pair motion at ±90° is tested; the chassis pickups, pin-bearing joints and full 19-solid dynamic swept collisions remain unverified.
2. Real chassis pickup coordinates, rear toe-angle linkage, authentic Model B structural assembly and full P2.8 rear wheel-end B-Rep integration.
3. Bearing axial retention, thread flank contact/backlash, thread tolerance/preload, jamnut torque, stress, metal fatigue, impact, temperature and manufacturing feasibility.
4. Owner's complete npm/Vitest/TypeScript WebGL/browser/video full-car run remains unverified in this connector session; local QA scripts are committed but **their complete full-car execution is not claimed**.
5. FIA/OEM authenticity, production approval, and vehicle release are not established.

**Result:** actual female thread topology is repaired in P2.12 threaded v2. The mechanism is not yet approved for real mechanical use; **G2 HOLD and no deploy/merge**.
