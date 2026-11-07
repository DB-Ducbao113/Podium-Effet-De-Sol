# PODIUM EDS — FULL CAR V2 / CAD-FIRST + SCROLL-DRIVEN ENGINEERING
Status: PROPOSED MASTER PLAN, NO RELEASE AUTHORIZATION
Date: 2026-11-07
Target branch: feat/engineering-inside-machine-v2
Design reference: owner-supplied animejs(1).mp4, 59.1 seconds, 1920×1080 screen recording.
Visual direction: current rebuild implementation (carbon / obsidian, ignition orange, ivory, condensed italic display typography), without modifying its global tokens, branding or production pages.

## 0. Decision and anti-goals

Full Car V1 is OWNER REJECTED. Its 176 valid solids and closed GLB meshes are not evidence of a believable Formula 1 silhouette. Do not extend V1 bodywork, wing blocks, rods or arbitrary hardpoints. Preserve only audit artifacts in history. No R4.5, Model B, concept placeholders, purchased manufacturer CAD or third-party sponsor logos silently substituted into the new CAD-first program.

P2.8 is the project-authored 59-solid FRONT-CORNER assembly, not a whole car. It is static-B-Rep reviewed and retains unresolved load-path/kinematic gates. The stand-alone P2.9 19-part split joint is a mechanical PROTOTYPE, not a completed source replacement. P3/P4 cinematic and P5 test code are reusable architectural learnings, not finished car geometry.

All new parts must declare source, coordinate system, geometry status, mechanical status, material status, and commercial/visual provenance. Label manufacturer-internal details as illustrative if not verifiable. Never call this licensed manufacturer or race-winning OEM CAD.

## 1. Baseline era — regulation-correct 2026

Working target: one internally consistent, non-team-branded 2026-era FIA Formula 1 concept grounded in verified multiple-view 2026 reference imagery and technical regulations. THIS IS NOT copying a team-owned 2026 CAD.

Reference constraints: wheelbase at most 3400 mm, 1900 mm overall regulation-oriented width, 18-inch wheels and narrow tyres, front/rear active aerodynamic elements, 2026 flatter floor + enlarged rear diffuser, turbocharged V6 plus MGU-K/energy store/control electronics, no MGU-H. Recheck all dimensional inequalities in the applicable FIA issue before locking any production CAD; the cited values establish design direction rather than a certification claim.

Crucial: do NOT model 2022–25 deep Venturi floor tunnels on the 2026 car or use 2022–25 DRS mechanism/wing profiles as if they were the 2026 aero package.

Authoritative reference starting points:
- https://www.formula1.com/en/page/2026-f1-regulations
- https://www.formula1.com/en/latest/article/gallery-check-out-every-angle-of-the-2026-f1-car.3W738wJViWXa3NVDNHSEaQ.3W738wJViWXa3NVDNHSEaQ
- https://www.formula1.com/en/latest/article/2026-regulations-explained-all-you-need-to-know-about-f1s-new-aerodynamics.7IAt0auc32UkCEFE5ypkTB
- https://www.formula1.com/en/latest/article/2026-regulations-explained-all-you-need-to-know-about-f1s-new-power-units.14jfv7a36905uDJDdNyfQd.html

License: reference imagery for analysis only. Production distribution, screenshots and branding have independent provenance checks.

## 2. P0 — Reference lock before ANY geometry

Deliverable: reference-board/ containing a single coherent car design language with front, rear, side L/R, top, underside, front 3/4, rear 3/4, cockpit and macro images. Each image records URL, publisher, date, license/usage, camera perspective, what geometry may be inferred and uncertainty.

Build 2026 regulation dimension sheet and coordinate baseline (X longitudinal, Y lateral, Z up, mm); front/rear axle centers, wheel planes, cockpit, monocoque envelope, nose tip, front wing span, sidepod shoulder, airbox and rear-wing planes. Do not recover metric dimensions from perspective pixels alone. Reference images from mixed teams/eras are not a single geometric authority.

Gate G0: clear vehicle generation, consistent silhouette reference set, dimension sheet, rights registry. Any ambiguous dimensions are left as design hypotheses.

## 3. P1 — Outer-surface clay silhouette, mandatory HARD GATE

Produce ONLY necessary major shapes: 4 tyres/rims to set proportions, front and rear wing aerodynamic skins, chassis/monocoque tub, thin nose, cockpit aperture, halo, airbox, sidepod inlet/undercut, engine cover taper, floor edge and enlarged 2026 diffuser. No surface-detail theatre.

Author with section curves, controlled lofts, sweeps, bounded NURBS/parametric surfaces with G1/G2 continuity where visually relevant. No boxes, arbitrary extrusions and rod cylinders pretending to be aerodynamic bodywork. Blender can be used for clay shading and camera review but CAD surfaces remain authored in native editable sources.

Review in neutral clay from at least front, rear, left, right, top, bottom, front 3/4, rear 3/4, plus two macro silhouettes. Orthographic comparison aligned to axle centers and reference scale; no perspective distortion tricks. Include overlay comparison and annotated deviations. Repeat until car unquestionably reads as modern Formula 1 without paint or logos.

Gate G1: owner explicitly accepts all major silhouette angles; review shows consistent wheel size, stance, nose, sidepod undercut, engine-cover profile, halo, wing proportions and floor. FAIL -> remodel surfaces. No PBR, sponsor work, or 100-part detail expansion before PASS.

## 4. P2 — Mechanically partitioned full vehicle

Body may be visually accepted yet not physically assembled. Split it into a real source hierarchy:

A. Front aero: nose crash structure / mainplane / adjustable flap sections / endplates or wake management pieces / hinge hardware, fasteners.
B. Front wheel station L/R: tyre, rim, wheel nut, hub, bearing, upright, brake disc/hat, pads, caliper body, pistons, seals and genuine mating interfaces.
C. Front suspension and steering: upper/lower arms, pushrod, rocker, spring/damper, tie-rod, steering rack, ball joints/retainers/bushings and chassis hardpoints.
D. Monocoque and cockpit: structural tub outer/inner, halo mounts, seat shell, steering wheel, pedal box, steering column, controls.
E. Sidepods and cooling L/R: exterior shells, inlet ducts, radiator cores, outlet ducting, intercooler/coolant paths with verified or labelled illustrative topology.
F. PU packaging: 2026-era ICE, turbo, intake/exhaust, MGU-K, energy store, control electronics and mounting envelope; OEM internals explicitly labelled illustrative unless verified.
G. Drivetrain and rear: gearbox casing, differential concept, shafts, rear suspension, rear brakes/wheels, corresponding fasteners and retainers.
H. Underbody and rear aero: 2026 flatter floor architecture, permitted edges, diffuser, active rear-wing elements, pivots/actuation and mounts.

Each part has partId, assemblyId, parentId, CAD source path, nominal scale/mm, source status, material group, pivot/hardpoint, fastener interface and three LOD mappings. Mirrored L/R assemblies must share dimensions but retain correct handedness, steering geometry and hardpoint references.

P2.8 59-piece corner: import owner source STEP and exact source manifest; retain original sha and source transformations; do not paste as a separate floating wheel. Establish position and meaningful mates. If the 2026 baseline cannot accept a source subassembly designed around different dimensions, declare the mismatch and redesign interfaces from first principles, keeping the P2.8 experiment as reference evidence, not source-certified fit.

Gate G2: all promised full-car systems have real authored named geometry, correct wheel and suspension locations, source-part counts and STEP reload, no fake decorative hardware. Keep source truth distinctions explicit.

## 5. P2.5 — Functional mechanical QA (not cosmetic)

Sequence: disconnected island detection -> solid validity -> all-pair broadphase -> exact B-Rep for ALL candidate pairs (not the first 100) -> approved-contact registry -> clearances at tolerance extremes -> kinematic steering/bump/wheel rotation at multiple coupled sample poses -> fastener retention and load-path preflight.

Unresolved B-Rep overlaps must be zero above the chosen declared tolerance, except explicitly documented intentional fit/contact cases. The prior 0.05 mm^3 threshold was a STATIC audit choice, not a universal manufacturing clearance.

Independent FEA, brake hydraulic truth, manufacturing tolerance stacks, friction, seals and fatigue are separate QA; no engineering safety claims without them. Visual exploded offsets must not be used to hide actual static interference.

Gate G3: full candidate report, exact counts, pose coverage, issue log and native source checksum. Failed load path/kinematics remain HOLD even if visual style passes.

## 6. P3 — Macro component quality and shading

Two independent gates:
- Geometry: threads/knurls where actually authored, brake rotor ventilation, tyre sidewall/bead, valve, brake-piston seals, bearings, clevis and pin retaining system, caliper bridge, hydraulic ports, damper and actuator joints. Compare CAD B-Rep to GLB at intended macro zoom. Watertight mesh, normals and seam quality per tier.
- Lookdev: coherent carbon composite, bead-blasted titanium, brushed aluminium, steel, rubber, ceramic brakes, anodised components. Metallic-roughness PBR + controlled HDR/PMREM. No randomly glowing metal, no uncontrolled orange reflections obscuring form.

Gate G4: matching seven/eight-angle clay + final PBR screenshot pairs; owner can read every featured part and identify materials, and can return to untouched assembly pose. If macro cannot survive camera zoom, geometry is not approved.

## 7. VIDEO-REFERENCE SCROLL LANGUAGE — what is actually in animejs(1).mp4

Owner reference is a 59-second capture:
- 00–08 s: DARK hero, one hero object remains the anchor while scroll rotates/reframes it.
- 09–16 s: high-contrast LIGHT technical assembly, line-work/callouts and part separation while the object persists.
- 18–36 s: DARK feature sequence. Object remains central while graphics and brief type change around it.
- 39–47 s: LIGHT exploded engineering sequence, separated pieces and assembly illustration.
- 48–59 s: return to dark, recompose and finish.
Do not copy the site's brand, text, rings, proprietary textures or code uncritically. Recreate the SCROLL CHOREOGRAPHY: one pinned stage, continuous reversible camera and geometry poses, strong black/technical-ivory scene transitions, short minimal labels and detailed mechanical focus.

## 8. P4 — Full-car cinematic script (17 chapter gates plus nested part steps)

Every chapter's main step: SYSTEM -> ASSEMBLY -> COMPONENT -> HARDWARE detail. Typical storyboard goal is 60–90 semantic focus steps; do NOT set part count arbitrarily. A separate Inspect/Deep Dive permits fastener-by-fastener macro without forcing hundreds of scroll steps on ordinary viewers.

00  HERO — full car in dark studio, slow 3/4 front reveal, no disassembly.
01  BLUEPRINT — clay/technical transition to ivory, clean front/top/side orthographic cues, outer envelope.
02  NOSE / FRONT WING — camera tracks nose -> mainplane -> active flap -> mounts/pivots -> representative bolts.
03  FRONT WHEELS — tyre -> sidewall -> rim -> center nut -> hub, wheel station held in frame.
04  BRAKES — cutaway with brake duct -> rotor/hat -> caliper -> pads -> pistons/seals.
05  FRONT SUSPENSION — upper/lower wishbones -> tie rod -> pushrod/rocker -> spring/damper -> retained joint.
06  STEERING — wheel/column -> rack -> tie rod -> hub steering, constraint-aware motion.
07  COCKPIT / HALO — halo structure/mounts -> cockpit -> wheel -> pedals -> monocoque.
08  MONOCOQUE — carbon safety cell outer/inner, reference attachment hardpoints.
09  SIDEPODS — bodywork peels off locally -> inlet -> undercut -> internal duct, without floating away.
10  COOLING — radiator/exchanger -> cooling routing -> outlets; ghosted body silhouette stays present.
11  POWER UNIT — ICE -> turbo -> MGU-K -> energy store -> controller; source-certified vs illustrative labels.
12  TRANSMISSION — gearbox casing -> differential -> driveshafts -> rear hubs.
13  FLOOR / DIFFUSER — underside 2026 flat(er) floor + rear diffuser, no fictional 2022 tunnels.
14  REAR SUSPENSION / BRAKES — hardpoints -> arms -> brake disc/caliper -> rear wheel.
15  REAR WING — elements -> active flap pivots -> end support -> actuator/mount.
16  WHOLE-CAR EXPLODED — systems reveal in a readable mechanically faithful order, context ghost stays.
17  REASSEMBLY / FINALE — exact return to original positions, materials and camera; whole-car hero.

Camera focus is computed from actual source-node world bounds and safe framing margins, not guessed pivots. Active aero uses permitted hinge motion, not stretching geometry. Do not apply nested explode transforms twice; use local parent-child transforms and canonical rest matrices.

Chapter transition goal: deterministic progress p between 0 and 1; any p yields same state regardless of scroll direction/speed. All objects at p=0 are assembled; at p=1 they must return to exact original pose (within numerical tolerance), unless a clearly documented final hero camera change. Scrolling backwards produces the identical preceding poses.

## 9. P4 UX implementation

- The website's route remains /engineering; review page remains DEV-only /engineering/cinematic-rebuild until the owner explicitly approves replacing the current Engineering entry.
- ONE persistent WebGL stage. Avoid mounting a new Canvas per chapter or reloading the GLB on each focus update.
- Sticky/pinned native-scroll section; seek by scroll, no wheel-event hijack. Keyboard arrows/chapters, touch and reduced-motion equivalents.
- HUD: logo untouched, tiny chapter index, one short headline and at most ONE descriptive line, thin progress track, optional info reveal. No full-width essays on top of the car. Expose source/licence notes on demand.
- Both EN and VI required. UI scoped to new page, reuse rebuild CSS palette/font variables rather than global overrides.
- Readable mobile layout, no unexpected page jumps. Keyboard focus, sufficient contrast, skip scene and static fallback when WebGL absent.

## 10. P5 Web performance / source packaging

Source STEP/assembly manifest stays out of public by default. Three GLB tiers are derived from accepted B-Reps. Assets are split by level where appropriate (hero shell first, subassemblies on demand); use compression and instance repeated fasteners while retaining unique semantic inspect handles. No silent swap to a different source model.

Proposed pre-QA targets, NOT measured claims:
- Desktop 1440/1920: median near 60 FPS, p95 frame time target <=20 ms on the declared reference GPU.
- Mobile 390 px: sustained >=30 FPS on representative target devices, avoid overheated prolonged animation.
- PERFORMANCE goal <=250k visible triangles / <=6 MB compressed initial 3D payload;
  BALANCED <=700k triangles / <=12 MB relevant payload;
  HIGH <=2 million visible triangles / <=25 MB relevant payload.
Budgets are provisional and must be revised from actual source geometry and device profiling, not by deleting genuine mechanical detail.
- No forced 5–7 second intro. Shell paints while model streams; graceful static poster/loading status.
- Context loss/restore, resource disposal, LOD switching, memory and renderer metrics must be tested.
- Browser coverage: Safari/Chrome on macOS, Chrome desktop, 390/768/860/861/1440/1920 widths.

## 11. Delivery and OWNER review gates

G0 REFERENCE LOCK — photo/source/dimension/provenance reference board; NO geometry acceptance claimed.
G1 SILHOUETTE LOCK — 8+ matching clay camera angles, comparative overlay; stop if shape looks unlike F1.
G2 ASSEMBLY LOCK — actual named CAD vehicle and source-derived STEP/GLB audit, fully counted.
G3 MECHANICAL REVIEW — exact all-candidate B-Rep, tolerances and sampled coupled kinematics; HOLD any unsafe/fake joints.
G4 MACRO/PBR REVIEW — named close-ups from the real source GLB, seam/material audit.
G5 SCROLL DESIGN REVIEW — source-backed browser screenshots of all chapters, screen video down-and-up, seek consistency.
G6 PERFORMANCE REVIEW — device/GPU/FPS/draw-call/memory/LOD/context-loss/mobile evidence.
G7 OWNER FINAL — only after visual, geometry, technical evidence and licence gates; no merge/deploy automatically.

At G1/G4/G5 deliver:
- Review contact sheet with source camera IDs and exactly matched angles.
- Source-backed 1080p 30 FPS review MP4 (or state the true resolution/fps if lower), capturing 0->100->0, system label, close-up, actual disassembly and reassembly.
- Capture methodology explicitly: BROWSER SCREEN RECORDING if the real WebGL ran, or OFFLINE CAD RENDER if not. Never label offline animation as browser performance evidence.
- Source/GLB hashes, exact tested commit, viewport, browser and renderer/GPU; defects with screenshot evidence.

## 12. Implementation ordering (non-overlapping, no premature polish)

R0 reference lock and visual scale -> R1 source-authored silhouette clay -> R2 coherent outer-body surfaces -> R3 internal system CAD hierarchy and hardpoints -> R4 integrate authoritative P2.8 where physically compatible -> R5 all-pair QA and kinematics -> R6 macro source geometry -> R7 PBR studio look -> R8 deterministic scroll choreography -> R9 WebGL performance, video and owner gates.

When a gate fails, return to the owning earlier stage; do not use render/postprocessing to conceal geometry failures.
Project status at this plan's writing: Full Car V1 OWNER REJECTED; P2.8 is a separately proven STATIC front corner; 2026 full-car CAD source has NOT passed G0/G1; P3–P5 site experience is NOT approved.
