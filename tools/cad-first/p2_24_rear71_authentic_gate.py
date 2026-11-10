#!/usr/bin/env python3
"""P2.24 exact source-bound rear 71-body native collision gate.

Purpose: revalidate REAL P2.23 latest rear40 against REAL P2.9/P2.10
suspension11, and then integrate original P2.12 rear toe and P2.14 split
bearings. No proxy, duplicated source, original Model B asset mutation or
unverified assertion of physical/structural compatibility is permitted.

The gate uses live CadQuery B-Rep objects, verifies exact approved Git blob
SHA-1 of its native upstream scripts and fails closed on any unexpected
source edit, unsupported part identity, B-Rep error or interference.

Stage A: 40 rear source + 11 independent suspension bodies -> 51. Reuse
P2.23's 40-body exact static PASS and test all other 495 candidate pairs.
Stage B: remove TWO existing P2.10 outer bearing prototypes and TWO P2.11
bearings that are present only in the P2.12 input; add six remaining toe
parts and sixteen P2.14 split-race parts -> 71. Reuse stage A's surviving
49-body exact PASS; test all other 1309 candidate pairs.

Only *static nominal pose*, not actual Model B measured rear hardpoints,
chassis fitting, motion sweeps, bolt preload, wheel spin, CV operation or
original F1 OEM authenticity. Even PASS keeps mechanical G2 on HOLD.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any

# SHA-1s of exact Git blobs on work/engineering-four-corners-local at 2026-11-10.
# No silent change of the baseline source is allowed in this P2.24 review.
VERIFIED_SOURCE_BLOBS = {
    'p2_9_rear_upright.py': '0a6b95d53479b63006d2103b24efb44e846589b1',
    'p2_10_rear_wishbone.py': 'e8cdb4b652300a514e7eb015bf3cc9020765d11e',
    'p2_11_rear_toe_link.py': '8ea653169f8a813acc52421089daf48855b773ca',
    'p2_12_toe_adjuster.py': '561ebdd652e5bf446bb946c56f907f4c5c0a8d67',
    'p2_12_constrained_kinematics.py': '2a419ff07ea5b203273647749af606c27098a67d',
    'p2_13_rear_joint_prototype.py': '32fc40ba114ef52724caa526f81a11e600daecbf',
    'p2_14_split_spherical_race.py': '9cea3e634348aa578391f42b491372d3b03db319',
    'p2_16_rear_wheel_end.py': 'b140147ea2504a8bb90616b3671b608aa5f4ccce',
    'p2_17_rear_brake_drive.py': '7d4a0b64b309b234c16965465130e496f787de5e',
    'p2_18_center_lock.py': 'eee7a4f0099a3e8acf96692afded74a0c0b0a54f',
    'p2_19_rear_wishbone_clearance.py': '3a71f504fcf49c324584e1ae330f294a2b9b0b63',
    'p2_21_rear_rotor_mount.py': '5048d12325b567d146d9e72154d478cc09da05a6',
    'p2_22_keyed_hub_rotor.py': 'd2b513c5e0ba6c6c8d5825785123027be7035109',
    'p2_23_spindle_hub_keyed_mate.py': 'ee85d36feb26d475f3ee4e0a4712a78c6b38f6eb',
    'p2_20_rear_joint_cross_source_gate.py': '27475648a16ec394be7203c6726b11a35f86ab30',
}
PALETTE_PATH = 'apps/web/src/dev/assemblyPreview/engineeringNeutralPalette.json'
PALETTE_BLOB = '7a3989f9ee7d9eca1912f3d71272dc54fce14240'
SCHEMA = 'peds.cad-first.p224-latest-rear71-authentic-static-gate.v1'
COLOR = '#87929d'
WHEEL40 = 40
SUSPENSION11 = 11
TOE19 = 19
SPLIT16 = 16
INTERMEDIATE51 = 51
FINAL71 = 71
REAR_KEYS = {'P216_REAR_HUB_STUB', 'P218_REAR_MALE_HELICAL_SPINDLE_EXTENSION',
             'P217_REAR_ROTOR_HAT_SPACER'}
REVISED_ARMS = {'P210_REAR_UPPER_A_ARM_FORGED', 'P210_REAR_LOWER_A_ARM_FORGED'}
EXPECTED_BEARING_NAMES = {
    'UPPER': 'P210_REAR_UPPER_OUTER_SPHERICAL_BEARING_PROPOSAL',
    'LOWER': 'P210_REAR_LOWER_OUTER_SPHERICAL_BEARING_PROPOSAL',
    'TOE_OUTER': 'P211_REAR_TOE_OUTER_BEARING_PROPOSAL',
    'TOE_INNER': 'P211_REAR_TOE_INNER_BEARING_PROPOSAL',
}


def git_blob_sha(path: Path) -> str:
    b = path.read_bytes()
    return hashlib.sha1(b'blob ' + str(len(b)).encode() + b'\0' + b).hexdigest()


def authenticate_source_tree(root: Path) -> dict[str, str]:
    """Prevent a transcribed fixture from impersonating original P2.12/P2.14."""
    verified = {}
    for filename, sha in VERIFIED_SOURCE_BLOBS.items():
        path = root / filename
        if not path.is_file():
            raise FileNotFoundError(f'Required original GitHub source absent: {filename}')
        actual = git_blob_sha(path)
        if actual != sha:
            raise ValueError(f'Unapproved native CAD Git blob: {filename}: {actual} != {sha}')
        verified[filename] = actual
    palette = root.parents[1] / PALETTE_PATH
    if not palette.is_file():
        raise FileNotFoundError('Original shared CAD material palette is missing')
    if git_blob_sha(palette) != PALETTE_BLOB:
        raise ValueError('User-authorized engineering neutral palette SHA changed')
    verified[PALETTE_PATH] = PALETTE_BLOB
    return verified


def compose_intermediate(rear40: dict[str, Any], suspension11: dict[str, Any],
                         rear40_pass: bool) -> tuple[dict[str, Any], set[str], set[str], dict]:
    if not rear40_pass:
        raise ValueError('P2.23 real 40-body native collision audit required')
    if len(rear40) != WHEEL40 or len(suspension11) != SUSPENSION11:
        raise ValueError('Exact P2.23 40 and original P2.9/P2.10 11 solid sources required')
    if not REAR_KEYS <= set(rear40) or not REVISED_ARMS <= set(suspension11):
        raise ValueError('Missing P2.23 four-key rear hub/spindle or P2.19 corrected wishbones')
    if sum(k.startswith('P221_REAR_ROTOR_HAT_STUD_UNTHREADED_') for k in rear40) != 8:
        raise ValueError('P2.21 added exactly eight native rotor-hat studs')
    if set(rear40) & set(suspension11):
        raise ValueError('Source ownership collision between rear40 and suspension11')
    joined = {**rear40, **suspension11}
    if len(joined) != INTERMEDIATE51:
        raise ValueError('Intermediate rear source must have exactly 51 bodies')
    return joined, set(rear40), set(suspension11), {
        'oldRear40Count': WHEEL40,
        'newIndependentSuspensionCount': SUSPENSION11,
        'staticStagePartCount': INTERMEDIATE51,
        'previouslyAuditedRear40Pairs': WHEEL40*(WHEEL40-1)//2,
        'potentialAdditionalPairs': INTERMEDIATE51*(INTERMEDIATE51-1)//2 - WHEEL40*(WHEEL40-1)//2,
    }


def compose_final(intermediate51: dict[str, Any], toe19: dict[str, Any],
                  split16: dict[str, Any], replace: dict[str, str],
                  intermediate_pass: bool) -> tuple[dict[str, Any],set[str],set[str],dict]:
    if not intermediate_pass:
        raise ValueError('Actual intermediate 51-native-solid collision audit must PASS')
    if (len(intermediate51),len(toe19),len(split16)) != (INTERMEDIATE51,TOE19,SPLIT16):
        raise ValueError('P2.24 expected exact 51 / 19 / 16 authoring lineage')
    if replace != EXPECTED_BEARING_NAMES:
        raise ValueError('P2.14 four bearing replacement IDs changed or incomplete')
    if set(split16) & (set(intermediate51) | set(toe19)):
        raise ValueError('P2.14 new bearing source IDs are duplicated')
    source_shared = set(intermediate51) & set(toe19)
    suspension = {k for k in intermediate51 if k.startswith(('P29_', 'P210_'))}
    if len(source_shared)!=11 or source_shared!=suspension:
        raise ValueError('P2.12 must share 11 EXACT existing P2.9/P2.10 source owner IDs')
    replaced = set(replace.values())
    if len(replaced)!=4 or not replaced <= (set(intermediate51)|set(toe19)):
        raise ValueError('Four original bearing proxies must be explicitly removed')
    if len(replaced & set(intermediate51))!=2 or len(replaced & set(toe19))!=4:
        raise ValueError('Two P2.10 plus two P2.11 bearing proxies expected')
    retained = {k: v for k, v in intermediate51.items() if k not in replaced}
    additions = {k: v for k, v in toe19.items() if k not in source_shared and k not in replaced}
    if len(retained)!=49 or len(additions)!=6:
        raise ValueError('P2.24 source owner invariant 49 retained + 6 toe + 16 split')
    full = {**retained, **additions, **split16}
    if len(full)!=FINAL71 or not REVISED_ARMS <= set(full) or not REAR_KEYS <= set(full):
        raise ValueError('Source 71-body CAD union incomplete or replaced original repairs')
    fresh=set(additions)|set(split16)
    return full,set(retained),fresh,{
        'stage51Bodies': INTERMEDIATE51,
        'p212IncomingBodies': TOE19,
        'p214NativeSplitBodies': SPLIT16,
        'sharedP29P210SourceIdsPreservedFromP219': sorted(source_shared),
        'removedFourOriginalBearingProxies': sorted(replaced),
        'sixNewToeSourceIds': sorted(additions),
        'sixteenSplitRaceSourceIds': sorted(split16),
        'retainedExistingSourceBodies': len(retained),
        'newlyIntegratedSourceBodies': len(fresh),
        'candidateBodyCount': len(full),
        'candidateAllPairs': FINAL71*(FINAL71-1)//2,
        'previouslyVerifiedOldOldPairs': len(retained)*(len(retained)-1)//2,
        'crossSourcePairCandidates': FINAL71*(FINAL71-1)//2 - len(retained)*(len(retained)-1)//2,
    }


def static_stage(geometry:dict[str,Any], old_ids:set[str],new_ids:set[str]) -> dict:
    # Re-use P2.20's native OCCT pair screen. It explicitly counts ALL pairs,
    # including prior-old and new-new; no AABB-only false certifications.
    from p2_20_rear_joint_cross_source_gate import incremental_brep_audit
    result = incremental_brep_audit(geometry, old_ids, new_ids)
    if result['allPairs'] != len(geometry)*(len(geometry)-1)//2:
        raise AssertionError('Incomplete native pair accounting')
    return result


def make_report(auth:dict, first_proof:dict,final_proof:dict|None,
                first_meta:dict,final_meta:dict|None,part_ids:list[str]) -> dict:
    passed51 = first_proof['passNewCrossSourceStatic']
    passed71 = final_proof is not None and final_proof['passNewCrossSourceStatic']
    return {
        'schema': SCHEMA,
        'status': 'STATIC_REAR71_PASS_MECHANICAL_G2_HOLD' if passed51 and passed71
                  else 'INTERMEDIATE_51_INTERFERENCE_HOLD' if not passed51
                  else 'FINAL_71_INTERFERENCE_HOLD',
        'exactOriginalUpstreamGitBlobSha1': auth,
        'initial51SourceOwnership': first_meta,
        'initial51NativeBRepAudit': first_proof,
        'candidate71SourceOwnership': final_meta,
        'candidate71NativeBRepAudit': final_proof,
        'candidatePartIds':sorted(part_ids),
        'actualModelBSourceUsedForMating': False,
        'realModelBChassisHardpointsMeasured': False,
        'static71SourceCertified':bool(passed51 and passed71),
        'dynamicKinematicsCertified':False,
        'actualThreadTorqueAndBearingPreloadCertified':False,
        'realBrakeAndCVDriveTransmissionCertified':False,
        'mechanicalG2Certified':False,
        'fullF1Completed':False,
        'viewerUniformColor':COLOR,
    }


def run(out:Path,export_review:bool=False)->dict:
    if out.exists():
        raise FileExistsError('P2.24 refuses overwrite of author source evidence')
    source_dir=Path(__file__).resolve().parent
    auth=authenticate_source_tree(source_dir)
    # These native imports are deliberately AFTER exact immutable blob check;
    # no mock/synthetic fallback is accepted for the actual owner source gate.
    from p2_23_spindle_hub_keyed_mate import joined_source_223
    from p2_19_rear_wishbone_clearance import revised_suspension
    from p2_12_toe_adjuster import all_parts
    from p2_14_split_spherical_race import source_parts,SOURCE_BEARING_TO_REPLACE

    wheel40,_,wheel_proof=joined_source_223()
    first,prior,new,first_meta=compose_intermediate(
        wheel40,revised_suspension(),wheel_proof['nativeStaticAudit']['passStatic'])
    first_proof=static_stage(first,prior,new)
    final_proof=None
    final_meta=None
    final_ids=list(first)
    full=None
    if first_proof['passNewCrossSourceStatic']:
        full,old,new,final_meta=compose_final(
            first,all_parts(),source_parts(),SOURCE_BEARING_TO_REPLACE,True)
        final_proof=static_stage(full,old,new)
        final_ids=list(full)
    report=make_report(auth,first_proof,final_proof,first_meta,final_meta,final_ids)
    out.mkdir(parents=True)
    (out/'P224_rear71_authentic_native_audit.json').write_text(json.dumps(report,indent=2)+'\n')
    if export_review and report['static71SourceCertified']:
        from p2_24_rear71_review_export import export_source
        export_source(full,report,out/'review')
    return report


if __name__ == '__main__':
    cli=argparse.ArgumentParser()
    cli.add_argument('--out',type=Path,required=True)
    cli.add_argument('--export-review',action='store_true')
    options=cli.parse_args()
    report=run(options.out,options.export_review)
    print(json.dumps({'status':report['status'],
                      'initial51':report['initial51NativeBRepAudit'],
                      'final71':report['candidate71NativeBRepAudit']},indent=2))
    if not report['static71SourceCertified']:
        raise SystemExit(2)
