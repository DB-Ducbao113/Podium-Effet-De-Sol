#!/usr/bin/env python3
"""Locate exact SHA-pinned source84 files in locally available Git history.

Read-only except for an explicitly requested new output report. Git-LFS pointers
are reported, never mistaken for recovered STEP geometry.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import subprocess
import sys
from pathlib import Path

SOURCE_PINS = {
    'P234E_source84_revised_six_ball_clearance.step': '9bd7ec6a60d5c4c9f1f3e421cb730fc252de026aae21dcf570584e5dda0ec63e',
    'P234E_source84_name_index.json': '57afa74054ca892d2cb5633fb1c03a3c906fc2a928adf45f4674aa008952a62a',
    'P234E_source84_ball_contact_audit.json': 'b2eb8da1720cd5bf206e716e24ad8ebdde28d620bf31aaea456edb1b05e4b894',
}
SCHEMA = 'peds.cad-first.p234af-git-history-source-recovery.v1'


def git(repo, *args, input_bytes=None):
    p = subprocess.run(['git', '-C', str(repo), *args], input=input_bytes,
                       stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
    if p.returncode:
        raise ValueError('git '+ ' '.join(args[:2])+' failed: '+p.stderr.decode('utf-8','replace')[:250])
    return p.stdout


def inspect(repo, pins=None, max_objects=30000, max_bytes=500_000_000):
    pins = SOURCE_PINS if pins is None else dict(pins)
    if len(pins) != 3 or len(set(pins.values())) != 3 or any(len(v)!=64 for v in pins.values()):
        raise ValueError('Require three distinct immutable SHA-256 source pins')
    if type(max_objects) is not int or not 1 <= max_objects <= 500000:
        raise ValueError('Invalid object budget')
    if type(max_bytes) is not int or not 1024 <= max_bytes <= 2_000_000_000:
        raise ValueError('Invalid size budget')
    repo = Path(repo)
    if not repo.is_dir():raise ValueError('Local repository directory missing')
    git(repo, 'rev-parse', '--git-dir')
    raw = git(repo, 'rev-list', '--objects', '--all')
    lines = raw.splitlines()
    if len(lines) > max_objects:raise ValueError('Git object budget exceeded; narrow repository scope')
    lookup={v:k for k,v in pins.items()}
    matches={k:[] for k in pins}
    pointers=[];examined=0;skipped=0
    seen=set()
    for line in lines:
        blob = line.split(b' ',1)[0].decode('ascii')
        if blob in seen:continue
        seen.add(blob)
        info=git(repo,'cat-file','-s',blob)
        size=int(info.strip())
        typ=git(repo,'cat-file','-t',blob).strip()
        if typ != b'blob':continue
        if size>max_bytes:skipped+=1;continue
        data=git(repo,'cat-file','blob',blob)
        examined+=1
        digest=hashlib.sha256(data).hexdigest()
        if digest in lookup:matches[lookup[digest]].append({'blobSHA':blob,'byteCount':len(data)})
        if data.startswith(b'version https://git-lfs.github.com/spec/v1\n'):
            try:
                text=data.decode('ascii')
                items=dict(row.split(' ',1) for row in text.strip().splitlines()[1:])
                oid=items.get('oid','')
                if oid.startswith('sha256:') and oid[7:] in lookup:
                    pointers.append({'originalFile':lookup[oid[7:]],'lfsPointerBlobSHA':blob,
                                     'lfsObjectAvailableInGitBlob':False})
            except (UnicodeError,ValueError):pass
    return {'schema':SCHEMA,'matches':matches,'lfsPointers':pointers,
            'allExactSourceBlobsFound':all(matches.values()),
            'objectsExamined':examined,'objectsOversizedSkipped':skipped,
            'gitWorktreeModified':False,'mechanicalG2Certified':False,
            'status':'EXACT_SOURCE_BLOBS_FOUND_G2_HOLD' if all(matches.values())
                     else 'ORIGINAL_SOURCE_BLOBS_NOT_RECOVERED_G2_HOLD'}


def main():
    p=argparse.ArgumentParser()
    p.add_argument('--repo',type=Path,required=True)
    p.add_argument('--out',type=Path,required=True)
    p.add_argument('--max-objects',type=int,default=30000)
    p.add_argument('--max-bytes',type=int,default=500_000_000)
    a=p.parse_args()
    if a.out.exists():raise FileExistsError('Evidence path exists')
    r=inspect(a.repo,max_objects=a.max_objects,max_bytes=a.max_bytes)
    a.out.parent.mkdir(parents=True,exist_ok=True)
    a.out.write_text(json.dumps(r,indent=2,allow_nan=False)+'\n',encoding='utf8')
    print(json.dumps({'status':r['status'],'objectsExamined':r['objectsExamined']}))
    return 0 if r['allExactSourceBlobsFound'] else 2
if __name__=='__main__':sys.exit(main())
