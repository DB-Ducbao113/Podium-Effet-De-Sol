# P2.34H/54 — Sampled coupled CV phase-path review

Date: 2026-11-11. Branch: `work/engineering-four-corners-local`.

**Result: screening evaluator implemented; authentic continuous path NOT measured. Mechanical G2 HOLD.**

P2.34G established exact native B-Rep interference in sampled 84-solid P2.34E source poses, but five two-race witnesses are insufficient for a monotonically sampled, common-bend phase path. P2.34H adds a fail-closed postprocessor; it does not generate new native measurements or alter 84 original solids.

Files:
- `tools/cad-first/p2_34h_phase_path_gate.py`: each independently measured pose requires six unique balls and BOTH original shaft/cup native BRepExtrema distances and Boolean overlap volumes. Rejects missing, nonfinite, negative and duplicate evidence. Treats gap and penetration independently. Requires three or more poses at a single bend, monotonic input and output magnitude phases, bounded phase increments, and exploratory output/input phase-increment ratio.
- `tools/cad-first/test_p2_34h_phase_path_gate.py`: ten synthetic contract tests. These are not source B-Rep tests.

The cup uses P2.34G's negative physical rotation convention: compare magnitudes of the positive `cupSpinDeg` increments and input increments. Default phase step screening limit 5°, ratio deviation 1%; volume threshold 0.05 mm³ and gap witness threshold 0.00001 mm. None is a validated mechanical engineering tolerance. Passing at finite samples never certifies constant velocity between samples, force contact, torque or structural retention.

Run:
```bash
cd tools/cad-first
python -m unittest -v test_p2_34h_phase_path_gate.py
python p2_34h_phase_path_gate.py --input /path/to/independently_measured_native_poses.json --out /path/to/new_report.json
```

Input is an array of source-native witness poses of the shape `{bendDeg,shaftSpinDeg,cupSpinDeg,ballWitnesses:[...]}`, each witness holding ball ID 1–6, both native minimum distances in mm, and both native intersection volumes in mm³. Do not interpolate P2.34G table values or convert synthetic tests into acceptance evidence.

Remaining P2.34 engineering gates: parameterize and revise the actual CV track and cage geometry from source; determine compatible 6-ball center trajectories and conjugate input/output angles; independently generate a new authentic source candidate; execute dense/adaptive native OCC contact/penetration checks at multiple bends; verify kinematics and load transfer. P2.34E source must remain immutable.

No merge, deploy, GitHub Actions, or Model B mechanical acceptance.
