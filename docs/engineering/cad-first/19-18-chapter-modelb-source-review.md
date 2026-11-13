# Model B + original P2.8: 18-chapter visual story review

**Branch:** `feat/engineering-inside-machine-v2`  
**Route:** `/engineering/full-car-story` (DEV only)  
**Production merge/deploy:** NOT AUTHORIZED  
**Engineering G2:** HOLD

## What this delivers

A single mounted React Three Fiber scene uses the repository's actual
`model-b-eds-optimized-v1.glb` visual shell as the central 3D object.
An eighteen-beat scroll runs through Hero, Blueprint, Front Aero,
Front Wheel, Brakes, Front Suspension, Steering Linkage, Cockpit, Monocoque,
Sidepods, Cooling, Power Unit, Transmission, Floor, Rear Mechanics,
Rear Aero, a local front-corner separation sequence and a final return
to the whole-car hero.

- Cinematic camera is derived deterministically from actual decoded Model B
  scene bounds and the native page's scroll progress. No custom wheel-scroll
  interception, no GLB reloading per chapter, and no invisible substitute body.
- Dark/technical-light transitions, compact source/provenance HUD, 18 chapter
  navigation, keyboard-accessible chapter buttons and reduced-motion-safe
  navigation. A single WebGL canvas persists during the story.
- Optional import of ORIGINAL 59-part P2.8 owner manifest and byte-for-byte
  SHA-matched GLB. The CAD appears **only** if its 59 node identities and
  measured original Model B tyre envelope pass validation.
- P2.8 is placed at the source-measured **front +Z visual wheel center only**.
  CAD root scale stays 1, source meshes and original GLB bytes are unchanged.
- Front-corner chapter parts get visual-only semantic focus. Chapter 16
  temporarily separates the **single loaded P2.8 assembly**; part positions
  are restored to original source pose. Shader material clones are allocated
  only on chapter transitions, not every scrolling frame.
- Missing rear mechanics, cooling, power unit, transmission and other
  source geometry are **labelled missing**, never substituted with boxes,
  cylinders or cloned P2.8 rear corners.

## Testing and evidence

`storyChapters.test.ts` verifies 18 ordered chapters, status gates,
missing source truth, deterministic scroll interpolation and correct
0%/100% endpoints. The environment's actual browser/GPU evidence remains
required; a source test alone cannot certify the new visual result.

## Local usage

```powershell
cd "E:\Formula 1\Podium-Effet-De-Sol"
git switch feat/engineering-inside-machine-v2
git pull origin feat/engineering-inside-machine-v2
npm ci
npm run typecheck
npm run test
npm run dev --workspace=@peds/web -- --host 127.0.0.1 --port 5184
```

Open `http://127.0.0.1:5184/engineering/full-car-story`.

Without any private CAD imports, the Model B outer-shell cinematic is
viewable and every P2.8-specific chapter says its CAD source is missing.
To review real 59-part front corner, import the local
`P28_remate_manifest.json` first and the matching
`P28_integrated_balanced.glb` (HIGH or PERFORMANCE tier also accepted when
their hashes match the manifest). Owner-only files remain local to browser.
The original detailed single-corner inspector remains at
`/engineering/assembly-preview`.

## Mechanical blockers still open

- Need independent authentic per-corner native source B-Reps and 2026-era
  front/rear left/right hardpoints. Do not mirror the front-left CAD and
  claim rear axle proof.
- P2.8 original upright structural retention, steering and bump
  coupled-clearance sampling still HOLD.
- Missing native monocoque inner/outer, gearbox, powertrain, cooling
  internals, all four distinct suspension assemblies, physical fastener
  interfaces and original source-specific wheel removal masks.
- A showroom exterior GLB is not a STEP chassis, and overlay/visual AABB
  does not provide load paths, manufacturer specifications or exact
  mechanical contact proof.
- Real Chromium 18-chapter full traversal, forward/backward scroll capture,
  responsive 390/768/1440/1920, FPS/GPU and source-specific browser QA
  must run before owner visual acceptance.

**Status: major visual integration milestone delivered, not a completed
physical whole-car CAD system and not a production release.**
