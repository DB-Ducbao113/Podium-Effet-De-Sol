# P2.2 — Original front-left CAD engineering assembly

**Repository:** DB-Ducbao113/Podium-Effet-De-Sol  
**Branch:** feat/engineering-inside-machine-v2 — PR #4 Draft  
**Date:** 2026-11-06  
**Status:** Source CAD modeled and audited locally; WebGL/photoreal review remains OPEN  
**Scope:** DEV-only CAD Lab, no production integration

## Direction

P2.2 creates a NEW source geometry master instead of polishing low-poly Model B or copying commercial-rights-unclear FSAE/Formula 1000 CAD. It is a parametric, project-authored Formula-style *illustrative* front-left assembly.

Source of truth is **STEP B-Rep, millimetres**, wheel axle **global +Z outboard**. Three.js export GLBs are **metres**. Every mesh retains a stable named semantic part ID in all three levels.

**The CAD is NOT an authentic Formula 1 engineering dataset and is NOT fit to manufacture.** No OEM affiliation, structural fatigue data, actual tire compound, certified center lock, realistic brake fluid routing or proven rolling bearing preload is asserted.

## Built topology

49 distinct independent native B-Rep solids, including:

| Family | Geometry |
|---|---|
| Wheel and tyre | Original ring-profile slick tire, forged-style barrel, centre disc, 10 separately modeled spokes |
| Hub and locking | Stepped hub shaft/flange, real swept 3D helical **male** thread, bore-through locking nut, face washer |
| Brakes | Annular rotor with **real 44 through-holes** in two radial rows, hat, two caliper body halves, two pads, two caliper bridges |
| Bearing | Inner and outer annular races with twelve individual ball elements (illustrative fit only; no rolling-groove surfaces) |
| Upright | Connected one-solid bearing carrier and three clevis ear bosses with cast linking webs |
| Suspension interfaces | Upper link, lower link, tie rod; each separately modeled |
| Rotor fasteners | Six hex-head mounting fasteners, each separate B-Rep |

The model comprises identifiable geometry, not only glossy PBR impostors or a normal-map fake thread. Source CAD and all derived GLB assets are produced by **one reproducible Python generator**:

\`tools/cad-first/p2_2_front_left_original.py\`

The external licensed candidates in P2.1 remain **not imported**, with commercial publication rights still unresolved. This P2.2 source is independent of them.

## Local technical audit (not CI)

- Native STEP imported back into CadQuery / OpenCascade: **49 solid objects, 49 valid, 496 CAD faces**.
- THREE GLB variants each preserve **49 named mesh parts**, the same names and model unit scale.
- Three independently tessellated LODs; no reused low-poly GLB renamed HIGH.

| Profile | Source triangles | GLB bytes | Technical purpose |
|---|---:|---:|---|
| HIGH | **185,117** | 2,650,608 | Inspect source geometry at macro zoom |
| BALANCED | **41,637** | 785,632 | Standard device preview |
| PERFORMANCE | **19,171** | 427,228 | Low-detail standalone render |

- Different versions of CadQuery/OCCT may generate slightly different triangle counts; regenerate the manifest along with assets.
- SHA-256 and bounding boxes are in the generated manifest and local audit report.
- Offscreen VTK renders use the **actual P2.2 GLB geometry**, not an AI-generated image. They show a 3/4 hero, front face, rear hub, isolated external thread, and drilled rotor+caliper study.
- Source B-Rep verification is not a proof of no inter-part penetrations, correct fastener engagement or cinematic quality.

## DEV website changes

The existing DEV-only \`/engineering/cad-lab\` page now accepts the P2.2 manifest and GLBs:

- A/B HIGH/BALANCED/PERFORMANCE comparison by local file import;
- named source part list and text filter;
- **ISOLATE SELECTED SOLID** for genuine independent geometry inspection;
- **EXPLODED CAD STUDY** slider: reversible editorial separation of source meshes. This is a viewing arrangement, **not** a certified service/disassembly sequence;
- evidence of source/rights shown separately, and source checksum mismatch is rejected if manifest was supplied;
- no auto-download of unapproved third-party CAD, no public model file deployment.

### Windows local authoring

\`\`\`powershell
cd "E:\Formula 1\Podium-Effet-De-Sol"
py -m venv .venv-cad
.\.venv-cad\Scripts\Activate.ps1
pip install -r tools\cad-first\requirements.txt
python tools\cad-first\p2_2_front_left_original.py --out ".local-assets\cad-first\front-left"
python tools\cad-first\p2_2_audit_front_left.py --folder ".local-assets\cad-first\front-left" --report ".local-assets\cad-first\front-left\audit.json"
npm run dev --workspace=@peds/web -- --host 127.0.0.1 --port 5184
\`\`\`

Open \`http://127.0.0.1:5184/engineering/cad-lab\`. Select the locally produced \`P2_front_left_manifest.json\`, then the corresponding \`P2_front_left_balanced.glb\`. Try Isolate with \`P2_CENTER_STUD_EXTERNAL_HELIX\` and \`P2_BRAKE_ROTOR_DRILLED_CARBON\`. Finally review at 0%, 50% and 100% editorial exploded state.

Generated STEP and GLB files are **not checked into public web assets**. Keep them in \`.local-assets\`, share only through owner-controlled review channels.

## P2.3 required for serious hyperrealism

The next round cannot rely only on material tuning. CAD master geometry needs **true physical refinement**:

1. Female nut internal helical groove with controlled crest/root clearance, correct thread profile/runout and explicit mate transform; **currently not verified**.
2. Bearing race grooves, retaining cages, spacers, preload/tolerance analysis; current spheres/rings are diagrammatic.
3. Tyre bead seat and sidewall cross section, wheel valve / heat shield, better rim web geometry and realistic chamfers.
4. Rotor internal cooling/vane architecture (where justified), bell mounting and caliper bodies with separate pistons/pins/seals; current bore pattern is illustrative, not F1 data.
5. Upright arms, clevis ball joints, actual physically consistent mounting and kinematic travel, plus collision/interference inspection at key assembled and exploded frames.
6. Selective high-resolution tessellation on hero parts and LOD merging for low-end devices; actual browser GPU and memory measurements.
7. Physically grounded multilayer PBR materials, environment lighting, studio HDRI and authentic macro shading after CAD geometry is credible.

**Release state:** Model B V1/P1 is not reintroduced; P2.2 is a CAD engineering prototype, not a commercial photoreal final. Feature branch PR remains Draft. No CI run, CI check, CI workflow edit, merge, or deploy was performed.
