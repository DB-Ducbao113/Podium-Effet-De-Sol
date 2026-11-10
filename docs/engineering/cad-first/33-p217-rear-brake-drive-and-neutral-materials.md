# P2.17 — Rear brake and drive static CAD / uniform neutral finish

Date: 2026-11-10
Branch: `work/engineering-four-corners-local`
Status: **NATIVE STATIC PASS / MECHANICAL G2 HOLD**

## Delivered

`tools/cad-first/p2_17_rear_brake_drive.py` builds eight separate, non-mirrored native CadQuery B-Rep solids in the rear wheel-local coordinates of P2.16. These are a rotor-hat spacer, one joined brake-caliper body, two pads, a bearing dust seal, an **unsplined** drive half-shaft and two **provisional** CV boot/housing envelopes.

The parts use a single shared neutral color `#87929d` from
`apps/web/src/dev/assemblyPreview/engineeringNeutralPalette.json`.
Tyre, disc, caliper, bearing and hardware reflectance vary by role; their base
RGB does not vary. This palette is also consumed by P2.16 CAD export and the
existing P2.8/P2.12/P2.14 Model B engineering viewer. The original showroom
Model B body/livery and all owner-source asset bytes remain unchanged.

## Executed local offline verification

| Test | Measured |
| --- | ---: |
| P2.16 preexisting native solids | 23 |
| P2.17 new native solids | 8 |
| Combined static source solids | **31** |
| Possible pairs for P2.16 + P2.17 | **465** |
| Excluded by bounding-box broadphase | **364** |
| Exact native B-Rep Boolean intersections | **101** |
| Volumetric overlaps greater than 0.05 mm³ | **0** |
| P2.17 STEP roundtrip | **8/8 valid** |
| P2.17 HIGH mesh triangles | **4,584** |
| P2.17 BALANCED mesh triangles | **1,812** |
| P2.17 PERFORMANCE mesh triangles | **984** |
| P2.17 glTF source nodes | **8/8 per quality** |
| P2.16 + P2.17 source unittests | **11/11 PASS** |

No binary CAD assets are committed to this public branch. Reproduce with:

```bash
python -m unittest -v tools/cad-first/test_p2_16_rear_wheel_end.py tools/cad-first/test_p2_17_rear_brake_drive.py
python tools/cad-first/p2_17_rear_brake_drive.py --out .local-assets/cad-first/p217-rear-brake-drive
```

P2.17 requires the P2.16 source file and the engineering neutral palette; it
verifies overlap against P2.16 before exporting STEP and GLBs. Each output
directory must be empty. The QA measurements above apply only to the
source geometry in the stated local frame, **not** a known physical rear
suspension/chassis mate on the original Model B.

## Explicit remaining blockers

- Model B original rear wheel station and structural/gearbox mounting points are not measured.
- Actual center-lock threads, bearing preload, brake caliper hydraulic attachment and drive-shaft splines are not authored or certified.
- P2.9 / P2.10 / P2.12 / P2.14 cross-source B-Rep static audits have not yet passed as a joined assembly.
- CV articulation, spin, bump, toe and mechanical loading are unverified.
- Full-car integration, browser QA, new real browser video and production release remain **HOLD**.

**No GitHub Actions, no merge and no deploy. Do not portray these 31 static solids as a verified complete F1 or installed original Model B rear corner.**
