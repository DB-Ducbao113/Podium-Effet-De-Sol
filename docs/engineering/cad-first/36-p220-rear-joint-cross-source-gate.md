# P2.20 — Original rear source ownership and native cross-source gate

Date: 2026-11-10
Branch: `work/engineering-four-corners-local`
Status: **INTEGRATION GATE IMPLEMENTED / AUTHENTIC 63-BODY AUDIT NOT RUN / G2 HOLD**

## Objective

Reviewing the original Model B's rear wheel-end now requires merging P2.19's 43 source bodies with the original P2.12/P2.14 rear toe and split-joint CAD. Do not concatenate all GLBs: P2.12 duplicates eleven P2.9/P2.10 source IDs and P2.14 replaces four older bearing proxy bodies.

## New source-first gate

`tools/cad-first/p2_20_rear_joint_cross_source_gate.py` reads seven **exact Git blob-pinned authoring scripts**: P2.9, P2.10, P2.11, P2.12, P2.13, P2.14 and P2.19. Any missing or modified input fails before any CAD claim.

The geometry ownership contract is:

| Step | CAD bodies |
|---|---:|
| P2.19 rear wheel-end, brake, drive and suspension | 43 |
| Remove old P2.10 upper/lower spherical bearing proxies | -2 |
| Add P2.12-native rear toe parts absent from P2.19/P2.10, excluding P2.11 bearing proxies | +6 |
| Add P2.14 new split spherical bearing source parts | +16 |
| Candidate physical-source CAD union | **63** |

The original P2.19 revised upper/lower A-arms retain ownership. P2.12's identical P2.9/P2.10 IDs are not overlaid and cannot undo the P2.19 rim clearance repair. Four replaced bearings (two P2.10, two P2.11) must be present and removed exactly once. Each source part ID is unique.

Native OpenCascade B-Rep interference gate enumerates **1,953 nominal-pose pairs**. The 820 pairings exclusively among 41 retained prior source bodies inherit P2.19's independently required static PASS. The remaining **1,133 potentially changed pairs** are screened with AABB and exact B-Rep Boolean intersection whenever their AABBs overlap. Any overlap greater than 0.05 mm3, failed Boolean or invalid solid causes HOLD. This is deliberately *not* a dynamic joint, structural load path or Model B chassis proof.

## Optional standalone GLB review (strictly gated)

`tools/cad-first/p2_20_native_review_export.py` creates a source-named **63-mesh BALANCED GLB** with one shared neutral base RGB `#87929D`, only after the exact Git blob checks and the actual 63-body B-Rep static audit PASS. It does not substitute any Model B source geometry. It refuses to emit a 63-body GLB when the native source fit fails. The output remains inside a local review folder and is never copied into production/public assets.

```bash
PYTHONPATH=tools/cad-first python -m unittest -v tools/cad-first/test_p2_20_native_review_export.py
PYTHONPATH=tools/cad-first python tools/cad-first/p2_20_native_review_export.py --out .local-assets/cad-first/p220-rear63-native-neutral
```

This assistant sandbox ran the preview exporter only against **synthetic negative/positive-control B-Rep objects**; real 63-part output has NOT been generated. Combined P2.20 logic and preview tests: **5/5 PASS** (synthetic fixture/algorithm scope only). Do not call the 63-body native authoring a mechanical PASS.

## Executed checks in this assistant environment

- 5/5 P2.20 unit tests **PASS** with clearly labeled synthetic/native CadQuery negative-control geometry.
- Tests verify exact 41 + 6 + 16 source counts and the no-duplicate source ownership rule.
- Tests verify deliberately colliding new-versus-existing CAD body is detected by an actual native B-Rep Boolean operation.
- Tests verify unexpected/missing Git source hashes are refused before an assembly claim.
- Verified all seven pinned Git blob IDs against the connected GitHub repository at this branch.
- **NOT RUN:** full 63-body source assembly, actual P2.12/P2.14 native cross-source Boolean clearance, STEP/GLB export of a genuine 63-body combined source, full Model B browser video.

### Why full CAD is on hold

The current sandbox contains previous P2.19 rear43 GLB/STEP evidence and reconstructed P2.9/P2.10 fixtures, but not the complete executable original GitHub P2.11/P2.12/P2.13/P2.14 authoring files and their native review exports. The connected GitHub API allowed text-source inspection and commit, not a full local repository checkout. Claiming 63-body mechanical PASS here would be false.

### Run on an authenticated repository checkout, without GitHub Actions

```bash
PYTHONPATH=tools/cad-first python -m unittest -v tools/cad-first/test_p2_20_rear_joint_cross_source_gate.py
PYTHONPATH=tools/cad-first python tools/cad-first/p2_20_rear_joint_cross_source_gate.py --out .local-assets/cad-first/p220-rear63-native-audit
```

The second command computes and saves `P220_rear63_cross_source_audit.json` only after exact upstream Git blob identity checks, with status `STATIC_CROSS_SOURCE_PASS_G2_HOLD` or `CROSS_SOURCE_INTERFERENCE_HOLD`. Source failures and any detected interferences stop integration. It never updates Model B or production assets.

**No GitHub Actions, merge, deployment, replacement-model render or false G2 approval. Entire Model B remains incomplete.**
