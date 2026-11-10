# P2.15 — Model B original visual repair based on 2026-11-10 reviews.zip

Branch: \`work/engineering-four-corners-local\`. Development-only route
\`/engineering/model-b-build\`. No GitHub Actions, merge, PR or deploy.
Mechanical G2 remains **HOLD**.

## Evidence and defects taken directly from the supplied 256 MB review

The review included actual original Model B Chromium H.264/MP4, source CAD
manifests, full-resolution 1440×900 and 1920×1080 6-chapter captures, and
390×844 mobile final screenshots. User-facing visual defects were:

- The completed exterior looked like **pale floating P2.8 CAD wheels over
  barely visible original Model B**, with dark remaining original tyres.
- At chapter 02, the original shell was deliberately faded to just **13%
  opacity** and parts traveled too far, presenting detached wheel masses
  rather than observable component insertion.
- At 390×844, the final mobile image had virtually no central vehicle
  silhouette; the two visible white wheel masses were near screen edges.
- \`lint-final2.log\` actually reported 8 errors + 1 warning although a
  separate summary called lint PASS. The source of truth is the command
  exit status from the exact reviewed commit, never the summary alone.

## Source-code fixes committed

### 1. Source viewer material fidelity — no substitute geometry

\`cadPreviewMaterials.ts\` explicitly applies PBR appearance to cloned
viewer-only source meshes. Tyres are dark nonmetallic rubber, rims are
graphite/aluminium, carbon brakes are charcoal, and hardware is titanium
metallic. Original P2.8 GLB object identity, authored mesh positions,
original normals, UVs, buffers and material files remain unchanged.
Tests reject ghost-white tyres and verify source material clones are
non-destructive.

### 2. No doubled original tyres; do not punch four holes prematurely

\`showroomWheelMask.ts\` keeps the original Model B tyres visible until
their SHA-verified source P2.8 replacements are being assembled. During
tyre entry it dither-displaces corresponding original showroom tyre
pixels around all four separately measured wheel centres. The wider
source-verified lateral wheel envelope removes leftover dark original
tyre silhouettes after the actual CAD tyre is fully installed.
Progress is held in one shared Three.js shader uniform; no editing of
original Model B geometry or GLB file.

### 3. Deliberate source-CAD assembly, actual fastener macro

\`modelBAssemblyTimeline.ts\` now retains at least 78% original chassis
opacity during the build and controls architectural shell separation
to 18% of the old factor. Native part entry is ordered
upright/links → bearings → hub → carbon rotor → fastening/caliper →
rim → tyre. Part approach offsets are greatly reduced and authored
source coordinates are restored exactly after assembly. Unassembled
mesh previews are **invisible**, not permanently 5.5%-opaque ghosts.

\`ModelBAssemblyStage.tsx\` adds camera macro moments by following real
source P2.8 fastener and P2.14 spherical-joint mesh centres. These
are non-mechanical showroom animations, **not** certified mating
paths, fastening torque or suspension movement.

### 4. Actual Model B source bounds determine both desktop/mobile final shot

\`modelBFraming.ts\` computes the required camera distance from all eight
corners of the actual decoded original owner's GLB bounds, calibration
scale, viewport aspect and camera FOV, rather than a guessed 1.45× mobile
multiplier. It is now used in the fully assembled/four-wheel camera
states. \`modelBAssembly.css\` gives portrait view the entire WebGL
canvas height, reserves text at the top, reduces giant overlay headings,
and keeps original F1 vehicle inside the screen.

A quick independent numerical perspective sanity check on the published
Model B source dimensions confirms all eight extrema within frame at
390×844, 375×812, 768×1024, 1440×900 and 1920×1080. This is an
**algorithmic check**, not a captured post-change Chromium screenshot.

### 5. No fake QA status on empty mobile screenshots

\`verify_model_b_final_visibility.py\` adds a foreground occupancy gate
over the central area of the **actual Chromium canvas-only screenshot**.
It fails if only isolated tyre masses occupy extreme lateral edges.
The local Chromium recorder now waits for the source-bounds-fit DOM gate,
captures both 390×844 and 1440×900 settled final canvases, runs this
pixel check, stores SHA and image metrics and refuses final MP4 PASS
without source-based framing and actual visible central source pixels.
\`record_original_model_b_only_local.py\` also checks the portrait
source-only bounds fit. The combined runner gates both.

Using the attached review image \`full-mobile-final.png\` as a
regression, center foreground counts were [14, 7, 5] in the three
central bands, **FAIL**, as desired. Independent synthetic pixel
fixture controls PASS/FAIL correctly. This demonstrates the old
mobile issue is detected rather than silently accepted.

## P2.15.1 — real cause of the reported mobile intro screenshot

The attached \`full-mobile-middle.png\` was not a CAD scene at all. It was the
global \`F1StartLightsPreloader\` splash displaying the large PODIUM wordmark
and Bỏ qua / Skip control. This overlay was mounted by
\`DocumentIntroController\`, not by the Model B 3D route.

\`documentIntroState.ts\` now bypasses the global document intro **only**
when the exact pathname is \`/engineering/model-b-build\` or
\`/engineering/assembly-preview\`. Home/showroom onboarding remains
unchanged. Its new Vitest regression checks exact route matching.

Both local Chromium recorders refuse browser evidence if the global
\`F1 Start Lights Preloader\` dialog still covers the actual car scene.
The source-only recorder also waits for final mobile geometry framing.

**Note:** No new post-patch Chromium browser session ran in this assistant
container. The old ZIP footage is not a validation of this code.

## Lint and local review limitations

The supplied \`lint-final2.log\` named React-Hooks immutability warnings
for mutations of Three.js-owned scene/camera objects, a redundant
\`cadFocus.ts\` try/catch, an overwritten \`orbit\` value, and an unused
eslint-disable directive. These were corrected or explicitly scoped
to the R3F imperative renderer. They **have not yet passed a complete
ESLint run** from a fresh checkout and must not be labeled PASS solely
from source changes.

The current assistant runtime does not have the complete repository
checkout, the exact private P2.8 binary or the original Model B GLB
to execute post-change Vite/Chromium screenshots. The original user
provided pre-fix videos remain real but are **not** proof of this patch.
No new post-fix Chromium MP4 has been produced here.

## Exact local re-review command on an authenticated checkout

\`\`\`bash
python tools/cad-first/run_four_corners_local.py \
  --p28-dir .local-assets/cad-first/p28-owner-remate \
  --out .local-assets/reviews/model-b-p215-final \
  --quality BALANCED --allow-rebuild
\`\`\`

That command regenerates/validates true CAD source, runs TypeScript,
Vitest and original source QA, starts Vite DEV, records original owner
showroom video, full four-corner browser review, mobile final visibility
and full scroll video. It uses **no GitHub Actions**. The script's
generated quality report and MP4 files must be reviewed before
claiming real visual PASS.

**MECHANICAL G2 HOLD. REAR WHEEL-END P2.8 PROXY ONLY. PRODUCTION UNCHANGED.**
