# P2.6 — Source-constrained steering, P3 CAD cinematography and P4 quality controls

**Review date:** 2026-11-07  
**Branch:** `feat/engineering-inside-machine-v2` (Draft PR #4)  
**Source:** independently authored P2.6 Formula-style front-left wheel CAD  
**Status:** SOURCE / LOCAL GEOMETRY AUDIT PASS; browser cinematic acceptance NOT YET VERIFIED  
**Release:** HOLD · no CI · no merge · no deploy

## Local P2.6 evidence, actually checked

Source `P2_6_steering_mated_master.step` has **53 connected valid B-Rep solids and 769 CAD faces**. Its SHA-256 is `6879b9373bdc36f830a2f270859d423e705cd80bd31533b2f1dbcf92a8f9c772`.

| Profile | Exact source identities | Triangles | Bytes | Local SHA-256 |
|---|---:|---:|---:|---|
| HIGH | 53 | 296,484 | 4,901,452 | `cf57188b0d90287f2475880845f6c29a839b1da39f12beef9b7db0c9e6554a05` |
| BALANCED | 53 | 68,632 | 1,375,368 | `f0bbd72cfc709360701b07b8da18ca5eb994a86ec8f4d788a6a7425ef67a7f39` |
| PERFORMANCE | 53 | 38,520 | 733,080 | `368245831c46a4678d5303e913f373036de034ef48e26050ac58a227d871e3a3` |

Independent local checks confirmed the original STEP digest, valid solids and faces, all three GLB sizes, cryptographic digests, mesh identity counts and actual mesh triangle counts. The owner review package includes the manifest, STEP master, all GLBs, CAD source and actual offline GLB render boards.

P2.6 mate solver preserves the authored tie-rod source length over 17 samples (-8° through +8°, 1° apart) and stores rack Z travel. In a separate **nine-pose sampled collision review**, source B-Rep Boolean intersections of upright/link pairs showed no overlap exceeding 0.05 mm³. The interference volume of the corrected upright was removed with source B-Rep Booleans; no material-only workaround was used.

**Not achieved:** the existing upper/lower rods are nearly parallel and lack real chassis-side A-arm pivots and ball-joint constraints. No justified suspension bump/rebound solution exists yet. The steering mechanism is a controlled one-DOF educational source assumption, NOT an F1 kinematic specification or a physically certified steering assembly. No unsampled continuous-angle guarantee.

## Implemented in the feature branch

### P2.6 source / kinematics
- `tools/cad-first/p2_6_steering_kinematics.py` — length-conserving idealized rack/kingpin solver.
- `tools/cad-first/p2_6_steering_relief.py` — source CAD upright relief and HIGH/BALANCED/PERFORMANCE source export.
- `tools/cad-first/p2_6_steering_clearance_audit.py` — nine-pose native B-Rep source collision sampler.
- `apps/web/src/dev/cadFirstP2/P2SteeringMate.ts` — deterministic frontend mate equations and explicit ±8° limit.
- `P2ExplodeRig.tsx` — wheel spin and steering transforms from original transforms per frame; never accumulates mesh drift.

### P3 — cinematic source-based experience
- `P2CinemaTimeline.ts` — 26-second storyboard, seven source-aligned beats, C1 camera interpolation, deterministic disassembly/reassembly, 0% and 100% matching hero pose.
- `P2CinemaRendering.tsx` — source-preserving cloned PBR materials, studio lighting, Blueprint transition and frame-by-frame camera. All source geometry/materials are restored on unmount.
- `P2StudioEnvironment.tsx` — scoped RoomEnvironment PMREM; no PMREM in PERFORMANCE.
- `P2MacroTargets.ts` — seven real part IDs found in P2.6 GLB across tiers.
- `P2CinemaCamera` — macro fit from actual current selected source mesh bounds, with narrow-device horizontal/vertical FoV protection and reduced-motion short-circuit.
- CAD Lab: immersive full-width cinema, Play/Pause, timeline seek, chapter markers, return-to-film, mobile layout, pale Blueprint typography and seven focus selectors.

### P4 — runtime performance and provenance
- HIGH: DPR cap 2.0 + antialiasing + PMREM; BALANCED: DPR cap 1.5 + PMREM; PERFORMANCE: DPR cap 1.0, no antialiasing/PMREM.
- `P2PerformanceTelemetry.tsx` — actual browser-observed FPS, render.ms, draw-call and rendered triangle counts only while playing; no predicted FPS from static GLB stats.
- WebGL context-loss event terminates playback and warns the reviewer.
- Switching manifest invalidates and removes old scene before accepting a new source GLB; selected quality derives from verified manifest profile, preventing a stale P2.4 scene appearing as P2.6 evidence.
- `P2CadEngineering.test.ts` contains local unit-test cases for constraint closure, source groups, limits, film endpoints and deterministic reverse seek. **Tests are authored but have not been executed with the full website toolchain.**
- No CI workflow was edited or inspected.

## Browser review protocol — OPEN

Use the P2.6 source preview (manifest plus matching GLB) at DEV `/engineering/cad-lab`:

1. Review geometry first with the local source manifest, section clipping and real part isolation.
2. Check steering -8°, 0° and +8°; only source-validated one-DOF mechanism is available, do not infer bump travel.
3. Enter CINEMATIC SOURCE FILM / P3. Play 0–100% and seek backwards. The source mesh returns to its exact hero pose and camera at the end.
4. Open all seven Macro parts: nut, stud, hub, bearing, rotor, caliper, rim. Inspect for faceted silhouettes, flickering, artificial geometry and clipping.
5. Compare HIGH / BALANCED / PERFORMANCE at 375, 768, 1440, 1920 CSS px. Check dark/white chapter contrast and control accessibility. FPS metrics are meaningful only when recorded in actual Chrome/Firefox WebGL.
6. Reduced-motion preference should disable autoplay and camera ease; direct seek and focus remain available.
7. Inspect actual canvas errors, GPU context loss handling and resource disposal while switching the original source.
8. Compare a continuous screen capture with owner-provided `animejs.mp4`. No claim of matching that reference is made until an actual browser recording is reviewed.

## Known shortcomings and release gates

- **Geometry realism:** slick sidewall lacks true manufacturer tire bead/compound modeling, caliper hydraulics remain diagrammatic, bearing preload and steering joints are incomplete. Master CAD needs source-based refinement.
- **Film realism:** offline VTK preview is visibly below the target for photoreal highlights and industrial macro detail. It is not a WebGL acceptance artifact.
- **Mechanical legitimacy:** no load/temperature/structural analysis; no genuine modern F1 OEM geometry or physical production certification.
- **Access and distribution:** third-party source candidates remain blocked by license review; the original project-authored CAD stays in local owner assets, not production.
- **Testing:** no actual browser screenshot run, user-device benchmarks, or release signoff yet.

**Owner gate remains HOLD.** Preserve Draft PR; no CI, merge or deploy.
