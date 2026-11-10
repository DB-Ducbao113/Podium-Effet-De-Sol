# P2.25 — SHA-verified rear51 source mesh review

Date: 2026-11-10
Branch: \`work/engineering-four-corners-local\`
Status: **51 ORIGINAL-DERIVED GLB REVIEW PASS / REAL 71-BREP AUDIT NOT RUN / MECHANICAL G2 HOLD**

## Scope

This step provides a genuine, independently reproducible 51-part 3D source-preview output, not another synthetic CAD fixture. It merges two original generated review datasets already handed to the owner:

- P2.19 rear43 GLBs: 43 named source meshes with **11** original rear suspension parts (P2.9/P2.10).
- P2.23 rear40 GLBs: **40** newer rear wheel/brake/spindle parts.

There are **32 shared old source IDs**. Keeping only the 11 original P2.19 suspension IDs and every latest P2.23 rear ID yields **51 exactly named, separately renderable meshes**. Both source manifest and all six input GLB SHA-256 values were checked. No duplicate IDs, no source Model B mutation and no GitHub Actions.

## Actual shape revisions

All three LOD files independently compare mesh geometry identity using \`trimesh.identifier_hash\`:

- 27 shared P2.19/P2.23 mesh shapes are unchanged;
- 5 shared shapes were revised: \`P216_REAR_BRAKE_DISC_VENTED\`, \`P216_REAR_HUB_STUB\`, \`P217_REAR_BEARING_DUST_SEAL\`, \`P217_REAR_ROTOR_HAT_SPACER\`, \`P218_REAR_MALE_HELICAL_SPINDLE_EXTENSION\`;
- 8 P2.21 rotor-hat studs are new;
- 11 P2.19 independent rear suspension parts are retained unchanged.

The change ledger is **mesh shape evidence**, not a native B-Rep topology identity certificate.

## QA actually executed

| Test | Result |
|---|---:|
| Original P2.19 rear43 source SHA and GLB node names, all tiers | PASS |
| Original P2.23 rear40 source SHA and GLB node names, all tiers | PASS |
| P2.25 HIGH named mesh count / triangle count | 51 / **110,866** |
| P2.25 BALANCED named mesh count / triangle count | 51 / **57,428** |
| P2.25 PERFORMANCE named mesh count / triangle count | 51 / **42,380** |
| Unified PBR base color | \`#87929D\` on every mesh in all tiers |
| 11 suspension × 40 rear mesh cross-pairs | **440** |
| AABB-separated pairs | **405** |
| AABB candidates requiring exact CAD verification | **35** |
| Exact B-Rep tests of all 51 | **NOT RUN** |
| Original P2.19 two SHA-verified STEP arms vs P2.23 40 native source bodies | 80 pairs: **76** AABB separated, **4** native B-Rep intersections, **0** overlaps >0.05mm³ |
| P2.25 source/GLB tests with real shipped input bundles | **6/6 PASS, 0 skips** |
| Tampered GLB SHA-256 / malformed source name rejection | PASS |
| Owner Model B vehicle included | **NO** |

The 35 AABB candidates are *potential* overlaps, not confirmed mesh intersections. This must **not** be described as 35 defects or as a mechanically collision-free 51-body source.

## Reproduce locally without GitHub Actions

Extract \`PEDS_P225_Real_Rear51_Neutral_GLBS_QA.zip\`. It includes original source input manifests and six original source GLBs, the three real P2.25 review GLBs, a manifest with SHA-256, unit tests, the original 2-arm STEP B-Rep audit log and a SHA-256 file list.

\`\`\`bash
python tools/cad-first/p2_25_rear51_mesh_review.py \
  --p219-rear43 .local-assets/cad-first/p225-sources/rear43 \
  --p223-rear40 .local-assets/cad-first/p225-sources/rear40 \
  --out .local-assets/cad-first/p225-rear51-neutral

PEDS_P225_SOURCES=.local-assets/cad-first/p225-sources \
PYTHONPATH=tools/cad-first python -m unittest -v test_p2_25_rear51_mesh_review
\`\`\`

The output directory must be new. Any bad source hash, nonwatertight mesh, wrong source ID, color drift or changed revision identity aborts before publishing.

## Remaining blockers

- Exact original **51 B-Rep** cross-source intersections from all P2.9/P2.10 native parts, not just the two STEP A-arms.
- Real original P2.12/P2.14 **71-part** source union, bearing proxy replacement and B-Rep clearance check (P2.24 still HOLD).
- Owner Model B original rear chassis and wheel station measurements, gearbox/CV connection and real fastener retention and preload.
- Suspension bump/toe/roll and wheel spin sweeps; F1 OEM/manufacturing certification.
- Actual Model B six-chapter browser rendering, responsive QA and captured video.

**G2 HOLD.** Do not swap 51 preview meshes into production, represent the composite as the owner Model B car, deploy, or merge without separate authorization.
