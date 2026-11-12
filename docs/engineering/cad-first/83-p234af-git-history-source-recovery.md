# P2.34AF/54 — Locate SHA-256 pinned original P2.34E evidence in reachable Git history

Date: 2026-11-12. Branch: `work/engineering-four-corners-local`.

## Finding and purpose

The repository working branch snapshot and `rebuild` branch tree do not expose the authentic three P2.34E original source STEP/name-index/audit files. Deletion from a current commit does **not** mean a blob cannot exist in locally available older Git commits, another locally fetched branch or a Git LFS object store.

P2.34AF implements a **read-only local Git-object inventory** at `tools/cad-first/p2_34af_git_history_recovery.py` using `git rev-list --objects --all`, `git cat-file -t`, `-s`, and `blob`. This scans only objects reachable by local references; shallow or incomplete clones and unreachable dangling objects are outside scope. It computes SHA-256 on blob bytes and matches precisely the three immutable P2.34E SHA pins, independent of file path and name. The command returns the Git blob SHA and byte count for each verified SHA match. It does **not** export or overwrite CAD files.

Git LFS pointer blobs are separately identified if their declared `oid sha256:` matches a source pin, but **the pointer itself is never counted as actual STEP/index/audit data**. Finding an LFS pointer requires locating the corresponding real LFS object locally or retrieving it using authorized normal repository access; P2.34AF does not claim to have done so.

To keep the process bounded, the script rejects more than 30,000 Git objects by default and skips blob objects larger than 500 MB by default (tune with flags). It does not update the Git working tree, run GitHub Actions, modify the original SHA pins or certify model geometry.

## Local execution and tests

```bash
cd tools/cad-first
python -m unittest -v test_p2_34af_git_history_recovery.py
python p2_34af_git_history_recovery.py \
  --repo /path/to/local/Podium-Effet-De-Sol \
  --out /new/P234AF_original_git_history_inventory.json
```

**9/9 real local Git test cases PASS**, using temporary Git repositories with commits and deletions, duplicate contents, an old branch, wrong SHA, bounded object budgets, and a deliberately matching LFS pointer. These fixtures use independent synthetic bytes; they do **not** supply a real owner CAD STEP.

The GitHub branch tree inspections demonstrate absent filenames in checked branch snapshots, **not** absence from every Git commit ever made or from the owner's external CAD exports. P2.34AF was not run against a complete local clone of the owner's repository because none is present in this runtime.

## Next native requirement

Obtain all three original STEP/index/audit byte-identical files and load them into the original P2.34F source guard; then execute the P2.34AA native P2.34M→N runner with P2.34AB/AC validation before claiming physical results. Do not substitute LFS pointers, synthetic replacement STEP geometry, or unverified versions.

**P2.34/54 in progress. Mechanical G2 HOLD. No Model B full-car integration, merge, deployment or GitHub Actions.**