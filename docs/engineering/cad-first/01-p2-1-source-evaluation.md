# P2.1 — Real racing front-corner STEP source evaluation

**Repository:** `DB-Ducbao113/Podium-Effet-De-Sol`  
**Feature branch:** `feat/engineering-inside-machine-v2`, Draft PR #4  
**Date:** 2026-11-06  
**Status:** Technical candidate shortlisting COMPLETE / source-rights gate OPEN  
**Delivery policy:** No unapproved 3rd-party CAD binaries in the repository or public site. No CI.

## Objective

Replace the previous Model B pilot with a real engineering CAD assembly. A credible front-corner master must contain independently modeled components — not one mesh named "wheel" with fake nut shapes. It must remain technically inspectable in STEP/AP214/AP242 (or equivalent) **before** converting to a hierarchy of three GLB levels for Three.js.

P2.1 separates **finding the file**, **opening B-Rep solids**, **confirming mechanical structure**, **determining publication rights**, and **verifying authentic Formula 1 provenance**. These are not interchangeable checks.

## Research verified against original GitHub records

### Candidate A — Ludemann Formula 1000: best actual racing-corner reference, conditional custom license

Source: https://github.com/LudemannEngineering/Formula-1000-Race-Car

- Full front-left: `STEP/Suspension/FrontSuspension/CornerLF_Complete.STEP`, **8,308,598 bytes**; source Git blob `29f5aac7f205c038231e16b8cd7f4b5dfa08082a`. File existence verified; full file could **not** be imported locally here, so actual solid count/clearances are **unknown**.
- Small supporting source `STEP/Suspension/FrontSuspension/PushRodF.STEP`, **398,131 bytes**: the actual AP214 STEP text was read via GitHub. Parsed: **10 named PRODUCT records**, **8 MANIFOLD_SOLID_BREP entities**, **123 ADVANCED_FACE entities**. Names include rod end, adjuster, tube and two hex jam nuts.
- Direct STEP entity count is evidence of source topology, **not proof** of 8 valid independent solid objects. The native OpenCascade import gate is still required before calling this a complete verified assembly.
- License: custom `LICENSE.txt` (not standard CC BY-SA or MIT). Commercial/public licensing terms impose prominent Ludemann Engineering logo/link, comparable sponsor credit, potentially using "Ludemann" in the project's name if substantially based on its CAD, independent engineering analysis, and share-alike conditions for adaptations. Licensed components from third-party manufacturers require separate provenance checks.
- **Decision: promising PRIVATE/DEV engineering reference, NOT approved for Podium EDS commercial publication without legal/business acceptance.**

### Candidate B — Nittany Motorsports NM26: strongest individual front-left part inventory, no license found

Source: https://github.com/udayjain2102/nittanymotorsports

- Repository `mule/cad/` currently contains **489 `.step` files** (GitHub tree).
- Whole-car assembly `mule/cad/NM26_Assembly.step`: **34,618,637 bytes** in Git tree, commit blob `d878de2c08e9113b9cf55e4c04d2db652f9da286`. Has NOT been B-Rep imported or fit-checked in this session.
- Separate left-front source files present:
  - Rim `NM26-UPR-006_rim_13in_front_L.step`
  - Lug nuts `NM26-UPR-007_lug_nuts_front_L.step`
  - Hub `NM26-UPR-008_hub_front_L.step`
  - Rotor `NM26-UPR-009_rotor_drilled_front_L.step`
  - Upright `NM26-UPR-010_upright_front_L.step`
  - Caliper `NM26-BRK-002_caliper_front_L.step`
  - Tyre `NM26-WHL-002_tyre_front_L.step`
  - Lower / upper A-arm `NM26-SUS-007` and `008`
  - Tie rod `NM26-SUS-009`
  - Pushrod `NM26-SUS-010`
  - Rocker `NM26-SUS-011`
  - Coilover `NM26-SUS-012`
- These **13 named STEP files** make this the most relevant candidate for a full left-front assembly hierarchy, but not proof of realistic bolt threads or mating tolerances. Individual file names do not mean each nut is a separate solid; that needs B-Rep inspection.
- As of this review, no repository LICENSE file was found. A public GitHub repository is **not** automatically available for commercial derivative distribution.
- **Decision: high technical relevance; BLOCKED for commercial use pending explicit written permission from the CAD authors/rightsholders.**

### Candidate C — GrabCAD Formula Student Front Upright

Source: https://grabcad.com/library/formula-student-front-upright-1

- Community listing references STEP/IGES; no local B-Rep audit or technical dimensions completed.
- GrabCAD itself says downloaded models are generally private-use. Commercial public use requires original author's explicit permission plus attribution. See https://help.grabcad.com/article/246-how-can-models-be-used-and-shared
- **Decision: commercial website distribution BLOCKED; do not copy source GLB into Podium EDS based solely on a download button.**

### Candidate D — Swarit bicycle hub reference: permissive license, wrong vehicle and LFS limitation

Source: https://github.com/Swarit786/regenerative-braking-bicycle

- Root license MIT; however, `cad/full_assembly.step` in the Git tree is a **132-byte Git LFS pointer**, referring to 1,769,568 bytes of actual CAD. Geometry has NOT been downloaded/validated.
- Bicycle regeneration mechanism is structurally inappropriate as an F1 front-left wheel assembly.
- **Decision: potentially useful for STEP intake practice subject to CAD provenance review; not a candidate to replace the racing wheel.**

## Technical decisions for Podium EDS

| Decision gate | Result |
|---|---|
| Racing-corner CAD sources exist | YES: Ludemann and Nittany |
| File names and STEP formats inspected | YES, with stated limits |
| Actual separate B-Rep solids of external candidates validated locally | NOT YET |
| Source-authentic modern F1 wheel CAD found | NO |
| Validated commercial-public-use rights | NO |
| Third-party models added to production | NO |
| Original P2 self-authored B-Rep intake | **PASS**: 4 valid solids, 67 CAD faces, 5 PRODUCT names in reference STEP |
| Full-corner conversion to high/mid/low GLB | HOLD |

For reference, local independent P2 starter STEP was successfully read by CadQuery/OpenCascade with four valid solids and zero geometry errors. This validates the intake tool itself, **not** any external candidate.

## New implementation delivered

- `apps/web/src/dev/cadFirstP2/sourceRegistry.json`: provenance, real file paths, Git blob IDs, evidence, license status and a hard `commercialReady:false` for each candidate.
- `apps/web/src/dev/cadFirstP2/P2CadLabPage.tsx`: displays source/rights evidence from that registry; mismatched local STEP-to-GLB manifest hashes are not accepted as verified.
- `tools/cad-first/p2_1_step_intake.py`: local CLI accepts source STEP and candidate ID; checks Git LFS pointer, ISO STEP signature, SHA-256, CAD PRODUCT/SOLID/FACE entity counts, and real imported OpenCascade B-Rep validity/bounds/volume. Labels product-name-based classification explicitly as lexical, not mechanical validation.
- No external CAD binaries were checked into the repository. No web download is triggered from the CAD Lab.

### Run the private source-intake check on an authorized local STEP file

```powershell
cd "E:\Formula 1\Podium-Effet-De-Sol"
# CadQuery authoring environment from P2.0 must already be installed
python tools/cad-first/p2_1_step_intake.py `
  --step ".local-assets\cad-first\candidates\CornerLF_Complete.STEP" `
  --source-id "ludemann-f1000-corner-lf" `
  --registry "apps\web\src\dev\cadFirstP2\sourceRegistry.json" `
  --report ".local-assets\cad-first\reviews\p2-1-ludemann.json"
```

If the local STEP file is not available, this command fails; the system never substitutes Model B or an unlicensed online download. A successful report **does not authorize publication**.

## P2.2 selection policy

1. Prefer legally usable STEP masters containing hub, rim, fasteners, upright, rotor, caliper, tire, arm links, bearings and mating surfaces as separate solids.
2. Verify license applies to the **actual CAD source** (not only application code), and allows derived 3D meshes, public display, downloading by viewers, and commercial website use.
3. If Nittany authors grant sufficient written rights, privately import its 13 front-left STEP components and assess B-Rep topology, part scale/alignment, physical clearances and macro detail. Otherwise do **not** use it in the product.
4. If Ludemann custom terms are unacceptable, do **not** force attribution/renaming onto Podium EDS. Use it as permitted reference only, or obtain separate written permission.
5. If no source satisfies both geometry and licensing, build an **original CAD-first Formula-style front corner** with CadQuery/FreeCAD, using independent dimensions/design rather than copying source mesh. Record which components are illustrative versus physically verified.
6. Public F1 authenticity is a separate standard: an FSAE or Formula 1000 assembly must not be presented as a manufacturer-certified modern Formula 1 part.

**P2.1 conclusion: candidate catalog and source gate are implemented, licensing remains HOLD. No CI was run, changed, or awaited; no merge or deploy.**
