# P2.34AJ — Search unreachable/dangling Git source blobs (G2 HOLD)

Date: 2026-11-12. Branch: `work/engineering-four-corners-local`.

## Actual gap

The P2.34AF Git history inventory uses `git rev-list --objects --all`, which enumerates objects reachable from local refs. Owner original P2.34E STEP/index/audit might have been present as loose Git blobs subsequently removed from all refs (for example after history rewriting), but remain in the local object database until Git garbage collection. Their byte contents cannot be regenerated from SHA-256.

P2.34AJ adds `tools/cad-first/p2_34aj_unreachable_git_source.py`. It calls `git fsck --full --no-reflogs --unreachable --no-progress` on a local Git clone. Only reported *unreachable/dangling blob* IDs are inspected. Candidate original source bytes must independently match the three immutable P2.34E SHA-256 hashes; LFS pointers are recorded separately and **never** counted as real CAD STEP/index/audit bytes. It never runs `git gc` and does not edit Git refs or the working tree. Only locally present objects are considered; pruned objects and unfetched remotes cannot be found.

When all three exact blob hashes are found, optional `--stage-dir` passes the discovered IDs to the already-existing P2.34AG restorer, which independently re-fetches the Git blobs, checks their actual content SHA-256 and writes a *new* staging directory. Otherwise this patch only writes the JSON inventory report and returns exit code 2.

## Run locally

```bash
cd tools/cad-first
python -m unittest -v test_p2_34aj_unreachable_git_source.py
python p2_34aj_unreachable_git_source.py \
  --repo /absolute/path/to/local/Podium-Effet-De-Sol \
  --out /new/P234AJ_dangling_inventory.json \
  --stage-dir /new/P234E_verified_native
```

## Testing and limitations

**12/12 unit tests PASS locally** in real temporary Git repositories containing invented source bytes. Cases include exact dangling blob matching, reachable-only negative control, LFS pointer-only negative control, object and byte limits, preserving Git working-tree state, and an AJ-to-AG adapter test using an explicitly mocked AG function. Thus the test suite does **not** independently exercise full real-owner source restoration or a genuine native STEP geometry import. GitHub files are separately verified after push.

The project's actual original P2.34E 84-solid STEP, source name-index and native ball-contact audit are still unavailable in this execution environment, so there is **no original-native mechanical pass**. Nothing is merged, deployed or installed into Model B.

**P2.34/54 IN PROGRESS. Mechanical G2 HOLD.**
