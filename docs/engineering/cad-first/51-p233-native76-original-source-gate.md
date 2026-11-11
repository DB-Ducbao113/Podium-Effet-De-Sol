# P2.33/54 — Native rear76 original-source integration gate (HOLD)

Date: 2026-11-11  
Branch: `work/engineering-four-corners-local`  
**Status: implementation + fixture regression PASS; real original 76-native-B-Rep union NOT EXECUTED; mechanical G2 HOLD.**

## Executed evidence

The assistant's CAD runtime has the genuine original **P2.31 56-solid STEP** with SHA-256 `e09a949f8827be01f9c0e50fc9b9c781b302642f3b40ea432836fe16d7eac284` and source-name bijection mapping. The native OpenCascade importer read all 56 B-Reps. It preserves **54 original source B-Reps** after deleting precisely two old P2.10 bearing proxies. The proposed owner union contains **six new P2.11/P2.12 toe pieces** plus **16 P2.14 split-race components**, yielding **76 independent source IDs**.

The local P2.33 regression tests used these 54 genuine old B-Reps with 22 **synthetic non-overlapping boxes** for the new components. This deliberately scoped test verifies source identity, pair accounting, collision-detection negative and positive controls, SHA-256 tamper rejection and fail-closed behavior. **8/8 local tests PASS**. It is *not* a real 76-body fit test or proof of the incoming CAD geometry.

| Original source / native QA | Result |
|---|---|
| Real P2.31 source STEP SHA-256 and 56-part name-map import | **PASS** |
| Real retained native old source bodies | **54** |
| Original P2.11–P2.14 executable authoring files in this local runtime | **MISSING** |
| Source-owner migration | 54 retained + 6 toe + 16 split = **76 IDs** |
| Full source candidate pair count | **2,850** |
| Previously certified retained old-old pairs | **1,431** |
| New or affected pairs requiring native B-Rep check | **1,419** |
| 54 genuine source + 22 artificial control box audit | **1,419 AABB exclusions; only algorithmic fixture** |
| Deliberate OpenCascade overlapping-solid control | **Detected** |
| Original 76 B-Rep source-native OpenCascade Boolean audit | **NOT RUN** |
| Original 76-body STEP/GLB export | **NOT PRODUCED** |
| Original Model B full car | **NOT AVAILABLE IN THIS REVIEW** |
| Mechanical G2 | **HOLD** |

## GitHub implementation

`tools/cad-first/p2_33_real_rear76_gate.py` is a strict original-source integration CLI. It:

1. Verifies the exact Git blob SHA-1 IDs of all **seven P2.9–P2.14 authoring modules**, before imports or output.
2. Imports the pinned genuine P2.31 56-solid STEP and source-name mapping.
3. **Executes original** `p2_12_toe_adjuster.all_parts()` and `p2_14_split_spherical_race.source_parts()` only when those complete source files are present and authenticated.
4. Removes four deprecated P2.10/P2.11 bearing proxies, retains corrected P2.19 arms and P2.29 upright, and ensures shared source IDs are not duplicated.
5. Carries forward only the verified **1,431** pairs of unchanged 54-source B-Reps, then AABB-excludes or exact-OpenCascade-checks every one of **1,419 new/affected pairs**.
6. Writes a failure audit with actual conflicting source IDs if interference occurs. Only after PASS can it emit a new 76-solid STEP, roundtrip-validity evidence and a source-name index; the original car remains excluded.

It does **not** invent missing toe rods, bearings or connector geometries, or force GLB tessellation to hide failed native solids.

## Reproduce on the full source checkout (without GitHub Actions)

```bash
python tools/cad-first/p2_33_real_rear76_gate.py \
  --p231-step .local-assets/cad-first/P231_rear56_original_native_static.step \
  --p231-name-map .local-assets/cad-first/P231_step56_source_name_map.json \
  --source-root tools/cad-first \
  --out .local-assets/cad-first/p233-authentic-rear76 \
  --export-step
```

Do not treat `--export-step` as guaranteed to succeed: exact source Booleans may reveal interference requiring a later geometry patch, and no output occurs when authoring sources are absent or changed. Locally, the real-source attempt stopped at missing `p2_11_rear_toe_link.py` **before any 76-part STEP/GLB was created**.

A separate, extended regression implementation, a genuine P2.31 native STEP, source map, logs, 8 tests and SHA-256 manifests are in the P2.33 ZIP handoff.

## Remaining blocker and patch numbering

**P2.33/54 remains the active patch**, not P2.34. Completion of P2.33 requires running the verified upstream source B-Reps together with the P2.31 native STEP, solving any real 76-body interference and verifying a true named 76-body STEP output. Thereafter P2.34 addresses inner CV connection and P2.39+ the original owner's Model B chassis. P2.54 is an acceptance *target*, not guaranteed end or effort percentage.

No GitHub Actions, merge, deployment, PR or replacement exterior F1 model.
