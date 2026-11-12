# P2.34AK — Actual AJ → AG integration regression, no owner-source fabrication

Date: 2026-11-12. Branch: `work/engineering-four-corners-local`.

## Change

Replaced P2.34AJ's previous `test_restoration_rechecks_exact_dangling_blobs`, which mocked the entire P2.34AG restoration engine, with a true functional integration test. The new test:

1. Initializes a temporary **real local Git repository**, writes three synthetic SHA-pinned blobs directly to the Git object database without attaching them to refs.
2. Uses P2.34AJ's actual `inspect()` to find the otherwise unreachable original-byte fixtures.
3. Uses P2.34AJ's actual `restore_exact_blobs()` to call the **real** P2.34AG `restore()` without mocking, yielding three files in a distinct new output directory.
4. Reads those restored bytes back and verifies each SHA-256 and the presence of `P234AG_git_restore_audit.json`.
5. Checks the audit always includes `mechanicalG2Certified: false`.

Two additional negative integration tests ensure (a) a tampered Git object ID in the AJ report is rejected and no destination is created, and (b) an existing output directory containing a user file is never overwritten or deleted.

This change closes a **test coverage gap**. It does not invent, model, infer, regenerate, or validate the genuine P2.34E STEP. The true native original 84-solid source/index/contact audit are still absent.

## Files and verification

Updated `tools/cad-first/test_p2_34aj_unreachable_git_source.py`. Its total test count is now **14 cases** (12 original, replacing one mock with genuine integration, plus two negatives).

The original tool sources `p2_34af_git_history_recovery.py`, `p2_34aj_unreachable_git_source.py`, and `p2_34ag_git_blob_restore.py` are unchanged.

**Run status:** the new 14-case suite was **not executed from a clean GitHub checkout** in this turn because this tool runtime cannot resolve github.com from its local terminal. The updated test file was committed through the authenticated GitHub tool and confirmed by fetching the saved blob. Do not claim 14/14 PASS until running it.

To reproduce without GitHub Actions:

```bash
cd tools/cad-first
python -m unittest -v test_p2_34aj_unreachable_git_source.py
python -m unittest -v test_p2_34ag_git_blob_restore.py
```

The first successful integration test is entirely synthetic and tests the **real Git object handoff and disk restoration**, not the physical CV geometry. The genuine P2.34E source remains a hard blocker for P2.34M–Y and Model B full-car mechanical G2 acceptance.

**P2.34/54 IN PROGRESS. Mechanical G2 HOLD. No GitHub Actions, merge or deploy.**
