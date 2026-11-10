# P2.16 — Independent rear wheel-end native CAD, source-first (HOLD)

Date: 2026-11-10  
Branch: `work/engineering-four-corners-local`  
Review route: `/engineering/model-b-build` (unchanged)  
No GitHub Actions, PR, merge or production deployment.

## Why this was authored

The six-chapter Model B build can load a SHA-verified 59-mesh P2.8 **front**
corner, but its two rear wheel-ends still reuse visual parts of that front
source. P2.9 rear upright, P2.10 rear wishbones, P2.12 rear adjuster and P2.14
split spherical races are independent provisional sources, not a physically
verified, complete rear wheel-end. A numeric part catalog or transform count
does not prove that complete rear geometry has been designed.

**Do not use front wheel-end geometry to claim a native rear assembly.** Do not
display newly authored P2.16 geometry as mechanically installed on Model B
until its separate native alignment and clearance gates pass.

## New authored source

`tools/cad-first/p2_16_rear_wheel_end.py` builds an **independent native
CadQuery B-Rep rear wheel-end**. It does not mutate Model B, the P2.8 front
source, or the published rear component manifests.

- One hollow rear slick tyre section, full width 450 mm, outer diameter 720 mm
- One separately authored rear wheel rim, 490.6 mm lip outside diameter,
  429.3 mm rear mounting width, ten B-Rep fused spokes
- One source rear hub stub
- Separate bearing inner/outer races and 16 individually authored bearing balls
- One vented rear brake rotor with 16 actual Boolean holes
- One explicitly **unthreaded, provisional** center-lock shell

Total: **23 independent, named B-Rep solids**. Source STEP is in millimetres,
GLB in metres, rear wheel-local frame X forward, Y up, Z outboard.

### Reference dimensions, not evidence of an exact mechanical mate

The 2022 18-inch tyre family nominally uses a 720 mm outside tyre diameter
and a 405 mm rear tread width as described by Pirelli. The 2022 FIA technical
regulations Issue 3 specify a rear rim mounting width of 429.3 mm,
outer lip diameter of 490.6 mm and rear tyre permissible overall width
440–470 mm. This proposal chooses a 450 mm total tyre width.

References:
- Pirelli 2021 18-inch reveal: https://press.pirelli.com/a-look-into-the-future-of-formula-1-with-new-18-inch-tyres-for-2022-cars/
- FIA 2022 technical regulations, Issue 3, Art. 10.7/10.8: https://api.fia.com/sites/default/files/2022_formula_1_technical_regulations_-_iss_3_-_2021-02-19.pdf

All inner bearing, rotor, hub, spoke and locking surfaces remain original
project-authored provisional geometry. A dimensional fit to a P2.9 proposed
71.5 mm carrier bore is not a direct cross-source physical collision audit.

## Executed offline quality gates — exact authored Python source

The source was executed with CadQuery 2.8 / OpenCascade, trimesh and NumPy.
`tools/cad-first/test_p2_16_rear_wheel_end.py` contains six unittest gates.

| Gate | Measured result |
|---|---:|
| Valid native connected B-Rep solids | 23 / 23 |
| STEP roundtrip | 23 / 23 |
| Total possible self-pairs | 253 |
| AABB-excluded pairs | 166 |
| Exact native B-Rep Boolean intersection pairs | 87 |
| Intersections over 0.05 mm³ | 0 |
| HIGH GLB triangles | 58,276 |
| BALANCED GLB triangles | 42,916 |
| PERFORMANCE GLB triangles | 39,076 |
| GLB named nodes/watertightness | 23 / 23 per tier |
| Source unittest gates | 6 / 6 PASS |

All 3 GLB tiers and the STEP + hash manifest were generated **outside GitHub**
in the offline review environment. Do not commit `.step`, `.glb`, or the
private Model B scene binaries to the public repository.

Run from an installed local Python environment:

```bash
python -m unittest -v tools/cad-first/test_p2_16_rear_wheel_end.py
python tools/cad-first/p2_16_rear_wheel_end.py --out .local-assets/cad-first/p216-rear-wheel-end
```

The output directory must be empty; source export refuses overwriting earlier
CAD evidence. The tests are independent of GitHub Actions.

## Remaining actual engineering blockers

**MECHANICAL G2 HOLD / NOT YET INTEGRATED.** Before P2.16 may replace rear
visual proxies, require:

1. Measure Model B's authentic separate rear wheel centres, envelope and
   source-to-wheel transform; preserve part chirality across both sides.
2. Native B-Rep cross-source Boolean fit of P2.16 with P2.9/P2.10/P2.12/P2.14.
3. Rear drive shaft/CV, caliper mount, rotor hat, bearing retention, actual
   threaded center-lock and rim bead/seal design, with explicit interfaces.
4. Actual wheel spin, bump and toe sweeps with no significant interference.
5. Browser verification of real P2.8/P2.16 sources loaded, rear proxy removed,
   six reversible scroll chapters, desktop/mobile F1 silhouette and real MP4.

Current **runtime remains unchanged**. These source results are not
manufacturer/OEM CAD and do not certify Model B assembly or release.

**Decision: native independent rear wheel-end source authored; physical
integration and final car animation remain HOLD.**
