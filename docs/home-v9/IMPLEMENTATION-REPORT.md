# V9 Living Machine — Implementation Report

**Status:** Prototype source committed. **Visual approval, real-device FPS and CI still need confirmation.**
**Branch:** `feat/homepage-racing-motion-v1`, separate from concurrently edited V8 branch.
**Homepage PR:** https://github.com/DB-Ducbao113/Podium-Effet-De-Sol/pull/1

V9 was prototyped separately, then moved onto the owner's specified Homepage feature branch. The former PR #3 is superseded.

## Available developer previews

- `/__home-v9-lab` — choose and interact with three separate materials.
- `/?v9=1` — one 3D world behind the entire Home and the shared Footer.
- `/` — unchanged V8 Homepage for A/B comparison.

## Implemented

1. **Pressure Membrane:** two deformable shader surfaces, pointer-local disturbances, normals and chapter morphs.
2. **Velocity Field:** 12–30 curved 3D tubes distributed in depth, shader motion and pointer deflection.
3. **Carbon Architecture:** 8–16 beveled aerofoil extrusions using one instanced draw call.
4. **Scene Director:** six DOM-measured anchors, including `peds-credits` outside the Home component; camera path and continuous interpolation.
5. **Quality gates:** WebGL2 probe, reduced-motion/Data Saver/mobile/low RAM static fallback, frame-time degradation, paused hidden tabs and context loss.
6. **Content:** a new preview-only Front Wing / Underfloor / Diffuser explainer, asymmetric Explore gateways, F1 image retained, duplicate V8 lines hidden in V9.
7. **Tests:** pure chapter mathematics, integration contracts, local Playwright screenshots and overflow checking.

## Not yet complete

- Track-specific circuit geometry in Race Control (the current curve is labelled as an abstract signal).
- Approved driver/team portrait slots and real team-color reactions in Title Fight.
- Final art-directed six-scene camera transitions and actual cross-device benchmark.
- Production V8-to-V9 migration. Preview remains DEV only.
- Approved `peds-aero01-car.webp` is still a local owner asset, not committed remotely.

## Safe Windows preview (separate clone, preserving the original conflicted repository)

In PowerShell:

```powershell
Set-Location 'E:\Formula 1'

git clone --branch feat/homepage-racing-motion-v1 --single-branch 'https://github.com/DB-Ducbao113/Podium-Effet-De-Sol.git' 'Podium-EDS-V9-Preview'

Set-Location 'E:\Formula 1\Podium-EDS-V9-Preview'

$src = 'E:\Formula 1\Podium-Effet-De-Sol\apps\web\public\media\homepage\f1-hero\peds-aero01-car.webp'
$dest = 'apps\web\public\media\homepage\f1-hero\peds-aero01-car.webp'
if (Test-Path $src) { Copy-Item $src $dest -Force }

npm ci
npm run dev
```

Open the Vite host/port displayed in PowerShell, usually `http://localhost:5173`. For visual acceptance, in a second PowerShell terminal run:

```powershell
Set-Location 'E:\Formula 1\Podium-EDS-V9-Preview'
$env:CHROME_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$env:V9_URL = 'http://localhost:5173'
node tools/home-v9-visual-qa.mjs
```

Review `.local-assets/home-v9/qa/report.json` and the screenshots. Screenshots and browser behavior must be reviewed at 360/390/768/1024/1440/1920px. The script cannot certify artwork quality or realistic device FPS.

## Release gates

Keep PR Draft until art direction, approved image, browser captures, keyboard/reduced-motion, weak-device profiling, all tests and CI have passed. Do not modify Showroom Model B or Championship state to accommodate the cinematic background.
