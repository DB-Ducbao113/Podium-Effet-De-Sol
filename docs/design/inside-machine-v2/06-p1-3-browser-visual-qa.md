# P1.3 — Cinematic visual QA infrastructure and first real-source review

**Repo:** `DB-Ducbao113/Podium-Effet-De-Sol`  
**Branch:** `feat/engineering-inside-machine-v2`  
**PR:** #4 (Draft)  
**Release:** HOLD; do not merge or deploy.

## Completed micro-gates

| Gate | Deliverable | Current status |
|---|---|---|
| P1.3.1 | Pale Blueprint UI contrast corrected: dark labels/technical HUD on light CAD | Implemented; automated static contract PASS |
| P1.3.2 | Animated key/fill/rim light changes, reversible as story progress changes | Implemented; visual rating not yet approved |
| P1.3.3 | DEV-only read-only evidence bridge for 7 actual scene transforms, camera, projected bounds, real render counters | Implemented |
| P1.3.4 | Playwright capture harness: 375, 768, 1440, 1920; eight cinematic timestamps, recorded video, JSON diffs | Implemented; execution with private local assets OPEN |
| P1.3.5 | Strong numeric acceptance: nut must move -0.84m, wheel -0.66m along glTF Z, other 5 parts remain fixed in 2-part mode | Implemented, pending local WebGL run |
| P1.3.6 | SHA-256 identity check for exact R4.5 compressed GLB and manifest before decode | Implemented, no fallback to an unrelated car |
| P1.3.7 | Existing Engineering REV4.2, Showroom, Championship and backend isolation | Retained; GitHub CI regression required |

## Run actual browser QA (assets must be present locally)

From the `feat/engineering-inside-machine-v2` checkout:

```powershell
npm ci
npm run dev -- --host 127.0.0.1 --port 5184
```

In a **separate terminal**:

```powershell
$env:P1_ORIGIN = "http://127.0.0.1:5184"
$env:P1_QA_OUT = "E:\Formula 1\Podium-Effet-De-Sol\scratch\engineering\p1-3-browser-evidence"
$env:P1_PROFILES = "HIGH,BALANCED,PERFORMANCE"
$env:P1_CHROME = "C:\Program Files\Google\Chrome\Application\chrome.exe"
npm run qa:itm-p1 --workspace=@peds/web
```

The QA script **fails rather than passes** if verified binary resources are missing, source hash is incorrect, WebGL cannot load, no real model renders or an expected source transform does not move. The output is always private/local, not copied into production assets.

### Expected artifacts

- `P1_3_BROWSER_QA.json` — functional acceptance results and failure details.
- `balanced-375x812/`, `balanced-768x1024/`, `balanced-1440x900/`, `balanced-1920x1080/` (and corresponding HIGH/PERFORMANCE folders).
- Per-viewport screenshots: `hero.png`, `unlock.png`, `nut-extracted.png`, `wheel-extracted.png`, `blueprint.png`, `macro.png`, `reassembly.png`, `fully-assembled.png`, and `full-seven-part-explode.png`.
- `video/` containing the viewport recording. The BALANCED 1440px case additionally runs **one uninterrupted 24-second PLAY CINEMATIC** walkthrough, measures wall-clock duration, and compares the final seven real transforms against the original pose. Seek-by-seek screenshots are not accepted as motion evidence.

### What gets checked numerically

1. Seven source nodes are actually accessible to a live Three.js renderer; 7 transform arrays are finite.
2. Real camera and source mesh viewport projection are reported; horizontal overflow rejected.
3. P1.2 two-part scope: center lock and outer wheel move, the other five remain fixed.
4. Actual glTF axial displacement: at 40%, nut `-0.84m` and wheel `0m`; at 54%, nut `-0.84m`, wheel `-0.66m`.
5. 0% = 100% and seek 54% → 40% → 0% gives original position, quaternion, scale and world position within 1e-5.
6. Blueprint held state has dark readable title; the actual technical edges are photographed, not asserted visually passed.
7. HIGH/BALANCED/PERFORMANCE and four viewports are independent runs, not one image resized four times.

### Source-only offline review (available, NOT WebGL acceptance)

Separately from live browser automation, the owner-provided raw R4.5 BALANCED GLB has been imported through VTK and its *real* wheel/nut mesh actors translated to examine mechanical visibility:
- Assembled baseline.
- Center-lock moved outward 0.84m.
- Center lock 0.84m outward + outer wheel 0.66m outward.

The resulting 3-frame comparison and closer macro crops are **offline diagnostic renders**. They verify source asset identity and directionality but cannot prove CSS composition, real WebGL lighting, React runtime camera continuity, mobile labels, true GPU cost or authentic mechanical fitment. They show dark body materials and tiny nut detail still require visual lookdev improvement.

## Cinematic review remains a hard gate

A PASS in GitHub CI or a passing Playwright structural report must **not** be relabelled as owner visual acceptance. Review required:

- Hero: silhouette immediately visible; no entire axle and caliper merging into one dark surface.
- Lock: central nut can be followed visually through release, separation and return.
- Wheel: source tyre/wheel geometry stays intact, no framewise clipping or double rendering.
- Blueprint: clean feature-edge outlines, not 140k-triangle wireframe.
- Macro: brake-disc/caliper/hub clearly distinguishable; no fabricated drilled-hole or shaft-fitment claim.
- Camera: continuous path without jumping, no orbit/story control competition.
- Mobile: active part and title remain legible without scrollbar or obstruction.
- Reassembly: complete roundtrip at both endpoints, no residual pose or memory leaks.
- Visual owner score at least **4/5 per cinematic dimension** as specified in `02-animejs-cinematic-acceptance.md`.

**What is NOT verified in this session:** an actual Chrome WebGL playback against the owner's local optimized Meshopt GLBs, GPU frame timings and visual scores. Browser execution requires the local working checkout and asset namespace; the hosted GitHub connector can commit and run CI, but does not expose the user's private local asset server.

**Decision:** P1.3 code/infrastructure is complete; cinematic **VISUAL QA HOLD**. Next is a captured browser review and iterative camera/material adjustment. No other wheel is released for scaling yet.
