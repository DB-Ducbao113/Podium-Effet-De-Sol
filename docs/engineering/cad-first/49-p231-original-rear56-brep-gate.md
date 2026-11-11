# P2.31/54 — Verified original 56-body rear CAD static gate

Date: 2026-11-11  
Branch: \`work/engineering-four-corners-local\`  
Status: **56 native B-Rep static PASS / mechanical G2 HOLD / original Model B not installed**

## Delivery

P2.30 contained 48 actual rear-source B-Reps (P2.29 native 46 plus the two P2.19 source-authenticated forged A-arms). P2.31 recovers the **exact original P2.10** authoring script from this repository's work branch, Git blob \`e8cdb4b652300a514e7eb015bf3cc9020765d11e\`, and adds its **eight missing** independently modeled bushings, outer spherical-bearing proposals and joint pins. The two P2.10 old A-arm bodies are deliberately excluded: P2.19's corrected A-arm geometry retains ownership.

The source-first execution authenticates 11 upstream source Git blobs; rebuilds P2.29's 46 native solids; imports two exact SHA-pinned P2.19 forged A-arm STEP solids; matches all 48 resulting source B-Reps to the original SHA-256-pinned P2.30 STEP by a unique bounding-box/volume signature; adds the eight native P2.10 B-Reps; and performs the incremental OpenCascade Boolean collision audit.

| Real native CAD verification | Measured |
|---|---:|
| Previously verified original native bodies | 48 |
| Newly included original P2.10 bodies | 8 |
| Total genuine source CAD B-Reps | **56** |
| All 56 unordered native part pairs | **1,540** |
| Carried original P2.30 old-old pairs | 1,128 |
| Newly or cross-source affected native pairs | **412** |
| AABB-separated new pairs | 392 |
| Exact OpenCascade B-Rep Boolean checks | **20** |
| Positive collisions above 0.05 mm³ | **0** |
| Native Boolean errors | **0** |
| Original source STEP roundtrip | **56/56 valid solids** |
| Unique source ID ↔ STEP solid index mappings | **56/56** |
| Source/geometry regression tests from clean ZIP | **9/9 PASS, 0 skips** |
| SHA-256 checksum entries from clean ZIP | **36/36 valid** |

Native STEP SHA-256: \`e09a949f8827be01f9c0e50fc9b9c781b302642f3b40ea432836fe16d7eac284\`.

The resulting full 56-body STEP is a substantive new native B-Rep assembly, not just a 56-mesh GLB. The source ID table maps each actual authoring part to the imported STEP index and validates every original eight P2.10 shape against its genuine code-built source.

## Visual QA limitation, not hidden

Importing the new STEP and tessellating some spherical bearing-ball solids produced nonwatertight meshes. Therefore, a fresh P2.31 GLB export was **not** falsely approved. Instead, the previously SHA-verified P2.29 visual GLBs with 56 individually named parts are retained as a separate viewer asset and checked against all 56 P2.31 STEP B-Reps. Maximum named-part bounding-box deviation by LOD:

- HIGH: 0.111893 mm
- BALANCED: 0.398600 mm
- PERFORMANCE: 1.414472 mm

These values verify geometric correspondence at the respective visual LODs only, not tolerance stackups, B-Rep/mesh Boolean equivalence, moving suspension or manufacturing fit. All retained viewer assets use base color \`#87929D\`.

## Reproduction without GitHub Actions

The P2.31 handoff ZIP includes original upstream P2.10/P2.9 authoring code, dependent source scripts, original SHA-pinned P2.30 native STEP, P2.19 two-arm STEP, new P2.31 56-native STEP, source-name index, old three GLBs, audit JSON, full regression source and logs.

Run from extracted \`PEDS_P231\`:

\`\`\`bash
PEDS_P231_ROOT="$PWD" PYTHONPATH=tools/cad-first python -m unittest -v test_p2_31_rear56_original_brep_gate
PYTHONPATH=tools/cad-first python tools/cad-first/p2_31_rear56_original_brep_gate.py --p230-dir sources/p230 --p219-dir sources/p219 --out output/new-native
PYTHONPATH=tools/cad-first python tools/cad-first/p2_31_step_name_map.py --p231-dir output/new-native --p230-dir sources/p230 --out output/new-map
\`\`\`

**Mechanical G2 HOLD:** P2.12/P2.14 original source toe/split-race fit remains to be integrated, projected full rear owner count is still 76 (not tested). Original Model B chassis and four wheel stations are unavailable in this source review, and real brake/gearbox/CV torque retention, suspension bump/toe/roll clearance, browser animation and video QA are incomplete.

**Progress:** **P2.31/54**, with P2.54 a provisional acceptance target rather than an effort percentage or guaranteed endpoint. Next: **P2.32/54** — authentic P2.11–P2.14 source ownership and bearing-replacement audit, then full native 76-solid gate. No merge, deploy or GitHub Actions.
