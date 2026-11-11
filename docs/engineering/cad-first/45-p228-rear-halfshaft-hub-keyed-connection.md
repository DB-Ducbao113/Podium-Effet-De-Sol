# P2.28 — Rear halfshaft-to-hub native keyed connection

Date: 2026-11-11
Branch: `work/engineering-four-corners-local`
Status: **native rear40 static source PASS / rear51 visual source QA PASS / full Model B and mechanical G2 HOLD**

## Genuine source defect and repair

P2.27 measured **104.0 mm guaranteed direct separation** between the original P2.17 rear halfshaft source and the latest P2.23 hub. P2.28 corrects this using the actual project-authored P2.16–P2.23 CadQuery native B-Rep source, without inventing a disconnected visual adapter.

`tools/cad-first/p2_28_halfshaft_hub_connection.py` replaces **two existing part IDs only inside the P2.28 inspection source**:

- `P217_REAR_DRIVE_HALF_SHAFT_UNSPLINED`: a connected coaxial 18.4 mm radius extension (z=-249 to -130 mm) fused with the original halfshaft, a 23 mm radius inboard shoulder ending at z=-145 mm, and four integral axial keys.
- `P216_REAR_HUB_STUB`: four accurately located, intentionally clearanced rectangular keyways cut with native OpenCascade Booleans.

The shaft shoulder nominally seats on the original hub's z=-145 mm face. The tenon-to-hub-bore radial clearance is 0.6 mm. The four 4.5 × 6.0 × 14 mm keys sit inside four 5.2 × 6.8 × 18 mm cutouts. These clearances mean there is no free-state solid overlap. Rotating the shaft 2° relative to the hub intentionally produces a native geometric obstruction (a positive-control test); this is **not** torque strength or allowable torsional deformation proof.

Original named P2.16–P2.23 CAD objects, GLBs, Model B source binary and PBR material policy remain unchanged. All authored parts share base RGB `#87929D`.

## Verified local engineering evidence

| Gate | Result |
|---|---:|
| Original P2.17 shaft to P2.23 hub native separation | **104.000000 mm** |
| P2.28 nominal source shaft shoulder to hub face | **0 mm** |
| Four-key forced 2° relative rotation interference | **48.815124 mm³** |
| Distinct rear wheel/brake/source bodies after replacement | **40** |
| Pair candidates in full native source | **780** |
| AABB exclusions | **627** |
| Exact OpenCascade B-Rep pair intersections | **153** |
| Overlaps above 0.05 mm³ | **0** |
| P2.28 replacement STEP valid roundtrip solids | **2/2** |
| Replacement source LOD triangles H/B/P | **4,406 / 1,900 / 1,176** |
| SHA-authenticated latest rear51 review GLB triangles H/B/P | **112,492 / 58,136 / 42,824** |
| 2 altered parts × 11 source rear suspension bodies | **22** pairs/tier |
| Cross-source 3D mesh AABB candidates | **2** pairs/tier |
| VTK triangle and containment findings | **0** per tier |
| Original separate test modules run together | **6/6 PASS, 0 skips** |

The P2.28 visual review (`tools/cad-first/p2_28_rear51_review.py`) replaces **only** the shaft/hub source meshes in an independently SHA-pinned P2.25 rear51 GLB. All **51** source part names are preserved. The source and output meshes are watertight and neutral-colored at all three LODs. Modified meshes are also screened against the eleven original P2.19 rear suspension meshes with VTK; this is **mesh screening, not 51-body native B-Rep proof**.

All output manifest GLBs and STEP have SHA-256 hashes. The tools reject input mutation or changed source identities and refuse to overwrite previous output.

## CV blocker remains explicit

The shaft still has **2.6 mm nominal radial clearance to `P217_REAR_CV_HOUSING_PROTOTYPE`** and **4.6 mm to the CV boot envelope**. The P2.17 CV model is only a static envelope. This new interface does not certify a functional CV articulation, torque/spline strength, gearbox connection, bolt/clamp preload or positive axial retention. Caliper-to-upright mounting also remains an unresolved earlier source issue.

## Reproduction from source in local checkout

```bash
PYTHONPATH=tools/cad-first python tools/cad-first/p2_28_halfshaft_hub_connection.py \
  --out .local-assets/cad-first/p228-native

PYTHONPATH=tools/cad-first python tools/cad-first/p2_28_rear51_review.py \
  --p225-dir .local-assets/cad-first/p225-review \
  --p228-dir .local-assets/cad-first/p228-native \
  --out .local-assets/cad-first/p228-rear51

PEDS_P228_NATIVE_DIR=.local-assets/cad-first/p228-native \
PEDS_P228_P225_DIR=.local-assets/cad-first/p225-review \
PYTHONPATH=tools/cad-first python -m unittest -v \
  test_p2_28_halfshaft_hub_connection test_p2_28_rear51_review
```

The required old P2.25 source GLBs are packaged in the P2.28 ZIP or available in the earlier P2.25 handoff, not published as a Model B car asset.

**Mechanical G2 HOLD:** requires original P2.9–P2.14 full 71-solid native intersection clearance, measured Model B chassis/wheel pickup and real drivetrain/gearbox geometry, positively constrained spindle/coupler retention, actual coupled suspension motion sweeps, original Model B browser/Anime.js integration and full-car video QA.

No GitHub Actions, PR merge, deploy, production asset overwrite or original F1 OEM authenticity claim.
