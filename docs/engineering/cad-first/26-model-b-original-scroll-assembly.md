# Model B — original-source scroll assembly experience (DEV)

Repository: \`DB-Ducbao113/Podium-Effet-De-Sol\`  
Branch: \`work/engineering-four-corners-local\`  
DEV route: **\`/engineering/model-b-build\`**. No production route, no deploy or GitHub Actions.

## Why this exists

The engineering work P2.8–P2.14 previously focused on producing real project-authored
CAD B-Rep parts, native STEP and three GLB LODs, while the requested
**Anime.js-style scroll-driven actual Model B assembly website** remained absent.

This feature adds an actual interactive Three.js/React Three Fiber viewport
to the original repository that:

1. **Auto-loads the owner's real, already versioned showroom Model B**
   \`apps/web/public/models/model-b-eds-optimized-v1.glb\`, not a generated
   replacement car, no stock/F1 substitute, no assistant-rendered placeholder.
2. Provides **six reversible chapters** controlled by physical browser scroll,
   with Anime.js v4 animating chapter typography and Three.js rendering the
   moving geometry and camera on each frame.
3. Locally accepts original **P2.8 59-mesh front wheel CAD** only after verifying
   the P2.8 native manifest, exact part identities, GLB byte size and SHA-256.
   Existing \`probeOriginalGeometry\`, \`fitOwnerShellToOriginalP28\`, and
   \`layoutFourCorners\` compute all **four separate original Model B wheel
   envelope centres** from decoded source geometry; no assumed left-right
   symmetry, zero mirrored threads. A proper Y=180° rotation preserves handedness.
4. Animates **every named original CAD mesh independently** by a systematic
   sequence (upright and suspension, bearings, hub, carbon brakes, rim/tyre,
   individual original fasteners). Offsets are **art-directed visual separation**,
   not STEP manufacturing assembly paths.
5. Optionally imports original **P2.12 threaded-v3 19-mesh source** and
   **P2.14 16-mesh split spherical joint source** (with manifest-to-GLB SHA-256).
   When P2.14 is present the four prior annular bearing proxy meshes inside
   P2.12 are suppressed. Two rear independently measured station placements
   are shown. No additional fabricated rear suspension or structural pickup
   coordinates are inserted.
6. Returns to the original Model B complete exterior at the last scroll
   chapter. Source showroom wheel-envelope window masking is **reversible shader
   logic**, leaving the original Model B bytes and geometry untouched.

## Animation timeline

| Browser scroll | Chapter | Verified 3D effect |
|---|---|---|
| 0–15% | THE MACHINE. | Original owner Model B full vehicle exterior |
| 15–30% | EVERY LAYER. | Source shell illustration/explosion; only when CAD is loaded |
| 30–50% | BUILT FROM THE CORE. | Original 59 source wheel meshes assemble hub/brake/structure |
| 50–69% | FOUR CORNERS. | Four measured wheel-station wheel ends and slicks |
| 69–85% | THE DETAILS LOCK IN. | P2.12 rear adjuster and P2.14 split races, if source loaded |
| 85–100% | MODEL B. REASSEMBLED. | Original exterior restored, source CAD visible if imported |

Scroll forward **and backward** are deterministic and continuous. Buttons
navigate among the same scroll-chapter boundaries. The camera is in actual
scene metres, moves between the whole car and source-registered original wheel
stations, and supports reduced-motion preferences.

When **no P2.8 file is loaded**, Model B **remains visible and complete**;
the scene does **not** fade to an empty car and does not draw made-up screws
to simulate assembly. The import drawer explicitly reports missing CAD.

## Files implemented on the work branch

- \`apps/web/src/dev/modelBAssembly/modelBAssemblyTimeline.ts\` — six-chapter
  deterministic timeline, non-destructive source part staging, classification,
  stable per-mesh animation offsets and geometry truth flags.
- \`modelBAssemblyTimeline.test.ts\` — reversible chapter, shell visibility,
  component order, source chirality and invalid timeline regression.
- \`ModelBAssemblyStage.tsx\` — original Model B GLTFLoader, original P2.8 source
  calibration, source GLB count checks, three CAD subassembly imports, four
  source-derived wheel placements, shader mask and cinematic camera choreography.
- \`ModelBAssemblyPage.tsx\` — Anime.js v4 headings, progress, six scene titles,
  chapter navigation, measured-asset status and source integrity drawer.
- \`modelBAssembly.css\` — responsive dark editorial technical design.
- \`apps/web/src/App.tsx\` — **DEV-only** route.
- Links added from the original P2 CAD lab and existing assembly preview.
- \`tools/cad-first/record_model_b_scroll_local.py\` — local actual Chromium
  browser screenshots and **real browser MP4** encoder with FFmpeg. Six actual
  WebGL canvas captures must visibly differ; every required original source
  mesh must parse. The script refuses to encode a partial/failed run.
- \`tools/cad-first/run_four_corners_local.py\` — invokes the new route browser
  recording **after** the existing full native CAD and four-corner review
  gates; records the resultant scroll MP4's SHA-256 and source lineage.
- None of these scripts uses GitHub Actions.

## Automatic DEV CAD source (no repeated manual imports)

The original Model B source is always loaded directly from the repository.
The **existing local CAD review runner** now also invokes
`tools/cad-first/stage_model_b_scroll_assets.py` after generating P2.8,
P2.12 and P2.14. This strictly verifies each source manifest/GLB SHA-256 and
copies only those originals into the **Git-ignored**
`.local-assets/model-b-scroll-preview` folder. P2.14 additionally requires
the real currently checked-out P2.14 generator and six upstream CAD hashes.

The serve-only `apps/web/plugins/modelBLocalCadPlugin.ts` exposes just seven
fixed, read-only paths beneath `/__peds-model-b-cad/`, rejects requests
from non-loopback clients, supports no arbitrary filesystem paths and is
absent from production builds. No private P2.8/P2.12/P2.14 binary is
committed to GitHub or placed inside `apps/web/public`/production `dist`.

On opening the scroll route, `ModelBAssemblyPage` reads the local source
index and **automatically** verifies and loads the original 59/19/16 named
CAD meshes in sequence. If no local bundle exists, the optional manual
SHA-verified CAD SOURCE importer remains accessible. An invalid staged
bundle is rejected rather than silently replaced by fake parts.
`localSourceIndex.ts` and its Vitest tests reject incorrect counts,
unexpected source names/URLs, missing P2.12 with P2.14, and any claim of
mechanical G2 approval.

Local original staging, if running Vite without the combined script:

```powershell
python tools/cad-first/stage_model_b_scroll_assets.py --p28-dir ".local-assets/cad-first/p28-owner-remate" --p212-dir ".local-assets/cad-first/p212-threaded-v3-source" --p214-dir ".local-assets/cad-first/p214-split-race-cad-source" --quality BALANCED
```

**These are local review export paths, not precommitted CAD binaries.** The
full combined native review runner already knows the real resolved source
folders and stages them automatically.

## Local owner browser testing

From a repository checkout with npm and Python/Playwright/FFmpeg installed:

\`\`\`powershell
cd apps/web
npm run typecheck
npm run test -- src/dev/modelBAssembly/modelBAssemblyTimeline.test.ts
npm run dev -- --host 127.0.0.1 --port 5184
\`\`\`

Open <http://127.0.0.1:5184/engineering/model-b-build>.

The user's original Model B loads without an uploaded file. Import the
original native P2.8 manifest \`P28_remate_manifest.json\` plus its matching
HIGH/BALANCED/PERFORMANCE GLB through **CAD SOURCE**. The optional source
P2.12/P2.14 imports require the prior source to be loaded.

For local real-browser MP4 from that Vite server:

\`\`\`powershell
python tools/cad-first/record_model_b_scroll_local.py --p28-dir ".local-assets/cad-first/p28-owner-remate" --p212-dir ".local-assets/cad-first/p212-threaded-v3-source" --p214-dir ".local-assets/cad-first/p214-split-race-cad-source" --quality BALANCED --out ".local-assets/model-b-real-scroll-video" --require-auto-source
\`\`\`

Those directories are representative local owner CAD export folders, **not
committed binary assets**. Paths must point to actual current-branch source
exports. The existing \`run_four_corners_local.py\` can build the source
when permitted with \`--allow-rebuild\`; it now runs the scroll recorder after
original source and geometry gates. The scroll recorder requires an already
running local Vite DEV server (the combined runner starts it itself).

### Required evidence for a full "browser MP4 PASS" claim

The recorder requires all of the following before it can report completion:

- Original Model B source requested and **HTTP 200**, parsed into the real WebGL scene.
- With `--require-auto-source`, the 59/19/16 CAD meshes must decode **without
  clicking any upload input**; the local endpoint bundle must be the only source.
- Original source P2.8 contains 59 mesh IDs, plus P2.12 19 and P2.14 16 when
  their optional sources are included, and the corresponding UI decoded-mesh
  status is displayed after real GLTF parsing.
- All **six** scroll titles occur in the actual browser, with distinct
  full-viewport screenshots.
- At least **four different actual WebGL canvas screenshots** across six
  chapters, independent of the changing HTML text.
- 96 real Chromium screen frames at 1440×900 (default), assembled by FFmpeg
  into \`model-b-real-browser-scroll.mp4\` and SHA-256 saved to JSON.
- No browser JavaScript exceptions or WebGL shader errors.
- Explicit mechanical gate **G2 HOLD**; no false genuine rear mechanical
  mating claim.

## What has NOT been verified in the GitHub connector edit session

**The full application TypeScript/Vitest/Vite build, rendering in local Chromium
and browser MP4 execution have not yet run** after the changes in this
conversation. Adding a real recorder is not the same as recording actual
browser output. Do not label the MP4 "delivered" unless the local runner
writes the file and passes every gate.

This remains a **visual-source assembly** project. True source-derived rear
suspension structural hardpoints, spherical bearing axial stop, real chassis
coupled kinematics and all native 31-body collision/strength/load tests remain
unverified. Existing P2.8 also does **not** become real rear upright geometry
just by proper visual placement.

**Mechanical G2 HOLD. Production unchanged. No GitHub Actions/PR/merge/deploy.**
