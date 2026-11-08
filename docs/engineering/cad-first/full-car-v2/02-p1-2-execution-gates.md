# P1.2 rebuild execution — source first, no more guessed full-car CAD

Branch: feat/engineering-inside-machine-v2. Current G0/G1: HOLD. Original Full Car V1 and P1.1 rejected. No Model B/R4.5 substitution, no public GLB upload, no merge/deploy.

## Order, measurable deliverables, failure handling

R0.1 **Research lock:** cite FIA Section C Issue 21 (19 Oct 2026) and ONE coherent official December 2025 2026 car reference. Register provenance/rights for front, rear, side L/R, top, underside and matching front/rear 3/4 shots. Any unavailable orthographic view remains PENDING, not inferred from photographic pixels. Required: coordinate system in mm, axle and centerline reference planes, dimension ledger with explicit evidence per bound. G0 HOLD if photo calibration absent.

R1.1 **2D envelope sketch:** define wheel centres, wheelbase, track/tyre envelope, nose/front wing overhang, rear wing overhang, cockpit/halo position and floor reference. Input only confirmed or labelled conceptual dimensions. No 3D tessellation until 2D proportion study passes.

R1.2 **CAD silhouette:** clean section curves/parametric lofts for the monocoque/nose, cockpit opening and 3D halo, sidepod inlet and deep undercut, engine-cover coke-bottle, 2026 floor and front/rear active aero elements. Create NEW parametric source file (do not extend the rejected P1.1 body surfaces). Maintain cross-section profiles and surface continuity diagnostics. Do not use boxes, arbitrary slabs or decorative rods for final aero skins.

R1.3 **Matched camera:** 8 orthographic/perspective views generated from the same camera rig as the calibrated source, matched to wheel centres/scale. Save aligned reference + clay comparisons and annotated shape defects (nose, inlet, halo, sidepod, wheel proportion, rear wing). Never call a two-angle turntable a matched-angle test. Owner gate G1 must explicitly pass all core silhouettes.

R2 **Seams / topology:** original CAD face continuity and valid B-Reps first, triangulation second. Rework LEFT/RIGHT_SIDEPOD_UNDERCUT_LOFT and HALO_FORWARD_CENTER_PILLAR faces known to be open. Verify watertightness on each GLB mesh and stable bounds/IDs across 3 LODs. Baseline: HIGH 204588 tris 3 open; BALANCED 57336 tris 3 open; PERFORMANCE 24415 tris 2 open. Measured LOD bounds differ in Z by about 1 mm; 0.5 mm is a proposed review trigger, not FIA tolerance.

R3 **Architecture:** only after G1: 13 named systems and explicit parent-child joints, STEP per part plus full STEP assembly, ID/parent/pivot/source-rights tags. The P2.8 59-piece source is ONE front corner; do not relabel it whole-car or auto-fit it by scaling.

R4 **Mechanical integration:** mate the actual P2.8 front corner only after source-hash and hardpoint/dimension checks. Build source-named rear suspension, front/rear brakes, gearbox and retained mechanical joints. Do not scale incompatible donor geometry into place. Source CAD, not GLB, remains truth.

R5 **Mechanical QA:** validate actual P2.8 hardpoints before mating; original/hypothetical compatibility documented. Use full OpenCascade B-Rep audit on EVERY broad-phase candidate pair, intentional-contact registry, static gaps, and coupled bump/steer/wheel/active wing samples. Unresolved intersections and load paths HOLD.

R6 **Macro and PBR:** source-backed rotor vents, hub/bearing, fasteners/retainers, caliper and brake duct, suspension pivots and gearbox/PU packaging. Unknown OEM details must be labelled illustrative. No fake bolts placed only for marketing realism.

Within R6, **PBR:** after geometry is accepted, neutral clay → carbon/steel/aluminium/rubber/ceramic physical materials. Same geometry identity, material LUT, HDR exposure, normal/gap validation in 8 matched cameras.

R7 **Scroll:** one persistent Three.js Canvas and deterministic 0→1→0 progress; 18 chapters from full car, blueprint, nose/front aero, wheel, brakes, suspension, steering, cockpit, monocoque, sidepod, cooling, PU, transmission, floor, rear suspension, rear wing, whole-car exploded and reassembled. Each scene looks up REAL source part nodes and bounds; no guessed pivots, double explode, invisible fallback cars or fake subparts. Scoped rebuild visual language, minimal text, accessibility/reduced motion.

R8 **Performance:** HIGH/BALANCED/PERFORMANCE from approved STEP, real GPU telemetry, streaming/instances/memory cleanup, Chrome/Safari Mac/mobile. Never invent measured FPS or call offline renders WebGL.

R9 **Acceptance:** 8+ calibrated clay view pairs, 7+ real macro views, browser video of 0→100→0 and detailed parts, source checksum/commit, real viewport/renderer/FPS, issue ledger. Only owner G1/G4/G7 sign-offs permit production progression; no CI, merge, deploy automatically.

## Already executed / not yet executed

- Ran actual P1.1 three-LOD GLB inspection locally: node identities consistent at 63; open mesh and small bounding discrepancy confirmed; original reference photographs not camera-calibrated. Reproducible script: tools/cad-first/p1_2_geometry_gate.py. Script is a diagnostic, not a visual certification algorithm.
- Neither a new approved full-car clay source nor a real browser video exists at this checkpoint. 
- This commit adds implementation gates and source code only. No production app edits.

To run on a machine containing the owner's private P1.1 source package:
python3 tools/cad-first/p1_2_geometry_gate.py --model-dir /path/to/PEDS_FullCar_V2_Clay_P1 --reference-index docs/engineering/cad-first/full-car-v2/p1-2-reference-index.json --output /tmp/p1_2_geometry_audit.json
