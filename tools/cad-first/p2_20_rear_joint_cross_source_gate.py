#!/usr/bin/env python3
"""P2.20 fail-closed rear CAD source integration gate (not a Model B mate).

P2.19 native 43 bodies + P2.12 toe/adjuster + P2.14 split-bearing parts.
P2.12 owns 19 solids including 11 P2.9/P2.10 duplicates; P2.14 replaces
four old bearings across those two owners. Preserve P2.19 source rewrites,
never draw duplicate P2.10 controls or promote provisional CAD to OEM truth.

The native B-Rep checker runs ONLY on newly introduced or re-mated pairs,
using the P2.19 existing 43-body PASS as its explicit old-old carryover.
Unlike a mesh overlap or AABB-only check, positive cases are exact OCC
shape intersections. This is a static source feasibility test, not a motion,
chassis-load, thread engagement, tolerance, or genuine F1 OEM certificate.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib
import json
import math
from pathlib import Path
from typing import Any

# Exact repository blob SHA-1s already checked on the CAD work branch.
# Prevent misleading results from accidentally transcribed source fixtures.
UPSTREAM_GIT_BLOBS = {
    'p2_9_rear_upright.py': '0a6b95d53479b63006d2103b24efb44e846589b1',
    'p2_10_rear_wishbone.py': 'e8cdb4b652300a514e7eb015bf3cc9020765d11e',
    'p2_11_rear_toe_link.py': '8ea653169f8a813acc52421089daf48855b773ca',
    'p2_12_toe_adjuster.py': '561ebdd652e5bf446bb946c56f907f4c5c0a8d67',
    'p2_13_rear_joint_prototype.py': '32fc40ba114ef52724caa526f81a11e600daecbf',
    'p2_14_split_spherical_race.py': '9cea3e634348aa578391f42b491372d3b03db319',
    'p2_19_rear_wishbone_clearance.py': '3a71f504fcf49c324584e1ae330f294a2b9b0b63',
}
SCHEMA = 'peds.cad-first.p220-cross-source-rear-joint-static-gate.v1'
EXPECTED_REAR43 = 43
EXPECTED_TOE_SOURCE = 19
EXPECTED_SPLIT = 16
EXPECTED_FULL = 63
THRESHOLD_MM3 = 0.05


def git_blob_sha(path: Path) -> str:
    data = path.read_bytes()
    return hashlib.sha1(f'blob {len(data)}\0'.encode() + data).hexdigest()


def authenticate_sources(root: Path) -> dict[str, str]:
    """Refuse source fixtures or source edits absent from the reviewed lineage."""
    checked = {}
    for name, expected in UPSTREAM_GIT_BLOBS.items():
        path = root/name
        if not path.is_file():
            raise FileNotFoundError(f'Missing exact upstream source: {name}')
        actual = git_blob_sha(path)
        if actual != expected:
            raise ValueError(f'Git source blob mismatch: {name} expected {expected}, got {actual}')
        checked[name] = actual
    return checked


def compose_nominal(base: dict, toe: dict, split: dict,
                    replacement: dict[str, str], old_static_pass: bool) -> tuple[dict, set[str], set[str], dict]:
    """Preserve amended 43 parts, remove four proxies and source duplicates.

    Preconditions require the exact structural lineage, not merely counts.
    Newly introduced shapes use authentic native CAD object ownership.
    """
    if not old_static_pass:
        raise ValueError('P2.19 prior 43-body static audit has not passed')
    if len(base) != EXPECTED_REAR43 or len(toe) != EXPECTED_TOE_SOURCE or len(split) != EXPECTED_SPLIT:
        raise ValueError('Unexpected P2.19/P2.12/P2.14 source part counts')
    if any(len(set(x)) != len(x) for x in (base, toe, split)):
        raise ValueError('Duplicate source part names')
    shared = set(base) & set(toe)
    if len(shared) != 11 or not all(name.startswith(('P210_', 'P29_')) for name in shared):
        raise ValueError('P2.12 must share exactly the 11 original P2.9/P2.10 source IDs')
    if set(split) & (set(base) | set(toe)):
        raise ValueError('New split-bearing part ID duplicates a native source ID')
    if set(replacement) != {'UPPER', 'LOWER', 'TOE_OUTER', 'TOE_INNER'}:
        raise ValueError('P2.14 must replace exactly four source bearing proxy roles')
    removed = set(replacement.values())
    if len(removed) != 4 or not removed <= set(base) | set(toe):
        raise ValueError('Four real source bearing proxy IDs missing/duplicated')
    if len(removed & set(base)) != 2 or len(removed & set(toe)) != 4:
        raise ValueError('Expected two P2.10 and two P2.11 bearing proxies')
    if any('BEARING' not in name for name in removed):
        raise ValueError('Non-bearing source deletion requested')
    retained = {key: body for key, body in base.items() if key not in removed}
    # Repeated P2.9/P2.10 solids from P2.12 are aliases to old authored source;
    # use P2.19's corrected arm meshes instead of silently undoing the repair.
    additions = {key: body for key, body in toe.items() if key not in shared and key not in removed}
    if len(retained) != 41 or len(additions) != 6:
        raise ValueError('Ownership invariant must be 41 retained + 6 rear toe + 16 split races')
    merged = {**retained, **additions, **split}
    if len(merged) != EXPECTED_FULL:
        raise ValueError('Mechanical source preview expected exactly 63 distinct CAD bodies')
    new_ids = set(additions) | set(split)
    if len(new_ids) != 22 or set(merged) != set(retained) | new_ids:
        raise ValueError('P2.20 cannot overwrite retained old CAD part identity')
    ledger = {
        'p219NominalSourceBodies': 43,
        'p212UpstreamBodies': 19,
        'p214ReplacementBodies': 16,
        'sharedOwnerIdsPreservedFromP219': sorted(shared),
        'removedOldBearingIds': sorted(removed),
        'toeNewIds': sorted(additions),
        'splitRaceNewIds': sorted(split),
        'oldSourceBodiesRetained': len(retained),
        'newSourceBodiesAdded': len(new_ids),
        'unionBodyCount': len(merged),
        'expectedAllPairs': 63*62//2,
        'priorOldOldPairsProvenByP219': 41*40//2,
    }
    return merged, set(retained), new_ids, ledger


def _bbox_overlap(a: Any, b: Any) -> bool:
    return all(min(getattr(a, axis+'max'), getattr(b, axis+'max')) -
               max(getattr(a, axis+'min'), getattr(b, axis+'min')) > 1e-6
               for axis in 'xyz')


def incremental_brep_audit(shapes: dict, old_ids: set[str], new_ids: set[str],
                           threshold: float = THRESHOLD_MM3) -> dict:
    """Compute exact intersections for every pair touching 22 newly mated parts.

    Must retain a trusted old-old P2.19 PASS: it is not recalculated here.
    A failed Boolean, invalid CAD volume or non-finite result is an audit FAIL.
    """
    if set(shapes) != old_ids | new_ids or old_ids & new_ids or not new_ids:
        raise ValueError('Invalid static audit ownership partition')
    if not math.isfinite(threshold) or threshold < 0:
        raise ValueError('Invalid exact B-Rep overlap threshold')
    for name, body in shapes.items():
        if body.isNull() or not body.isValid() or len(body.Solids()) != 1 or body.Volume() <= 0:
            raise ValueError('Invalid native source B-Rep before audit: '+name)
    boxes = {name: shape.BoundingBox() for name, shape in shapes.items()}
    names = sorted(shapes)
    exempt_old_old = broadphase = booleans = 0
    conflicts, kernel_errors = [], []
    for i, name in enumerate(names):
        for other in names[i+1:]:
            if name in old_ids and other in old_ids:
                exempt_old_old += 1
                continue
            if not _bbox_overlap(boxes[name], boxes[other]):
                broadphase += 1
                continue
            booleans += 1
            try:
                mm3 = float(shapes[name].intersect(shapes[other]).Volume())
                if not math.isfinite(mm3) or mm3 < -1e-9:
                    raise ArithmeticError(f'Nonfinite/negative OCC overlap {mm3}')
                if mm3 > threshold:
                    conflicts.append({'left':name,'right':other,'overlapMm3':round(mm3,6)})
            except Exception as exc:
                kernel_errors.append({'left':name,'right':other,'error':repr(exc)})
    count = len(names)*(len(names)-1)//2
    if exempt_old_old+broadphase+booleans != count:
        raise AssertionError('Not all geometry pairs have an explicit audit status')
    return {
        'allPairs':count,
        'previouslyCertifiedOldOldPairs':exempt_old_old,
        'broadphaseExcluded':broadphase,
        'exactOpenCascadeBooleanPairs':booleans,
        'thresholdMm3':threshold,
        'detectedCollisions':conflicts,
        'booleanErrors':kernel_errors,
        'passNewCrossSourceStatic':not conflicts and not kernel_errors,
        'fullCarMechanicallyCertified':False,
        'continuousDynamicKinematicsCertified':False,
        'modelBActualHardpointsMeasured':False,
    }


def run(out: Path) -> dict:
    # Never inspect or replace existing P2.19-generated evidence in-place.
    if out.exists():
        raise FileExistsError('New unique output folder required for P2.20 evidence')
    # Import exact author CAD and prove file hashes before computing source fit.
    source_root = Path(__file__).resolve().parent
    sources = authenticate_sources(source_root)
    from p2_19_rear_wishbone_clearance import full_source_audit
    from p2_12_toe_adjuster import all_parts
    from p2_14_split_spherical_race import source_parts, SOURCE_BEARING_TO_REPLACE
    old, old_audit = full_source_audit()
    union, retained, new_ids, ledger = compose_nominal(
        old, all_parts(), source_parts(), SOURCE_BEARING_TO_REPLACE, old_audit['passStatic'])
    audit = incremental_brep_audit(union, retained, new_ids)
    report = {
        'schema':SCHEMA,
        'status':'STATIC_CROSS_SOURCE_PASS_G2_HOLD' if audit['passNewCrossSourceStatic']
                else 'CROSS_SOURCE_INTERFERENCE_HOLD',
        'sourceGitBlobSha1':sources,
        'provenance':ledger,
        'nativeIntersectionAudit':audit,
        'partIds':sorted(union),
        'uniformSourceReviewColor':'#87929d',
        'noSourceGeometryWasChanged':True,
        'actualModelBInstalled':False,
        'actualManufacturerCadClaim':False,
        'mechanicalG2Certified':False,
        'blockers':['Re-author and re-audit any flagged cross-source interference',
                    'Actual original Model B chassis hardpoint measurement',
                    'Retained dynamic wheel/arm/shaft/track/bearing-mate clearance',
                    'Actual full-vehicle physical attachment and separate browser QA'],
    }
    out.mkdir(parents=True)
    (out/'P220_rear63_cross_source_audit.json').write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps({'status':report['status'],'static':audit,'partCount':len(union)},indent=2))
    return report


if __name__ == '__main__':
    cli = argparse.ArgumentParser()
    cli.add_argument('--out', required=True, type=Path)
    result=run(cli.parse_args().out)
    if not result['nativeIntersectionAudit']['passNewCrossSourceStatic']:
        raise SystemExit(2)
