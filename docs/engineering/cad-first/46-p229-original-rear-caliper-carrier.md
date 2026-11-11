# P2.29 — Authentic P2.9 rear caliper-to-upright mounting study

Date: 2026-11-11  
Working branch: `work/engineering-four-corners-local`  
Status: **46 original-source native B-Rep bodies nominal static PASS; 56 source review GLBs PASS; original Model B mechanical G2 HOLD**

## Source provenance and defect

P2.27 found a guaranteed lower bound of 33 mm between the rear caliper and rear upright using source mesh AABBs. P2.29 restores the **complete original P2.9 authoring script** from the connected project GitHub branch; its Git blob SHA-1 is `0a6b95d53479b63006d2103b24efb44e846589b1`. The original P2.17 and P2.28 authored scripts are also verified against their exact Git blob IDs before any P2.29 build.

An actual OpenCascade **minimum solid-to-solid distance** between the original P2.17 brake caliper and original P2.9 upright is **82.615071 mm** at the nominal wheel-local pose. This measurement is distinct from the previous conservative AABB lower bound.

## Authoring changes

`tools/cad-first/p2_29_caliper_upright_carrier.py` authors an individual connected machined caliper saddle B-Rep conformally cut against the actual original P2.9 cylindrical upright surface. It also drills four genuine clearance holes and models four distinct unthreaded bolts.

- **P29 upright:** preserve its original topology and datum locations except for two machined mounting bores in the radial carrier ring.
- **P217 caliper:** retain the source cast caliper body, drilling two radial mounting bores through the inboard cheek/bridge.
- **P229 radial carrier (new):** connected freestanding native B-Rep conformally fitted to the original upright and meeting the caliper cheek at y=196 mm.
- **Two P229 caliper mount bolts (new):** 3.0 mm shanks, recessed 5.0 mm heads; 3.45 mm-radius holes.
- **Two P229 upright mount bolts (new):** radial pins with machined counterbore seat at y=111 mm. All bolts are **unthreaded proposals**, not retained/qualified structural fasteners.

The initial positive-control model had both caliper bolt heads outside the caliper at rim radius ~223 mm and caused **18.7155 mm³ / 18.7299 mm³ of actual rim B-Rep collision**. Their heads were moved into carrier counterbores. The corrected final reviewed parts have no positive overlap beyond 0.05 mm³.

The revised carrier-to-upright and carrier-to-caliper minimum native B-Rep distances are **0.0 mm**. Contact is at the nominal designed faces and is **not** a structural torque, stress, threaded retention or load test.

## Executed source CAD / GLB QA

| Check | Executed result |
|---|---:|
| Original P2.9, P2.17 and P2.28 source Git blob identity | **3/3 exact matches** |
| Old original caliper ↔ P2.9 upright OpenCascade minimum distance | **82.615071 mm** |
| Revised caliper ↔ P229 carrier | **0 mm** |
| Revised P29 upright ↔ P229 carrier | **0 mm** |
| P2.28 rear wheel/brake/driveline source solids | 40 |
| Native P29 upright and P229 carrier + 4 bolts | +6 |
| Total native B-Rep bodies in nominal stage | **46** |
| Total native pairs | **1,035** |
| AABB broadphase exclusions | **838** |
| Exact native OpenCascade Boolean intersections | **197** |
| Overlaps >0.05 mm³ | **0** |
| P2.29 authored/revised STEP roundtrip | **7/7 valid solids** |
| Source review part identities | **56** |
| P2.29 HIGH/BALANCED/PERFORMANCE source review triangles | **122,800 / 62,314 / 45,040** |
| Newly changed 7 pieces × 10 unchanged P2.10 suspension source pieces (each GLB tier) | 70 pairs |
| Separated AABBs / VTK triangle-and-containment checks (each tier) | 68 / 2 |
| Cross-source VTK collision hits | **0** |
| Original/source handoff tests in clean extracted ZIP | **7/7 PASS, 0 skips** |
| Uniform CAD base color | **#87929D** |
| Signed bundle checksum entries | **36/36 verified** |

The P2.29 review script reads the SHA-256 verified prior P2.28 source review and P2.29 native seven-mesh outputs. It replaces exactly **two** old source mesh IDs (P29 upright, P217 caliper), adds exactly **five** new part IDs (one carrier and four bolts), leaving **56 independently named 3D meshes** without visual duplication. It does not mutate the original Model B or source P2.9/P2.17/P2.28 files.

The **46 native B-Rep pass does not include the other 10 P2.10 suspension B-Reps**. Their newly affected mesh pairs were screened via VTK at all three LODs, not the full native OpenCascade. Previous P2.19 43-body checks and P2.26 mesh checks remain separate evidence and should not be combined into a false full-vehicle PASS.

## Reproduction, without GitHub Actions

The attached `PEDS_P229_Original_Rear_Caliper_Carrier_56Part_CAD_QA.zip` contains:
- Exact original P2.9, P2.17/P2.28 and chain CAD source scripts and shared neutral palette;
- P2.29 seven-body STEP, three seven-part GLBs and native JSON audit;
- Three 56-part GLB review outputs, SHA manifests, all prior P2.28 source GLBs;
- Seven tests, logs, screenshot source-inspection render and two PNG snapshots;
- SHA256SUMS for all 36 other files.

From extracted `PEDS_P229/`:

```bash
PEDS_P229_NATIVE_DIR=./native PEDS_P229_P228_DIR=./sources/p228_review \
  PYTHONPATH=tools/cad-first python -m unittest -v \
  test_p2_29_caliper_upright_carrier test_p2_29_rear56_review

PYTHONPATH=tools/cad-first python tools/cad-first/p2_29_caliper_upright_carrier.py \
  --out ./new_p229_native

PYTHONPATH=tools/cad-first python tools/cad-first/p2_29_rear56_review.py \
  --previous-dir ./sources/p228_review --native-dir ./native --out ./new_rear56
```

## Model B / mechanical gates remaining

**G2 HOLD.** No genuine Model B original whole-car GLB/STEP, chassis rear pickup dimensions, gearbox connection, verified caliper brake reaction stiffness/stress, real bolt threads and retention, or wheel bump/toe/roll dynamics in this static source review. The P2.28 CV housing still has a 2.6 mm gap to the shaft. P2.12 and P2.14 genuine B-Rep integration is unverified. After adding five P229 source parts, the **projected future rear source owner count is 76**, not an executed 76-part mechanical fit.

No GitHub Actions, production GLB asset replacement, PR merge, or deployment.
