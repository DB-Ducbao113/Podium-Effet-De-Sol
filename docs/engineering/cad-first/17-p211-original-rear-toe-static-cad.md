# P2.11 — Original rear toe link, independent native CAD

Project: **Podium Effet De Sol**, repository `DB-Ducbao113/Podium-Effet-De-Sol`  
Branch: `work/engineering-four-corners-local`  
Status: **Static source CAD review PASS; Mechanical G2 HOLD; DEV only**.

## Source lineage and new geometry

- `tools/cad-first/p2_11_rear_toe_link.py` generates **four new** separately named native CAD parts: `P211_REAR_TOE_LINK_TUBULAR_FORGED`, `P211_REAR_TOE_OUTER_BEARING_PROPOSAL`, `P211_REAR_TOE_INNER_BEARING_PROPOSAL`, `P211_REAR_TOE_OUTER_CLEVIS_PIN`.
- The shaft is a hollow native solid joining pierced eyes; the inner/outer annular bearing inserts and toe-clevis pin are each independent native B-Rep solids. This is a **fixed-length source proposal**: it does **not** implement threaded toe adjustment, locknuts or a certified spherical joint.
- Includes the **existing P2.9 rear upright** and **existing 10 P2.10 wishbone solids**, without counting them as newly authored. Combined source count **15**, not 4+15.
- Existing toe lug source coordinate is imported directly from P2.9: `[139, -24, -156]` mm. The outer eye centre is `[139, -24, -199]` mm. The inboard end `[236, -69, -328]` mm is a **provisional, author-selected chassis-side proposal**; it is NOT an actual measured owner Model B hardpoint.
- Units are STEP mm, preview GLB metres. Original P2.8 wheel geometry and Model B original GLB remain unchanged, with no CAD rescale or mirror.

## Executed local native source evidence

The original project CAD source and native tool dependencies were available in the execution environment. `python -m unittest -v test_p2_11_rear_toe_link.py` returned **4/4 PASS**. An independent combined local run of P2.9, P2.10 and P2.11 source tests completed **12/12 PASS** (CadQuery 2.8 / Python 3.13); this is native-source QA, not browser WebGL/vehicle signoff.

- Source geometry: **15 / 15 valid, connected native B-Rep solids**, 15 / 15 after STEP import roundtrip.
- Every pair of the 15 parts was classified: **105 total**, **88 nonintersecting AABBs** and **17 exact native B-Rep Boolean evaluations**, zero Boolean failures, zero positive overlaps above the **0.05 mm³** static-review threshold.
- Outer pin and inner/outer bearing axial bores: separate mesh and Boolean clearance checks PASS in nominal pose.
- Source-authored GLB profiles (all 15 exact semantic nodes, watertight and consistently wound):
  - HIGH **31,346 triangles**;
  - BALANCED **11,562 triangles**;
  - PERFORMANCE **6,518 triangles**.
- STEP and all three GLBs exported from original project CadQuery source; hashes are recorded in `P211_rear_toe_manifest.json`. No synthetic substitute was used.
- The attached CAD four-angle image is an **offline VTK rendering of the real exported P2.11 BALANCED GLB**, not a browser screenshot or owner visual acceptance.

## Local reproduction

In a clone checked out to `work/engineering-four-corners-local`, with the original project CAD dependencies installed:

```powershell
python tools/cad-first/test_p2_11_rear_toe_link.py
python tools/cad-first/p2_11_rear_toe_link.py --out ".local-assets/cad-first/p211-rear-toe-source"
```

Outputs: `P211_rear_toe_static_master.step`, `P211_rear_toe_static_audit.json`, `P211_rear_toe_manifest.json`, three `P211_rear_toe_{high,balanced,performance}.glb` LODs. The generator refuses to overwrite a nonempty existing source folder.

## Assembly-preview integration

- `apps/web/src/dev/assemblyPreview/rearToeSource.ts`: validates exactly 15 source node identities, all three SHA-linked GLB LODs, 105-pair static audit, STEP SHA and **explicit uncertified mechanical flags**.
- `RearToeInstances.tsx`: imports the exact source GLB into the existing R3F canvas and positions independent instances at both measured Model B rear wheel centres using the established rigid source transforms. P2.11 contains P2.9 and P2.10 and therefore **replaces their previous render instances to prevent duplicate mesh volumes**.
- `AssemblyPreviewPage.tsx`: DEV-only source import controls, source verification and explicit `G2 HOLD` in the exported placement report.
- The local runner/Chromium recorder now builds/checks P2.11 and accepts a video gate only after a P2.11 SHA-bound 15-node source is parsed and the browser exports the matching placement. No GitHub Actions, PR, merge or deploy.

## Outstanding validation — do not claim completion

1. Actual **chassis-side toe pickup** must be measured from structural CAD, not inferred from polygon Model B body contours.
2. Correct toe link length, spherical-bearing articulation, axial pin retention, fastener threads, corrosion/preload, adjustable toe travel and torque are **unverified**.
3. P2.11's 105-pair audit covers only the authored **rear static 15-body subassembly**, not the original 59-solid P2.8 wheel/brake bearing interface.
4. Coupled suspension bump/roll/camber/toe, full dynamic Boolean interference, rear gearbox, CV joints and driveshaft fit are **unverified**.
5. Browser WebGL, complete npm TypeScript/Vitest/build, GPU frame metrics and owner's MP4 inspection were **not run in the active source-only GitHub connector session**.
6. 2026 F1 manufacturer authenticity, homologation and mechanical release were not established.

**Engineering G2 remains HOLD. No production deploy.**
