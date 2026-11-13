> **OWNER VISUAL REVIEW — REJECTED (2026-11-07).** Full Car V1 does not meet recognisable Formula 1 silhouette or engineering-detail quality. Native CAD validity (176/176 solids) and watertight GLBs are mathematical format checks, NOT visual acceptance. This concept must not be treated as an approved whole-car source or base for P3–P5 hyperreal/cinematic production. It is retained only for audit/history.
>
> **Observed defects:** flat rectangular front/rear wing elements, polygonal slab-like chassis/underfloor, rough sidepod/cockpit/halo proportions, simplified rod-based suspension, and weak wheel-to-body proportions. Source generator relies primarily on box(), prism(), cylinder() and rod().
>
> **Corrective gate:** Lock authentic full-car orthographic front/side/top/rear silhouettes and section envelopes before generating new CAD. Preserve the original project-authored P2.8 front-corner source as a separately reviewed subassembly; do not imply this V1 has mechanically integrated it. Require owner visual sign-off on clay silhouette from at least six matched angles before detailing, PBR, exploded scroll or video.

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

Watertight mesh proof: **176/176 in HIGH, BALANCED, PERFORMANCE**, with consistent winding after tessellation boundary welding at 1 µm. This checks triangulated surfaces only, not static CAD fit.

STEP master SHA-256: `ce07d12f731c44302bf2499bef400116e184c41330889ec9846632b5778c652f`
HIGH GLB SHA-256: `4c2d6c79ee5faa2389fb58ecd764b96c68cd1fb9e9eeb5673893476ef76b7602`
BALANCED GLB SHA-256: `5a5a74b7bbf385a8ddefc8398d944c61438271cba4f76d39444f06146862bbde`
PERFORMANCE GLB SHA-256: `2ff5abeca947803276a5671b4e9dad96c1941c90be2c5095b0bf240da664b243`
Partial collision preflight SHA-256: `4d0d391cfc9ed18c6f2ff3b70916cdcbaf77a61d91ec2679d323af2b9dc7271e`

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
