# P2.0 — CAD-first reset and source intake

**Project:** Podium Effet De Sol, Engineering / Inside the Machine
**Branch:** `feat/engineering-inside-machine-v2`, Draft PR #4
**Status:** NEW ARCHITECTURE STARTED; no approved external F1 CAD yet
**Owner gate:** HOLD. No production deploy, merge, or CI requirement for experimental lookdev.

## Why we stopped P1

P1.0–P1.7 improved the way Model B is lit, narrated and animated, but could not add missing engineering geometry: threads, machined bevels, bearings, fasteners, dimensional fit, correct independent solids. In the old R4.5 source the center-lock demonstrator was only 44 triangles. The new goal is not to keep polishing that GLB. It is to build the web scene FROM a separate analytic CAD master.

### Removed from active feature branch

- DEV P1 `/engineering/p1-front-left` route and P1.0–P1.7 runtime, animations, camera/lookdev, tests and CSS.
- Obsolete P1 demo reference data, scripts and docs.
- Navigation into the old pilot from the REV4.2 Advanced panel.
- Current DEV landing at `/engineering` now loads P2 CAD Lab instead of old Model B trial.
- Historical P1 revisions remain recoverable in Git commit history, **not** in the active feature branch.

### Explicitly retained

- Current production `main`, migration baseline and all public pages.
- Independent old REV4.2 Engineering source files and existing model assets under the source namespace, **only as rollback / reference**. They are not loaded by the new P2 CAD Lab.
- Unrelated Championship, Showroom, homepage, API and jobs.
- No binaries, third-party STEP models or licensing assumptions were added to public assets.

## P2's new source of truth

```
AUTHORIZED CAD .step / .stp / .FCStd
    |
    v
B-REP MASTER (named solids + mm dimensional origin + assembly hierarchy)
    |-- Source register, author, rights, license, SHA-256
    |-- Documented interfaces / real fasteners / tolerances (where known)
    |-- Source measurements and part semantic IDs
    |
    v
CAD MESHER (distinct geometry each LOD)
    |-- HIGH: tight chordal tolerance, real detail for macro
    |-- BALANCED: moderate mesh density
    |-- PERFORMANCE: low density, preserve critical silhouettes
    |
    v
ONE GLB per LOD with NAMED part nodes and meter units
    |
    v
DEV-only CAD Lab: local file input, source hash validation,
                geometry inspection, camera/orbit and part selection
    |
    v
After owner visual approval + rights proof:
    commercial engineering storyboard, 3D assembly animations, release
```

## Delivered P2.0 proof, independently authored

`tools/cad-first/p2_fastener_reference.py`

An original and reproducible analytic CadQuery B-Rep demonstration contains:

1. `P2_STUD_HELICAL_THREAD` — real swept external helix with 1.75mm nominal pitch, machined bevel and hex socket.
2. `P2_HEX_NUT` — separately modeled hex nut; female thread engagement NOT certified.
3. `P2_HARDENED_WASHER` — separate washer solid with chamfer.
4. `P2_HUB_SPACER` — separate ring/spacer solid.

The output includes **one STEP master**, three detail-specific GLB files and a provenance/size/SHA-256 manifest. The authoring script reconstructs fresh B-Rep shapes for each LOD because re-tessellating the same cached Open Cascade face can silently produce identical triangle counts.

Sample output measured locally:

| Tier | Total triangles | GLB bytes |
|---|---:|---:|
| HIGH | 19,438 | 469,648 |
| BALANCED | 10,850 | 265,184 |
| PERFORMANCE | 5,068 | 126,404 |

**This is not a genuine Formula 1 center lock.** It demonstrates independent analytic bodies and visible helical 3D geometry before we select a licensed racing CAD assembly. No manufacturing accuracy is asserted for the nut's female thread, fastener tolerances or hub/shaft engagement.

## Local run (Windows PowerShell)

From repository root, on the feature branch:

```powershell
py -m venv .venv-cad
.\.venv-cad\Scripts\Activate.ps1
pip install -r tools/cad-first/requirements.txt
python tools/cad-first/p2_fastener_reference.py --out .local-assets/cad-first/reference
npm install
npm run dev -- --host 127.0.0.1 --port 5184
```

Open `http://127.0.0.1:5184/engineering` (or `/engineering/cad-lab`). In the P2 page, select `P2_fastener_reference_manifest.json` first, then select any `P2_fastener_reference_*.glb` for local-only SHA-256 inspection and orbit.

**STEP is an editable engineering master; the Three.js viewer takes converted GLB, not STEP directly.** The browser does not upload local files to any remote server.

## External source candidates (LICENSE IS A HARD GATE)

1. [Nittany Motorsports NM26](https://github.com/udayjain2102/nittanymotorsports): public multi-part full-car STEP and parts table; found 2,307 CAD files in the GitHub tree, but no repository `LICENSE`. **Rights unresolved; no publication or model copying.** Verify whether geometry is sufficiently detailed for wheel internals and obtain permission.
2. [GrabCAD Formula Student Front Upright](https://grabcad.com/library/formula-student-front-upright-1): plausible wheel CAD, but GrabCAD community models are generally private-use only. Commercial public use requires explicit permission from the original designer and attribution; **not approved**.
3. [OpenArm Hardware](https://github.com/enactic/openarm_hardware): full mechanical STEP assembly under CERN-OHL-S-2.0; open-hardware license requires legal/compliance review. **Not an F1 wheel; suitable only for CAD topology/LOD pipeline feasibility until reviewed.**
4. [BYUI Formula Hybrid legacy CAD](https://github.com/byui-formula-hybrid/legacy-CAD-Models): README claims MIT, but repository did not include the referenced LICENSE file and wheel corner parts are not present in available tree. **Not approved**.

No external model was uploaded into this repository or substituted for an F1 source.

## Mandatory next intake gate for a real F1-inspired wheel

- Real STEP/FCStd/AP214 assembly with at least hub, upright, bearing inner and outer race, fasteners, caliper, rotor and suspension attachments in **distinct named solids**, not a fused showpiece mesh.
- Source attribution and an explicit license permitting the actual intended web usage, derivative meshes and distribution, or a written author authorization.
- SHA-256 provenance and units/coordinate convention; measured B-Rep face/solid count, component hierarchy, bounding dimensions and validity check.
- Review native geometry for real helical thread, functional surface and mating bodies where required; do not pretend a textured normal map equals a physical thread.
- Create and compare three tessellations; prevent LOD profiles with identical geometry.
- Owner reviews macro images / exploded mechanics before cinema effects.
- Only after real CAD is accepted do we build a cinematic animation sequence using source assembly hierarchy.

**No CI runs, changes or waits were performed as part of the P2 migration.**
