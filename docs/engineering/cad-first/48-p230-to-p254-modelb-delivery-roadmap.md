# Podium Effet De Sol — P2.30/54 delivery milestone roadmap

Updated: 2026-11-11. Branch: `work/engineering-four-corners-local`.

**Current patch: P2.33/54. P2.54 is a proposed acceptance target, not a guaranteed release or a percent-complete claim.** Discovery of missing Model B source, original native CAD discrepancies, new engineering requirements or failed QA may require additional patches. Patch number is not a calibrated measure of project effort.

## The 25-gate path through P2.54

| Patch | Acceptance deliverable | Status |
|---|---|---|
| P2.30 | 48 source B-Reps: 46 P2.29 + two P2.19 source A-arms; 1,128 static pairs; 48-solid STEP | DONE (static only) |
| P2.31 | Authenticate final eight P2.10 bodies and certify the nominal original rear56 source STEP (1,540 pairs) | DONE (56-BRep static only) |
| P2.32 | Review original P2.11–P2.14 Git blobs, reconcile 76 source IDs, run 62-BRep partial upper/lower split-race formula preflight | DONE (source ownership; original full source runtime still pending) |
| P2.33 | Authenticate & run real 76-body P2.12/P2.14 native union; 1,419 new B-Rep pairs; export STEP only on PASS | IN PROGRESS — gate implemented; original 76 run blocked by missing local native source files |
| P2.34 | Design and verify inner driveshaft/CV joint mechanical connection, motion envelope, interface datums | Planned |
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
