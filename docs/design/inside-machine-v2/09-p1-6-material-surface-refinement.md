# P1.6 — Cinematic material and surface refinement

**Repository:** `DB-Ducbao113/Podium-Effet-De-Sol`  
**Branch:** `feat/engineering-inside-machine-v2`  
**Access:** DEV `/engineering/p1-front-left`  
**Status:** Experimental lookdev implementation, visual approval OPEN, release HOLD.

## Source-backed inventory

The owner-supplied `inside-the-machine.zip` contains the R4.5 BALANCED GLB. Its seven front-left-wheel semantic control nodes have source-owned mesh descendants with these materials. The affected leaf meshes have `TEXCOORD_0`; no UV unwrap or source geometry edit is required.

| Part | R4.5 source material name | P1.6 target |
|---|---|---|
| Center Lock | `PEDS_NEW_TITANIUM` | Satin titanium, tight highlights and low-amplitude brushed roughness |
| Outer Wheel | `PEDS_Tire_Rubber`, `PEDS_NEW_GRAPHITE`, `PEDS_NEW_TITANIUM` | Nonmetallic tyre, differentiated matte wheel cover and reflective rim |
| Hub | `PEDS_NEW_GRAPHITE` | Separate gunmetal study so the hub does not merge with the dark rotor |
| Brake Disc | `PEDS_NEW_BRAKE_CARBON`, `PEDS_NEW_TITANIUM` | Dark carbon-brake plus source-existing metallic submesh |
| Caliper | `PEDS_NEW_CRIMSON` | Preserve the source Crimson accent; adjust only controlled PBR highlights |
| Suspension Links | `PEDS_NEW_TITANIUM` | Composite-look *proposal* for merged arms, not validated physical material segregation |
| Hub Mount Interface | `PEDS_R43_BRUSHED_TITANIUM` | Brushed, distinct from wheel rim and hub; no claim of validated shaft fitment |

These descriptions refer to the educational Model B material groups. The source does **not** establish genuine F1 team surface treatments, alloys, tyre compounds, disc vent morphology or part-interface certification.

## Code shipped in this iteration

1. `P1SurfaceTextures.ts` — deterministic procedural UV *roughness only*. Three tiny shared finish tiles: tyre grain, brake carbon grain, satin metal grain. No normal, displacement, fabricated weave pattern or geometric drilling; GPU textures are disposed on feature unmount. HIGH uses 128²; BALANCED uses 64²; PERFORMANCE uses none.
2. `pilotMaterials.ts` — source-name-specific PBR palette. No visual overrides are applied to unrelated car paint: only the inspected wheel's named parts receive target recipes. Each material is cloned and can be replaced safely without writing to the GLB.
3. `P1WheelStage.tsx` — quality-scoped texture kit and PBR clone cache. The original material values remain accessible for A/B preview. Technical overlays are hidden when unused, and their fill opacity is reduced during Blueprint so source geometry retains depth.
4. `P1WheelLookdevPage.tsx` — **SOURCE MATERIALS** vs **P1.6 / CINEMATIC** A/B controls that preserve the exact camera, focus, model and timeline position. The material panel exposes the actual R4.5 source slot names plus proposed metalness/roughness figures.
5. `P1SurfaceStudy.ts` — the exact seven source-slot mappings; no guessed source numerical values are printed for the original source mode.
6. `p1Wheel.css` — compact A/B comparison and material chip rows without obstructing the 3D subject.

### Approved-to-test candidate PBR values

| Finish | Albedo proposal | Metalness | Roughness |
|---|---|---:|---:|
| Tyre rubber | `#32363C` | 0.00 | 0.93 |
| Titanium | `#B2BEC8` | 0.76 | 0.29 |
| Brushed titanium | `#ABB8C3` | 0.72 | 0.41 |
| Wheel graphite | `#59636D` | 0.27 | 0.56 |
| Hub-only gunmetal | `#788590` | 0.61 | 0.42 |
| Brake carbon | `#41454B` | 0.11 | 0.86 |
| Crimson caliper | `#A92F2D` | 0.37 | 0.40 |
| Composite-look arm | `#3E454D` | 0.12 | 0.72 |

**These are prototype lighting/material parameters, not source-measured F1 physical properties.** A/B is the owner review mechanism.

## Cinematic acceptance checkpoints (manual, not CI)

- At **0% Hero**, compare source and cinematic. The rubber should remain visibly nonmetallic, while hub, wheel rim and body edges reflect the studio; no body-livery hue changes.
- At **40% Center Lock**, compare the satin highlight profile; the lock's source mesh has few polygons, so specular should not expose faceting aggressively.
- At **54% Exploded**, each brake disc, hub, rim and caliper should have a distinct roughness/material identity without any extra fake geometry.
- At **73% Blueprint**, the whole chassis transitions to a pale technical finish; exact source contours stay legible and no transparent duplicate mesh masks their depth.
- At **80% Macro**, examine tyre roughness and carbon rotor for shimmery UV seams or moiré. If any are visible, reduce UV repetition or disable the affected tile.
- At **100% Rebuild**, A/B toggling must not alter source geometry or pose. Returning to SOURCE mode must restore the exact original albedo/metalness/roughness values on cloned materials.
- Review four widths 375/768/1440/1920 and three quality tiers for detail legibility, texture shimmering and material comparison. Do not assert 60fps or cinematic 4/5 scores without browser evidence.

## Safety and release state

- No source GLB, manifest, binary assets, global styles, Showroom, Championship, Homepage, API or deployment settings were modified.
- **No CI workflows were modified, launched, inspected or awaited in P1.6**. All associated commits use `[skip ci]`, as requested for the experimental branch.
- There is **no claim of completed WebGL visual inspection**. The browser-look verdict is still pending; all changes are reversible from the A/B controls.

**Owner gate:** HOLD. Do not merge/deploy or scale the material study to the other 58 components until P1.6 photographs and motion on the actual WebGL model are visually approved.
