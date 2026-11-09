# P2.14 — Native radially assembled split spherical races (candidate)

Project **Podium Effet De Sol** — \`DB-Ducbao113/Podium-Effet-De-Sol\`  
Branch **work/engineering-four-corners-local**  
Status **source CAD review PASS; physical retention and vehicle Mechanical G2 HOLD**.

## Mechanical problem found in P2.13

P2.13's single-piece native cylindrical race was bored with a concentric **spherical** cavity radius 9.95 mm and ended at Z=±6.5 mm. Its smallest axial opening has radius

\`sqrt(9.95² − 6.5²) = 7.5334 mm\`.

The drilled spherical ball's maximum radius is **9.65 mm**. A rigid ball cannot be inserted through that closed bearing lip along Z in a one-piece manufacturing assembly. A nominal Boolean-free final position is therefore **not** evidence of feasible physical assembly.

## P2.14 native source change

Each of the same four rear source joint stations (upper, lower, toe outer and toe inner) is now authored as **four independently named B-Rep solids**:

1. Positive-X half of the spherical socket/race, cut with a true 9.95-mm spherical cavity.
2. Negative-X complementary half, split exactly through the ball-centre plane X=0.
3. The source P2.13 drilled spherical ball, preserved at radius 9.65 mm with a real pin bore.
4. A separate thin **axially sliding containment sleeve**.

Nominal radii:

| Interface | Radius (mm) |
|---|---:|
| Spherical ball | 9.65 |
| Inner spherical cavity | 9.95 |
| Split-race outer | 11.25 |
| Sleeve inner | 11.35 |
| Sleeve outer | 11.88 |
| Existing P2.10/P2.11 eye bore | 12.00 |

The ball-to-cavity radial gap is **0.30 mm**, race-to-sleeve gap **0.10 mm**, and sleeve-to-eye nominal radial gap **0.12 mm**. All are preliminary source dimensions, **not tolerances, loads, proof of a press fit, or certified finished interfaces**.

Unlike the P2.13 one-piece ring, the two race halves can be placed from opposite sides of the ball. The sleeve can then slide axially around both halves. **There is currently no circumferential groove, circlip, bolted end cap, swage stop, press-fit specification, or any other verified axial sleeve retention.** The sleeve could slide off; the unit is **not a physically captive certified bearing**.

## Executed P2.14 source CAD QA

The source was actually generated and checked locally with CadQuery 2.8, and the corrected source code was committed to GitHub.

| Evidence | Result |
|---|---:|
| New source B-Rep solids | 16 valid, connected |
| Original P2.12 19 minus 4 bearing proxies plus P2.14 16 | **31 nominal source bodies** |
| Nominal static source pair classifications | **465 / 465** |
| AABB-excluded pairs | 400 |
| Exact native B-Rep candidates | 65 |
| Recorded native positive-volume collisions >0.05 mm³ | 0 |
| Original STEP import roundtrip | 16 / 16 |
| Exact watertight, wound GLB nodes | 16, all three LODs |
| HIGH | **45,616 triangles** |
| BALANCED | **9,320 triangles** |
| PERFORMANCE | **4,024 triangles** |
| Finite-step lateral halves and axial sleeve insertion pairs | **144 / 144 under 0.01 mm³** |
| Intentionally displaced ball contact positive controls | **4 / 4 detected**, each ~104.023 mm³ |
| Seven ideal 6DOF angles × four joints × five actual B-Rep interface comparisons | **140 / 140 under 0.01 mm³** |
| Native unit tests | **5 / 5 PASS** |

The five per-pose checks include each of the two race halves versus the ball, the two halves versus the containment sleeve, and the ball versus the containment sleeve.

These native geometry tests provide useful limited evidence, **not a continuous-time sweep**. OpenCascade has previously produced false-negative helical Booleans on P2.12, so even the checks with positive controls do not prove all possible solid-contact conditions.

## Build and QA separation

The \`tools/cad-first/p2_14_split_spherical_race.py\` exporter produces the 16-solid STEP, three independently tessellated GLBs, 465-pair nominal source report and SHA manifest.

The 140 seven-pose B-Rep checks run **in a separate native process** through \`tools/cad-first/p2_14_pose_audit.py\`. Combining heavy pose testing and exporting everything in one OpenCascade process previously timed out; neither that incomplete run nor any stale intermediate output was counted as an export PASS.

Local commands (no GitHub Actions):

\`\`\`powershell
python tools/cad-first/test_p2_14_split_spherical_race.py
python tools/cad-first/p2_14_split_spherical_race.py --out ".local-assets/cad-first/p214-split-race-cad-source"
python tools/cad-first/p2_14_pose_audit.py --out ".local-assets/cad-first/p214-seven-pose-native-bearing-audit.json"
\`\`\`

The GitHub runner validates all SHA-256 source files and assets, 31-body nominal source static screen, 144 discrete assembly checks, four intentionally colliding controls, 140 separate articulated checks, and explicit **Mechanical G2 HOLD** before Chromium visual review.

## Model B web preview

\`/engineering/assembly-preview\` accepts the optional P2.14 SHA-locked manifest and GLB after the P2.8/P2.12 original source. It renders P2.14's 16 meshes **at both separately measured Model B rear stations**; hides the four old P2.12 annular proxies and suppresses the prior eight-piece P2.13 scene. This is a **static nominal source view only**, not a true seven-angle WebGL kinematic animation.

**Not completed:** production axial sleeve retention; structural eye sleeve press-fit, manufactured fit and assembly path; materials and fatigue; real owner Model B chassis hardpoints; physical pin torque and safety devices; full 31-body moving CAD and continuous contact; P2.8 59-part wheel-end mating; WebGL Vite/Chromium browser capture, TypeScript/Vitest full repository execution and MP4. Those remain G2 HOLD.

## Source artifact provenance

The distributed ZIP is generated from a **local P2.9–P2.13 review snapshot**. The final P2.14 Python generator itself is byte-identical to the version committed to the work branch, but historical P2.12 and constrained-solver Python file bytes differ from their current GitHub counterparts. Therefore ZIP manifest **upstream source SHA values cannot be passed off as a current branch regeneration**. Rebuild locally from the branch when testing strict source hashes. The finished current-branch QA pipeline and browser capture were not run in this connector session.

**Decision: P2.14 split-race assembly-path concept and native static CAD QA pass; Mechanical G2 HOLD, no deploy/merge.**
