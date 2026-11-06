# P1.0 — Front-left wheel: source audit and cinematic-shot baseline

**Repository:** `DB-Ducbao113/Podium-Effet-De-Sol`  
**Branch:** `feat/engineering-inside-machine-v2` (PR #4, draft)  
**Source:** owner-provided `inside-the-machine.zip`, R4.5 export files  
**Run:** `python tools/inside-the-machine/p1/audit_front_left.py --source /path/to/inside-the-machine.zip --out /tmp/p1-audit.json`

## P1.0 result — verified from the uploaded GLBs

All seven semantic component control nodes exist **exactly once** and contain valid mesh descendants in **HIGH, BALANCED and PERFORMANCE**. All belong to the front-left wheel's control hierarchy. Each R4.5 profile contains 172 nodes, 85 meshes, 20 glTF materials.

| Semantic part | Triangles (Balanced) | Actual source material(s) | Source fact / design consequence |
|---|---:|---|---|
| `CENTER_LOCK_NUT` | 44 | `PEDS_NEW_TITANIUM` | Very low geometry density; verify edge quality in macro before adding reflection |
| `WHEEL_OUTER` | 5,005 | `PEDS_NEW_TITANIUM`, `PEDS_NEW_GRAPHITE`, `PEDS_Tire_Rubber` | Wheel is compound group with three leaf meshes |
| `WHEEL_HUB` | 1,048 | `PEDS_NEW_GRAPHITE` | Distinct hub geometry exists; real fitment not proven |
| `BRAKE_DISC` | 3,132 | `PEDS_NEW_BRAKE_CARBON`, `PEDS_NEW_TITANIUM` | Two actual submeshes; no fake drilled-hole claims |
| `BRAKE_CALIPER` | 188 | `PEDS_NEW_CRIMSON` | **Crimson is existing material, not gunmetal**; retain as restrained accent unless owner changes livery |
| `SUSPENSION_LINKS` | 304 | `PEDS_NEW_TITANIUM` | **Actual source is titanium**. A carbon-composite appearance is only an unimplemented proposed look |
| `HUB_MOUNT_INTERFACE` | 320 | `PEDS_R43_BRUSHED_TITANIUM` | **Manifest pivotWorld = [0,0,0]**; invalid as wheel macro focal anchor. Use parent wheel pivot pending authoring correction |

**Total visible descendant mesh geometry within these seven groups:** 10,041 triangles per profile. This is a sum of GLB accessor triangle counts, **not** a WebGL measured GPU cost.

### Exact profile hashes

| Profile | Bytes | SHA-256 |
|---|---:|---|
| HIGH | 8,463,056 | `2af5b57ab3e77c921840dd9a351fff0d8a0164644e5c21f3a376bff19207e705` |
| BALANCED | 7,665,796 | `a1c8e39b6b22299fc8ed48617888b483fcc72276b570783ac5538e1e4a2a4eb3` |
| PERFORMANCE | 6,784,156 | `b42021335b3b3140acb98705dc417a633578b1d2a50b78c3864052fbd9bf3496` |

The models' glTF JSON reports `KHR_materials_clearcoat` as an extension. No conclusion about real-device decode speed, visual sharpness or FPS follows from GLB size.

## Source axis and camera anchor

Manifest uses **Blender +X forward, +Y left, +Z up**. Rendering uses **GLB +X forward, +Y up, -Z left**. The origin for cinematic first-corner camera shots comes from the assembled wheel world pivot, not from the origin of the invalid hub interface.

- Source wheel pivot Z-up: `[1.2527518272, 0.8302745819, 0.3711177111]` metres.
- Converted anchor Y-up: `[1.2527518272, 0.3711177111, -0.8302745819]` metres.
- Type-safe six-shot camera brief: `apps/web/src/dev/insideMachineI1/design/frontLeftWheelShots.ts`.
- Start/end timestamps normalized to user-supplied Anime.js ~59 s cinematic reference, **not copied animation code**.

### Cinematic shot order

| Shot | Progress | Technical goal |
|---|---|---|
| A. Hero | 0–12% | Whole-car silhouette, black graphite with readable rim |
| B. Lock | 12–25% | Slow camera advance onto center lock, no lens jump |
| C. Explode | 25–54% | Seven component layers, mechanical separation controlled |
| D. Blueprint | 54–69% | Same geometry, pale technical field, world-anchored leaders |
| E. Macro | 69–86% | Hub/brake textures and topology legible |
| F. Rebuild | 86–100% | Wheel assembled, zero residual transform offset |

**Reference board:** derived from frames 02 and 03 of the uploaded Anime.js clip. These are **source-site screenshots**, not achieved Model B renders. The file remains a user-review artifact and is not copied into public production assets.

## P1.0 gate status

- [x] Owner source read and three GLB profile SHA-256 recorded.
- [x] All seven actual mesh descendants and PBR material names audited.
- [x] Coordinate-system mapping and valid wheel camera target established.
- [x] Material discrepancy documented (crimson caliper, titanium suspension).
- [x] Unverified fitment and zero-value subcomponent pivot surfaced.
- [x] Six camera/lighting storyboard presets written as a typed contract.
- [ ] Still needed: **actual** WebGL screenshots, collision checks, pixel-scale materials review, accessibility and 0→100→0 runtime reassembly.

## Immediate next gate: P1.1

Capture **one** genuine WebGL front-left-wheel hero frame with the actual Model B geometry; correct lighting until tyre, hub, rotor and bodywork silhouette are readable. Compare directly with dark mechanical section of the owner video. Then inspect a macro frame for the center-lock's low geometry density. Do not redesign all 7 parts at once or replace stable REV4.2 binaries without geometry/visual QA.

**Final:** P1.0 source/data/camera contract complete; P1.1 cinematic render is OPEN. PR stays Draft; release HOLD.
