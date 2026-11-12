# P2.34Z/54 — Source-authentic M–Y pipeline metadata preflight

Date: 2026-11-12. Branch: `work/engineering-four-corners-local`.

**Delivered: executable fail-closed metadata/source preflight, 12/12 tests actually PASS in local Python, and a real dry run of the preflight against absent source directories returned exit code 2 with all 13 stages M–Y BLOCKED. No genuine P2.34E 84-solid source STEP or actual P2.34M native report available, so no native CAD pipeline accepted. Mechanical G2 HOLD.**

## Why this gate

P2.34M–Y developed many narrowly scoped geometry diagnostic scripts, but successive standalone synthetic unit tests do not demonstrate an end-to-end authentic source execution. P2.34Z is a **metadata and availability preflight** before attempting an expensive native run; it does not use synthetic geometry to assert native source readiness. The existing authentic P2.34E STEP/index/audit have immutable SHA-256 pins. Without all three, the first stage is blocked and later stages carry explicit `UPSTREAM_NOT_VERIFIED`.

The tool reads each available stage report and validates its exact declared schema, invariant `mechanicalG2Certified: false` gate, recorded original source SHA (where applicable), and recorded SHA-256 links to its expected input report/candidate STEP bytes. Reports with malformed JSON, false certificates, tampered native source pins, wrong parent hashes, missing candidate STEP or partial upstream coverage are **BLOCKED**. Each file's presence and digest are recorded separately, with `PRESENT_UNTRUSTED` until proven in the chain.

Stage N intentionally stores original STEP SHA in a mapping rather than a scalar. Malformed/non-object mappings fail closed. The report naming in `REPORTS` is a reproducible *expected output convention*, not evidence these artifacts already exist or have been produced.

## Tested behavior

Local source-independent tests: **12/12 PASS**, covering:

- all missing native source files and 13 blocked stage reports
- source SHA mismatch and invalid original M schema/source SHA
- malformed JSON
- tampered parent SHA
- correct SHA but blocked upstream
- false G2 certificate
- incorrect `nativeSourceSHA256` data type
- exact stage manifest coverage
- output overwrite refusal, and writing a blocked report.

Negative-control local command:

```bash
mkdir -p /tmp/p234z-empty/{source,candidate,reports}
cd tools/cad-first
python -m unittest -v test_p2_34z_pipeline_preflight.py
python p2_34z_pipeline_preflight.py \
  --p234e-native /tmp/p234z-empty/source \
  --p234n-candidate /tmp/p234z-empty/candidate \
  --reports /tmp/p234z-empty/reports \
  --out /tmp/p234z-empty/P234Z_blocked.json
# Correctly exits 2, flags M through Y as BLOCKED; not an error in the checker.
```

When real inputs become available, substitute their actual directories and inspect each `stagePreflight.<letter>.reasons`. Exit 0 means only all 13 stages' **metadata links** are verifiable; it does **not** mean mechanical acceptance or native shape correctness. The program unconditionally reports `authenticNativeCADExecutionPerformedByPreflight: false`, `original84SourceGeometryValidatedByPreflight: false`, `mechanicalG2Certified: false`.

## Explicit limitations

- The preflight checks available SHA-pinned files and provenance metadata, not OpenCascade B-Rep quality.
- Source name-index and audit file *content* are only byte-authenticated, not semantically checked here; the original P2.34F loader performs structural checks during actual native execution.
- Inter-stage hash/field checks are limited to the declared keys in the installed scripts; cross-referenced physics, trajectory completeness, dynamic validation and financial/engineering safety are not certified.
- Even passing all metadata checks is not sufficient for passing P2.34O–Y geometric/force gates.
- The authentic P2.34E source files and full original-source native execution were **not available**; no CV manufacturing claim, no full Model B car integration.

## Files

- `tools/cad-first/p2_34z_pipeline_preflight.py`
- `tools/cad-first/test_p2_34z_pipeline_preflight.py`

**Next work:** prioritize obtaining/mounting the original three exact P2.34E files and executing P2.34M natively, then audit the actual results before attempting P2.34N and downstream stages. Adding more synthetic geometric screens without real source data will not resolve this blocker.

**P2.34/54 IN PROGRESS. G2 HOLD. No merge, deploy, GitHub Actions, or Model B full-car integration.**
