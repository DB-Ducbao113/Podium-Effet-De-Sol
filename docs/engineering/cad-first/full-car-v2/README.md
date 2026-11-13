# Full Car V2 — P0 Reference Lock (initiated)
Status: **P0 STARTED / G0 HOLD / G1 HOLD**. Does not contain a new 3D car.

This packet starts the serious redesign rather than pretending the rejected 176-solid V1 is repairable. Its purpose is a machine-readable design contract and a reference grid for genuine 2026 Formula 1 proportions.

## Confirmed source baseline
- FIA 2026 Section C Technical regulations, Issue 21 (19 October 2026): https://www.fia.com/regulation/category/2182
- Formula 1 official 2026 multi-angle renders (17 December 2025): https://www.formula1.com/en/latest/article/gallery-new-look-new-tech-new-rules-f1-reveals-renders-of-the-innovative.4DYoUzwNaKhW9aQeeVXJMv
- Official overview of 2026 regulations: https://corp.formula1.com/f1-2026-regulations-terminology-update/

The 1900 mm regulatory-oriented width and wheelbase <=3400 mm frame the design; the real text has exceptions and must be reviewed at clause/reference-volume level before any claims of compliance. The 3350 mm working wheelbase and 940 mm half width are **preliminary concept values, not measured from the imagery or FIA-approved CAD**.

## Immediate implementation contract
1. Assign licensed/research-source images to 10 view slots in reference-lock.json. Avoid mixing team silhouettes. Photographs must not be embedded into the public site without rights.
2. Verify dimensions against FIA Issue 21 coordinate references; log regulation clause IDs and uncertainty. All missing parameters stay null, not guessed.
3. Generate scaled 2D envelope drawings from the accepted dimensions (orthographic only).
4. Build **one clay outer shell** using authored parametric section curves/lofts: nose, monocoque, sidepods, engine cover, floor and wings. Do not create featureless boxes.
5. Capture matching front, rear, left, right, top, underside, front 3/4 and rear 3/4. Compare silhouettes using aligned axle centers, not perspective guesswork.
6. Stop at **G1 owner visual review**. Only after G1 PASS: internal systems, source P2.8 integration, mechanical audit, PBR, 18-scene scroll and browser video.

The owner rejected V1 specifically because it did not resemble a Formula 1 car, regardless of CAD solids. That visual problem cannot be fixed through mesh welding, new materials or additional hardware. No R4.5/Model B source substitution. The existing CAD P2.8 59-solid FRONT CORNER remains separate until the new car envelope passes and physical mating is validated.

## How to run
From repo root: `python3 docs/engineering/cad-first/full-car-v2/check_reference_lock.py`

Expected status: structural preflight PASS, reference assignments PENDING, G0/G1 HOLD. This is not a completed clay/scroll/video release.
