# P2.30/54 — Original rear48 source native B-Rep cross-audit

Date: 2026-11-11
Branch: `work/engineering-four-corners-local`
Status: **48 native source solids static PASS; mechanical G2 HOLD**

## Source and actual execution

P2.30 merges the **46 author-source native CadQuery solids** from P2.29 with the **two native P2.19 forged A-arm B-Reps** imported from an original SHA-256-pinned STEP. The original P2.9, P2.17 and P2.28 sources are SHA-pinned within P2.29; P2.29 itself is pinned to Git blob `afb997e6a8b0b08a8e30a354cadeb6de92a34475`. P2.19's exact imported STEP SHA-256 is `cad06f6632b1c6ef38f9e92130b7ac220af802c271556fd813aad1be397537fa`.

| Native static source gate | Executed result |
|---|---:|
| P2.29 source solids | 46 |
| SHA-verified real P2.19 A-arms | +2 |
| Combined authentic connected B-Rep solids | **48** |
| All 48 unordered pair combinations | **1,128** |
| Old P2.29 pair checks carried forward | **1,035** |
| New 48 source pairs requiring review | **93** |
| AABB-separated new pairs | **89** |
| Exact OpenCascade Boolean intersections among new pairs | **4** |
| Native intersections exceeding 0.05 mm³ | **0** |
| Native Boolean failures | **0** |
| Original native combined STEP import | **48/48 valid solids** |
| New P2.30 tests | **6/6 PASS, 0 SKIP** |

The four Boolean pairs are the two revised A-arm bodies against the original source rim and tyre. Each has zero measured volumetric intersection at the nominal pose. This is not a dynamic wheel or suspension sweep.

Actual `P230_rear48_original_static.step` SHA-256: `50d3856a8600e3826e8ce810cc6af74b301ffbacb940af7e355e2fbbaae654dc`.

## Strict limits

These 48 native B-Reps still omit the **eight remaining P2.10 source bodies**. The P2.29 **56-mesh** preview remains the latest rendering review but is *not* 56 original B-Rep bodies certified. The full P2.12/P2.14 native source union is still pending; its projected total after P2.29 is 76 distinct owner part IDs. This remains a projection, not an executed 76-body test.

The actual original Model B full-car body/chassis binary and wheel attachment coordinates, real CV articulation, caliper force path, axial retention, screw preload, suspension kinematic sweeps, Three.js/Anime.js reversibility and browser/video QA have **NOT** been validated. No OEM/compliance claim is made.

## Reproduction

```bash
PYTHONPATH=tools/cad-first python tools/cad-first/p2_30_rear48_brep_gate.py --p219-native-dir .local-assets/cad-first/p219-native --out .local-assets/cad-first/p230-rear48-native --export-step
PEDS_P230_NATIVE48_DIR=.local-assets/cad-first/p230-rear48-native PEDS_P219_NATIVE_DIR=.local-assets/cad-first/p219-native PYTHONPATH=tools/cad-first python -m unittest -v test_p2_30_rear48_brep_gate
```

Output directories must be new and original P2.19 and P2.29 sources must match the approved Git blobs. Fail-closed on any mismatch. No GitHub Actions, merge, PR or deploy.
