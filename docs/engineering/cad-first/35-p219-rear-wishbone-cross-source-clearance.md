# P2.19 — Rear wishbone to wheel-rim clearance repair

Date: 2026-11-10
Branch: `work/engineering-four-corners-local`
Scope: rear wheel-local source CAD, not Model B installation.

## Problem reproduced

Direct native B-Rep intersections between the existing P2.10 forged A-arms
and the independent P2.16 rear rim exposed two substantive nominal-pose
geometry errors:

- `P210_REAR_UPPER_A_ARM_FORGED` vs `P216_REAR_FORGED_RIM_10_SPOKE`:
  approximately **464.90 mm3**.
- `P210_REAR_LOWER_A_ARM_FORGED` vs the same rim:
  approximately **200.03 mm3**.

The failures occur at the inboard rim region, about z = -214 to -208 mm.
The former isolated P2.10 and P2.18 checks did not test these cross-source
pairs. An isolated subsystem passing QA is not a whole-corner fit.

## Implemented correction

`tools/cad-first/p2_19_rear_wishbone_clearance.py` imports P2.9 and
P2.10 authoring definitions and **replaces only the two A-arm forged B-Rep
bodies in the review assembly**. Their original outer upright bores and
both inner chassis pickup datums remain unchanged.

The new source uses a short inboard shoulder, then a 55 mm axial dogleg
before the links diverge toward the pre-existing inner bushings. The
annular joint bores are re-cut after union and each revised arm is one
valid connected native B-Rep solid. This is an unapproved engineering
layout proposal, NOT a load-tested suspension design.

P2.9/P2.10 previous original source scripts are not overwritten; the
P2.16/P2.17/P2.18 source assets and the actual owner Model B also remain
unchanged. All displayed review CAD parts have the same neutral
base color `#87929D`, with differences only in PBR properties.

## Local validation evidence

| Gate | Recorded local result |
|---|---:|
| Legacy P2.10 arm-to-P2.16 rim overlaps | 464.90 / 200.03 mm3 |
| Overlap for both revised arms to rim | below 0.05 mm3 |
| New native B-Rep bodies | 2 valid |
| Cross-source nominal review bodies | 43 |
| Cross-source possible pairs | 903 |
| Excluded by AABB | 752 |
| Exact B-Rep Boolean intersections | 151 |
| Intersections over 0.05 mm3 | 0 |
| P2.19 native STEP roundtrip | 2/2 |
| P2.19 HIGH / BALANCED / PERFORMANCE triangles | 9392 / 3686 / 1996 |
| Combined 43-body GLB triangles (H/B/P) | 91670 / 55872 / 46068 |
| Combined GLB source mesh names | 43 unique per tier |
| Neutral CAD RGB | (135,146,157,255) |
| Standalone P2.19 tests | 5/5 PASS |
| 43-part composite SHA/mesh test | 1/1 PASS (with P2.18 asset bundle) |

**Local evidence limitation:** This container cannot clone/fetch the full
repository source over the network. The test used a local P2.9/P2.10
geometry fixture transcribed from the connected GitHub source definitions.
The repository scripts use the actual P2.9/P2.10 imports when run on a full
checkout. The local result is NOT a replacement for rerunning the exact
upstream-source test and comparing source SHA-256. The earlier 17 individual
P2.16–P2.18 tests passed, but a subsequent all-in-one test command
timed out while re-running the P2.19 static audit. Do not label that
combined run PASS.

## Commands on the full checkout

```bash
PYTHONPATH=tools/cad-first python -m unittest -v tools/cad-first/test_p2_19_rear_wishbone_clearance.py
python tools/cad-first/p2_19_rear_wishbone_clearance.py --out .local-assets/cad-first/p219-source

PEDS_REAR32_REVIEW_DIR=.local-assets/cad-first/p218-rear32-neutral-review PYTHONPATH=tools/cad-first python -m unittest -v tools/cad-first/test_p2_19_composite_review.py
python tools/cad-first/p2_19_composite_review.py --rear32-dir .local-assets/cad-first/p218-rear32-neutral-review --p219-dir .local-assets/cad-first/p219-source --out .local-assets/cad-first/p219-rear43-neutral-review
```

The 43-body preview requires an existing SHA-verified P2.18 rear32 bundle.
If missing, the composite test SKIPS and the preview cannot claim PASS.
The scripts reject unexpected CAD identities, tampered GLBs, mixed
colors and nonempty output directories.

## Mechanical and release status

**G2 HOLD / full Model B NOT integrated.** Still requires:

- Re-run exact P2.9/P2.10 native-code cross-source QA on a full repository checkout.
- Cross-source integration with P2.12 + P2.14 (toe/linkage and split races).
- True original Model B rear axle and chassis pickup measurements.
- Joint pin retention, drive shaft/CV linkage, braking, torque and load paths.
- Coupled bump, toe and roll kinematics and swept clearance, including
  wheel spin and steering.
- Actual browser Model B assembly integration, desktop/mobile framing,
  scroll reversibility, render performance and video QA.

No GitHub Actions, PR merge, deployment, OEM authenticity claim, or
manufacturing/mechanical signoff.
