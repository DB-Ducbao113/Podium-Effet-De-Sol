# Model B — exact source GLB Git-object verification before animation

Branch: `work/engineering-four-corners-local`. Route `/engineering/model-b-build` remains DEV-only. Mechanical G2 HOLD. No GitHub Actions, merge, PR or deployment.

## Original file is present in repository

`apps/web/public/models/model-b-eds-optimized-v1.glb` was checked using GitHub's live repository file metadata on the work branch. It is 2,120,816 bytes, Git blob object SHA-1 `74fbd44daf709d0d368adef9de66e4e22a49fed4`. The connector cannot transfer this >2MB private binary into the assistant container: GitHub text fetch cannot decode binary, and repository contents API omits base64 for files >1MB. The original GLB exists **in the actual repository checkout**, not in the assistant's local container.

## Implemented fail-closed verification

- `originalModelBSource.ts`: hashes the exact GLB bytes as a Git blob (`SHA-1('blob '+length+'\\0'+data)`) using secure browser Web Crypto, checks 2,120,816 exact bytes and the checked-in original Git object ID, rejects missing Web Crypto or modified GLB.
- `ModelBAssemblyStage.tsx`: uses `fetch(..., {cache:'no-store', signal: AbortController})`, verifies the original Git object before calling Three.js/GLTFLoader.parseAsync, then applies the existing decoded scene geometry bounds and four-wheel P2.8 fit checks. A similar-looking substitute GLB is never loaded as the owner's Model B. Dispose/abort avoids previous stale fetch and source duplication.
- `ModelBAssemblyPage.tsx`: makes the verified source ID visible to local automated browser QA **only after** the actual original GLB has been SHA validated and decoded.
- `verify_original_model_b_asset.py`: local checkout preflight verifies exact file length and Git blob SHA, glTF 2.0 header, JSON scene nodes/meshes; emits a JSON source report that explicitly does not claim WebGL parsing or mechanical mating.
- `test_verify_original_model_b_asset.py`: negative-control synthetic fixture tests prove Git blob calculation, same-size tamper rejection, malformed GLB refusal and source G2 HOLD.
- `run_four_corners_local.py`: requires exact original file preflight PASS, four Python preflight tests, strict web source test, then full Vite/Chromium scroll MP4 flow; a fake or changed owner Model B binary prevents browser recording.
- `record_model_b_scroll_local.py`: requires the exact Git hash attached to the decoded source state in Chromium and records this as explicit evidence before permitting final video.

## Actually executed independent checks

On the exact Python source and test files retrieved from the updated GitHub branch and copied locally with identical length and FNV checksum, **4/4 Python tests PASS**. This is real executed code: synthetic test GLB inputs are intentionally **not** owner CAD and do not prove the actual vehicle file was loaded.

On the exact TypeScript `originalModelBSource.ts` file retrieved from GitHub (length/FNV matched), `tsc --strict --noEmit` PASS and `tsc` JS output run under Node 22 Web Crypto **5/5 checks PASS** including the independently calculated Python/Git reference hash `95d09f2b...` for `hello world`. This proves the SHA algorithm and rejection behavior, but not React/Three/Vite behavior.

## Remaining gate

Run full repository npm install/typecheck/Vitest/Vite on an actual checkout containing `apps/web/public/models/model-b-eds-optimized-v1.glb` and original P2.8 59-mesh binary, then execute Chromium QA and record **full** Model B six-chapter MP4. These were **not run** in this environment. Existing VTK rear 31-mesh preview is source-only and must not be relabeled as the full-car website video.

**Mechanical G2 HOLD. Production unchanged.**