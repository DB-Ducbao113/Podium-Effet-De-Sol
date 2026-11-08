# P1.1 — FULL CAR V2: original lofted 2026 clay study (2026-11-08)

**Current gate: P1 SURFACE STUDY BUILT; G0 reference calibration and G1 owner silhouette acceptance HOLD.**

This record belongs to the CAD-first P1–P5 program on `feat/engineering-inside-machine-v2`. The rejected Full Car V1 (176 block/rod solids) is **not used**, and neither are R4.5 / Model B. **P2.8 remains an independent 59-solid front-corner STEP**, not a complete-car assembly.

## Executed local CAD result

- Source: original CadQuery station-lofts/sweeps with separate native STEP B-Reps; concept aligned to **2026-era** nose, monocoque, thinner wheelset, shaped sidepod undercut, cockpit/halo, flatter floor, three aero elements each end, four tyre locations and minimal silhouette suspension links.
- **63/63 valid CAD STEP solids after independent STEP reload**.
- Wheelbase parametric study: 3350 mm. Actual display envelope about 5514 × 1846 × 1148 mm (no homologation claimed).
- Named GLB meshes at all LODs: 63/63, checksum verified.
- HIGH: 204,588 triangles, 3,668,128 bytes.
- BALANCED: 57,336 triangles, 1,039,664 bytes.
- PERFORMANCE: 24,415 triangles, 455,956 bytes.
- Ten offline renders from the actual HIGH GLB, plus an offline VTK camera orbit; **NOT browser/WebGL video**.
- The source code, native STEP, GLBs and review contact/video are in the owner-review artifact package supplied in this conversation. **These binaries have not been committed to GitHub/public**.

## Visual/engineering defects, deliberately NOT called PASS

- G0 photo-to-orthographic overlay is not finished, despite use of official FIA/Formula 1 public concept references for research.
- Nose/sidepod inlet and undercut need proportion and continuity refinements; halo/front aero and rear support need matched-angle shape review.
- CAD solids are valid but **three HIGH/BALANCED meshes still fail watertightness**, specifically LEFT_SIDEPOD_UNDERCUT_LOFT, RIGHT_SIDEPOD_UNDERCUT_LOFT and HALO_FORWARD_CENTER_PILLAR. PERFORMANCE has two open seams.
- No full-vehicle B-Rep collision audit, load path validation, coupled steering/bump test or P2.8 integration has been performed. These are silhouette-stage sources only, not mechanical CAD certified for assembly.
- No PBR hyperreal, cinematic scroll runtime or GPU FPS PASS.
- DO NOT put the incomplete clay GLBs in public assets or present them as a finished 2026 Formula One race car.

## Immediate P1.2 engineering tasks

1. Generate a single consistent matched-angle FIA reference board with provenance and camera normalization, rather than borrowing silhouettes across teams/eras.
2. Resculpt the sidepod undercut/ram inlet, nose-to-front-wing nose pylons, centre halo geometry and rear aerodynamic mounts using controlled CAD section curves. Check overall silhouette from 8 canonical views.
3. Fix three GLB topology seams by adjusting CAD face/section parameterization first, not simply claiming STEP validity.
4. Compare objective proportions with official FIA 2026 render reference. Reject any shape that still looks like a toy/early clay instead of real F1.
5. Pause before P2 full-vehicle internals, lighting/PBR or site-wide scroll integration until owner G1 shape acceptance.

References:
- FIA 2026 regulation render gallery: https://www.fia.com/multimedia/image-gallery/2026-fia-formula-1-regulations-renders
- F1 2026 updated gallery: https://www.formula1.com/en/latest/article/gallery-new-look-new-tech-new-rules-f1-reveals-renders-of-the-innovative.4DYoUzwNaKhW9aQeeVXJMv
- FIA 2026 size change summary: https://www.fia.com/news/f1s-new-era-everything-you-need-know-about-how-fia-making-formula-1-more-competitive-more

**No CI, merge, deploy, site route substitution or public asset commit.**