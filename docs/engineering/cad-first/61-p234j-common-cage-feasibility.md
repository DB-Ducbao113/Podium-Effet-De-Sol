# P2.34J/54 — Shared cage/ball group native feasibility
Date: 2026-11-11. Branch: `work/engineering-four-corners-local`.

**Code authored; 12/12 source-independent contract tests PASS locally using a test-only P2.34I utility shim. The genuine owner P2.34E STEP was not present or executed. Mechanical G2 HOLD.**

P2.34I independently screened six ball positions. Such independent positions need not be compatible with one physical cage. P2.34J instead translates one actual cage and its six original native balls by one shared 3D offset, preserving relative positions, while independently rotating the real input shaft and outer cup at the same prescribed phase. Default grid: 0.2 mm spacing within a 0.4 mm sphere. The zero-offset original baseline is retained; the best score is a diagnostic and not proof of feasible operation.

For every common translation, the code calls 33 native B-Rep intersection Booleans (12 ball-race, 15 ball-ball, 6 ball-cage) plus 12 minimum-distance checks (6 per original race). It rejects nonfinite and negative measurements and requires 6 ball IDs. The exploratory gate flags >0.05 mm³ ball-race or ball-ball overlaps, any cage/ball penetration, or >0.00001 mm gap to either original race. Numerical thresholds are research screening limits, **not engineering acceptance tolerances**; subthreshold solid overlap cannot be treated as certified contact.

Source input is P2.34E's existing SHA-pinned STEP/index/audit through the previously authored P2.34F native loader. No original STEP geometry is altered. No new STEP/GLB is generated; no cage reorientation, groove redesign, coupled moving trajectory, bearing forces, velocity equality, torque path or mechanical fit is certified.

Usage from `tools/cad-first`:
```bash
python -m unittest -v test_p2_34j_common_cage_rigid_search.py
python p2_34j_common_cage_rigid_search.py --p234e-native /path/to/P234E_native --out /path/to/new-P234J-report.json
```

**Next remaining gates:** execute source-native search on the authentic 84 solids, inspect and quantify gaps/collisions over a dense bend/phase set, derive cage center and orientation constraints, author separately versioned conjugate inner/outer track variants, validate native B-Rep, then evaluate actual constant-velocity kinematics and load transfer.

No merge, production deploy, GitHub Actions or Model B integration. **P2.34/54 remains IN PROGRESS; Mechanical G2 HOLD.**
