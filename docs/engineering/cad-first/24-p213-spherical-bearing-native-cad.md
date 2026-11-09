# P2.13 — Native spherical rear joint prototypes for constrained P2.12

Project: **Podium Effet De Sol**  
Repository: \`DB-Ducbao113/Podium-Effet-De-Sol\`  
Branch: \`work/engineering-four-corners-local\`  
Engineering gate: **G2 HOLD — no chassis approval or deploy**.

## What P2.13 adds

The prior P2.12 six-DOF solver closes ideal upper/lower wishbone and toe **centres**, but the P2.10/P2.11 annular bearing proxies cannot demonstrate physical spherical articulation. P2.13 supplies **four independent project-authored spherical-joint concepts**:

- **UPPER** — upper rear wishbone outer spherical race plus drilled ball.
- **LOWER** — lower rear wishbone outer spherical race plus drilled ball.
- **TOE_OUTER** — toe link upright-end race plus drilled ball.
- **TOE_INNER** — toe link chassis-end race plus drilled ball.

The eight source-native CAD bodies explicitly **replace four old annular bearing solids** in the P2.12 nominal assembly. The bookkeeping is **19 − 4 + 8 = 23 original-plus-proposal solids**; do not append all eight to the 19 without hiding/removing the four prior proxies.

Each outer race is a connected B-Rep ring with a **real spherical cavity** (radius 9.95 mm). Each inner element is a truncated spherical ball (radius 9.65 mm) with a real through-hole (radius 7.5 mm). Nominal spherical radial spacing is **0.30 mm**. The race outer radius is 11.65 mm for upper/lower and 11.6 mm for toe. STEP uses millimetres and GLB metres, as in the upstream CAD lineage.

This is a **concept prototype**, not a certified or manufacturable spherical-bearing design. In particular, ball capture, race splitting/swaging, axial retention, cage/liner, material selection, lubrication, fatigue life, press-fit and bolt torque are **not designed or validated**.

## Executed native source evidence

The original P2.13 CadQuery source was run locally against the user-provided P2.9–P2.12 CAD review snapshot:

| Check | Evidence |
|---|---:|
| P2.13 independent valid B-Rep solids | 8 / 8 |
| Native STEP round-trip | 8 / 8 |
| Three tiers GLB exact mesh IDs/watertight/winding | 8 / 8 each |
| HIGH | 40,448 triangles |
| BALANCED | 7,392 triangles |
| PERFORMANCE | 2,968 triangles |
| Seven constrained P2.12 poses × four spherical race/ball pairs | **28** source-native Boolean clearance pairs |
| Above-threshold overlap among those 28 pairs | 0 |
| Deliberately shifted ball (1 mm), positive native Boolean controls | Four detected, each more than 100 mm³ |
| Combined nominal P2.12/P2.13, 23 native bodies | **253** pair classifications |
| Combined nominal source AABB disjoint cases | 218 |
| Combined nominal exact OCC Boolean candidates | 35 |
| Combined recorded positive-volume collisions >0.05 mm³ | 0 |
| Independent P2.13 Python unit cases | **5/5 PASS**, each in isolated OCCT child |

The native 23-body screen covers **only the nominal static candidate pose**. The 28 pair reviews apply the ideal six-DOF motions **only to each race and ball pair**; they do not build, move or clearance-check all 23 CAD bodies through the seven transforms. The source-proposal chassis hardpoints still have not been verified against a real rear structural chassis. Previous complex P2.12 helical Boolean false negatives mean **the 253-pair Boolean-only result must not be represented as exhaustive physical clearance**.

The source-linked manifest records hashes of P2.9, P2.10, P2.11, P2.12 and the P2.12 ideal-kinematics solver, as well as hashes for the original P2.13 STEP and three GLBs. A complete source-checkout run must regenerate the assets to obtain hashes that match **the current branch**. The separately provided local ZIP uses the exact **review snapshot of upstream CAD files**, which may have different Python file bytes than the current GitHub branch. Browser SHA matching by itself is not independent manufacturer CAD provenance.

## Source, tests and preview

- \`tools/cad-first/p2_13_rear_joint_prototype.py\` — original native CAD builder and 23-body static screen; produces eight source CAD pieces, STEP, three GLB tiers and JSON evidence.
- \`tools/cad-first/test_p2_13_rear_joint_prototype.py\` — dimensions/curved surfaces, deliberately misaligned positive Boolean control, seven-poses, STEP roundtrip and 253 candidate pairs.
- \`tools/cad-first/run_p213_tests_isolated.py\` — runs five native unit tests in **separate OCCT child processes** and persists fail-closed source-linked JSON.
- \`apps/web/src/dev/assemblyPreview/rearJointSource.ts\` — original manifest field/identity check, 28 native pair evidence, 253 candidate pair evidence and GLB SHA-256.
- \`RearJointInstances.tsx\` — nominal **static** P2.13 GLB at both independently measured original Model B rear wheel centres. The P2.12 renderer hides exactly four old annuli whenever this source overlay is imported. No fabricated 6DOF animation is enabled.
- \`/engineering/assembly-preview\` — optional import of original manifest and matching GLB; P2.8 + P2.12 source must first be loaded.
- The existing local Chromium runner records actual Three.js GLB load only if the P2.13 mesh names, source hashes and placement-report G2 HOLD checks pass.

### Local reproduction

\`\`\`powershell
python tools/cad-first/run_p213_tests_isolated.py --out ".local-assets/cad-first/p213-isolated-qa.json"
python tools/cad-first/p2_13_rear_joint_prototype.py --out ".local-assets/cad-first/p213-four-spherical-joint-cad-prototypes"
\`\`\`

The generator refuses to overwrite a nonempty folder. Outputs:
\`P213_four_rear_spherical_joint_prototypes.step\`, \`P213_23_body_static_audit.json\`, \`P213_joint_articulation_manifest.json\`, and the three \`P213_spherical_joints_{high,balanced,performance}.glb\` assets.

## Remaining G2 HOLD blockers

1. Physically retained/articulated spherical bearing construction, verified pin bore and mount tolerances.
2. True chassis-side measured pickup geometry and link travel, not provisional source coordinates.
3. All **23** dynamically remated native B-Rep bodies and continuous collision/solid-occupancy checks (only 28 joint pairs across seven ideal poses screened).
4. P2.8 original 59-solid wheel/brake assembly cross-source CAD fit, driveshaft/CV/gearbox and full vehicle source registration.
5. Loads, fatigue, real materials, manufacturing, dynamic toe/camber/bump/roll, 2026 F1 technical restrictions.
6. Complete current-branch npm/TypeScript/Vitest, actual Vite+Chromium WebGL inspection, MP4 and owner visual review — **not run** in the GitHub-connector editing session.

**Decision: new P2.13 spherical geometry source and nominal static candidate screen PASS; mechanical G2 remains HOLD. No GitHub Actions, PR, merge or production deploy.**
