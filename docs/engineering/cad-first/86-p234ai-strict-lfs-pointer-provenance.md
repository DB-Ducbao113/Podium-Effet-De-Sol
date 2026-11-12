# P2.34AI/54 — Strict, deterministic Git LFS pointer provenance

Date: 2026-11-12. Branch: `work/engineering-four-corners-local`.

## Defect

P2.34AH's `locate()` accepted the first matching Git LFS pointer for each immutable P2.34E SHA-256 pin and skipped subsequent historical pointers with the same content hash. A stale or tampered AF inventory could silently choose an arbitrary pointer even when another pointer in that inventory claimed a conflicting file size. It also silently ignored malformed inventory entries or incorrect source-name associations.

## Fix implemented

Updated `tools/cad-first/p2_34ah_lfs_source_restore.py`:

- Inspect **every** pointer entry in the AF inventory rather than immediately selecting the first valid item.
- Require each entry to name one of the three canonical pinned files, contain a syntactically valid Git blob OID, resolve to a real Git blob, and contain a canonical pointer to the precise expected original SHA-256.
- Collect historical pointer variants per original file. If their declared `size` differs for the same content SHA, reject the inventory with `Conflicting historical LFS pointer sizes` instead of choosing one arbitrarily.
- If duplicates have identical sizes, select deterministically by the smallest Git blob OID.
- Keep the existing independent real LFS payload file-length and SHA-256 verification, no-follow source opening, exclusive destination creation, immutable original files and permanent `mechanicalG2Certified: false` state.

## Test evidence

Four new local regression tests cover conflicting historical pointer sizes, duplicate identical pointers, a valid pointer misattributed to another pinned file, and unknown inventory entries. Combined with the original 11 P2.34AH tests, **15/15 PASS** locally in a temporary Git repository backed by synthetic LFS objects. The GitHub source and test files were updated and read back by their blob SHAs.

This validates **metadata handling and source restoration logic only**. No authentic original P2.34E STEP, original index, original ball-contact audit or native 84-solid OCC geometry has been obtained or analyzed. No CAD mechanical G2 certificate, actual CV torque/velocity evidence or full Model B assembly is implied.

## Local reproduction

```bash
cd tools/cad-first
python -m unittest -v test_p2_34ah_lfs_source_restore.py
python p2_34ah_lfs_source_restore.py \
  --repo /actual/local/Podium-Effet-De-Sol \
  --stage-dir /new/P234E_verified_native
```

**P2.34/54 IN PROGRESS. Mechanical G2 HOLD. No GitHub Actions, merge, deploy or Model B full-car integration.**