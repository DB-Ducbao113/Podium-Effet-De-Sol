# PEDS — CAD-FIRST FULL CAR V1 / SOURCE REVIEW

Date: 2026-11-07
Branch: `feat/engineering-inside-machine-v2`
Gate: **VISUAL PROTOTYPE ONLY / MECHANICAL HOLD**
Owner review media: delivered in the current project conversation, not added to public build.

## Correct identity and source boundaries

- CAD-first P1–P5 is the continuing program. No R4.5 or Model B input is used.
- The 59-solid P2.8 STEP master describes ONE FRONT CORNER, not the whole vehicle.
- Owner-only P2.8 STEP and source three-tier GLBs are **not checked into this branch**, and were unavailable to the current full-car generator environment.
- P2.9 split spherical bearing 19-piece STEP is a separately verified proof-of-concept, not yet mated into a full-car load path.
- To permit whole-car visual review without inventing engineering certification, **V1 is a separately sourced parametric original full-car concept**. It is not an F1 manufacturer's CAD or mechanically proved continuation of the 59-solid master.

## V1 source results executed locally

| Scope | Result |
|---|---|
| Native CAD, original CadQuery solids | 176 / 176 valid |
| STEP master reload | 176 / 176 solids valid |
| Named complete-car systems | 13 |
| Overall dimensions (GLB bounds) | approximately 5.33 × 2.067 × 1.112 m |
| HIGH | 42,944 triangles, 176 meshes |
| BALANCED | 18,944 triangles, 176 meshes |
| PERFORMANCE | 11,944 triangles, 176 meshes |
| Total static potential part pairs | 15,400 |
| AABB overlap candidates | 438 |
| Exact B-Rep intersections executed on largest candidates | 100 |
| Unexpected/unresolved volumetric overlaps seen in sample | 62 |
| Remaining candidate pairs not exact-tested | 338 |
| Mechanically verified static-fit, dynamic steering/bump, load paths | **FAIL/HOLD / NOT DONE** |
| Hyperreal browser or macOS GPU FPS | **NOT VERIFIED** |

STEP master SHA-256: `f75af94427608211928dec283b5fc7f004115a57f6b7f51df3fa5f44e8cf9e86`
HIGH GLB SHA-256: `bc81b6f17d1ff51b43de7eeb0bca4ca37d9a80c2affd61ca63da4c6827817454`
BALANCED GLB SHA-256: `a1022176939825249f135d76a8ef1a04fb482e714656cf9dbcdb2f65b89514a6`
PERFORMANCE GLB SHA-256: `67ba4ae16a767497a14b8cda12a55f11d97f4d7dd67f911b0077249b2d03b513`
Partial collision preflight SHA-256: `dfdacd94e3c8589155a9bb818b9330bf581044d5399a0083d3297786ca6343eb`

## Review media / source

The current chat contains the reproducible source package:
- `source/generate_fullcar.py` — actual generator of 176 CAD solids
- `source/audit_fullcar.py` — partial interference preflight
- `output/*.step`, `output/*.glb`, `output/full_car_manifest.json`
- `review/fullcar_webgl_review.html` — source-linked WebGL2 demo, requires browser QA
- `review/PEDS_CAD_First_FullCar_V1_Scroll_Review.mp4` — offline GLB-sourced CAD camera review, NOT browser screen recording.

The above **owner-review binaries are intentionally not checked into git/public** until the mechanical and visual gates are separately decided. The existing DEV route `/engineering/cinematic-rebuild` supports importing a `podium-eds.cad-first.full-car.v1` source manifest and matching locally selected GLB. This route must not be advertised as a production-ready full-car assembly.

## Work remaining in order

1. Transfer the actual owner P2.8 59-solid source package into the local CAD sandbox and remate front suspension on all four corners; do not silently substitute V1 concept uprights.
2. Resolve CAD V1 collision candidates and fastener, tyre/rim, brake and hardpoint interfaces. Run every AABB candidate through exact B-Rep; document allowed contacts versus actual interference.
3. Produce connected monocoque, rear/front attachment hardpoints, ground-effect underfloor, rear suspension and gearbox integration with load-path evidence, plus true vehicle-level kinematics.
4. Retessellate HIGH/BALANCED/PERFORMANCE from accepted B-Reps; check watertightness and macro seams.
5. Run actual browser WebGL visual check, scroll reverse 0→100→0, Mac performance on HIGH/BALANCED/PERFORMANCE, leak/resize/context-loss QA.
6. Owner approval required before merge or deploy. Keep CI disabled for draft work.

The separate P1–P5 program and its source rights remain authoritative; **this V1 concept is a visual source starting point, not release gate completion.**
