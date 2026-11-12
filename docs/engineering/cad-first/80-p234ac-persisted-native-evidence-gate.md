# P2.34AC/54 — Validate persisted native M/N evidence before accepting a completed stage

Date: 2026-11-12. Branch: `work/engineering-four-corners-local`.

## Real defect fixed

P2.34AA previously accepted the **Python return value** from the P2.34M native stage as sufficient to mark M complete and recorded the file's SHA without checking whether the saved file contents matched that returned report. It also marked N complete after `build()` succeeded, without independently verifying the saved N audit, SHA-linked exported STEP or original changed-part/G2 scope.

P2.34AC adds `tools/cad-first/p2_34ac_persisted_evidence_gate.py` and integrates it in P2.34AA. A report is not considered a completed stage before **on-disk byte-level evidence** passes validation.

- `check_m()` reads back the actual M JSON and compares it to the returned object; validates source STEP SHA, pose-grid SHA, source84 count, unchanged-original flag and sampled pose count; computes SHA from the actual saved bytes. Returns the prior `p234mReview` and new `p234mSHA256` only after success.
- P2.34AB still executes before any N native cutting, validating the selected M candidates directly against P2.34N's `validated_paths` contract.
- `check_n()` reads the actual prototype STEP bytes and its associated N JSON audit; rejects missing/empty/symlinked STEP, mismatching returned-versus-persisted audit, changed SHA, wrong original source hashes, wrong M parent hash, missing 84-original scope, altered race names and false mechanical acceptance claims. The runner records `p234nCandidateSHA256` and `p234nAuditSHA256` and marks `N` complete **only after** the audit passes.
- All stage errors are caught by AA and written into the existing output folder's immutable execution manifest. No original owner STEP is changed or replaced.

## Tests and provenance

Local Python QA (on the local equivalent of these files): **25/25 PASS** — 13 existing AA stage-integration tests (explicit source/CAD stubs) plus 12 new AC tests on real temporary on-disk data, including M return-vs-persisted divergence, N audit mismatch, parent-M tampering, candidate STEP byte change, missing audit, symlink, empty output, source scope tampering and false mechanical acceptance.

**These are not original 84-solid STEP tests.** The N STEP test fixture deliberately uses dummy bytes to test hash and provenance, never claims successful CadQuery STEP import. The pushed version has not been independently rerun from a clean checkout.

To reproduce locally:

```bash
cd tools/cad-first
python -m unittest -v test_p2_34aa_native_runner.py test_p2_34ac_persisted_evidence_gate.py
```

The authentic P2.34E files remain absent from the inspected GitHub tree, and no original-native M/N run can be carried out here. The source84 SHA pins must remain unchanged. Mechanical G2 HOLD regardless of a passing runner metadata test.

## Files

- `tools/cad-first/p2_34ac_persisted_evidence_gate.py`
- `tools/cad-first/test_p2_34ac_persisted_evidence_gate.py`
- Updated `tools/cad-first/p2_34aa_native_runner.py`
- Updated `tools/cad-first/test_p2_34aa_native_runner.py`

**P2.34/54 still IN PROGRESS. No Model B integration, GitHub Actions, merge or deployment.**
