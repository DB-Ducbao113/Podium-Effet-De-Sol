# P2.32/54 — Original rear-joint ownership and partial native split-race preflight

Date: 2026-11-11  
Branch: `work/engineering-four-corners-local`  
Status: **76 source IDs PASS, reconstructed 62 native B-Rep static preflight PASS, full original 76-body B-Rep NOT RUN; G2 HOLD**

## What was verified from original project sources

The GitHub-connected repository's exact upstream authoring scripts were inspected and their Git blob SHA values confirmed:

| Upstream source | Git blob SHA |
|---|---|
| `p2_11_rear_toe_link.py` | `8ea653169f8a813acc52421089daf48855b773ca` |
| `p2_12_toe_adjuster.py` | `561ebdd652e5bf446bb946c56f907f4c5c0a8d67` |
| `p2_12_constrained_kinematics.py` | `2a419ff07ea5b203273647749af606c27098a67d` |
| `p2_13_rear_joint_prototype.py` | `32fc40ba114ef52724caa526f81a11e600daecbf` |
| `p2_14_split_spherical_race.py` | `9cea3e634348aa578391f42b491372d3b03db319` |

Original P2.11/P2.12/P2.13/P2.14 source contents and exact part-name declarations were checked against those GitHub files. **These full originals are not present in the offline CAD sandbox**, so they were *not executed locally as authoring modules*. The repository P2.32 gate's optional `--source-root` requires exact matching files and fails closed on missing or modified content.

The current actual **P2.31 56-solid native STEP** (SHA-256 `e09a949f8827be01f9c0e50fc9b9c781b302642f3b40ea432836fe16d7eac284`) and its bijective 56-name source index were used locally and revalidated.

## Correct source ownership for P2.33 — projected 76 bodies

P2.12's 19 independent source IDs include 11 upstream P2.9/P2.10 IDs already present in the 56-part STEP. It replaces P2.11's fixed-length toe rod with five new pieces and retains one toe clevis pin plus two old P2.11 bearing placeholders. P2.13 defines the replacement identity of **four** old bearing proxies. P2.14 authors 4 parts at each of 4 stations (two race halves, a drilled spherical ball, a slide-on retention sleeve), giving **16 P2.14 part IDs**. Old P2.13 8-part prototype pieces are *not* retained.

| Identity step | Part count |
|---|---:|
| Original P2.31 STEP source B-Reps | 56 |
| Remove two old P2.10 bearing proxies | −2 |
| Retained prior genuine source bodies | **54** |
| Add 5 P2.12 toe adjuster pieces + one P2.11 clevis pin; discard two P2.11 old bearings | +6 |
| Add 4 × 4 split race/bearing pieces from P2.14 | +16 |
| **Proposed unique owner-part union** | **76** |

This is an **ownership schema**, not 76 mechanically proven native B-Reps. The 76-part original source static gate has **2,850 potential pairs**; 1,431 old-old pairs are inherited from a prior verified static pose, and **1,419 new/affected native pairs** still need exact CAD checking.

## Actual P2.32 B-Rep preflight

A deliberately constrained engineering test imported the **real original P2.31 56 native CAD solids**, deleted two obsolete P2.10 outer bearing proxies and generated **eight upper/lower P2.14-like bearing solids using analytical geometry directly transcribed from P2.13/P2.14 source definitions**. These eight are **reconstructed formula parts, NOT exact original P2.14 code execution**. No toe joint geometry was introduced.

| 62-native-body preflight | Executed result |
|---|---:|
| Authentic original P2.31 bodies retained | 54 |
| Added formula-reconstructed upper/lower joint bodies | 8 |
| Provisional native source bodies | **62** |
| Total nominal pose pairs | 1,891 |
| Previously verified retained pairs | 1,431 |
| Newly affected pairs | **460** |
| AABB-separated new pairs | 418 |
| Exact OpenCascade B-Rep Boolean checks | **42** |
| Nominal intersections >0.05 mm³ | **0** |
| Native Boolean failures | **0** |
| Partial-proposal STEP roundtrip valid solids | **62/62** |
| Native ownership/preflight + repo-gate tests | **13/13 PASS, 0 skips** |

The exported STEP explicitly contains `reconstructed_split_races_NOT_ORIGINAL_P214` in its filename and its JSON manifest sets `originalP214GithubBrepSourceExecuted=false` and `full76NativeSourceClaim=false`. It must **never** be treated as a true original P2.14 or complete rear Model B assembly.

Nominal source dimensions (not certified functional fit): race sleeve outer radius 11.88 mm versus eye bore radius 12.0 mm (radial difference 0.12 mm); split race radius 11.25 mm versus sleeve bore radius 11.35 mm (0.10 mm); spherical ball radius 9.65 mm versus cavity radius 9.95 mm (0.30 mm). P2.14 sleeve lacks certified axial retention; P2.12 does not establish manufacturer-approved internal female threads.

## Reproduction without GitHub Actions

The `PEDS_P232_Rear76_Owner_and_Partial62_BRep_QA.zip` package includes the authentic P2.31 STEP and source name map, full 76-name owner inventory, a separate actual native 62-solid reconstructed preflight STEP, Python authoring/audit scripts, 13 source QA tests and SHA-256 checks.

```bash
PEDS_P232_DATA=./source PYTHONPATH=./tools python -m unittest -v test_p2_32_rear_joint_ownership test_p2_32_repo_gate
python tools/p2_32_repo_gate.py --p231-step source/P231_rear56_original_native_static.step --p231-names source/P231_step56_source_name_map.json --out output/reproduced_owner
python tools/p2_32_upper_lower_split_preflight.py --step source/P231_rear56_original_native_static.step --names source/P231_step56_source_name_map.json --out output/reproduced_preflight --export-step
```

**P2.33/54 next:** get the full original executable P2.11–P2.14 sources into the same native CAD environment, generate six *original* toe pieces and 16 *original* P2.14 split parts, remove original obsolete bearing placeholders, check all **1,419** newly affected exact B-Rep pairs, then export a *true* source-owner 76-solid STEP/GLB only after PASS. Actual Model B original chassis fit, four corners, wheel motion and Three.js/Anime.js website QA remain separate gates.

**Mechanical G2: HOLD. No merge, deploy, GitHub Actions or replacement Model B car.**
