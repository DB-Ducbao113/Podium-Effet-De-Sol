# P2.23 — Four-key rear spindle-to-hub source CAD

Date: 2026-11-10
Working branch: `work/engineering-four-corners-local`
Status: **40-part native static review PASS / mechanical G2 HOLD / Model B not installed**

## Issue addressed

P2.22 added four torque keys between the hub and rotor hat, but its P2.18 male threaded spindle was attached to the hub only by an axial face. That did not establish a positive keyed rotational interface. The user-required neutral engineering base color remains `#87929D` for every authored CAD mesh.

## Native geometry authored

`tools/cad-first/p2_23_spindle_hub_keyed_mate.py` works from genuine project-authored P2.22 and P2.18 CadQuery B-Reps and replaces **two existing source IDs only in the review**:

- `P216_REAR_HUB_STUB`: four rectangular broached female keyways in the existing inner r19 mm bore.
- `P218_REAR_MALE_HELICAL_SPINDLE_EXTENSION`: add one fused r18.65 mm outside, r14 mm inside hollow tenon, four axial solid male keys and a connected transition annulus to the original thread.

No old thread is deleted (original male thread missing volume measured as zero). The tenon radial clearance is 0.35 mm. Original P2.16–P2.22 files and Model B source bytes remain unchanged.

## Locally executed verification

| Source/native test | Result |
|---|---:|
| Replacement native connected B-Reps | 2 / 2 valid |
| Review CAD named solids | 40 |
| Nominal source potential pair count | 780 |
| AABB excluded | 634 |
| Exact OpenCascade B-Rep intersections | 146 |
| Nominal overlapping pairs >0.05 mm³ | **0** |
| Prior spindle-hub forced 2° overlap | 0 mm³ |
| Revised spindle-hub forced 2° overlap | **12.004305 mm³** |
| Original right-hand helical source missing volume | 0 mm³ |
| STEP native roundtrip | 2 / 2 |
| P2.23 HIGH/BALANCED/PERFORMANCE triangles | 10,128 / 4,232 / 2,606 |
| SHA-verified P2.23 rear40 review triangles H/B/P | 88,812 / 48,756 / 37,678 |
| Neutral PBR source RGB | (135,146,157,255) on all 40 review meshes |
| P2.23 local native + review tests | **5/5 + 1/1 PASS** |
| P2.19 original two-arm STEP vs 40 revised parts | 80 pairs, 76 AABB exclusions, 4 exact B-Rep, zero significant overlaps |

The deliberate forced rotation is a **negative interference control**, not a certified physical torque test. A matched keyway with clearance does not prove load strength, axial retention, clamp preload, fatigue, manufacturability or manufacturer-specific engineering.

### Important QA runtime limitation

The native STEP/GLB CLI executed successfully in a fresh Python process. Repeated heavyweight OpenCascade exports within one already loaded test process timed out twice. Source regression was therefore split into actual in-memory Boolean tests and SHA/STEP/GLB validation of independently generated outputs. These six separately executed tests PASS. No full-source automated browser or complete-car test was run.

## Execute on the repository checkout

```bash
python tools/cad-first/p2_23_spindle_hub_keyed_mate.py --out .local-assets/cad-first/p223-native
python tools/cad-first/p2_23_composite_review.py --previous-dir .local-assets/cad-first/p222-rear40-review --native-dir .local-assets/cad-first/p223-native --out .local-assets/cad-first/p223-rear40-review
PYTHONPATH=tools/cad-first PEDS_P223_NATIVE_DIR=.local-assets/cad-first/p223-native python -m unittest -v test_p2_23_spindle_hub_keyed_mate
PYTHONPATH=tools/cad-first PEDS_P223_NATIVE_DIR=.local-assets/cad-first/p223-native PEDS_P222_REAR40_DIR=.local-assets/cad-first/p222-rear40-review python -m unittest -v test_p2_23_composite_review
python tools/cad-first/p2_23_p219_cross_gate.py --p219-dir .local-assets/cad-first/p219-source --out .local-assets/cad-first/p223-p219-cross
```

Source output directories must be new. The optional composite test SKIPS rather than fabricating old CAD inputs when the original P2.22 binary bundle is missing. All source GLB/STEP hashes and native part names are validated before the composite can be exported.

## Whole rear suspension aggregation warning

P2.20's older **63-body** candidate is no longer the current generation: P2.21 added eight physically distinct rear rotor-hat studs. The latest candidate count before *authentic* P2.12/P2.14 re-mating is **71**: (40 P2.23 wheel/brake/drive bodies + 11 P2.9/P2.10 rear suspension) - 2 old P2.10 bearing proxies + 6 nonduplicated P2.12 source toe/linkage parts + 16 replacement P2.14 split-bearing parts. This is a **part ownership projection, not an executed 71-solid integration or proven source fit**.

## Required next engineering gates

- Real original Model B rear hardpoints, chassis/gearbox pickup measurement and source-to-car registration.
- Actual P2.12 and P2.14 original B-Rep 71-body native Boolean cross-source audit, with all substitutions applied exactly once.
- Positive axial spindle retention, secure center-lock thread engagement, bearing preload, real brake clamping and operating torque/stress/fatigue.
- Coupled wheel spin / suspension bump / toe / roll articulation and final assembly insertion paths.
- Original Model B browser six-chapter reversible scroll QA and owner-review video.

**Do not treat these 40 source meshes as an installed full F1. No GitHub Actions, PR merge, deployment or producer/model substitution occurred.**
