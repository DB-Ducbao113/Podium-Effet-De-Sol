#!/usr/bin/env python3
"""P2.32 source-identity gate: genuine P2.31 STEP -> proposed P2.14 rear76.

Not a native 76-solid collision PASS. No Model B, dynamics or OEM certification.
Local original P2.11–P2.14 bytes may be authenticated via --source-root.
"""
import argparse,hashlib,json
from pathlib import Path

STEP_SHA='e09a949f8827be01f9c0e50fc9b9c781b302642f3b40ea432836fe16d7eac284'
SOURCE_BLOBS={
 'p2_11_rear_toe_link.py':'8ea653169f8a813acc52421089daf48855b773ca',
 'p2_12_toe_adjuster.py':'561ebdd652e5bf446bb946c56f907f4c5c0a8d67',
 'p2_12_constrained_kinematics.py':'2a419ff07ea5b203273647749af606c27098a67d',
 'p2_13_rear_joint_prototype.py':'32fc40ba114ef52724caa526f81a11e600daecbf',
 'p2_14_split_spherical_race.py':'9cea3e634348aa578391f42b491372d3b03db319',
}
P211=('P211_REAR_TOE_LINK_TUBULAR_FORGED','P211_REAR_TOE_OUTER_BEARING_PROPOSAL',
      'P211_REAR_TOE_INNER_BEARING_PROPOSAL','P211_REAR_TOE_OUTER_CLEVIS_PIN')
P212=('P212_TOE_OUTER_RIGHT_HAND_THREADED_ROD_END',
      'P212_TOE_INNER_LEFT_HAND_THREADED_ROD_END',
      'P212_TOE_TURNBUCKLE_HOLLOW_SLEEVE','P212_TOE_OUTER_HEX_LOCKNUT',
      'P212_TOE_INNER_HEX_LOCKNUT')
STATIONS=('UPPER','LOWER','TOE_OUTER','TOE_INNER')
SPLIT=('SPLIT_RACE_POSITIVE_X','SPLIT_RACE_NEGATIVE_X',
       'DRILLED_SPHERICAL_BALL','SLIDING_RETENTION_SLEEVE')
P210_OLD={'P210_REAR_UPPER_OUTER_SPHERICAL_BEARING_PROPOSAL',
          'P210_REAR_LOWER_OUTER_SPHERICAL_BEARING_PROPOSAL'}

def sha256(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def git_blob(p):
    data=p.read_bytes()
    return hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()

def audit(step:Path,source_names:Path,out:Path,source_root:Path|None=None):
    if out.exists():raise FileExistsError('P2.32 source evidence must not overwrite existing output')
    if not step.is_file() or sha256(step)!=STEP_SHA:
        raise ValueError('Original P2.31 STEP sha256 mismatch')
    m=json.loads(source_names.read_text())
    names=m['nameToZeroBasedSolidIndex']
    if m.get('stepSHA256')!=STEP_SHA or m.get('partCount')!=56 or len(names)!=56 or set(names.values())!=set(range(56)):
        raise ValueError('Original P2.31 56-body STEP/source name ledger mismatch')
    original=set(names)
    shared={x for x in original if x.startswith(('P29_','P210_'))}
    if len(shared)!=11 or len({x for x in original if x.startswith('P210_')})!=10 or not P210_OLD<=original:
        raise ValueError('P2.31 correct source ownership and obsolete P2.10 bearing roles not found')
    toe_source=shared|set(P211[1:])|set(P212)
    obsolete=P210_OLD|{P211[1],P211[2]}
    split={f'P214_{st}_{suffix}' for st in STATIONS for suffix in SPLIT}
    retained=original-P210_OLD
    added_toe=toe_source-original-obsolete
    union=retained|added_toe|split
    if (len(toe_source),len(retained),len(added_toe),len(split),len(union))!=(19,54,6,16,76):
        raise ValueError('Exact source owner contract 54 + 6 + 16 = 76 violated')
    if union&obsolete or P211[0] in union or any(x.startswith('P213_') for x in union):
        raise ValueError('Source bearing or fixed rod deletion not properly applied')
    authenticated={}
    if source_root is not None:
        for f,expected in SOURCE_BLOBS.items():
            p=source_root/f
            if not p.is_file():raise FileNotFoundError('Original native source missing: '+str(p))
            if git_blob(p)!=expected:raise ValueError('Git blob mismatch: '+f)
            authenticated[f]=expected
    doc={'schema':'peds.cad-first.p232-rear76-repo-owner-gate.v1',
        'status':'SOURCE_OWNERSHIP_PASS_ACTUAL_76_BREP_HOLD',
        'patch':'P2.32/54','p231OriginalSTEPsha256':STEP_SHA,
        'p231NameMapSHA256':sha256(source_names),
        'reviewedOriginalSourceGitBlobs':SOURCE_BLOBS,
        'originalSourceFilesVerifiedInLocalCheckout':bool(authenticated),
        'originalSourceBlobsAuthenticatedLocally':authenticated,
        'p212IncomingCount':len(toe_source),'p212SharedOwnerCount':len(shared),
        'obsoleteOriginalBearings':sorted(obsolete),'removedP211FixedRod':P211[0],
        'retainedOriginalP231Parts':sorted(retained), 'newToePartIds':sorted(added_toe),
        'newSplitJointPartIds':sorted(split), 'candidateSource76PartIds':sorted(union),
        'candidateParts':76,'candidateAllPairs':2850,
        'inheritedOld54Pairs':1431,'newNativePairsPending':1419,
        'nominalSleeveOuterEyeRadialClearanceMm':.12,
        'realOriginal76NativeCollisionGateExecuted':False,
        'actualModelBAssetIncluded':False,'mechanicalG2Certified':False}
    out.mkdir(parents=True)
    (out/'P232_rear76_repo_owner_gate.json').write_text(json.dumps(doc,indent=2)+'\n')
    return doc

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--p231-step',type=Path,required=True)
    p.add_argument('--p231-names',type=Path,required=True)
    p.add_argument('--out',type=Path,required=True)
    p.add_argument('--source-root',type=Path,default=None)
    a=p.parse_args()
    r=audit(a.p231_step,a.p231_names,a.out,a.source_root)
    print(json.dumps({'status':r['status'],'candidateParts':r['candidateParts'],
                      'newNativePairsPending':r['newNativePairsPending']},indent=2))
