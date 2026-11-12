#!/usr/bin/env python3
"""P2.34AJ: scan local unreachable Git blobs for SHA-pinned original P2.34E.

Read-only Git discovery; dangling objects may be pruned by git gc.
A Git LFS pointer is not the actual source STEP.
"""
from __future__ import annotations
import argparse,hashlib,json,re,sys
from pathlib import Path
from p2_34af_git_history_recovery import SOURCE_PINS,git

SCHEMA='peds.cad-first.p234aj-unreachable-git-source-v1'
OID=re.compile(rb'^[0-9a-f]{40}$|^[0-9a-f]{64}$')

def inspect(repo,pins=None,max_objects=30000,max_bytes=500_000_000):
    pins=dict(SOURCE_PINS if pins is None else pins)
    if len(pins)!=3 or len(set(pins.values()))!=3 or any(
        not isinstance(v,str) or re.fullmatch('[0-9a-f]{64}',v) is None for v in pins.values()):
        raise ValueError('Exactly three unique original SHA-256 pins required')
    if type(max_objects)!=int or not 1<=max_objects<=500000:raise ValueError('Invalid object budget')
    if type(max_bytes)!=int or not 1024<=max_bytes<=2000000000:raise ValueError('Invalid byte budget')
    root=Path(repo)
    if not root.is_dir():raise ValueError('Repository directory missing')
    git(root,'rev-parse','--git-dir')
    output=git(root,'fsck','--full','--no-reflogs','--unreachable','--no-progress')
    objects=set()
    for line in output.splitlines():
        fields=line.split()
        if len(fields)==3 and fields[0] in (b'unreachable',b'dangling') and fields[1]==b'blob':
            if OID.fullmatch(fields[2]) is None:raise ValueError('Invalid Git fsck object ID')
            objects.add(fields[2].decode('ascii'))
    if len(objects)>max_objects:raise ValueError('Git dangling-object budget exceeded')
    reverse={sha:name for name,sha in pins.items()}
    matches={name:[] for name in pins};pointers=[]
    count=skipped=0
    for oid in sorted(objects):
        size=int(git(root,'cat-file','-s',oid).strip())
        if size>max_bytes:skipped+=1;continue
        data=git(root,'cat-file','blob',oid)
        if len(data)!=size:raise ValueError('Inconsistent Git object size')
        count+=1
        sha=hashlib.sha256(data).hexdigest()
        if sha in reverse:matches[reverse[sha]].append({'blobSHA':oid,'byteCount':size})
        if len(data)<=1024 and data.startswith(b'version https://git-lfs.github.com/spec/v1\n'):
            try:
                rows=dict(line.split(' ',1) for line in data.decode('ascii').splitlines()[1:])
                raw_sha=rows.get('oid','')
                expected_size=int(rows['size'])
                if raw_sha.startswith('sha256:') and raw_sha[7:] in reverse and expected_size>0:
                    pointers.append({'originalFile':reverse[raw_sha[7:]],
                                     'lfsPointerBlobSHA':oid,'pointerOnly':True,
                                     'expectedLfsObjectSize':expected_size})
            except (ValueError,KeyError,UnicodeError):
                pass
    return {'schema':SCHEMA,'matches':matches,'lfsPointers':pointers,
            'allExactSourceBlobsFound':all(matches.values()),
            'unreachableBlobsInspected':count,'oversizeBlobsSkipped':skipped,
            'originalSourceModified':False,'gitRepositoryModified':False,
            'nativeGeometryValidated':False,'mechanicalG2Certified':False,
            'status':'PINNED_UNREACHABLE_BLOBS_FOUND_G2_HOLD' if all(matches.values())
                     else 'PINNED_UNREACHABLE_BLOBS_NOT_FOUND_G2_HOLD'}

def restore_exact_blobs(repo,destination,evidence,pins=None):
    """Pass discovered objects to AG for independent exact byte verification."""
    pins=dict(SOURCE_PINS if pins is None else pins)
    if not isinstance(evidence,dict) or evidence.get('schema')!=SCHEMA:
        raise ValueError('Untrusted AJ evidence schema')
    if evidence.get('allExactSourceBlobsFound') is not True:
        raise ValueError('All three original blobs required')
    from p2_34ag_git_blob_restore import restore
    af_evidence={'schema':'peds.cad-first.p234af-git-history-source-recovery.v1',
                 'matches':evidence['matches']}
    return restore(repo,destination,inventory=af_evidence,pins=pins)

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--repo',required=True,type=Path)
    p.add_argument('--out',required=True,type=Path)
    p.add_argument('--stage-dir',type=Path)
    p.add_argument('--max-objects',type=int,default=30000)
    p.add_argument('--max-bytes',type=int,default=500_000_000)
    a=p.parse_args()
    if a.out.exists() or a.out.is_symlink():raise FileExistsError('Never overwrite Git history audit')
    result=inspect(a.repo,max_objects=a.max_objects,max_bytes=a.max_bytes)
    if a.stage_dir and result['allExactSourceBlobsFound']:
        result['staged']=restore_exact_blobs(a.repo,a.stage_dir,result)
    a.out.parent.mkdir(parents=True,exist_ok=True)
    with a.out.open('x',encoding='utf8') as handle:
        handle.write(json.dumps(result,indent=2,allow_nan=False)+'\n')
    print(json.dumps({'status':result['status'],
                      'unreachableBlobsInspected':result['unreachableBlobsInspected']}))
    return 0 if result['allExactSourceBlobsFound'] else 2

if __name__=='__main__':sys.exit(main())
