# P5-R0/R1 — Local assets and Drivers/Teams directory redesign

**Branch:** feat/homepage-racing-motion-v1

## Findings

The 2026 source declares 22 main drivers and 11 constructors, but the source manifests are **not proof that the physical image files exist**. The owner keeps images locally, with the P5 public directory intentionally gitignored. The previous Drivers directory alternated between a landscape poster card and a portrait card, producing inconsistent layouts. Concept portraits also lacked an onError handler.

## Changes

- P5Portrait: local 2026 headshot -> licensed portrait -> typographic number fallback. Each failed source is tried once; switching driver or season resets that source's status.
- P5ExtraArtwork: source-specific onError fallback for owner-local poster and hero images.
- P5LocalImage: fallback for optional concept car artwork, no broken image icons.
- P5DirectorySurfaces: one Driver Grid card anatomy for 2024–2026 (media/rank/number/name/team/points/route). Team Garage uses separate content and artwork panels, real season lineup, team power unit and points. Visual priority: owner team poster, concept car, driver portraits/typography.
- p5DirectoryV2.css: 4 desktop driver columns, 5 on wide screens, 2 on mobile; 2 Teams columns on desktop, 1 on mobile. No CSS zoom or new WebGL.
- Manifest and markup tests.
- A local-only audit/installer that does not upload assets, overwrite files or alter the original local sources.

## Check local images on Windows

Run from the **existing project root** in PowerShell:

    Set-Location 'E:\Formula 1\Podium-Effet-De-Sol'
    node tools/p5-audit-local-assets.mjs

The report appears at .local-assets/p5-r0/asset-audit.json, which is ignored by Git. It lists driver IDs, source and destination paths, checksums and specific missing files for 22 posters, 22 headshots, 11 team posters, plus optional art.

For **safe local preview installation only**, if the manifest's source files exist:

    node tools/p5-audit-local-assets.mjs --install
    node tools/p5-audit-local-assets.mjs

Only files that match the manifest SHA-256 and size are copied to absent destinations under apps/web/public. Existing files are never overwritten, source files never modified, and no files are uploaded to GitHub. A checksum mismatch is reported; fix it manually after comparing the actual local files.

These public folders are ignored from Git and are therefore visible in your **local Vite environment only**, not production. Concept car images are from a different package and are only reported, not silently installed by this tool.

## When the original local repository has unresolved Git conflicts

Do NOT pull, reset, or clean the original folder to audit the photos. Clone the branch into a separate preview and point the audit script at the original image directory:

    Set-Location 'E:\Formula 1'
    git clone --branch feat/homepage-racing-motion-v1 --single-branch 'https://github.com/DB-Ducbao113/Podium-Effet-De-Sol.git' 'Podium-EDS-P5-Preview'
    Set-Location 'E:\Formula 1\Podium-EDS-P5-Preview'
    npm ci

    node tools/p5-audit-local-assets.mjs --source-root 'E:\Formula 1\Podium-Effet-De-Sol'
    node tools/p5-audit-local-assets.mjs --install --source-root 'E:\Formula 1\Podium-Effet-De-Sol'
    npm run dev

The original directory is read-only for this operation. Verified images are copied into the preview directory only. Open /drivers and /teams at the localhost port displayed by Vite. The audit JSON is written under the preview's ignored .local-assets/p5-r0 directory.

## Do not guess the missing driver

Check the 2026 drivers/headshots entries in the local report. A missing image cannot be identified conclusively from GitHub alone. Do not insert reserve or test drivers into the ranked 22-driver standings.

## Remaining sign-off

Visual screenshot review at 360/390/768/1024/1440/1920, both languages, 2024–2026, image errors/fallbacks, keyboard focus, and no overflow. Run lint, typecheck, unit tests and build. Keep PR Draft until local art and layout are approved.
