# P2.4 — Original full-corner static fit / source collision audit

**Project:** Podium Effet De Sol / Engineering CAD-first  
**Branch:** \`feat/engineering-inside-machine-v2\` · PR #4 Draft  
**Pilot route:** DEV-only \`/engineering/cad-lab\`  
**Date:** 2026-11-06  
**Status:** Original CAD geometry + static fit audit PASS; WebGL visual/kinematic acceptance OPEN; release HOLD.

## Goal and what changed versus P2.3

P2.3 successfully generated a 58-solid STEP master with male/female helical groove geometry, bearing raceways and caliper pistons, but its **selected-pair** overlap test had missed major interferences in the assembled front corner. P2.4 specifically corrects those mechanical source mistakes; it is not another lighting/shader iteration.

Before the rework, native OpenCascade B-Rep intersections measured e.g.:

| P2.3 bodies | Collision volume (mm³) |
|---|---:|
| Tyre / upper wishbone | 5,383.95 |
| Tyre / lower wishbone | 6,083.94 |
| Rim barrel / upright | 19,807.05 |
| Hub / center stud | 6,034.37 |
| Hub / rim center disc | 16,225.54 |
| Rotor hat / upright | 125,280.45 |
| Rotor hat / outer bearing race | 68,330.02 |

The P2.4 source generator \`tools/cad-first/p2_4_assembly_fit.py\` fixes these directly in the CAD master:

1. **Forged one-piece rim:** merge old barrel, centre disc and ten ornamental "separate spokes" into one connected manufacturing-oriented B-Rep. All ten spokes remain visible as geometric features. Thus the part list becomes more honest, not simply bigger.
2. **Wheel-to-hub axial faces:** correct hub/stud overlap, central rim bore and face washer axial stack to use nonpenetrating plane contacts rather than overlapping free bodies.
3. **Upright and wishbone clearance:** relocate three arm mounting ears inboard; add real link relief cavities, avoiding the tyre/wheel barrel. These are illustrative articulations, not production ball-joint specifications.
4. **Brake rotor hat:** move its shoulder and sleeve to the correct axial side of the existing upright/bearing. Genuine six-through-bore bolt pattern through the rotor/hat; six distinct hex nuts are added. The nuts' bores are **not** claimed to contain certified female helical thread geometry.
5. **Caliper clearance:** move castings and pads slightly inboard, replace two rotor-piercing pad pins with bridge tie studs outside the brake rotor swept radius, and Boolean-cut mating slots into the casting halves.

**R4.5 Model B was not reintroduced.** Every P2.4 solid is generated from the original project-authored P2.2–P2.3 B-Rep lineage, not an imported rights-uncleared Formula SAE model.

## Exact local evidence

Original STEP B-Rep round-tripped through OpenCascade:

- **53/53** connected, valid B-Rep solids;
- **685** analytic faces on reimported STEP;
- **1,378** unique body pairs considered (53 choose 2);
- **1,132** pairs rejected as nonintersecting by AABB;
- **246** potential pairs tested by native exact B-Rep Boolean intersection;
- **0** unresolved intersections above **0.05 mm³** in the single neutral assembled pose;
- **0** Boolean calculation failures;
- Source-file and collision-audit SHA-256 are recorded in \`P2_4_fit_manifest.json\`.

This audit does **not** prove dynamic clearance during wheel rotation, steering, suspension travel or braking. Contact forces, bearing preload, thread torque, heat expansion, tolerance stacks, caliper pressure, wear and vibration are not calculated. The 0.05 mm³ threshold is a *volume reporting threshold*, not an allowable machining tolerance.

## Export profiles

| Quality | Method | Triangles | File size |
|---|---|---:|---:|
| HIGH | Direct tessellation from native B-Rep | 292,292 | 4,799,848 B |
| BALANCED | Exact-seam cleaning + VTK quadric simplification of HIGH | 78,890 | 1,458,068 B |
| PERFORMANCE | Exact-seam cleaning + VTK quadric simplification of HIGH | 37,974 | 723,252 B |

All three preserve the **same 53 mesh/node IDs**. Lower tiers are **CAD-derived quadric decimations**, *not independently tessellated B-Rep profiles*. This is recorded as \`profiles[*].strategy\` in the manifest. Reduced GLB triangle counts are not proof of actual frame-rate improvements on user hardware.

## Source and local Windows reproduction

Sources:

- \`tools/cad-first/p2_2_front_left_original.py\`
- \`tools/cad-first/p2_3_precision_upgrade.py\`
- \`tools/cad-first/p2_4_assembly_fit.py\` — P2.4 original geometry corrections, B-Rep assembly and LOD export;
- \`tools/cad-first/p2_4_lod.py\` — true source-ID-preserving CAD-derived VTK decimation;
- \`tools/cad-first/p2_4_collision_audit.py\` — complete static pairwise audit.

Commands at the repository root:

\`\`\`powershell
cd "E:\Formula 1\Podium-Effet-De-Sol"
# If the authoring venv does not exist:
py -m venv .venv-cad
.\.venv-cad\Scripts\Activate.ps1
pip install -r tools\cad-first\requirements.txt

$dir = ".local-assets\cad-first\front-left-p2-4"
python tools\cad-first\p2_4_assembly_fit.py --out $dir --init
python tools\cad-first\p2_4_assembly_fit.py --out $dir --profile HIGH
python tools\cad-first\p2_4_assembly_fit.py --out $dir --profile BALANCED
python tools\cad-first\p2_4_assembly_fit.py --out $dir --profile PERFORMANCE
python tools\cad-first\p2_4_collision_audit.py --folder $dir
python tools\cad-first\p2_4_assembly_fit.py --out $dir --finalize
\`\`\`

The original owner-only archive has the STEP master, GLBs, source manifest, full collision audit, reproducible Python sources and offscreen diagnostic renders. None of its binary STEP/GLB contents are checked into the public web assets.

### CAD Lab review

Run the DEV web app at \`http://127.0.0.1:5184/engineering/cad-lab\`. Upload in order:

1. \`P2_4_fit_manifest.json\`;
2. \`P2_4_static_fit_audit.json\`, which must SHA-match the manifest, for the **STATIC ASSEMBLY FIT** evidence panel;
3. \`P2_4_front_left_balanced.glb\` or HIGH/PERFORMANCE.

Inspect real source parts via filter, ISOLATE SELECTED SOLID, GPU section view, and reversible EXPLODED CAD STUDY. The exploded timeline remains an **illustrative editorial separation**, not a validated servicing/kinematic sequence.

## Review and next gate

P2.4 achieves a credible **noninterpenetrating static educational CAD assembly**. The offscreen previews remain visually simplistic compared with the owner's benchmark \`animejs.mp4\`. More PBR and HDRI alone cannot supply actual suspension clevis pins, reliable wheel-bearing contact or caliper hydraulic architecture. These remain source engineering work.

**P2.5 recommended:** sample kinematics/rotational clearances using staged spatial constraints, add brake/shaft retaining hardware and finish original CAD detail, then start HDR studio/product-cinematic lookdev with source-accurate macro shots. Any visual signoff requires real browser evidence, not offline VTK pictures.

**CI:** No workflow edits, triggers, status checks or waiting. All commits carry \`[skip ci]\`.  
**Release:** PR Draft/HOLD. Do not merge or deploy.
