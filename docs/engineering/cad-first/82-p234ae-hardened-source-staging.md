# P2.34AE/54 — Harden original P2.34E source staging

Date: 2026-11-12. Branch: `work/engineering-four-corners-local`.

## Scope

P2.34AD finds the three SHA-256 pinned owner original files anywhere in user-specified local CAD directories and optionally stages copies under canonical names. P2.34AE hardens this staging process against local filesystem races and accidental deletion.

### Defects addressed

Previously, source files were checked by path and then passed to `shutil.copyfile()`. A file could change between the SHA scan and the copy, including being swapped to a symlink. The old failure handler called `shutil.rmtree(target)`; this was unnecessarily broad for a high-value CAD workspace.

The updated `tools/cad-first/p2_34ad_source_locator.py`:

1. Opens the source with `os.O_NOFOLLOW` and refuses staging on platforms without that protection. Checks `fstat()` before and after byte copying.
2. Copies through the open descriptor into output created with exclusive `'xb'`, while calculating SHA-256; rehashes the staged file and compares it to the immutable expected pin.
3. Refuses destination symlinks and symlinked destination parents, and rejects unsafe canonical output filenames.
4. On failure, unlinks only files explicitly created by the current staging attempt and removes its newly created *empty* directory with `rmdir()`, without recursive deletion.
5. Keeps the mechanical G2 flags false and never modifies the original CAD files.

These checks reduce common path-swapping and accidental-overwrite risks; they are not a complete defense against a hostile concurrent process capable of changing destination parent paths during execution. Use a trusted local CAD workspace.

## Tests and evidence

Updated `tools/cad-first/test_p2_34ad_source_locator.py` with four adversarial tests:

- Symlinked destination parent is rejected.
- Source contents are modified immediately before opening for copy: staging fails and leaves no partial staged directory.
- Source path is switched to a symlink: `O_NOFOLLOW` causes rejection.
- Canonical destination name with a parent traversal element is rejected.

**18/18 tests PASS locally** using synthetic bytes with locally controlled SHA-256 fixtures. No original P2.34E native STEP/index/audit were available for real geometric execution. The staged source has not been created in the actual owner workspace.

Run without GitHub Actions:

```bash
cd tools/cad-first
python -m unittest -v test_p2_34ad_source_locator.py
python p2_34ad_source_locator.py \
  --search-root /path/to/owner/CAD \
  --report /new/P234AD_locator.json \
  --stage-dir /new/P234E_verified_native
```

The tool still requires the exact three original source SHA-256 pins. It does not synthesize source CAD, generate a new CV assembly or integrate Model B.

**P2.34/54 in progress. Mechanical G2 HOLD. No merge, deploy, or GitHub Actions.**