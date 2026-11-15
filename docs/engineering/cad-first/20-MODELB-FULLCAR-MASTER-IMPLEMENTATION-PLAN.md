# PODIUM EFFET DE SOL — MODEL B → FULL CAR CAD → ASSEMBLY → GLB → THREE.JS + ANIME.JS → REAL VIDEO

**Master execution plan v1.0 — 2026-11-15.** Work branch: `feat/engineering-inside-machine-v2`. Scope: an original, source-tracked, very detailed 2026-era F1 engineering concept **wrapped by the owner's existing Model B shell**, NOT an OEM-approved or race-safe vehicle. **This document specifies work; it does not certify that work has happened.** Never merge/deploy without owner signoff. The previous `P2.54/54` is a closed **patch sequence**, not completed full-car geometry. The previous 176-body full-car V1 was visually rejected; do not use it as the silhouette authority.

## 0. Definition of done — exact requested outcome

The final visual product is **one coherent Model B-based F1**, with preserved exterior identity, complete per-system *authored* CAD in STEP plus parametric source, correct four-corner interfaces and mechanical hierarchy, small hardware on actual host components, source-tracked high/medium/low GLBs, consistent materials, deterministic scroll-driven disassembly/reassembly, a live site and **a real browser-recorded 0→100→0 walkthrough**. No cosmetic cylinders or unexplained dots standing in for threads, bearings, interfaces or missing pieces. Conceptual internals not available from authentic OEM sources must be made as **clearly labeled educational designs**, not presented as measured manufacturer internals.

Success requires all gates G00–G15, not a count of batches. A software build can PASS while mechanical G06/G07 remains HOLD. The final owner-visible review must show **the entire car**, not one wheel or a demo overlay.

### Source-of-truth facts from the existing repository (audited, not a completion claim)

- Existing exterior: `apps/web/public/models/model-b-eds-optimized-v1.glb`; original, nonmetric showroom coordinates. Preserve the file's hash and visible silhouette. Its current source geometry is about 27.79 raw units longitudinal. Before claiming metric dimensions, solve a documented coordinate transform and calibrated scale.
- Existing mechanical evidence: P2.8 59 STEP solids, **one front-corner assembly**, original owner manifest and three SHA-matched GLB LODs. Source rebuild scripts live in `tools/cad-first`. Its static audit was limited to a neutral pose; upright load path and coupled suspension motion remain OPEN. Do not multiply 59×4 and call that four engineered corners.
- P2.9 19-part joint is an independently built prototype, **not yet mated**. The old 176-solid full-car V1 was **OWNER REJECTED**.
- Existing DEV tools: `/engineering/assembly-preview`, `/engineering/cad-lab`, `/engineering/full-car-story`. The latter has 18 **visual** chapters, not 18 fully authored CAD modules. The existing browser evidence job has had timeout on screenshot, despite passing software lint/typecheck/tests/build on its last reviewed commit.
- The prior owner's reference video's core style is one pinned hero model, reversible scroll animation, dark/light technical chapters, detailed macro assemblies and exact reassembly. Keep the current rebuild typography/visual direction; avoid copying the reference website's copyrighted assets.

### 2026 rule/version lock

Read and record the applicable **FIA 2026 F1 Regulations, Section C Technical, Issue 21 dated 2026-10-19** from the FIA regulations hub: https://www.fia.com/regulation/category/2182. In the dimensional worksheet record exact **article, version and permitted interval** for each constraint. The 2026 high-level direction includes a shorter car (wheelbase up to ~3,400 mm), narrower overall envelope (~1,900 mm), 18-inch wheels, narrower tyres, active front/rear aero, flatter floor than 2022–25 deep tunnels, turbo V6 + MGU-K + energy store and **no MGU-H**. These are **reference targets subject to checking against Issue 21**, not a certification of Model B compliance. If the pre-existing Model B violates a rule, mark the concept `VISUAL-2026-INSPIRED / REGULATION-MISMATCH`, do not silently distort it or claim FIA legality.

## 1. Fixed workflow, dataset schema, software layout

**Canonical engineering coordinates:** metres in runtime, millimetres in source STEP authoring. Canonical CAD frame: +X forward, +Y left, +Z up. Model B native frame may be +X longitudinal, +Y vertical, +Z lateral; the exact signs/front/up/handedness MUST be measured from the source GLB, not assumed. Transform `T_modelB_source_to_cad` is immutable, invertible and independently checked on four wheel centers, origin and axles. All GLBs record mm→m conversion and keep root scaling 1 in the final assembly.

**Every part record** must have: `partId`, `assemblyId`, `parentId`, `system`, `side`, `station`, `sourceKind` (MODEL_B/PROJECT_CAD/ILLUSTRATIVE_RESEARCH), `sourcePath`, `sourceSHA256`, `STEPsolidId`, `displayNode`, `nativeUnits`, `restTransform`, `pivotTransform`, `hardpoints[]`, `mates[]`, `contactExceptions[]`, `materialClass`, `LOD[3]`, `animationRole`, `verification`, `referenceAndRights`. Pins, clips and bolts each have a **real host hole/seat** and a joint/contact relationship.

**Tree at build output**:
```
FULL_CAR_ROOT
  MODEL_B_EXTERIOR (unchanged original GLB + non-destructive visibility masks)
  FRONT_AERO
  FRONT_LEFT / FRONT_RIGHT (wheels, steering, brakes, suspension)
  CHASSIS_MONOCOQUE / COCKPIT / HALO
  SIDEPOD_LEFT / SIDEPOD_RIGHT / COOLING
  POWER_UNIT / HYBRID_ERS / ELECTRONICS
  GEARBOX / DIFFERENTIAL / DRIVESHAFTS
  REAR_LEFT / REAR_RIGHT (wheels, brakes, suspension)
  FLOOR_DIFFUSER / REAR_AERO
  FASTENER_REGISTRY / CABLE_AND_FLUID_RUNS
```

**Project source layout** (create gradually, use scripts in repo instead of parallel duplicate pipelines):
```
tools/fullcar/{source_audit,dimensions,modelb_frames,cad,interfaces,assembly,
               kinematics,collision,lod,manifest,qa,render}/
.local-assets/fullcar/{inputs,work,step,glb,reports,shots,video}/  # private
docs/engineering/fullcar/{sources,dimensions,interfaces,ledger,acceptance}/
apps/web/src/dev/fullcar/{loader,rig,scroll,materials,ui,qa}/
```
Master source remains immutable; generated intermediates never overwrite owner files; no third-party licensed geometry is copied into public assets. SHA256 and deterministic generator inputs are retained at every transfer.

**Every work packet closes only with** (1) real artifact/source, (2) parent/scale/mate record, (3) reproducible command, (4) automated test, (5) visual screenshot/turntable when relevant, (6) named blocking defects and result PASS/HOLD/FAIL. Failed or absent evidence => HOLD; no invented completion percentages.

## 2. Full dependency graph and hard gates

```
G00 source/audit ─→ G01 2026+scale reference ─→ G02 Model B measured interfaces
                                               ├─→ G03 external clay & sub-panels
                                               ├─→ G04 front corners/steering
                                               ├─→ G05 rear corners/transmission
                                               ├─→ G06 core/cockpit/powertrain/cooling
                                               └─→ G07 all CAD fasteners + full-car mates
G07 ─→ G08 mechanical QA (static + coupled motion) ─→ G09 macro/detail QA
G09 ─→ G10 LOD/GLB/manifest ─→ G11 scene integration/materials
G11 ─→ G12 scroll/Anime.js ─→ G13 browser perf + full video ─→ G14 owner acceptance
```

**Allowed overlap:** CAD detail designers may work on different systems once the frame/hardpoint interface sheet is LOCKED. No team may invent mount coordinates independently. Three.js staging/scroll code may be prepared in parallel, but no final full-car animation approval before full source CAD exists.

---

## 3. G00 — Baseline lock, restore and evidence inventory (12 packets)

- **B00.01:** Identify active Git branch, commit SHA, dirty changes, reference assets and DEV vs production routes. Output `baseline.json`; reject repo mismatch (especially F1-Overview).
- **B00.02:** Verify original Model B GLB SHA, byte length, glTF version, texture/materials, license provenance and whether meshes represent tyre/body joined together. Retain unchanged copy.
- **B00.03:** Enumerate every Model B node, geometry, hierarchy, material and triangle count; export `modelb-inventory.csv`.
- **B00.04:** Extract original exterior orthographic/45° 8-view neutral clay turntable and 2 interior cuts; forbid replacements in screenshots.
- **B00.05:** Recover existing P2.8 STEP master, `P28_remate_manifest.json`, BALANCED/HIGH/PERFORMANCE GLBs; verify hashes and 59 identity names.
- **B00.06:** Run fresh STEP reload, per-solid validity and assembly source audit on P2.8; retain all still-open upright and joint problems.
- **B00.07:** Locate P2.9 joint prototype and document whether it is actually reusable; otherwise RESEARCH ONLY.
- **B00.08:** Inventory existing front-corner fasteners, subassemblies, their pivots, thread profiles, source units, dimensions and contact surfaces.
- **B00.09:** Inventory rejected V1 and explicitly blacklist its fake silhouette primitives/donor geometry from reuse.
- **B00.10:** Inventory current Three.js/Anime.js/presentation code, unverified source labels, untested browser capture and prior failures.
- **B00.11:** Open deficiency ledger with each defect `system, severity, owner, dependencies, required evidence`.
- **B00.12:** Freeze baseline snapshot and reproducible local command set, keeping owner STEP/GLB private.

**Gate G00 PASS:** all source identities verified, missing files called out, original model unchanged, source ledger and evidence package available.

## 4. G01 — 2026 design dimensions and canonical Model B frame (14 packets)

- **B01.01:** Extract latest FIA 2026 Section C article IDs into versioned regulation worksheet; mark `RULE` vs `DESIGN TARGET`.
- **B01.02:** Lock canonical XYZ orientation, axle line and body center planes; prove handedness using source markers and camera views.
- **B01.03:** Compute native Model B bounding box, origin, natural unit scales and principal axes; cross-check against measured wheel envelope.
- **B01.04:** Fit 4 actual Model B wheel centers, 4 wheel-plane normals, front/rear tyre radius and widths, plus physical track widths.
- **B01.05:** Choose one consistent metric visual scale `m/source-unit` from explicit wheel measurements; report error propagation and alternate fits.
- **B01.06:** Compare Model B length/width/height/wheelbase/track against the Issue 21 constraints; write mismatch table.
- **B01.07:** Establish approved reference views: top, bottom, front, rear, L/R, both 3/4, cockpit, wheel/brake macro. Cite rights and camera.
- **B01.08:** Lock conceptual monocoque envelope relative to Model B exterior and driver clearance; unknown OEM cavity is ILLUSTRATIVE.
- **B01.09:** Lock four wheel station coordinate frames FL/FR/RL/RR, sign conventions and rotating/sliding degrees of freedom.
- **B01.10:** Lock suspension pickup surfaces and reserved hardpoint **zones**; exact points await modeled load-bearing chassis interfaces.
- **B01.11:** Lock rear gearbox/engine/cooling packaging volumes, centre-of-gravity assumptions and clearance reservations.
- **B01.12:** Lock front/rear aero hinge/actuator reference axes and 2026-concept permissible travel hypothesis.
- **B01.13:** Export dimensional sketch sheets and canonical `reference_frame.json` with measured-vs-assumed tags.
- **B01.14:** Render 8-view Model B clay against reference sheet; produce deviation annotations and owner-visible preview.

**Gate G01 PASS:** no coordinate ambiguities, four wheel station transforms exist, full dimensional/reference sheet with every uncertain value explicitly labeled.

## 5. G02 — Model B shell preservation, segmentation and mounting envelope (14 packets)

- **B02.01:** Freeze original GLB and render identical baseline before integration; source bytes never modified.
- **B02.02:** Classify native nodes as exterior body, tyres, rims, windows, cockpit, halo, aero, floor and unknown.
- **B02.03:** Identify existing model wheel surfaces to prevent double tyre/rim visuals; use reversible visibility masks, not deletions.
- **B02.04:** Compute watertightness/open edges, normals and topology of the showroom shell; do not call mesh a solid when open.
- **B02.05:** Build source-linked non-destructive section masks for nose, wing, upper body, sidepods, engine cover, floor, rear cover.
- **B02.06:** Record paint/seam/fastener cues from the actual mesh; avoid generating physical bolts wherever the mesh has no seat.
- **B02.07:** Create exact collision proxy meshes for Model B exterior (BVH or signed-distance where meaningful), mark proxy-only.
- **B02.08:** Locate interference zones at four wheel envelopes and front/rear aero skin; compute static mesh distances.
- **B02.09:** Build real project-authored interface support CAD surfaces behind removable body panels; no decorative floating brackets.
- **B02.10:** Create chassis/cockpit source envelopes distinct from visible shell; mark them conceptual if owner OEM geometry absent.
- **B02.11:** Integrate per-panel animation groups with canonical rest transforms; hidden areas must reveal actual modeled internals.
- **B02.12:** Match shell mask boundaries to mounting hardware with correct overlap and shadow seam.
- **B02.13:** Verify restoring all masks yields byte-identical visible original Model B exterior layout.
- **B02.14:** Export shell/attachment interface registry and 8 angles with overlays.

**Gate G02 PASS:** Model B still recognizable and unchanged; no doubled wheel meshes; every later CAD mount references a stable measured interface.

## 6. G03 — Full external authored CAD skin, chassis and structural support (22 packets)

**Do not redesign away Model B.** Author internal/project-CAD supports and extract reference-aligned, physically separated *conceptual* shells. Explicitly mark visual shells derived from GLB vs native B-Rep.

- **B03.01:** Nose shell outer loft, internal nose rib, nose fastening flange and tip support.
- **B03.02:** Front wing mainplane, secondary elements, end treatment and source-aligned camber sections.
- **B03.03:** Front-wing hinge axle, bushings, lever, actuator bracket, stops and retaining screws.
- **B03.04:** Front crash-support nose interface and accessible removable fasteners (educational concept, not crash homologation).
- **B03.05:** Monocoque tub outer longitudinal surfaces, loft stations and controlled section continuity.
- **B03.06:** Monocoque tub inner surfaces, upper cockpit aperture lip and wall section; reserve driver envelope.
- **B03.07:** Front bulkhead, steering rack seats, pedal-box hardpoint bosses and local reinforcing laminates.
- **B03.08:** Front suspension upper/lower clevis mounts, threads/through-holes, seat radii and bushing orientation.
- **B03.09:** Rear tub/engine-to-chassis connection flange and mating interface.
- **B03.10:** Halo structural model, front and rear mount collars, real local bolt holes (not safety-certified).
- **B03.11:** Left and right sidepod surface sections, inlet lips, undercuts and removable upper shells.
- **B03.12:** Left/right sidepod internal support frames and duct supports; distinguish from external Model B visual skins.
- **B03.13:** Airbox roll-over inlet housing, cover supports and fixation.
- **B03.14:** Engine cover removable shell, fastener lips, catches and undercut clearance.
- **B03.15:** Flat 2026-style floor lower/upper shells, plank, skids and edge attachments per current rules.
- **B03.16:** Diffuser expansion surfaces, strakes where justified, outlets and rear mounting plate; no legacy 2022–25 tunnel copy.
- **B03.17:** Rear crash support / rear wing pedestal reference (NOT certified crash structure).
- **B03.18:** Rear wing mainplane and active elements with proper section curves.
- **B03.19:** Rear wing pivots, bushings, end supports, actuator and stops.
- **B03.20:** Aero/body bolts, quarter-turn fasteners, panel nuts and their actual host clips, distributed by interface registry.
- **B03.21:** Connected shell-support topology and service-access/removal order for each cover.
- **B03.22:** Eight-view neutral clay + cross-sections, compared against the locked exterior with no box/rod shortcuts.

**Gate G03 PASS:** full structural/visual body topology is authored as named pieces; Model B remains silhouette authority; each opening/hinge has real source geometry and mounts. Any impossible mating is visible as an OPEN conflict, not hidden.

## 7. G04 — Four separate wheel, hub and brake assemblies (24 packets)

**Important:** P2.8 is one corner, not four. Front L/R handedness, rear carrier/upright, rear brake mount/drive load and all shaft interfaces need distinct verification. Work per station; copy of a front assembly is a starting geometry operation only, NOT an accepted rear assembly.

- **B04.01:** Master wheel datum/rim diameter/tyre section cross-check versus Model B and FIA worksheet.
- **B04.02:** FL original P2.8 source verify 59 solids, STEP, node hash, correct left/right identity and native unit.
- **B04.03:** FL tyre tread/sidewall, bead, shoulder fillet, wheel lettering area and air-valve actual seat.
- **B04.04:** FL rim spoke faces, rim barrel, inboard seat, center bore, valve and hub-axis pivot.
- **B04.05:** FL central nut lock form, actual threads, anti-release detail, fastener access.
- **B04.06:** FL hub housing, inner/outer bearing races, rolling element seats, seals and spacer stack.
- **B04.07:** FL brake rotor, hat, cooling holes/vanes, pad contact tracks and caliper envelope.
- **B04.08:** FL caliper halves, pistons, seals, bridge, retaining pins and hydraulic port bosses.
- **B04.09:** FL upright/knuckle, upper/lower joint retains, steering arm, wheel bearing seats.
- **B04.10:** FL upright boss load-path and P2.8 structural-retention defects fixed in B-Rep; rebuild neutral pose.
- **B04.11:** FL rotor/hub/caliper static interference and 360° sampled rolling clearance, bearing concentricity.
- **B04.12:** FR authored handedness conversion of wheel/upright, reoriented threads, caliper mounting face and steering arm.
- **B04.13:** FR actual mounting bosses/bores/bearings validated independently; no mere negative-scale reflection in GLB.
- **B04.14:** FR independent STEP and GLB, fit and motion tests, right wheel center aligned.
- **B04.15:** RL tyre/rim package with measured rear section and drive-compatible hub.
- **B04.16:** RL driven hub, rear upright/carrier, axle splines interface, bearings and seals.
- **B04.17:** RL rear brake disc/hat/caliper/pads and appropriately positioned hydraulic ports/cooling path.
- **B04.18:** RL center-lock, wheel nut retention, upright joint and service sequence.
- **B04.19:** RR rear assembly authored/handed separately; correct driven hub and caliper inboard/outboard orientation.
- **B04.20:** RR independent bearing/spline/brake/retention STEP fit and running clearance.
- **B04.21:** Four independently measured wheel center coordinates, tyre clearance and arch/sidepod interferences.
- **B04.22:** Four wheel rotation pivots, brake static anchoring and wheel detach/re-attach transforms.
- **B04.23:** Identical base material palette across four rims/fastener families, with geometry correct per side.
- **B04.24:** Four-corner roll-call screenshot (FL/FR/RL/RR), source IDs, parts manifest and neutral STEP inspection.

**Gate G04 PASS:** all four genuinely authored, correct handedness, independent native STEP and clearances, no doubled Model B tyres, each axle/wheel pivot real. 59×4 is **not** a validity measure.

## 8. G05 — Front suspension, rack and steering kinematics (18 packets)

- **B05.01:** FL upper wishbone inboard bushings and outer joint seat; tubes/sections modeled with real joints.
- **B05.02:** FL lower wishbone inboard bushings and upright outer joint retention.
- **B05.03:** FR matching independent upper/lower arms with handedness and chassis pickups.
- **B05.04:** Front pushrods with spherical bearings, locknuts, joint-length and motion envelope.
- **B05.05:** Front rockers/bellcranks, pivot bores, support bracket and retaining features.
- **B05.06:** Front springs, dampers, caps, threaded adjusters, collars, bump stops and actuator mounts.
- **B05.07:** Front anti-roll bar, torsion lever, support bushings and drop links, where reference concept requires it.
- **B05.08:** Steering wheel column shaft, bearings, U-joints and rack input coupling.
- **B05.09:** Rack housing, gear/linear output proxy (functional geometric motion, not certified tooth loads).
- **B05.10:** FL tie-rod body, inboard and outboard ball joints, threads and retainers.
- **B05.11:** FR tie-rod equivalent with appropriate length and handedness.
- **B05.12:** Verify centerline wheel steer zero and tie-rod/rack constraints; derive joint positions from locked hardpoints.
- **B05.13:** Sample steering ±8° and bump ±15 mm from previous design *as exploratory test positions only*; replace with actual validated limits as computed.
- **B05.14:** Coupled steer+bump+roll at both front corners (not isolated single-axis animation).
- **B05.15:** Check bolt-to-arm, brake hose, upright and tyre to chassis clearances across samples.
- **B05.16:** Verify no unretained wishbone ball stud or disconnected load path.
- **B05.17:** Source assembly variants and exact rest transforms for animations.
- **B05.18:** Front suspension geometry/report, kinematic plots and isolated macro exploded video.

**Gate G05 PASS:** all front mechanical members and both steering sides attached to chassis with non-fake joints; sampled movement returns to zero pose.

## 9. G06 — Rear suspension, differential, gearbox and shafts (20 packets)

- **B06.01:** Gearbox casing package derived from engine/chassis envelope and rear axle frame.
- **B06.02:** Gearbox rear structural mounting plate and monocoque-engine-gearbox interface.
- **B06.03:** Gear carrier shafts, bearings, outer races and bearing retainers.
- **B06.04:** Dog engagement/coupling conceptual gearbox internal gears and stacked shaft arrangement; tag unsupported OEM details ILLUSTRATIVE.
- **B06.05:** Differential housing, side bearings, carrier, ring gear and output flanges.
- **B06.06:** Oil galleries, plugs and vent fitting with actual host bores.
- **B06.07:** RL half-shaft, CV joints, boots, spline interfaces and rear wheel hub retention.
- **B06.08:** RR half-shaft and CV arrangement mirrored with correct angular freedom.
- **B06.09:** RL upper/lower wishbones, gearbox-side pickups and outboard joints.
- **B06.10:** RR upper/lower wishbones, symmetric load paths and side-specific clearance.
- **B06.11:** Rear pushrod/pullrod selection grounded in source envelope, not arbitrary visual rods.
- **B06.12:** Rear rocker, spring/damper stacks, torsion bars and support mounts.
- **B06.13:** Rear anti-roll bar, links, bearings, anchor plates and retainers.
- **B06.14:** Rear brake carriers and ducts fit the rear suspension and gearbox.
- **B06.15:** Ensure gearbox final-drive output couples to both driven hub axes.
- **B06.16:** Articulation/bump/roll kinematic sampling with drive shafts and CV angle limits.
- **B06.17:** Exact B-Rep clearance near diffuser/floor/rear-wing pedestal.
- **B06.18:** Check exhaust/engine cover separation from rear suspension travel.
- **B06.19:** Every rear nut, bolt, pin, clip and grease/service plug has mating host.
- **B06.20:** Full rear assembly STEP/GLB, rear steering=non-steering unless research establishes contrary, rest/pivot tests.

**Gate G06 PASS:** rear axle is a distinct driven assembly; load path and shaft kinematics close within declared conceptual limits. Never represent copied front P2.8 at the rear as valid.

## 10. G07 — Cockpit, driver controls, safety cell and visible interiors (16 packets)

- **B07.01:** Cockpit inner surface, real aperture and masked body skin to reveal it.
- **B07.02:** Driver seat shell, seat insert, side bolsters and fixing rails.
- **B07.03:** Headrest surround and halo mount flanges, sectioned where appropriate.
- **B07.04:** Steering wheel base, grips, detachable hub, screen and bezel.
- **B07.05:** Steering wheel buttons, rotary selectors, shifters, paddles, trigger springs, rear connectors.
- **B07.06:** Steering quick-release socket and steering column spline/interface.
- **B07.07:** Upper and lower steering column bearings, bushings, shaft couplings.
- **B07.08:** Pedal box plate, brake/throttle pedals, pivot bearings, adjuster tracks, stops.
- **B07.09:** Master-cylinder/brake-by-wire educational concept and actual connected lines.
- **B07.10:** Driver heel-rest floor, footwell service panels and fastening seats.
- **B07.11:** Dashboard/digital controls wiring mounting and data connector.
- **B07.12:** Harness anchoring as visual reference; never safety certification.
- **B07.13:** Cooling/air ventilation flow inlet to cockpit, duct and outlets.
- **B07.14:** Cockpit camera macro frames (seat, steering wheel front and reverse, pedals) verify focus.
- **B07.15:** Service removal hierarchy: steering wheel → wheel connector → body panel → seat/pedal access.
- **B07.16:** Full cockpit fit/report, material registry and independent visual detail approval.

**Gate G07 PASS:** no empty cockpit; controls are detailed with real mounts and visible connections. Safety/performance of actual crash and harness systems remains unclaimed.

## 11. G08 — 2026-inspired power unit, hybrid, cooling, fluids and electronics (24 packets)

- **B08.01:** Engine envelope and mounting datums between monocoque and gearbox; clearance against Model B cover.
- **B08.02:** V6 crankcase, cylinder banks, head covers, sump and mechanical fastener flanges.
- **B08.03:** Crankshaft journals, throws, bearings and balancing envelope (conceptual internals).
- **B08.04:** Rods, pistons, pins, rings and cylinder bore seats for cutaway macro.
- **B08.05:** Intake valves, valve seats, cam covers/shafts, cam drive mechanism (source-status label).
- **B08.06:** Turbo compressor housing, wheel, shaft, bearing cartridge, turbine and wastegate/actuator topology.
- **B08.07:** Exhaust manifolds, collector and exhaust outlet clearance/thermal shield.
- **B08.08:** Engine airbox to turbo intake and downstream inlet tract.
- **B08.09:** MGU-K housing, rotor, stator illustrative parts, mounts, torque coupling and wiring exit.
- **B08.10:** Energy store/battery casing, mounting, high-voltage module grouping (schematic only; no unsafe live wiring instructions).
- **B08.11:** Control electronics/ECU mounting, connectors, service panel and cable covers.
- **B08.12:** NO MGU-H; reject previous-era MGU-H assemblies from manifest.
- **B08.13:** Fuel cell permitted envelope as schematic, protected location and concept line routing (no real crash/safety claim).
- **B08.14:** Oil tank, pump, scavenging lines, cooler and filter cartridge with mounts.
- **B08.15:** Water/coolant pump, hoses, elbows, clamps and expansion paths.
- **B08.16:** Charge-air cooling topology, cores and ducts with source-supported placement.
- **B08.17:** Left radiator core/frames, fins at practical LOD, inlet/outlet manifolds.
- **B08.18:** Right radiator core/frames and independently routed plumbing.
- **B08.19:** Sidepod inlet duct, turning vanes supported by source and outlet/heat-exit duct.
- **B08.20:** Electrical loom bundles, brackets, actual connectors and protective clips, no floating cables.
- **B08.21:** Thermal clearance proxies near exhaust/battery/driver compartment; visually mark unknown heat/FEA calculations.
- **B08.22:** Connect ECU/ERS/powertrain/cooling assemblies to real supports; no intersections disguised by body opacity.
- **B08.23:** Demonstrate engine/gearbox full packaging, service access and interior cutaway.
- **B08.24:** STEP macro/cross-sectional GLB/diagram labeling clearly distinguishing project concept from OEM.

**Gate G08 PASS:** full, connected powertrain/cooling/electronics physical *visual concept* exists as native authored geometry and exact package fit; no invented manufacturer internal detail presented as fact.

## 12. G09 — All bolts, bearing details, clips, piping, service hardware and source realism (18 packets)

- **B09.01:** Canonical metric fastener catalog: dimensions, pitch, length, washer/head style, material and source/standard.
- **B09.02:** Female bore/counterbore/countersink threads generated from same nominal standard and assembly registry.
- **B09.03:** Authentic helical thread mesh for macro-target bolts, controlled LOD simplified cylindrical threads elsewhere.
- **B09.04:** Lock nuts, castellated nuts, safety retainers, captive nuts, washer stacks and service clips.
- **B09.05:** Ball joints spherical race/body/liner/retaining studs with shoulders and mating bores.
- **B09.06:** Rolling bearing balls/rollers, inner/outer race tracks, cage and dust seals as real geometry where exposed.
- **B09.07:** Bushings, sleeves, collars, spacers, circlips and anti-rotation keys.
- **B09.08:** Brake bleed nipples, pad retaining pins, anti-rattle clips, hydraulic fittings and shields.
- **B09.09:** Hose end connectors, strain-relief jackets, tube clamps and mount tabs.
- **B09.10:** Electrical connectors, backshells, plug locks and routing fasteners.
- **B09.11:** Rivets, composite inserts, bracket backing plates and correct local clearances.
- **B09.12:** Wing pivot pins, actuator rod-end joints, hinge stops, hinge bushings and locking pins.
- **B09.13:** Cooling core tube/fins structure meaningful at both macro and ordinary LOD.
- **B09.14:** Tyre valve stem, tire sidewall, rim bead seats, wheel internal interfaces.
- **B09.15:** Brake cooling vanes/slots, machined rotor surfaces, caliper cutaway seals.
- **B09.16:** Every fastener placement generated from host surface/hole feature and real path, not random dots.
- **B09.17:** Count `fasteners in manifest = host interfaces` and detect unhosted/duplicate/hidden items.
- **B09.18:** 25+ representative macro images: bolts, raceways, valve, brakes, suspension joints, controls, PU, cooling.

**Gate G09 PASS:** macro details have actual topology at camera distance; host adjacency and correct nesting are proven. *Quantity is derived from validated hosts*, never arbitrary “1000 screws”.

## 13. G10 — Full-car mating and four-corner coupled assembly solver (18 packets)

- **B10.01:** Define base vehicle assembly with canonical rest transforms and fixed chassis datum.
- **B10.02:** Implement concentric mate (shaft/bore), planar mate, angular mate, bolt clamp and ball-joint constraints.
- **B10.03:** Implement hinge, slider, rack-to-steer, drive-shaft and coupled rocker constraints.
- **B10.04:** Build interface/mate graph and identify disconnected nodes/unsupported braces.
- **B10.05:** Source placement transaction with quaternion no-scale, SHA manifest and failure rollback.
- **B10.06:** FL source corner to measured front-left chassis hardpoints, NOT simply to tyre center.
- **B10.07:** FR corner to corresponding right chassis hardpoints, independently signed.
- **B10.08:** RL rear module to gearbox/chassis rear hardpoints.
- **B10.09:** RR rear module to gearbox/chassis rear hardpoints.
- **B10.10:** Gearbox + engine + monocoque mount path; suspension supports and chassis floor interfaces.
- **B10.11:** Intake/cooling/exhaust fluid ducts constrained to relevant openings/parts.
- **B10.12:** Electrical loom clip constraints and service disconnect/mask rules.
- **B10.13:** Wing hinge/actuator travel with geometric stops.
- **B10.14:** Wheel rotation, steering, suspension bump and differential output articulation together.
- **B10.15:** All contact pairs, tightening hardware and mount clearance hierarchy.
- **B10.16:** Resolve positional under-constraint, over-constraint, reflection, unit mixup and pivot drift.
- **B10.17:** Assemble and disassemble full car from exact rest matrices; roundtrip pose equality check.
- **B10.18:** 4-wheel/full-car proof: all 4 tyres touching intended wheel centers, all subassemblies visible and no impossible floaters.

**Gate G10 PASS:** full car source assemblies connected by explicit mates; all four corners and every named major system exist. Measured overlay alone is insufficient.

## 14. G11 — Native STEP / B-Rep / kinematic engineering QA (18 packets)

- **B11.01:** Rebuild all project-authored native STEP solids from parametric source; SHA and determinism checks.
- **B11.02:** Per-solid topology validity, volume sign, closedness, inverted normals and disconnected islands.
- **B11.03:** Boolean broadphase BVH/AABB with full candidate enumeration (not first 100).
- **B11.04:** Exact B-Rep intersections for **all candidates** in the declared pose sample, annotated contact exemptions.
- **B11.05:** Contact/clearance map for fastener heads, retained joints, spacers, gears, shaft/bearing seats.
- **B11.06:** Ensure intended zero-clearance fit/contact and swept operating clearances are distinguished from collision.
- **B11.07:** Sample 4-wheel rotation and front steering, rear bump and combined chassis heave/roll states.
- **B11.08:** Sample coupled steering + bump + wheel spin; do not extrapolate from single-axis motion.
- **B11.09:** Anti-clipping of tyre to wing, floor, sidepod and pushrod through all poses.
- **B11.10:** Axle drive articulation and CV joint limit preflight.
- **B11.11:** Aero hinge clearance at low/high downforce poses with actuator stop/contact checks.
- **B11.12:** Body panel service opening order versus hardware and internal obstructions.
- **B11.13:** Electrical and coolant hose routing envelopes across changing poses.
- **B11.14:** Tolerance stack worksheets on a limited declared set of representative critical interfaces.
- **B11.15:** Model B mesh-vs-project-STEP collision proxies; distinguish proxy report from exact native B-Rep.
- **B11.16:** Performance/control sampling under source/geometry perturbations; record numerical stability.
- **B11.17:** Full QA report `collisions.csv`, `contact-allowlist.json`, `kinematics.csv`, scene validation.
- **B11.18:** Resolve every high-severity issue; document residual conceptual engineering uncertainty and not-real-OEM status.

**Gate G11 PASS:** declared full-car sampled QA has zero unwaived intersections beyond the **explicit interface-specific criteria**; do not reuse the historical 0.05 mm³ static threshold as a universal clearance requirement. This still is not structural FEA or safety homologation.

## 15. G12 — Tessellation, render LOD and asset optimization (16 packets)

- **B12.01:** Export 1 native source STEP/assembly plus manifest with per-part SHA and local pivots.
- **B12.02:** Tessellate each solid to HIGH with screen-space silhouette and macro roundtrip check.
- **B12.03:** Tessellate BALANCED preserving tire outline, threads where zoomed, key sharp edges and seam fidelity.
- **B12.04:** Tessellate PERFORMANCE with geometry simplification by group and reversible high-macro swapping.
- **B12.05:** Preserve true smoothing/hard edges, stable normal direction, tangent basis and correct mirroring.
- **B12.06:** Deduplicate source materials/instances without merging independently movable parts.
- **B12.07:** Keep instanced bolts only when each retains selectable partId and world transform.
- **B12.08:** Texture set: carbon, titanium, rubber, steel, aluminium, ceramic brake, anodized accents, wheel print.
- **B12.09:** Consistent palette and side-independent materials; branding/paint decals on shell, nose, wing and wheel as separate layers.
- **B12.10:** Draco/Meshopt/KTX2 only when decoders and target browser support pass; don't silently damage source texture.
- **B12.11:** Quantization and GLB packing; ensure assembly pivot origin/matrix preserved within declared error.
- **B12.12:** Validate no empty meshes, lost normals, dropped part IDs or unreferenced geometry across 3 tiers.
- **B12.13:** Export per-part and per-assembly draw-call, triangles, vertex, texture memory/VRAM estimates.
- **B12.14:** Compare HIGH vs BALANCED vs PERFORMANCE from identical cameras with difference screenshots.
- **B12.15:** Verify no missing backfaces, silhouette pops, reflection seams or rotor gap artifacts at macro zoom.
- **B12.16:** Produce SHA-matched `fullcar_manifest.json`, three tier GLBs and static source audit.

**Gate G12 PASS:** exact 1:1 source identity across STEP and GLB, three tiers visually checked, canonical pivots retained, source provenance preserved.

## 16. G13 — Three.js, scene hierarchy and configurable inspection UI (16 packets)

- **B13.01:** Create DEV-only full-car loader accepting full-car manifest + GLB; reject missing systems and SHA mismatch.
- **B13.02:** Maintain single mounted WebGL scene and original Model B render; don't reload per chapter.
- **B13.03:** Construct component tree from manifest; partId remains selectable through LOD transitions.
- **B13.04:** Apply CAD-native rest transforms and units without double scaling; no mirrored negative scales for mechanical parts.
- **B13.05:** Hierarchical rotation/translation/explode rig with per-component pivots.
- **B13.06:** Explicit full-car mode, local system mode, individual part and hardware macro modes.
- **B13.07:** Local body masks reveal actual constructed internals, not empty cavities.
- **B13.08:** Technical material palette applied consistently to all assemblies and bolts; keep original Model B livery separately controllable.
- **B13.09:** Orbit/zoom and focus from actual node bounds and safe clipping distances.
- **B13.10:** Selective exploded offsets computed by local part hierarchy and near-miss constraints; no floating offscreen confusion.
- **B13.11:** Source labels `MODEL_B_EXTERIOR`, `PROJECT_CAD`, `ILLUSTRATIVE` with clear unsupported engineering internals.
- **B13.12:** Viewport profiles mobile/tablet/desktop/ultrawide and fallback for low-powered hardware.
- **B13.13:** Correct disposal of texture/environment, materials, geometry, decoder resources; context-loss recovery.
- **B13.14:** Dev metrics FPS, draw calls, triangles, texture memory and animation frame time.
- **B13.15:** Contrast/accessibility/keyboard focus and reduced-motion alternatives.
- **B13.16:** All 4 corners and full-car review demonstrated on the same persistent stage.

**Gate G13 PASS:** owner can inspect all major systems, each contains genuine authored geometry and every part survives focus, isolation, LOD switch and reassembly.

## 17. G14 — Anime.js / pinned scroll choreography, actual 18 chapters (22 packets)

**Animation contract:** single deterministic normalized scroll `p∈[0,1]`, reversible and seekable; no state accumulation or per-scroll fresh GLB. Anime.js drives timelines/values; Three.js renders, with an explicit source-preserving `restMatrix`. Integrate existing code rather than replace it blindly. All chapter labels must correspond to **present source geometry**; no placeholder 18-chapter "complete" claim.

- **B14.01:** Author time-independent `sampleSceneAt(progress)` from canonical rest matrices.
- **B14.02:** Design native scroll track; one sticky full-screen WebGL stage; no hijacked wheel events.
- **B14.03:** Build 0 HERO — assembled full Model B, 3/4 camera.
- **B14.04:** Build 1 BLUEPRINT — light technical contrast, dimensions from validated source.
- **B14.05:** Build 2 NOSE/FRONT WING — body skin/mounts/active flap/hinges/screws.
- **B14.06:** Build 3 FRONT WHEELS — four-wheel context, FL/FR tyre → rim → locknut → hub.
- **B14.07:** Build 4 BRAKES — real rotor/hat/caliper/pistons/seal components with cutaways.
- **B14.08:** Build 5 FRONT SUSPENSION — upper/lower wishbones, joints, pushrod, rocker/damper.
- **B14.09:** Build 6 STEERING — steering wheel/column/rack/tie-rods/uprights with constrained motion.
- **B14.10:** Build 7 COCKPIT/HALO — open shell, seat, wheel reverse, controls, pedals, halo mounts.
- **B14.11:** Build 8 MONOCOQUE — inner/outer tub and real interface brackets/hardpoints.
- **B14.12:** Build 9 SIDEPODS — remove L/R skins; reveal duct support/core.
- **B14.13:** Build 10 COOLING — radiators, plumbing, air path, clamps.
- **B14.14:** Build 11 POWER UNIT — ICE, turbo, MGU-K, energy store and ECU (source-status labeled).
- **B14.15:** Build 12 TRANSMISSION — gearbox case, differential, drive shafts/CVs.
- **B14.16:** Build 13 FLOOR/DIFFUSER — underside technical view and actual 2026-source floor geometry.
- **B14.17:** Build 14 REAR SUSPENSION/BRAKES — rear arms, damper, wheel, brakes and pivots.
- **B14.18:** Build 15 REAR WING — aero elements, hinges, actuator and fasteners.
- **B14.19:** Build 16 WHOLE-CAR EXPLODED — mechanically reasonable outside-in removal order, source part IDs.
- **B14.20:** Build 17 REASSEMBLY/FINALE — complete restoration to original pose, original Model B hero.
- **B14.21:** Inter-chapter camera path, focal length, lighting, focus and line callouts; dark/light sequence aligned with supplied reference.
- **B14.22:** Scroll forwards/backwards, jump/keyboard, mobile gestures and reduced motion: equality of positions/quaternions, no camera leaps, 0→100→0 repeatable.

**Gate G14 PASS:** all 18 fully source-backed chapters visually present, exact reversibility with no skipped parts, every close-up shows real relevant CAD. 18 existing **placeholder/missing-source** chapters are NOT accepted as done.

## 18. G15 — Final browser QA, video, performance and owner acceptance (18 packets)

- **B15.01:** Run `npm ci`, lint, typecheck, all targeted tests, production build and source boundary; no need for GitHub Actions.
- **B15.02:** Validate full STEP reload, native B-Rep QA and full source SHA manifest against on-disk asset pack.
- **B15.03:** Load full-car GLB in actual Chromium, verify every source node and source status.
- **B15.04:** Take 8 neutral clay angles + 8 styled angles at fixed frame.
- **B15.05:** Screenshot all 18 chapters at entry, midpoint and exit (at least 54 checkpoints).
- **B15.06:** Capture macro views of wheel, 4 brakes, uprights, fasteners, cockpit, PU, cooling, gearbox, rear links.
- **B15.07:** Browser video continuously scroll **0→100→0** with real WebGL; output WebM and MP4 (ffmpeg).
- **B15.08:** Separate close-up technical film using validated part sequence, without external fake geometry.
- **B15.09:** Responsive 375/390/768/1440/1920/ultrawide visual audit, overflow/occlusion checks.
- **B15.10:** Hardware/device profile measured FPS, p95 frame time, draw calls, GPU memory; define numerical performance budgets from actual devices.
- **B15.11:** Stress test rapid scroll seek, reverse, tab switch, window resize and route navigation.
- **B15.12:** Test GLB and texture unmount/disposal, WebGL context loss/recovery, stale camera motion and memory leaks.
- **B15.13:** Keyboard/reduced-motion/contrast/focus checks, mobile gesture equivalence.
- **B15.14:** Audit livery/material and asset/license registry, avoid unauthorized logos/manufacturer CAD claims.
- **B15.15:** Produce `final_review_manifest.json`, SHA, QA reports, clear FAIL/HOLD list and evidence index.
- **B15.16:** Do final source correctness comparison of every wheel and named subassembly; no duplicate wheel geometry.
- **B15.17:** Provide owner a single review ZIP: STEP source, GLBs/manifests, screenshots, source list, QA and MP4, excluding private files from public git.
- **B15.18:** Owner visual review and explicit acceptance; only then separate discussion on production merge and deployment.

**Gate G15 PASS:** real full-car mechanical and visual source requirements are met **for the declared concept scope**, video demonstrates the complete authored vehicle, all blockers resolved or explicitly owner-waived as conceptual limitations. Commercial/OEM engineering certification is a separate and unclaimed objective.

---

## 19. Execution ordering in buildable vertical slices (mandatory)

Do not do 54 arbitrary patches without a car. Each slice produces a tangible, testable new piece of the **same** car.

| Slice | Main completed module | Required checkpoint |
|---|---|---|
| S00 | Audit source + native Model B references | Original 8-view Model B and 59-part STEP known |
| S01 | Four wheel centers + canonical dimensions | Correct unit/frame, same silhouette |
| S02 | FL repaired full corner | Actual retained upright + brake + bearing |
| S03 | FR valid counterpart | Correct handedness, two real front wheels |
| S04 | RL driven wheel + brake carrier | Rear axle concept and spline interfaces |
| S05 | RR driven wheel + brake carrier | Four *distinct* corners; no false mirror |
| S06 | Front suspension + complete steering | Actual rack/tie-rod and coupled motion |
| S07 | Rear suspension + gearbox/diff | Driven hubs, shafts and actual links |
| S08 | Chassis/monocoque interfaces + cockpit | 4-corner load path and real interior |
| S09 | Engine/ERS/cooling/fluids | All internal large modules |
| S10 | Complete aero, floor, body covers | Model B outer look retained |
| S11 | System-wide hardware/retainers | No disconnected bolt or floating bracket |
| S12 | STEP + complete mate/collision QA | One **assembled whole car** |
| S13 | 3-tier optimized full-car GLB | Identical source IDs and pivots |
| S14 | Three.js + Anime.js 18 *real* chapters | No missing content masked with labels |
| S15 | Chromium full video + owner evidence | 0→100→0 actual video and full QA |

A slice cannot be called done unless its real on-screen artifact has been verified against its native CAD and accepted slice constraints. Independent packet-level defect fixes are unlimited within a slice, but each fix needs its own evidence and does not increment fake completion percentages.

## 20. Critical scenario test matrix

| Scenario | Pass condition |
|---|---|
| Four wheels | FL/FR/RL/RR centers, distinct handed geometry, tyre/corner motion |
| Steering | Both front uprights/tie rods follow actual rack and arm constraints |
| Rear drive | Differential → half-shafts → both rear hub axes linked |
| Brake motion | Disc rotates with wheel; caliper stays on upright; pad clearances remain |
| Bump + steer | Connected kinematics within declared sample envelope |
| Fasteners | Every visible screw/nut/clip has a seat and correct parent/pivot |
| Body masks | All original Model B graphics recover exactly after reassembly |
| Material continuity | Same class of steel/rubber/carbon/aluminium uses matching defined palette |
| LOD | Same identities, rest transforms, axes and silhouettes across all tiers |
| Reversible scroll | `sample(p)` same in either direction, 0 and 1 exact hero/rest |
| Video | 18 non-placeholder chapters captured in browser, forward and reverse |
| Source honesty | Concept vs Model B vs original project CAD always distinguishable |
| Release | G15 owner acceptance; absent evidence = HOLD |

## 21. Failure policy and honest limitations

1. **Never call preview “whole car complete” when only the front corner is real CAD.** If one rear wheel/engine/gearbox/cooling module is missing, the corresponding slice and overall gate stay HOLD.
2. **No fabricated OEM internals:** an educational project-authored V6, MGU-K, gearbox, electrical system or body structure can be modeled and rendered to high detail but is NOT the private design of a real 2026 F1 team.
3. **No unverified structural safety:** STEP validity, intersection sampling and cinematic visual match do not equal crash, fatigue, thermal, electrical, aero, manufacturing or FIA homologation.
4. **No invented exact numerical tolerances:** geometry criteria derive from interface design and source specs; historical 0.05 mm³ static overlap and 5 mm preview gates are limited diagnostics, not interchangeable manufacturing limits.
5. **Don't force the original P2.8 CAD onto incompatible Model B dimensions:** the source can remain a geometry reference and reauthor interface parts where actual mating is impossible; preserve unchanged archive and explain modifications.
6. **No silent external CAD download/license misuse**, no unapproved copied sponsor logos, no old visually rejected V1 shells.
7. **No GitHub Actions dependency for owner's local workflow:** local reproducible scripts and browser recordings; remote workflow results may inform diagnostics, not substitute for source/browser acceptance.
8. **No automatic deployment:** develop on a feature branch, owner review before merge, keep private owner STEP/GLB off the public production asset tree.

## 22. First actual implementation queue (do not jump to animation)

**Next batch B00.01–B00.06:** inspect Model B source and SHA, restore P2.8 manifest/STEP/three GLBs, measure four actual wheel envelopes, run original P2.8 validity and create source inventory. **Then** B01.01–B01.09 lock frame/dimensions; **then** B04.02–B04.14 repair FL and author FR; **then** B04.15–B04.24 build true RL/RR. The first full-vehicle visual checkpoint is S05: four actual CAD-backed corners under Model B. Do **not** declare S05 PASS before seeing all four.

**Mandatory user-visible evidence per slice:** assembled vehicle 8-view stills, subsystem macro preview, source manifest with part count, exact open/closed mates and QA; during later stages GLB and scroll video. The user should not need to ask dozens of times merely to learn whether one module exists.
