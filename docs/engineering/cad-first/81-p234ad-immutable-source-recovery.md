# P2.34AD/54 — Find the authentic P2.34E source by SHA-256, then stage an immutable input

Date: 2026-11-12. Branch: `work/engineering-four-corners-local`.

## Result

P2.34AD implements a **local filesystem recovery utility** rather than another CV geometric test. Previous analysis of the branch's 1,188-entry GitHub commit tree did not locate the three original SHA-pinned P2.34E source files. Because the original 84-solid STEP cannot be reconstructed from hashes or from generic test cylinders, the native chain M–Y still cannot run. This utility helps find an authentic owner export in other local CAD workspaces, backups or extracted folders **even if files have been renamed**.

The exact pinned original files are:
- `P234E_source84_revised_six_ball_clearance.step` — SHA-256 `9bd7ec6a60d5c4c9f1f3e421cb730fc252de026aae21dcf570584e5dda0ec63e`
- `P234E_source84_name_index.json` — SHA-256 `57afa74054ca892d2cb5633fb1c03a3c906fc2a928adf45f4674aa008952a62a`
- `P234E_source84_ball_contact_audit.json` — SHA-256 `b2eb8da1720cd5bf206e716e24ad8ebdde28d620bf31aaea456edb1b05e4b894`

## Native input discovery behavior

`tools/cad-first/p2_34ad_source_locator.py` recursively traverses explicitly given local search roots, hashing regular files in bounded chunks and looking up each digest against the immutable source pin map. It never follows symlink files or symlink directories; it rejects symlinked roots, limits the number/size of files and records missing matches. It never invents or regenerates source geometry.

Once all three exact matches exist, optional `--stage-dir` copies them into a **new, nonexistent directory** under the canonical original names and SHA-rechecks the copied bytes, then writes `P234AD_source_provenance.json`. It refuses overwrites and cleans up partial output on copy failure. No existing source files are modified. Without all three pins, it exits with code 2 and records `PINNED_SOURCE_NOT_FOUND_G2_HOLD`; the report is still written.

Local usage:

```bash
cd tools/cad-first
python -m unittest -v test_p2_34ad_source_locator.py
python p2_34ad_source_locator.py \
  --search-root /path/to/my/CAD/projects \
  --search-root /path/to/my/CAD/backups \
  --max-files 25000 \
  --report /new/P234AD_locator.json \
  --stage-dir /new/P234E_verified_native
```

The staged directory is intended for the existing native P2.34F source loader, P2.34AA local native M runner, and the P2.34Z pipeline metadata audit. **Discovery success means only byte integrity; it does not prove the mechanical design.**

## QA

**14/14 actual tests PASS locally** on SHA-pinned temporary sample files, including renamed source files, missing/modified bytes, source preservation, staging success, refusing overwrite, symlink avoidance, bounded scanning, and rejecting changed source between scan and copy. Tests use deliberately synthetic file bytes, *not actual owner 84-solid STEP*.

### Files

- `tools/cad-first/p2_34ad_source_locator.py`
- `tools/cad-first/test_p2_34ad_source_locator.py`

No authentic P2.34E STEP was recovered in this runtime; no native CV gear geometry measurements, no Model B assembly, no GitHub Actions, no merge or deployment.

**P2.34/54 continues. Mechanical G2 HOLD.**
