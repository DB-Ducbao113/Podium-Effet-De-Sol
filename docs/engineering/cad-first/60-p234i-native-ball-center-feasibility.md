# P2.34I/54 — Original-native six-ball center feasibility screen
Date: 2026-11-11. Branch: `work/engineering-four-corners-local`.

**Code committed, synthetic contract tests only; real P2.34E STEP search NOT yet executed. Mechanical G2 HOLD.**

The P2.34G original-native coupled shaft/cup phase evidence showed sampled conflicts. P2.34H postprocessed possible sampled phase paths. P2.34I investigates a prior prerequisite: at one fixed coupled pose, can each source ball move a small bounded distance in its local radial/tangential/axial directions to approach both original source race surfaces without significant penetration or penetrating its original cage?

The tool `tools/cad-first/p2_34i_native_ball_center_search.py` authenticates the existing 84-solid STEP, name index and audit using P2.34F's hard-pinned loader. It rotates original shaft and cup exactly as P2.34G; retains original ball shape and cages as native B-Reps. Only trial copies of ball solids are translated. For each ball and candidate, native OpenCascade Boolean volume and BRepExtrema distance are measured against shaft, cup and half-bend cage. The baseline at zero displacement is retained. The default radial/tangential/axial 3D grid has 0.2 mm steps inside 0.4 mm sphere, and enforces an explicit finite search budget.

The exploratory screen requires near-both-race distances <=0.00001 mm, no tested volume >0.05 mm³, and no detected cage overlap. Small nonzero ball/race overlap below 0.05 mm³ is **ambiguity**, not validated stress-free contact. The thresholds are investigative only, not production tolerances. Candidate centers are independently selected: this does not validate ball-to-ball collisions, six mutually compatible cage pocket centers, continuity across phase, equal angular velocity, load transfer or actual torque.

Run from `tools/cad-first`:
```bash
python -m unittest -v test_p2_34i_native_ball_center_search.py
python p2_34i_native_ball_center_search.py --p234e-native /absolute/path/to/P234E_native --bend 10 --shaft-phase 0.6241 --cup-phase 1.0254 --step-mm 0.2 --radius-mm 0.4 --out /absolute/path/to/new-P234I-audit.json
```
Requires real owner-only source STEP/index/audit SHA matching P2.34F; never overwrites output. Source-independent contracts are not real-BRep tests. No STEP or GLB exported. No merge/deploy/GitHub Actions.

**Next design gate:** run multiple coupled poses and bends on authentic source, resolve six-ball joint cage trajectory and check ball-ball, then actually design new conjugate shaft/cup tracks and cage geometry in a separately named CAD variant, remeasure with native OCC and investigate physically supported torque/speed equality.

**G2 HOLD, P2.34 not complete.**
