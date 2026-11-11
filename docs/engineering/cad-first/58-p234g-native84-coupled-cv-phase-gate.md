# P2.34G/54 — Coupled input/output CV phase geometry on authentic 84-native source

Date: 2026-11-11. Branch: \`work/engineering-four-corners-local\`.

**Engineering collision diagnostic PASS; CV function FAIL/HOLD; mechanical G2 HOLD.**

## Why P2.34F was insufficient

P2.34F rotated shaft and cup against *fixed* real source ball positions independently, proving unequal first-contact onset. P2.34G rotates **both** original native source B-Reps in a **common candidate phase pair** to detect whether simultaneous race engagement creates intersections in other ball groups. No new STEP, GLB, or original Model B car is authored.

Input is actual P2.34E 84-solid B-Rep STEP SHA-256 \`9bd7ec6a60d5c4c9f1f3e421cb730fc252de026aae21dcf570584e5dda0ec63e\`, its exact source name index and source audit. The existing \`p2_34f_repo_native_contact_guard.py\` authenticates all three original source files. The six source balls remain at the prescribed θ/2 half-bend positions (not a solved cage). Input shaft is rotated about the local output Z and then bent about X; output cup is counter-rotated about Z. All physical lengths mm.

**12 sampled cases** = 3 bend angles (−10°, 0°, +10°) × 4 real candidate input/cup phase pairs (\`0/0\`, \`0.2481/0.6133\`, \`0.6241/0.6133\`, \`0.6241/1.0254\`, degrees). Each case checks 6 source balls against the shaft and cup: **144 exact OpenCascade native Boolean volume checks**. 5 tested cases have ≥1 ball/race pair intersection over the exploratory 0.05 mm³ threshold; 7 do not. **60 additional exact BRepExtrema minimum-distance evaluations** on five deliberately selected cases determine whether the same ball is near both source races (witness threshold 0.00001 mm). The surface-distance = 0 result alone is not proof of safe contact because it can also mean penetration; simultaneous Boolean results are always retained.

## Executed source-native witnesses

| Bend | shaft/cup counter-phase | Balls near both races | Overlap pairs >0.05 mm³ |
|---|---|---:|---:|
| 0° | 0.6241° / 0.6133° | 6/6 | 0 |
| +10° | 0.2481° / 0.6133° | 0/6 | 0 |
| +10° | 0.6241° / 0.6133° | 2/6 | 2 |
| +10° | 0.6241° / 1.0254° | 6/6 | 4 |
| −10° | 0.6241° / 0.6133° | 2/6 | 2 |

At +10° and input/cup phase 0.6241°/1.0254°:
- original native shaft/balls 2,5: ~**0.07080168 mm³** intersection per ball;
- original native cup/balls 1,4: ~**0.05089122 mm³** per ball;
- balls 3,6 also exhibit smaller sub-threshold geometry intersections (not acceptable real contact-stress evidence).

This demonstrates a *sampled* simultaneous-engagement conflict. It does **not** rule out all continuous phase angles, self-centering cage solutions, an alternative track geometry, or an actual constant-velocity mechanism. A few collision-free sampled poses may still have clearance and no real torque transfer. The 0.05 mm³ threshold is not an OEM fit tolerance or stress/certification criterion.

## Source and reproducibility

- Repo: \`tools/cad-first/p2_34g_coupled_phase_gate.py\` — exact byte-matched script used locally; computes 144 native Booleans, 60 exact distances, source evidence JSON + CSV; verifies input Git/SHA provenance.
- Repo: \`tools/cad-first/test_p2_34g_coupled_phase_gate.py\` — exact byte-matched seven-test suite (actual original 84 STEP, 84-mesh neutral reference GLB, collision positive control, SHA tamper blocking).
- User ZIP: \`PEDS_P234G_Coupled_CV_84BRep_TwoRace_Contact_QA.zip\` contains original SHA-pinned P2.34E STEP/index/native audit, unmodified 84-source GLB, complete tools, full JSON with every per-ball Boolean and focused nearest-point witness, CSV, plotted exact collision count, seven tests and SHA256SUMS.

**Clean ZIP extraction: 7/7 PASS, 17/17 SHA-256 files verified, ZIP CRC valid.** No GitHub Actions, merge or deployment.

**P2.34 remains IN PROGRESS.** This new evidence reinforces the need to replace/solve the native track/ball/cage contact geometry rather than simply enlarge balls. Genuine loaded dual-contact force, constant-velocity ratio, shaft/cup positive retention, real gearbox Model B mates and four-corner moving vehicle have NOT passed. P2.54 is a conditional project acceptance target, not measured overall percent-complete.
