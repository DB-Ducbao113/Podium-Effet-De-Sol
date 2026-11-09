# P2.12 v3 — helical B-Rep Boolean false-negative regression

Project: **Podium Effet De Sol**  
Branch: `work/engineering-four-corners-local`  
Mechanical status: **G2 HOLD**, no production release or validated real-world toe adjustment.

## What failed in the old QA

The original P2.12 v3 local clearance review enumerated 171 static native CAD solid pairs and ran six additional RH/LH thread-pair Boolean intersections at sleeve angles −90°, 0° and +90°. These are valid **executed operations**, but their zero-overlap answers are **not sufficient proof of the absence of true helical interference**.

An independent negative-control experiment using the actual project-authored P2.12 v3 CAD detected the failure:

| Geometric test on deliberately misphased outer threaded rod | Observed |
|---|---:|
| Additional axial misphase | 1.0 mm = half of 2 mm thread pitch |
| Native OCCT `sleeve.intersect(misphasedRod).Volume()` | **0.0 mm³** |
| Native crest surface samples inside the actual sleeve `Solid.isInside` | **30/30** |

Thus the zero from OCC Boolean `common()` is **a false negative** for this complex swept geometry, not a successful clearance. Static 171-pair results and the six Boolean volume checks remain recorded as **Boolean-only evidence**, not mechanical G2 approval.

## Corrective local QA

New script: `tools/cad-first/p2_12_phase_contact_audit.py`. It uses the **project-generated native male helix**, independently tessellates its crest, samples **30 distributed crest points** in the actual female engagement region and queries `Solid.isInside(point, 0.002 mm)` on the real CAD sleeve or hex locknut. Each test runs in its own Python/OpenCascade process with a timeout. Existing evidence is never overwritten.

| 12 source-CAD cases | Results on packaged P2.12 v3 source |
|---|---|
| Sleeve, correct phase (RH/LH, −90°/0°/+90°) | **6/6**, 0 of 30 interior points per case |
| Sleeve, wrong half-pitch RH/LH at 0° | **2/2 detected**, 30 of 30 interior points each |
| Locknut, correct phase RH/LH at 0° | **2/2**, 0 of 30 interior points per case |
| Locknut, wrong half-pitch RH/LH at 0° | **2/2 detected**, 30 of 30 interior points each |
| Total | **12/12 PASS**, source-locked local artifact |

This verifies **phase sensitivity at the measured sample positions**, not a mathematically exhaustive continuous sweep. The negative controls are mandatory: a clearance-only test that always reports zero is now rejected.

The GitHub local review runner `tools/cad-first/run_four_corners_local.py` additionally requires:

- all 12 unique expected combinations;
- six aligned sleeve cases, two aligned locknut cases and four deliberately misphased controls;
- `cadSourceSha256` equal to the **currently checked out CAD source file**, not a historical ZIP SHA;
- 0/30 surface points inside the proper female part for every aligned case;
- at least 20/30 samples inside for every deliberately misphased case;
- explicit `mechanicalLoadCapacityCertified=false`, `continuousMotionCertified=false` and `mechanicalG2=HOLD`.

### Local reproduction (no GitHub Actions)

```powershell
python tools/cad-first/p2_12_phase_contact_audit.py --out ".local-assets/cad-first/p212-phase-occupancy-v2.json"
```

The evidence from this turn was **executed against the source included with the P2.12 v3 review ZIP**, which contains the same nominal geometry but is not asserted byte-identical to the current remote Python file. The complete source-checkout runner, npm build, browser/WebGL, source 59-solid P2.8 mechanical cross-check, complete continuous kinematics and physical stress testing **have not been executed on the whole repository in this turn**.

**Conclusion:** phase-sensitive geometry is demonstrated independently for sleeve and locknuts, including adversarial controls. This resolves an important false-negative testing blind spot, **not** real force-transmitting thread engagement or actual chassis-mated rear toe mechanics. **G2 HOLD.**
