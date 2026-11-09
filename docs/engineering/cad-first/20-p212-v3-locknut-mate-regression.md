# P2.12 v3 — corrected male-to-locknut RH/LH thread mating

Repository: `DB-Ducbao113/Podium-Effet-De-Sol`  
Branch: `work/engineering-four-corners-local`  
CAD source: `tools/cad-first/p2_12_toe_adjuster.py`  
Schema: `podium-eds.p2.cad-first.rear-toe-adjuster-threaded.v3`  
Mechanical gate: **G2 HOLD**, no production approval, no merge, no deploy.

## Confirmed source mismatch and fix

The previously distributed P2.12 v2 CAD ZIP used a shorter male-crest region than the latest GitHub source. Rebuilding the former GitHub version with 34 mm male helices exposed a **native B-Rep intersection of 0.117870 mm³ between the outer threaded rod and outer locknut** at the nominal pose. That exceeds the 0.05 mm³ static-review threshold and invalidates any claim that the previous GitHub v2 source had passed the package's tests.

The revised source, **P2.12 v3**, corrects this:

- Outer male RH crest: **s = 45–69 mm** (24 mm long).
- Inner male LH crest: **s = 99–123 mm** (24 mm long).
- Outer locknut physical body: **s = 47.5–53.5 mm**, female groove nominal phase starts s = 47 mm.
- Inner locknut physical body: **s = 114.5–120.5 mm**, female groove nominal phase starts s = 115 mm.
- Sleeve body: **s = 56–112 mm**; already has distinct RH/LH native B-Rep female grooves plus four axial runout zones.
- Nominal locknut-to-sleeve axial gap: **2.5 mm** at static source pose. Across the six sampled free-screw positions, minimum calculated gap is **2.0 mm**.
- The earlier P2.11 fixed toe rod is **replaced**, never duplicated. Total source remains **19 independently named CAD solids**.

Native nominal rod/locknut intersections are **zero for both sides**. The source combined static audit enumerates **171 unique body pairs**, with 147 AABB separations, 24 native B-Rep Boolean candidates, no recorded positive intersections exceeding 0.05 mm³, and no Boolean exceptions at the static source pose.

## Independent local source artifacts (November 9, 2026)

A separate native CAD review generated and validated the corrected geometry, then packaged source, STEP, three GLBs, a SHA-256 manifest, screenshots, static audit and six-pose evidence.

| Source QA | Result |
|---|---|
| Native STEP roundtrip | 19/19 solids valid |
| Static 19-solid unique pairs | 171/171 enumerated; source static gate PASS |
| Outer rod ↔ outer locknut at nominal pose | 0 mm³ positive volume |
| Inner rod ↔ inner locknut at nominal pose | 0 mm³ positive volume |
| Isolated RH/LH screw-pair B-Rep: sleeve at −90°, 0°, +90° | 6/6 finite-volume comparisons below 0.05 mm³ |
| Minimum nominal sleeve-to-locknut gap across six poses | 2.0 mm |
| GLB HIGH | 80,440 triangles, 19 watertight semantic meshes |
| GLB BALANCED | 31,434 triangles, 19 watertight semantic meshes |
| GLB PERFORMANCE | 17,852 triangles, 19 watertight semantic meshes |
| Full original P2.8/Model B WebGL browser rendering | Not run |
| Full NPM/TypeScript/Vitest app QA | Not run |

The native 19-solid generator can be sensitive to repeated OCCT mesh-cache and export operations. The regression suite therefore keeps its unit STEP/tessellation checks separate from the **complete 19-solid regeneration** gate. The `p2_12_thread_sweep.py` script runs **each angle/rod pair in its own Python process**, with a timeout, and writes a fail-closed source-hashed evidence JSON. `run_four_corners_local.py` enforces v3 manifest identity, SHA evidence, 171-pair static QA and this isolated screw-pair review before any WebGL recording.

### Remaining mechanical blockers

**No mechanical G2 approval.** Although six discretely sampled screw-pair positions are noninterfering, they do not show continuous, load-bearing thread flank contact or torsion/axial load transmission. A purposely misphased 180° source check does not reliably report positive interference. Treat actual thread engagement/load transfer as **unproven**, not PASS.

Still outstanding: full 19-solid dynamic swept collision including translating bearings, fastener retention and real chassis kinematics; actual measured chassis toe pickup and 59-part P2.8 wheel/brake mating; realistic thread tolerances, stress/fatigue, locking torque/preload, material strength, 2026 FIA compliance and full browser/MP4 validation. The external Model B showroom source remains unchanged.

The reference ZIP containing binary CAD evidence is a **local review artifact**; only source code, browser validation, test code and documentation are committed on the GitHub work branch.

**Gate: P2.12 v3 native static source PASS; mechanical validation G2 HOLD.**
