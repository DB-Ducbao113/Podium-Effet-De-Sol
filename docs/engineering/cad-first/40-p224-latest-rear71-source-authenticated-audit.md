# P2.24 — Source-authenticated 71-part rear corner cross-CAD gate

Date: 2026-11-10
Branch: `work/engineering-four-corners-local`
Status: **GATE AND QA IMPLEMENTED; ORIGINAL 71-BREP AUDIT NOT RUN; MECHANICAL G2 HOLD**

## Why P2.20 63-body gate is obsolete

The latest P2.23 wheel/brake/spindle source has 40 bodies: the old P2.18 32-body wheel-end source plus the eight genuine P2.21 rotor-hat studs, with later keyed hub/spindle revisions replacing the source solids in-place. The P2.19/ P2.10 rear suspension carries 11 additional native bodies. Old source IDs must not be reused twice.

Correct current nominal owner-part lineage:

| Step | Parts |
|---|---:|
| P2.23 source wheel/brake/driveline | 40 |
| P2.19 corrected P2.9/P2.10 independent rear suspension | +11 |
| Intermediate source check | **51** |
| Delete two earlier P2.10 bearing proxies | −2 |
| Add six P2.12 genuinely additional toe/linkage parts (P2.12 contains 11 duplicated P2.9/P2.10 IDs and two deleted P2.11 bearing prototypes) | +6 |
| Add P2.14 replacement split-race and bearing source parts | +16 |
| Latest nominal source candidate | **71** |

Part ownership: 49 retained old shapes plus 22 new source shapes. This is **not** 71 mechanically validated bodies. The former P2.11 two bearing prototypes are not included in the +6 and are never subtracted a second time.

## Implemented source gate

`tools/cad-first/p2_24_rear71_authentic_gate.py`: before importing any original CAD, verifies 15 original Git blob SHA-1s and the exact committed shared neutral palette JSON hash, including P2.9, P2.10, P2.11, P2.12 constrained kinematics, P2.13, P2.14 and P2.16–P2.23 sources plus the existing P2.20 native B-Rep audit. Unexpected/missing sources abort without creating output.

Stage A combines exactly 40 named P2.23 parts with 11 independent rear suspension B-Reps. It inherits the prior 40-body 780-pair PASS and screens all **495 additional pairs**. Entire stage: **1,275 pairs**, 51 native solid candidates.

Stage B removes only two carried P2.10 obsolete bearings, deduplicates eleven common P2.9/P2.10 part IDs from P2.12, excludes two obsolete P2.11 bearings, adds six genuine toe parts and sixteen P2.14 split-race solids. It carries forward only the 49-body surviving 1,176-pair PASS, while screening **1,309 new/affected pairs**. Entire stage: **2,485 pairs**, 71 native solid candidates.

For every newly affected pair, the algorithm AABB-screens the bodies then computes an exact native OpenCascade B-Rep Boolean when overlapping. Positive intersections above 0.05 mm³ or failed Booleans force HOLD. Source body count and ID ownership are strict, not just mesh-count checks.

`tools/cad-first/p2_24_rear71_review_export.py`: only after original-source authentication **and both actual B-Rep stages PASS**, exports a 71-solid native STEP assembly and source-named BALANCED GLB, with one uniform material color `#87929D`. No source or vehicle assets are modified or copied to the production site. The visual export still carries G2 HOLD.

## Actual QA executed 2026-11-10

| Check | Result |
|---|---|
| P2.24 synthetic test fixture, plus real CadQuery B-Rep collision negative control | **7/7 PASS, 0 skips** |
| 51-part and 71-part source ID/de-duplication rules | **PASS** (synthetic lineage, not original CAD geometry) |
| Deliberately intersected new P2.14 part vs retained rear40 part | **Detected using OpenCascade B-Rep Boolean** |
| Reject stale 63-part source, missing bearings, modified/missing source hashes | **PASS** |
| Reject fake/unauthenticated 71-part STEP/GLB export | **PASS; no preview created** |
| Exact P2.24 code snapshots on branch vs local executed code | **All three SHA-1 Git blob checks matched** |
| CLI against this assistant's locally available source folder | **Failed closed: original `p2_9_rear_upright.py` absent** |
| Real 51-body original CAD cross audit | **NOT RUN** |
| Real 71-body original CAD cross audit | **NOT RUN** |
| True 71-part source STEP/GLB export | **NOT PRODUCED** |
| Original Model B full-car install, browser and motion QA | **NOT RUN** |

The connected GitHub source records were checked for their exact identities; the restricted local CAD runtime does not contain the seven original executable P2.9–P2.14 source files. It would be false to claim a 71-part original fit from synthetic tests. The full repository checkout has these authoring sources and can run this gate locally without GitHub Actions.

## Run on the full repository checkout

```bash
PYTHONPATH=tools/cad-first python -m unittest -v test_p2_24_rear71_authentic_gate
PYTHONPATH=tools/cad-first python tools/cad-first/p2_24_rear71_authentic_gate.py --out .local-assets/cad-first/p224-rear71-audit --export-review
```

The second command emits an authentic 71-body STEP and uniform-grey GLB only if both actual full-source stages pass. On collisions it writes an audit report with blocker part IDs and never exports misleading source geometry. Do not repeatedly run over an existing output folder.

## Outstanding Model B mechanical blockers

Authentic P2.12/P2.14 cross-CAD interference resolution; owner Model B rear chassis and wheel pickup measurements; CV and gearbox load path; safe brake/fastener retention and spindle torque/bearing preload; wheel spin/bump/toe/roll motion clearance and browser/video QA. G2 HOLD irrespective of nominal static PASS.

No GitHub Actions, merge, PR, deployment or OEM authenticity claims.
