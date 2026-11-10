# P2.18 — Native threaded rear center-lock source (G2 HOLD)

Date: 2026-11-10
Branch: work/engineering-four-corners-local
Scope: original rear wheel-local CAD static study; original Model B binary unchanged.

## Source changes

- 2 independently authored connected CadQuery B-Rep solids: right-handed helical male spindle extension and 12-flat female nut with helical Boolean-cut groove.
- Nominal 3 mm thread pitch. Actual spindle-to-original-hub interface is face contact, not a certified retention/load path.
- Only the SHA-verified review composition removes the P2.16 unthreaded nut. P2.16 and P2.17 source bytes, original GLBs, and original Model B are not modified.
- Single neutral material base color #87929d across all P2.16, P2.17 and P2.18 CAD parts; PBR reflectance remains material dependent.

## Verified offline measurements

| Gate | Result |
|---|---:|
| B-Rep candidate solids | 32 = 23 - 1 + 8 + 2 |
| Static candidate pairs | 496 |
| Broadphase exclusions | 391 |
| Exact B-Rep Boolean pairs | 105 |
| Overlaps >0.05 mm3 | 0 |
| P2.18 STEP roundtrip | 2/2 valid |
| P2.18 GLB triangles (H/B/P) | 7260 / 2976 / 1810 |
| Rear32 review GLB triangles (H/B/P) | 69616 / 47200 / 41366 |
| Source unit tests (P2.16-P2.18) | 17/17 PASS |

All 32 review meshes have preserved original part names and RGBA (135,146,157,255). The source composite checks SHA-256 identity and refuses tampered input GLBs.

## Reproduce

Run with PYTHONPATH=tools/cad-first from the repository root; tests:

python -m unittest -v tools/cad-first/test_p2_16_rear_wheel_end.py tools/cad-first/test_p2_17_rear_brake_drive.py tools/cad-first/test_p2_17_composite_review.py tools/cad-first/test_p2_18_center_lock.py tools/cad-first/test_p2_18_composite_review.py

Build source: python tools/cad-first/p2_18_center_lock.py --out .local-assets/cad-first/p218-threaded-lock

Composite: python tools/cad-first/p2_18_composite_review.py --rear31-dir .local-assets/cad-first/p217-rear31-neutral-review --thread-dir .local-assets/cad-first/p218-threaded-lock --out .local-assets/cad-first/p218-rear32-neutral-review

## Release hold

Mechanical G2 remains HOLD. Need rear wheel datum registration and real B-Rep cross-source fit with P2.9/P2.10/P2.12/P2.14; validated threaded torque, bearing preload and spindle retention; CV driveshaft, brake hydraulics, chassis and suspension kinematics; original Model B browser and scroll QA.

This is not OEM F1 CAD and not an installed/verified Model B car. No GitHub Actions, merge, deployment, Chromium footage or production release performed.
