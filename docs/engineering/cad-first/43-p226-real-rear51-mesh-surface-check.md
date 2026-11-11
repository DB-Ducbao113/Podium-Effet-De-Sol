# P2.26 — 51-source rear GLB triangle and enclosure audit

Date: 2026-11-11
Branch: `work/engineering-four-corners-local`
Status: **SOURCE-MESH SCREEN PASS / ORIGINAL 71-SOLID B-REP NOT RUN / MECHANICAL G2 HOLD**

## Real verified input

Uses the original P2.25 rear51 view: 11 P2.19 source suspension meshes plus 40 latest P2.23 wheel/brake/spindle meshes. The P2.25 manifest and each of the HIGH, BALANCED, PERFORMANCE GLBs have immutable SHA-256 pins inside the audit script. Exactly 51 distinct named, watertight, winding-consistent meshes with one neutral material base RGB `#87929D` are required.

## Executed P2.26 checks

| Gate | HIGH | BALANCED | PERFORMANCE |
|---|---:|---:|---:|
| Source cross-owner pair candidates | 440 | 440 | 440 |
| Existing P2.25 separated AABBs | 405 | 405 | 405 |
| AABB-overlapping pairs tested with VTK triangle contacts | **35** | **35** | **35** |
| Pairs with triangle surface contacts | **0** | **0** | **0** |
| Pairs with vertices enclosed by the opposite part | **0** | **0** | **0** |
| Model B chassis geometrically registered | NO | NO | NO |

VTK `vtkCollisionDetectionFilter` measures mesh triangle contacts. `vtkSelectEnclosedPoints` checks both mesh directions to detect fully contained parts whose surface triangles never cross. The detailed JSON report contains 35 × 3 = 105 individual pair results. Positive-control tests successfully identify interpenetrating boxes and an enclosed box; a negative control confirms separated parts are clean. Input byte tampering and changed manifest ownership are rejected. **6/6 tests PASS** in the packaged original-source environment, and 6/6 PASS after clean ZIP extraction.

### Scope limitations

This is a **triangle-mesh screening result**, not an exact native CAD B-Rep proof. It cannot certify every tangential/subtriangle geometry case, manufacturing tolerances, pressure contacts or mechanical strength. The result concerns only the 11 P2.19 suspension parts versus 40 P2.23 wheel/brake parts at one nominal pose. The separate P2.12/P2.14 original authoring sources were unavailable to the offline container; hence the 71-part original P2.24 cross-CAD gate is **still NOT RUN**. No original Model B chassis/body/gearbox mating, web assembly or video QA was performed.

## Reproduce with the P2.26 ZIP

The archive `PEDS_P226_Rear51_Real_Mesh_Collision_QA.zip` includes P2.25 source-named GLBs, source manifest, the Python scripts, the detailed 105-case JSON audit report, test log, README and SHA256SUMS. Requires `numpy`, `trimesh`, `vtk` (locally tested VTK 9.6.2).

```bash
python tools/cad-first/p2_26_mesh_surface_qa.py --p225-dir /path/to/PEDS_P226/source/review --out .local-assets/cad-first/p226-rear51-surface
PEDS_P226_SOURCE_DIR=/path/to/PEDS_P226/source/review PYTHONPATH=tools/cad-first python -m unittest -v test_p2_26_mesh_surface_qa
```

Native source validation and full Model B work remain gated. Next, run P2.24 with the exact original P2.9–P2.14 CadQuery scripts on the full repository checkout, address all real 71-solid native collisions, measure owner Model B datums, verify suspension motion and full-car browser/video QA. **G2 HOLD; no Actions, merge, deploy or production model substitution.**
