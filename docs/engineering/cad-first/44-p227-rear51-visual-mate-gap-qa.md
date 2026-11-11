# P2.27 — Real rear51 visual inspection and mate-gap QA

Date: 2026-11-11
Branch: `work/engineering-four-corners-local`
Status: **SOURCE-MESH VISUAL QA + GEOMETRIC GAP BOUNDS PASS / MECHANICAL G2 HOLD**

## Actual delivered evidence

P2.27 consumes the immutable SHA-256-verified P2.25 BALANCED GLB, which has **51 individually named source meshes**: P2.19 rear suspension (11) and P2.23 wheel/brake/hub/spindle (40). Material base color remains exactly `#87929D`; metal/rubber differences are reflected through shading only.

Using VTK offscreen rendering under xvfb, an **8-second, 1280 × 720, 96-frame H.264 MP4** was produced. Its sequence shows nominal assembly, a separated engineering-inspection pose and an animated reverse assembly. This is a visual animation of source meshes and is explicitly **not** certified mechanical disassembly, original full-car Model B geometry, or an actual Three.js/Anime.js browser build. The video itself is delivered in the P2.27 ZIP, not committed as a production asset.

A separate, deterministic gap auditor records rigorous *bounds* for 14 selected part pairs using two methods: separated axis-aligned bounding boxes provide a lower bound on triangle-surface separation; nearest pairs of tessellation vertices provide an upper bound. Neither is a replacement for exact OpenCascade native B-Rep mating distances.

## Definite direct-contact gaps in the delivered source GLB

| Original named part pair | Guaranteed minimum direct separation |
| --- | ---: |
| `P217_REAR_DRIVE_HALF_SHAFT_UNSPLINED` ↔ `P216_REAR_HUB_STUB` | **104.0 mm** |
| `P217_REAR_BRAKE_CALIPER_CAST_BODY` ↔ `P29_REAR_UPRIGHT_BEARING_CARRIER_PROPOSAL` | **33.0 mm** |
| `P217_REAR_DRIVE_HALF_SHAFT_UNSPLINED` ↔ `P217_REAR_CV_HOUSING_PROTOTYPE` | **4.0 mm** |
| `P210_REAR_UPPER_A_ARM_FORGED` ↔ `P29_REAR_UPRIGHT_BEARING_CARRIER_PROPOSAL` | **10.5 mm** |
| `P210_REAR_LOWER_A_ARM_FORGED` ↔ `P29_REAR_UPRIGHT_BEARING_CARRIER_PROPOSAL` | **11.5 mm** |

The above figures prove the *named body pairs* do not directly touch at this nominal source pose. They do not rule out an intermediate joining pin, bearing, bracket or other part. The missing torque/mount paths are engineering hold items, not confirmed numerical clearance design requirements.

## Executed QA

- Genuine P2.25 source manifest SHA-256 and BALANCED GLB SHA-256 verified.
- Exactly 51 original part IDs and uniform neutral base RGBA (135,146,157,255) verified.
- **14 selected mate-pair AABB-lower / vertex-upper distance bounds** recorded to JSON.
- Unit tests **5/5 PASS**, including physically separated-box controls, missing manifest rejection, and modified-source-GLB rejection before report export.
- MP4 decoded by ffprobe: **H.264, 1280 × 720, 8.0 s, 96 frames**; an independently rerendered first frame from the packaged VTK code was pixel-identical to the handed-off original frame.
- Source code for the audit, unit test, and the headless VTK renderer is committed to the CAD work branch; the P2.27 ZIP includes actual source GLB, JSON results, video, three PNG inspection stills, executable scripts and SHA256SUMS.

## Reproduce without GitHub Actions

Extract `PEDS_P227_Rear51_Visual_QA_and_Mate_Gaps.zip`, then from the extracted `PEDS_P227/` folder run:

```bash
python -m unittest -v test_p2_27_rear51_mate_gap_audit
python p2_27_rear51_mate_gap_audit.py --p225-dir source --out qa/reproduced_new
PEDS_P227_SOURCE_DIR=./source xvfb-run -a python p2_27_render_rear51.py --out frames_new --frames 96 --fps 12
ffmpeg -framerate 12 -i frames_new/frame_%04d.png -c:v libx264 -pix_fmt yuv420p recreated.mp4
```

The report CLI refuses to overwrite existing evidence; the renderer needs VTK, xvfb and ffmpeg.

## Blockers unchanged

The project still lacks an authenticated original 71-solid cross-B-Rep fit involving P2.12/P2.14, real measured chassis and rear-wheel attachment coordinates from the owner's original Model B, the hub/halfshaft path, brake caliper carrier mount, positively retained center-lock fasteners, suspension kinematic sweeps and full-car WebGL/browser capture. Do not call the 51-mesh review a finished car or a passed mechanical G2.

No GitHub Actions, merge, deploy or original Model B binary change.
