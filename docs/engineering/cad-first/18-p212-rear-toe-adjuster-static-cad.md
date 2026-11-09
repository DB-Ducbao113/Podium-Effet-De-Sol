# P2.12 — Original rear toe adjuster source, static CAD checkpoint

Project: **Podium Effet De Sol**, repository \`DB-Ducbao113/Podium-Effet-De-Sol\`.  
Implementation branch: \`work/engineering-four-corners-local\`.  
Stage: **P2.12 static B-Rep + source-linked preview; Mechanical G2 HOLD**.

## What has been authored

The earlier **P2.11 fixed-length toe link** (\`P211_REAR_TOE_LINK_TUBULAR_FORGED\`) is explicitly **removed from the combined source** and replaced with **five separate, native CadQuery solids**:

1. \`P212_TOE_OUTER_RIGHT_HAND_THREADED_ROD_END\`: outer eye, bored fork interface, tubular RH helical male crest.
2. \`P212_TOE_INNER_LEFT_HAND_THREADED_ROD_END\`: inner eye and distinct LH helical male crest.
3. \`P212_TOE_TURNBUCKLE_HOLLOW_SLEEVE\`: hollow axial sleeve.
4. \`P212_TOE_OUTER_HEX_LOCKNUT\`: independent bored hex body.
5. \`P212_TOE_INNER_HEX_LOCKNUT\`: independent bored hex body.

**Combined source count**: 14 retained P2.9–P2.11 solids + 5 P2.12 solids = **19**. The old P2.11 fixed rod is not double-rendered or double-counted. P2.8 owner wheel assemblies, fasteners and Model B showroom shell remain unmodified.

The two outward/inward eye centres are retained exactly from P2.11, still relative to the rear wheel-local CAD frame, **not** inferred physical body mount locations. STEP uses millimetres; mesh exports use metres and the scene uses rigid source rotations/translations (never mirrors threaded geometry).

## Explicit mechanical limitation

The two **oppositely handed external male helical crests really are modeled as swept B-Rep geometry**. However, the sleeve has a *circular, deliberately clearance-sized bore*, **not** a matching internal female thread. The external crest radius is 9.62 mm, sleeve bore radius 10.02 mm, and radial clearance is **0.40 mm**.

Consequently **this is not yet a working, captive, axially load-transmitting turnbuckle** and no torque, adjustment travel, load, stress, thread preload or functional thread engagement is certified. Hex locknuts are visible separate source solids but their actual tapped engagement/retention is also **not** certified. No kinematic animation purporting to show true toe adjustment is permitted.

### Local native QA actually executed

With CadQuery 2.8 and local source P2.9–P2.12:

| Evidence | Result |
|---|---|
| Connected native solids after fixed-rod replacement | 19 / 19 |
| STEP import roundtrip | 19 / 19 |
| Static pair classifications | **171 / 171** |
| AABB-separated pairs | 147 |
| Native exact B-Rep Boolean checked pairs | 24 |
| Positive overlap >0.05 mm³ | **0** |
| Boolean exceptions | **0** |
| P2.12 Python/CadQuery source tests | **4/4 PASS** |
| Source GLB HIGH | **51,426 triangles** |
| Source GLB BALANCED | **20,322 triangles** |
| Source GLB PERFORMANCE | **11,056 triangles** |
| Mesh identities/watertight/winding | 19 / 19, all 3 tiers |
| Actual full Vite browser WebGL capture | Not executed |
| npm/Vitest/TypeScript full repo build | Not executed |
| P2.9–P2.12 combined 16-test run | **Timed out**; no PASS claim |

The static AABB/Boolean audit covers **only this 19-solid source assembly**, not the full original owner 59-part P2.8 wheel/brake B-Rep and does not certify coupled suspension kinematics.

## Source, preview and export

- CAD source: \`tools/cad-first/p2_12_toe_adjuster.py\`
- Native test: \`tools/cad-first/test_p2_12_toe_adjuster.py\`
- Browser source guard: \`apps/web/src/dev/assemblyPreview/rearToeAdjusterSource.ts\`
- Web test: \`apps/web/src/dev/assemblyPreview/rearToeAdjusterSource.test.ts\`
- 3D instances: \`apps/web/src/dev/assemblyPreview/RearToeAdjusterInstances.tsx\`
- Preview and controls: \`/engineering/assembly-preview\`
- Local combined owner review: \`tools/cad-first/run_four_corners_local.py\` and \`record_four_corners_local.py\`

Source-only local reproduction (from a branch checkout with CAD dependencies installed):

\`\`\`powershell
python tools/cad-first/test_p2_12_toe_adjuster.py
python tools/cad-first/p2_12_toe_adjuster.py --out ".local-assets/cad-first/p212-toe-adjuster-source"
\`\`\`

The generator refuses to overwrite a nonempty output directory. Exports:
\`P212_rear_toe_adjuster_static_master.step\`,
\`P212_rear_toe_adjuster_manifest.json\`,
\`P212_rear_adjuster_static_audit.json\`,
and \`P212_rear_adjuster_{high,balanced,performance}.glb\`.

To run the original P2.8 + independently measured four-corner DEV viewer with local Chromium evidence, use the existing local script. No GitHub Actions, PR, merge, deploy or external CAD upload.

### Mechanical G2 HOLD blockers

- Actual chassis mounting points versus an engineering chassis model.
- True matched RH/LH female threads, axial load path, locknut tapped bores, torque, anti-loosening and retained articulation.
- Coupled bump/toe/roll/camber and dynamic CAD interference against actual source P2.8 wheel/rotor/brake/upright.
- Rear drive axle, CV, gearbox interfaces, high-load strength/fatigue, physical material and manufacturing tolerance stackups.
- Verified local WebGL capture, complete TypeScript/Vitest and production code quality gate, owner visual acceptance.

**Not a certified, functional or FIA/OEM authentic Formula One rear toe adjuster.**
