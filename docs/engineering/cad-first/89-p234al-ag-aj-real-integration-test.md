# P2.34AL/54 — Actual combined AG + AJ integration test run

Date: 2026-11-12. Branch: `work/engineering-four-corners-local`.

## Executed verification

Ran the real P2.34AK AJ→AG integration tests and the existing P2.34AG Git blob restore test suite together using a local source copy corresponding to the repository's committed implementations:

```bash
cd /mnt/data/p234al
python -m unittest -q test_p2_34ag_git_blob_restore.py test_p2_34aj_unreachable_git_source.py
```

**Result: Ran 25 tests in 0.770s — OK (25/25 PASS).**

The integration test creates genuinely unreachable blob objects in a temporary local Git repository using `git hash-object -w --stdin`; P2.34AJ identifies the three content-SHA-matching blob IDs, then P2.34AG reads the exact objects using `git cat-file` and exports the recovered bytes to disk. The test reopens the staged outputs and checks SHA-256 for each. The test does **not** mock P2.34AG.

## Discovered and corrected test defect

The previous P2.34AK integration tests created output folders using `self.repo.parent / ...`; because `self.repo` is itself a temporary directory immediately below `/tmp`, this escaped its per-test fixture and allowed collisions across test executions. A combined rerun reproduced **two FileExistsError errors** after the isolated tests previously passed.

Updated `tools/cad-first/test_p2_34aj_unreachable_git_source.py` to use per-test `self.repo / ...` staging paths. Reran the AG+AJ suites together; **25/25 PASS**. The failure was in temporary test-path isolation, not in actual source geometry.

## Provenance and limits

Source files under local `/mnt/data/p234al` were assembled from the existing earlier local copies of the matching GitHub Git scanner/restorer modules, and the test changes were applied locally before updating the GitHub test file. The changed GitHub file was fetched and verified after push. This is a local integration run, **not an independently checked-out clean remote build**.

Test data are deliberately synthetic SHA-pinned bytes in real local Git object databases; no authentic original P2.34E STEP, index or contact audit has been obtained. A passing test establishes byte-preserving Git recovery, **not** CAD geometry validity or F1 Model B assembly.

**P2.34/54 still IN PROGRESS. Mechanical G2 HOLD. No GitHub Actions, merge or deployment.**
