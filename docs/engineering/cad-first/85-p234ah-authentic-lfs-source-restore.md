# P2.34AH/54 — Restore P2.34E from authenticated local Git LFS objects

Date: 2026-11-12. Branch: `work/engineering-four-corners-local`.

## Source blocker and patch purpose

P2.34AF scans reachable Git history and detects LFS pointers; P2.34AG restores genuine original Git blobs. Git LFS pointers are small files containing an SHA-256 identifier and the byte length of an external object. A pointer is **not the source STEP geometry** and is never sufficient for mechanical validation.

P2.34AH adds `tools/cad-first/p2_34ah_lfs_source_restore.py`, which combines a Git-committed LFS pointer with its actual existing local LFS object, requiring both evidence sources and an exact match to the three immutable P2.34E original SHA-256 pins.

1. Inspect verified P2.34AF Git-pointer inventory, or produce it from an available local clone. Re-fetch each pointer's Git blob, parse `oid sha256:<hash>` and `size <length>`.
2. Resolve the local Git LFS object store from `git rev-parse --git-common-dir`, with `--lfs-dir` for an explicitly supplied local object cache. Search `objects/<first2>/<next2>/<sha256>`.
3. Reject missing local LFS payloads, source hash mismatches, size mismatches, source symlinks, nonregular objects, invalid pinned names and preexisting output directories.
4. Copy byte streams into a new, exclusively created source folder using `O_NOFOLLOW` for payload files. Hash during copying, then rehash staged content, and remove partial generated files if anything fails.
5. Record source and Git pointer provenance in `P234AH_lfs_restore_audit.json`. Original repository data are never edited. Status is always `ALL_PINNED_REAL_LFS_OBJECTS_RESTORED_G2_HOLD`, not mechanical certification.

If only the Git LFS pointer exists and the real LFS object is unavailable, P2.34AH must fail closed. It does not download, fabricate or reinterpret CAD data. A valid restored-byte SHA alone does not prove the physical CV assembly.

## Actual test execution

**11/11 tests PASS**, run locally against temporary real Git repositories containing authentic-format LFS pointers and independent synthetic payloads. Covered successful three-object restoration, incorrect pointer size, modified data, absent payload, symlink payload, malicious/missing pointer blob, incorrect inventory schema, output overwrite refusal and no Git worktree changes.

These were not tests using the owner's original 84-solid STEP. No real P2.34E SHA-matched files or actual mechanical P2.34M native measurements were available in this session. The code committed to GitHub was not independently rerun from a fresh checkout.

## Local invocation

```bash
cd tools/cad-first
python -m unittest -v test_p2_34ah_lfs_source_restore.py
python p2_34ah_lfs_source_restore.py \
  --repo /actual/local/Podium-Effet-De-Sol \
  --stage-dir /new/P234E_verified_native
# An existing AF inventory can also be supplied via --inventory.
# Use --lfs-dir /actual/local/lfs/objects when Git's default store differs.
```

## Remaining gates

After authentic P2.34E STEP, name index and audit have been recovered and SHA-verified, run P2.34F source validation and P2.34AA M→N local native execution, then the protected downstream P2.34O–Y diagnostics. Keep G2 HOLD until actual race contact, captive ball retention, continuous velocity equality, load and torque constraints are proven. No Model B full-car assembly or deployment has been accepted.

**P2.34/54 IN PROGRESS — Mechanical G2 HOLD. No merge, GitHub Actions or deploy.**