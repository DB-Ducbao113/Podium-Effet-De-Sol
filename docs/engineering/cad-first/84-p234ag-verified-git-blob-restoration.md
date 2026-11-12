# P2.34AG/54 — Restore exact source84 original files from SHA-matched Git blobs

Date: 2026-11-12. Branch: `work/engineering-four-corners-local`.

## Problem and delivered change

P2.34AF could discover authentic original source P2.34E bytes within the reachable Git object history, even if a path was deleted at later commits. It only printed blob SHAs: there was no way to stage them for the native P2.34F or P2.34AA CAD processes.

P2.34AG adds `tools/cad-first/p2_34ag_git_blob_restore.py`. Given a **local cloned repository** (and optionally a previous P2.34AF metadata inventory), it selects three candidate blob IDs, re-reads each using `git cat-file`, confirms it is a blob with allowed byte size, independently calculates the actual SHA-256, compares against all three immutable original P2.34E pins, and only then writes the files under the original canonical names in a new non-existing target directory.

The complete stage includes `P234AG_git_restore_audit.json` with Git object SHA, source SHA-256 and byte length. A report from P2.34AF alone is **never trusted**: its blob IDs and actual bytes are verified again. Untrusted object IDs are restricted to 40- or 64-digit lowercase hex values. Git LFS **pointer** bytes cannot satisfy the pinned SHA of actual original STEP content and cannot be promoted to a real source file. Unavailable actual LFS objects remain a blocker.

Output staging refuses any existing directory and symlinked parent directory; it opens destination files exclusively and on failure only removes files created within the new staging directory. The source repository is read-only. The method is designed for **trusted local filesystems** rather than an adversarial process racing the destination path.

## Actual test results

**11/11 PASS, locally executed** using temporary Git repos. Tested restoring files after deletion from a newer commit, refusing overwrite, no worktree modifications, missing SHA, tampered inventory, malformed Git object ID, fake LFS pointer, symlink parent, schema mismatch, unchanged Git commit and unsafe destination filename.

Tests use invented source bytes and custom test-specific SHA pins. No genuine P2.34E original 84-solid owner STEP was found or verified, no native mechanical M–Y execution was performed, no STEP geometry changed.

## Files

- `tools/cad-first/p2_34ag_git_blob_restore.py`
- `tools/cad-first/test_p2_34ag_git_blob_restore.py`

## How to use (locally, without GitHub Actions)

```bash
cd tools/cad-first
python -m unittest -v test_p2_34ag_git_blob_restore.py

# Scans all reachable blobs from local clone, and writes originals to a new directory.
python p2_34ag_git_blob_restore.py \
  --repo /absolute/path/to/local/Podium-Effet-De-Sol \
  --stage-dir /absolute/path/to/new/P234E_verified_native

# Or reuse an AF inventory. Every candidate blob is revalidated:
python p2_34ag_git_blob_restore.py \
  --repo /absolute/path/to/local/Podium-Effet-De-Sol \
  --inventory /absolute/path/to/P234AF_original_git_history_inventory.json \
  --stage-dir /absolute/path/to/new/P234E_verified_native
```

If a source blob is missing, the process fails without creating a staged source. Once original source files are truly recovered, run the P2.34F source loader and the P2.34AA native M→N runner with AB/AC validations. A successful byte restoration alone never certifies the cage, CV mechanism, loaded torque or full-car assembly.

**P2.34/54 IN PROGRESS. Mechanical G2 HOLD. No merge, deployment, GitHub Actions or Model B full-car integration.**
