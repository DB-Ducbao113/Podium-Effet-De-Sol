# Model B scroll: original CAD inspector and rear 31-source proof

Branch: work/engineering-four-corners-local. Mechanical G2 HOLD. No Actions, PR, merge or production deploy.

## Source-verified component inspection

The DEV route /engineering/model-b-build now supports selecting original GLTF meshes through Three.js raycasting. The click inspector displays the exact CAD part name, source category, four-station Model B wheel location and a truthful G2 HOLD status. P2.8 front-wheel-end meshes drawn at rear stations are explicitly identified as FRONT-SOURCE REAR VISUAL PROXIES, never genuine rear chassis suspension. P2.12 and P2.14 are labeled project-authored unapproved proposals. Clicking an unknown mesh fails rather than fabricating an ID.

Source code: apps/web/src/dev/modelBAssembly/cadPartInspector.ts and corresponding Vitest source-identity tests. TypeScript/Vitest of the full repository and actual Chromium raycasting have not yet been run in the connector editing session.

## Unified authentic 31-mesh rear source GLB

tools/cad-first/compose_rear31_visual.py combines SHA-verified real P2.12 v3 source and P2.14 split-bearing source exactly as 19 original pieces MINUS 4 superseded annular bearing proxies PLUS 16 project-authored P2.14 pieces = 31 distinct named meshes. It rejects incorrect source hashes, incorrect part names, missing old bearings and false mechanical G2 approval, then re-imports the combined watertight GLB. The local runner now generates this file after native P2.12/P2.14 geometry checks. The Python test uses clearly synthetic fixture meshes only to verify error handling and never supplies fake CAD to the actual website.

Run locally on the real source export directories:

    python tools/cad-first/compose_rear31_visual.py --p212-dir .local-assets/cad-first/p212-threaded-v3-source --p214-dir .local-assets/cad-first/p214-split-race-cad-source --out .local-assets/cad-first/rear31-original-source-composite --quality BALANCED

## Local native visual review actually completed

The separately delivered original-source VTK review used SHA-verified P2.12 and P2.14 BALANCED GLBs from the prior project CAD export snapshots. It produced a real 31-mesh watertight GLB (39,122 triangles; 677,692 bytes), H.264 animation (5 seconds, 120 frames, 24 fps, 960x540) and five native image frame captures. Video SHA-256: 644250a83ee396c3ee1a2abfa61f241ef784632ee84282873ba09c2b3a5858c3. Four source-composition negative-control fixture cases passed locally. These visual offsets do not simulate constrained suspension kinematics.

The VTK video is a REAR SUSPENSION SOURCE-ONLY preview; it does NOT show the actual full Model B body, does NOT establish a real Chromium/Anime.js browser recording, and does NOT certify bearing retention, dynamic 31-body collision, real chassis hardpoints or physical mechanical fitting. The source snapshot upstream SHA values differ from certain current repository scripts, so current-branch original CAD must be regenerated for strict browser proof.

## Remaining milestone

Real DEV Vite/Chromium test of /engineering/model-b-build with the authentic Model B showroom GLB and actual P2.8 59-mesh CAD, six scroll chapters, all four wheel centres and video MP4. Production remains untouched and Mechanical G2 HOLD.