# Podium Effet De Sol — P2.30/54 delivery milestone roadmap

Updated: 2026-11-11. Branch: `work/engineering-four-corners-local`.

**Current patch: P2.34/54 — authentic rear76 rigid inboard coupling static PASS, functional CV still HOLD. P2.54 is a proposed acceptance target, not a guaranteed release or a percent-complete claim.** Discovery of missing Model B source, original native CAD discrepancies, new engineering requirements or failed QA may require additional patches. Patch number is not a calibrated measure of project effort.

## The 25-gate path through P2.54

| Patch | Acceptance deliverable | Status |
|---|---|---|
| P2.30 | 48 source B-Reps: 46 P2.29 + two P2.19 source A-arms; 1,128 static pairs; 48-solid STEP | DONE (static only) |
| P2.31 | Authenticate final eight P2.10 bodies and certify the nominal original rear56 source STEP (1,540 pairs) | DONE (56-BRep static only) |
| P2.32 | Review original P2.11–P2.14 Git blobs, reconcile 76 source IDs, run 62-BRep partial upper/lower split-race formula preflight | DONE (source ownership; original full source runtime still pending) |
| P2.33 | Execute exact Git-authored P2.12/P2.14, audit 76 B-Reps / 1,419 affected pairs and export source-named STEP plus neutral GLBs | DONE — 76 native nominal static PASS; mechanical G2 HOLD |
| P2.34 | Original rear84 six-ball CV-like native study: 11 prescribed local angles and source84 nominal static B-Rep gate; real CV kinematics, retention and load | IN PROGRESS — source84/11-angle nominal geometry PASS; speed equality and new cup retention NOT CERTIFIED |
| P2.35 | Real caliper load path, fastener threads/retention and spindle axial bearing preload gates | Planned |
| P2.36 | Coupled rear bump, roll, toe, wheel-spin and articulation clearance sweeps | Planned |
| P2.37 | Revalidate front axle CAD to same B-Rep/provenance and LOD standard | Planned |
| P2.38 | Four corners: correct left/right transformations, bearings, suspension and brake mates | Planned |
| P2.39 | Import original owner Model B full-car asset and measure chassis, wheels and rear datums | Blocked by original Model B |
| P2.40 | Original Model B full-car hardpoint registration and motion path clearance gate | Planned |
| P2.41 | Source-named original car + CAD registry, part datums/pivots, unit policy | Planned |
| P2.42 | Three.js full-car source scene, real GLB load, PBR/LOD and accurate car framing | Planned |
| P2.43 | Reversible 3D exploded assembly graph, physical grouping, collision-screened path | Planned |
| P2.44 | Anime.js scroll timeline: deterministic forward/reverse without transform drift | Planned |
| P2.45 | Chapters 1-2: fasteners, wheel/brake assembly and high-detail source animations | Planned |
| P2.46 | Chapters 3-4: suspension, chassis interfaces, pivot-controlled sequence | Planned |
| P2.47 | Chapters 5-6: complete Model B car reveal with cinematic camera and states | Planned |
| P2.48 | UI art direction, typography, annotations and reference-video comparison | Planned |
| P2.49 | Desktop WebGL performance, asset-size/LOD budget, memory and frame-time QA | Planned |
| P2.50 | Touch/mobile responsiveness, reverse scrolling, reduced-motion, accessibility | Planned |
| P2.51 | Source CAD + scroll regression + visual QA across patches | Planned |
| P2.52 | Browser desktop/mobile end-to-end real Model B tests and screenshot diffs | Planned |
| P2.53 | Record full-car engineering-to-finished-vehicle review video and fix QA findings | Planned |
| P2.54 | Owner-review-ready final acceptance: all required gates PASS; no deploy/merge unless requested | TARGET — not reached |

## Important status distinctions

- P2.30 PASS is limited to **48 genuine static B-Rep bodies**, with **1,128 pair accounting**, **93 newly reviewed pairs**, **4 exact new OCC Booleans**, **0 significant overlaps** and 48/48 STEP readback.
- The latest P2.29 **56-part GLB is a visual/source-mesh preview**, not 56 exact B-Rep fits. Eight native P2.10 solids have not entered the latest full native gate.
- The latest projected rear full owner count after P2.29 is **76**. The 76-body source B-Rep audit is **not run**.
- Authentic original owner **Model B body/chassis GLB or STEP is not included in this audit bundle**. Whole-F1 visual and physical fit cannot be signed off from rear-part-only files.
- No functional torque, real brake caliper load, bearing preload, CV motion, OEM compliance, manufacturing readiness or dynamic suspension certification is implied by a zero-overlap static CAD audit.

## Definition of truly finished at P2.54

1. Reuse **the owner's original Model B**, not a substituted F1 model or proxy chassis.
2. Source-authenticated individual CAD solids with correct full-car position, scale, pivots and signed/recorded provenance.
3. Four corners and full car accurately assembled, source naming retained and no accidental duplications or unverified mechanical mate claims.
4. Three.js full F1 car plus Anime.js reversible scroll-driven exploded/assembled timeline across all chapters, with clear visual transitions rather than plain section scrolling.
5. Uniform neutral engineering gray `#87929D` for requested mechanical CAD parts; preserve original exterior where required.
6. Desktop/mobile, reduced motion, WebGL-performance and actual browser end-to-end QA; full-length owner-review video and source audit evidence.
7. No GitHub Actions, merge, deployment or PR automation without a separate explicit instruction.

**Mechanical G2 HOLD** until all real original-source constraints and dynamics are verified. Finish means acceptance criteria passing, not merely reaching patch number 54.

## P2.32 verification update (2026-11-11)

P2.31 authentic 56-native static STEP PASS. P2.32 source review verifies 76 unique part names after retaining 54, adding six toe parts and 16 split-race parts. Real native B-Rep preflight with 54 authentic P2.31 source bodies and eight reconstructed P2.14 upper/lower source-formula bodies: 460 newly affected pair checks (418 AABB excluded, 42 exact OpenCascade Booleans), zero significant overlaps. This 62-body provisional STEP is explicitly NOT an authentic P2.14 source export. The complete executable P2.11–P2.14 source files were read and hash-reviewed on connected GitHub but not available to the local sandbox, so the complete 76-body mechanical native check remains NOT RUN. P2.54 is still a conditional acceptance target, not an effort-completion percentage.

## P2.33 update (2026-11-11)

The source-pinned P2.33 76-body native integration gate is committed and a local 8/8 regression with genuine P2.31 native STEP and 22 **synthetic collision-control shapes** passed. The full original 76-body source Booleans have **not** been run in the offline CAD environment because P2.11–P2.14 executable source files are absent there, though GitHub source hashes are known. This is not a mechanical PASS. Current patch remains **P2.33/54 (in progress)** until 76 real source bodies are verified and exported. P2.54 remains a conditional target.

## P2.33 real source-native completion (2026-11-11)

The seven exact original P2.9–P2.14 Git-authored modules were recovered into the local CadQuery runtime and checked byte-for-byte against their Git blob SHA-1 values. Actual original P2.12 and P2.14 geometry was executed with the P2.31 genuine 56-source-BRep STEP to produce **76 distinct original source-native B-Reps**. Of the **1,419 newly affected pairs**, **1,334 were AABB-separated** and **85 exact OpenCascade B-Rep Booleans** were run, with **zero significant overlaps and zero Boolean errors**. A new 76-solid STEP was independently read back (76/76 valid, source-name map 76/76); SHA-256 `2807bfc253f2afaf76172fac06ed259051f970518bc3a3765c6c84e40438aa62`. Three source-named neutral `#87929D` GLBs at HIGH/BALANCED/PERFORMANCE levels were also exported from prior 54 source preview parts and the new 22 authentic P2.12/P2.14 BReps. **17/17 regression tests PASS from clean ZIP.** P2.33's static CAD deliverable is DONE; progress advances to **P2.34/54**. Actual Model B full-car chassis fit, four corners, dynamic suspension, fastener/drive load paths, browser scroll and full-car video are still unverified; mechanical G2 remains HOLD. P2.54 is still a conditional target, not a guarantee or effort percentage.

## P2.34 real B-Rep source update (2026-11-11)

The 76 named original-source CAD solids from P2.33 were preserved while the two real P2.17-derived shaft and CV-housing B-Reps were machined with a four-key/four-keyway rigid torque-indexing interface and a one-sided shaft seating shoulder. Original 2.6 mm minimum separation changed to 0 mm at the shoulder, with zero nominal solid intersection; deliberate ±2° relative rotation produces ~10.296118 mm³ geometric collision. The incremental gate inherits 2,701 old unaffected source pairs and explicitly checks 149 affected pairs (141 AABB-separated; eight real OpenCascade B-Rep Booleans; zero significant collisions); rebuilt STEP validates 76/76 solids and named indexing 76/76. Three GLBs retain 76 closed `#87929D` meshes. Nine tests PASS. **This is not a functioning articulating CV joint**: the original P2.17 housing is only an annular prototype, and neither axial positive retention, rated torque nor the original Model B gearbox and dynamic suspension mate has been verified. P2.34 remains IN PROGRESS until the actual articulated CV and retention criteria pass; do not advance to P2.35 solely on this rigid static gate. P2.54 remains a conditional overall target.

## P2.34b provisional axial retaining-ring update (2026-11-11)

Actual SHA-256-pinned P2.34 76-native STEP was used to machine a one-piece original halfshaft groove and add a single independent open C-ring source solid. **77 native B-Reps**, **2,926 total pairs**, **151 newly affected pairs** (**142 AABB-separated**, **9 native OpenCascade Boolean checks**), **zero significant nominal intersections**, and **77/77 STEP independent readback/source names PASS**. Forced CV-housing +0.5 mm outward motion meets the C-ring after 0.3 mm clearance (58.046442 mm³ B-Rep intersection), −0.5 mm inward motion hits the existing shaft shoulder (260.117588 mm³), and C-ring ±0.4 mm groove motion causes 12.509266 mm³ intersection in both directions. Crucially, **1° relative CV housing angulation still intersects the original halfshaft by 69.499829 mm³**. This is a geometry-only axial retaining proposal, NOT actual angular CV articulation or rated spring-ring retention. Three 77-name `#87929D` GLBs and 9/9 tests passed from clean extracted ZIP; source code is included in the user handoff. **P2.34/54 remains IN PROGRESS, mechanical G2 HOLD**, with real articulated CV design still missing. No merge, deploy or GitHub Actions.

## P2.34c authentic six-ball geometric study (2026-11-11)

P2.34B's **1° shaft/housing native collision of 69.499829 mm³** motivated a new original-source-derived six-ball CV-like geometry. Starting from byte-verified P2.34B **77 native B-Reps**, two named source bodies were modified and seven additional native parts (six spherical balls + independent ball guide cage) were generated. **84 native bodies, 3,486 total nominal pairs, 2,775 inherited unchanged pairs, 711 affected pairs; 682 AABB exclusions and 29 exact OpenCascade Booleans, zero nominal significant clashes**. The 84-solid native STEP and 84-name index both roundtrip. Separately, **11 prescribed local nine-part angular poses from −10° to +10°** each checked 36 CAD pair envelopes (21 OpenCascade native Booleans per pose), **231 exact checks with zero significant collision**. Full moving-car/continuous motion NOT checked. Three neutral 84-name GLBs and an 11-pose video passed **10/10 tests and 28/28 SHA-256 checks** from a clean extracted ZIP. The old C-ring does **not retain the enlarged housing** (+0.5 mm axial motion causes no contact). Real constant-velocity velocity-ratio kinematics, rated torque, positive axial retention and Model B chassis fit remain unverified. **P2.34/54 stays IN PROGRESS; mechanical G2 HOLD.** Full source/QA evidence delivered separately in `PEDS_P234C_RealSource_CV_SixBall84_STEP_GLBS_11PoseQA.zip`.
