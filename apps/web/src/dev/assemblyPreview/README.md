# Owner Model B + original P2.8 — DEV-only integration checkpoint

Repository: **DB-Ducbao113/Podium-Effet-De-Sol** (not F1-Overview).
Branch: feat/engineering-inside-machine-v2.
URL: **/engineering/assembly-preview** (local Vite DEV only).
Gate: **G2 HOLD**. Not merged, not production deployable.

## What now exists

- React Three Fiber staging viewer loads the **already owned showroom shell** from \`apps/web/public/models/model-b-eds-optimized-v1.glb\`. It does not reauthor or replace any bodywork.
- Imports the original **59-part P2.8** owner manifest + SHA-matching GLB using existing \`verifyCadSource\` source validation (embedded glTF resources only, max 150 MiB).
- Checks the 59 original node identities again after parsing GLB, preserving actual parts (rim, bearing, fasteners, center lock, brake, upright, double wishbone) rather than silently adding generic fake meshes.
- Initial visual staging is **next to** Model B. A separate explicit option overlays P2.8's graphic center; it is **NOT** an axle/hardpoint fit. The root transform can be edited in metres and degrees. **Scale always 1**; no geometry welding, tessellation, or transformation of the CAD solids.
- Toggle shell opacity, isolate P2.8 named parts, reset view and download a local placement JSON declaring all remaining mechanical gates **HOLD**.
- All owner-only STEP/GLB inputs remain selected in the user's browser; no upload to the server or public assets.

## Genuine source files from earlier completed work

P2.2–P2.3 original fasteners/helix, rotor, bearing raceways and caliper pistons are already represented in the P2.8 59-part lineage. **Do not add counts across P2.2–P2.8 or copy these parts a second time.** P2.8 is 51 retained P2.6 bodies plus eight P2.7 wishbone bodies. Its incomplete structural upright retention and combined-motion kinematics remain unresolved.

P2.8 owner-only files are *not in GitHub*. Existing generation scripts are at:

- \`tools/cad-first/p2_6_steering_relief.py\` + prior P2.2–P2.4 sources
- \`tools/cad-first/p2_7_wishbone_cad.py\`
- \`tools/cad-first/p2_8_upright_remate.py\`
- \`tools/cad-first/p2_8_source_glb_composition.py\`

Preferred: **reuse the owner's previously generated** \`P28_integrated_59_solid_master.step\`, \`P28_remate_manifest.json\`, \`P28_integrated_balanced.glb\`, rather than regen if hashes already match. An existing owner archive \`PODIUM_EDS_P2_8_STATIC_REMATE_REVIEW.zip\` was documented, not committed publicly. Generate missing exports with the source scripts only when the owner archive is unavailable.

## Local use

~~~powershell
cd "E:\Formula 1\Podium-Effet-De-Sol"
.\.venv-cad\Scripts\Activate.ps1
python tools\cad-first\assembly_modelb_p28_preflight.py --p28-dir ".local-assets\cad-first\front-left-p2-8" --quality BALANCED --out ".local-assets\cad-first\p28-modelb-preflight.json"
npm run dev --workspace=@peds/web -- --host 127.0.0.1 --port 5184
~~~

Open \`http://127.0.0.1:5184/engineering/assembly-preview\`. Select the owner P2.8 manifest, then its SHA-matching GLB. The local Python preflight additionally requires the source STEP and checks all 59 native B-Reps.

## Hard HOLD gates

1. **Coordinate frame:** P2.8 authored axle orientation and Model B local transform must be proven from source landmarks, not inferred from bounding-box centering.
2. **Wheel envelope:** locate intended front-left wheel center in both sources; verify P2.8 tyre diameter, width, inboard rim plane and steering axis against Model B. The body shell may contain preexisting wheel geometry; removing duplicated graphics requires authoring a non-destructive presentation mask.
3. **Mechanical:** cross-source STEP-to-body precise clearances are not proved. Model B is a polygon showroom shell, *not* a manufacturer STEP body; do not assert a mechanical mate by mere visual overlap.
4. **P2.8 integrity:** source static audit passed under its own assumptions, but structural joint retention and coupled ±8° steering / ±15 mm bump remain unproved. A composed P2.8 upright preview previously had an open tessellation seam.
5. **Real browser QA:** syntax/source tests are not full React build or measured WebGL rendering; review responsive 375/768/1440/1920, lifecycle/disposal and GPU performance before owner acceptance.
6. **No P1.1 or rejected 176-solid V1** bodywork, no donor external license substitution, no merge/deploy.

## Attribution and access

Model B license provenance stays governed by \`apps/web/public/models/README.md\` and project asset registry. P2.8 geometry is project-authored CAD. This package does not publish private owner models or third-party photos.
