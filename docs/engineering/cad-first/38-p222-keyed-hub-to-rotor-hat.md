# P2.22 — Source-authored four-key hub to rotor-hat fit (static HOLD)

**Date:** 2026-11-10  
**Working branch:** `work/engineering-four-corners-local`  
**Status:** Native static source PASS; full Model B mechanical G2 HOLD; no merge, deploy or GitHub Actions.

## Defect and corrective source CAD

P2.21 fixed the rear rotor-to-hat axial seat but still left a **0.40 mm radial gap between hub and hat**. This is not a demonstrated torque transmission path, even if the aggregate B-Rep collision count is zero.

`tools/cad-first/p2_22_keyed_hub_rotor.py` modifies **only review-local** instances of three source B-Rep bodies, retaining their original source part IDs:

- `P216_REAR_HUB_STUB`: a connected native ring shoulder occupies z=-93.5..-90 mm and axially seats on the hat at z=-90. Four integral straight rectangular keys extend from the actual hub B-Rep.
- `P217_REAR_ROTOR_HAT_SPACER`: broach four corresponding subtractive 3D key slots into a reinforced hat stem; keep the existing P2.21 eight-hole disc flange seated at z=-64.
- `P217_REAR_BEARING_DUST_SEAL`: move a preliminary annular seal envelope to z=-98..-95, clear of the hub shoulder. This does **not** establish a working sealing lip.

No new virtual geometry is appended as a separate duplicated wheel. P2.16–P2.21 source files, the authentic owner Model B GLB, production code and animations remain unchanged. The resulting P2.22 rear review still contains **40 uniquely named native CAD bodies**. All GLBs retain the user's single neutral grey base color `#87929D` with varying PBR response.

## Measurements and scope

| CAD check | Observed |
|---|---:|
| P2.21 hub-to-hat source gap | **0.400000 mm** |
| P2.22 hub-to-hat seated minimum | **0 mm** |
| Hat-to-rotor seated minimum | **0 mm** |
| Nominal source B-Rep bodies | **40** |
| Total unordered part pairs | **780** |
| Broadphase AABB exclusions | **634** |
| Exact OpenCascade B-Rep intersection pairs | **146** |
| Nominal positive overlaps exceeding 0.05 mm³ | **0** |
| Forced +0.5° relative hat rotation: key interference | **23.555649 mm³** |
| P2.22 STEP roundtrip connected native solids | **3 / 3** |
| P2.22 HIGH / BALANCED / PERFORMANCE GLB triangles | **8,840 / 3,580 / 2,016** |
| SHA-verified rear40 preview mesh count | **40 / 40 each tier** |
| Rear40 HIGH / BALANCED / PERFORMANCE triangles | **87,528 / 48,148 / 37,254** |
| Unit tests | **5/5 P2.22 native + 1/1 composite PASS**, executed separately |

The forced angular interference is a **negative control** proving the keys occupy real solid geometry. It is **not** a torque test or a permitted 0.5° running deflection. No thread preload, mechanical strength, stiffness, positive retention, or load path into the gearbox was established.

Two SHA-verified P2.19 forged A-arm bodies were independently imported from the existing original local P2.19 STEP (`cad06f6632b1c6ef38f9e92130b7ac220af802c271556fd813aad1be397537fa`). Against the 40-body P2.22 nominal source: 80 candidate pairs, 76 AABB exclusions, 4 exact B-Rep Booleans, **0 significant overlaps**. This gate concerns only those two A-arms, not every P2.9/P2.10/P2.12/P2.14 component.

## Reproduction (local authenticated checkout)

```bash
PYTHONPATH=tools/cad-first python -m unittest -v test_p2_22_keyed_hub_rotor
python tools/cad-first/p2_22_keyed_hub_rotor.py --out .local-assets/cad-first/p222-native

PEDS_P221_REAR40_DIR=.local-assets/cad-first/p221-rear40-review PYTHONPATH=tools/cad-first python -m unittest -v test_p2_22_composite_review
python tools/cad-first/p2_22_composite_review.py \
  --previous-dir .local-assets/cad-first/p221-rear40-review \
  --native-dir .local-assets/cad-first/p222-native \
  --out .local-assets/cad-first/p222-rear40-review

python tools/cad-first/p2_22_p219_cross_gate.py \
  --p219-dir .local-assets/cad-first/p219-source \
  --out .local-assets/cad-first/p222-p219-cross
```

P2.22 refuses to overwrite a previous native output. The review builder verifies SHA-256 of source GLBs, original part IDs, and uniform material color; it fails closed on tampering. In the absence of the exact P2.21 rear40 bundle, the optional composite unittest **SKIPS**, not PASS.

## Blocking steps

**Original Model B FULL-CAR: NOT COMPLETE.** Still blocked by actual P2.20 full P2.12/P2.14 cross-source 63-body native verification, measured owner Model B rear wheel/chassis datums, drive/CV and brake loads, true bearing/lock retention, seal function, wheel spin/bump/toe sweeps, and source-authenticated WebGL browser/video QA. P2.22's new hub is an original engineering concept, not an F1 manufacturer's actual part.

**No GitHub Actions, PR merge, production deployment, or full-car readiness claim.**
