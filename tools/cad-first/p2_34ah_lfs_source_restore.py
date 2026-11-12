#!/usr/bin/env python3
"""P2.34AH: restore authentic P2.34E files from locally present Git LFS objects.

A Git LFS pointer alone cannot count as a recovered STEP file. Exact bytes and
all three original SHA pins are required. No network, CAD mutation or G2 approval.
"""
from __future__ import annotations
import argparse,hashlib,json,os,re,stat,sys
from pathlib import Path
from p2_34af_git_history_recovery import SOURCE_PINS,git,inspect

SCHEMA='peds.cad-first.p234ah-lfs-original-source-restore.v1'
AF_SCHEMA='peds.cad-first.p234af-git-history-source-recovery.v1'
OID=re.compile(r'^[0-9a-f]{40}$|^[0-9a-f]{64}$')
HEX=re.compile(r'^[0-9a-f]{64}$')

def parse_pointer(data):
    if len(data)>1024 or not data.startswith(b'version https://git-lfs.github.com/spec/v1\n'):
        raise ValueError('Not a canonical LFS pointer')
    try:
        lines=data.decode('ascii').splitlines()
        values={}
        for line in lines[1:]:
            k,v=line.split(' ',1)
            if k in values:raise ValueError('Repeated LFS pointer key')
            values[k]=v
        oid=values['oid'];count=int(values['size'])
    except (UnicodeError,KeyError,ValueError) as error:
        raise ValueError('Malformed LFS pointer') from error
    if not oid.startswith('sha256:') or not HEX.fullmatch(oid[7:]) or count<=0:
        raise ValueError('Invalid LFS pointer object')
    return oid[7:],count

def locate(repo,pins=None,inventory=None,lfs_dir=None):
    pins=dict(SOURCE_PINS if pins is None else pins)
    if len(pins)!=3 or len(set(pins.values()))!=3 or any(not HEX.fullmatch(d) for d in pins.values()):
        raise ValueError('Three distinct SHA-256 pins required')
    repo=Path(repo)
    if inventory is None:inventory=inspect(repo,pins)
    if not isinstance(inventory,dict) or inventory.get('schema')!=AF_SCHEMA:
        raise ValueError('Wrong AF inventory schema')
    pointers=inventory.get('lfsPointers')
    if not isinstance(pointers,list):raise ValueError('LFS pointer evidence missing')
    if lfs_dir is None:
        gitdir=git(repo,'rev-parse','--path-format=absolute','--git-common-dir').decode().strip()
        lfs_dir=Path(gitdir)/'lfs'/'objects'
    else:lfs_dir=Path(lfs_dir)
    # Historical pointer revisions may disagree on the advertised length.
    # Never silently prefer the first matching SHA in an untrusted inventory.
    alternatives={name:[] for name in pins}
    for item in pointers:
        if not isinstance(item,dict):
            raise ValueError('Malformed LFS inventory entry')
        name=item.get('originalFile');oid=item.get('lfsPointerBlobSHA')
        if name not in pins or not isinstance(oid,str) or not OID.fullmatch(oid):
            raise ValueError('Malformed LFS inventory pointer reference')
        if git(repo,'cat-file','-t',oid).strip()!=b'blob':
            raise ValueError('LFS inventory points to non-blob')
        pointer_sha,size=parse_pointer(git(repo,'cat-file','blob',oid))
        if pointer_sha!=pins[name]:
            raise ValueError('LFS pointer no longer matches pinned source: '+name)
        alternatives[name].append((size,oid))
    found={name:None for name in pins}
    for name,values in alternatives.items():
        if not values:continue
        if len({size for size,_ in values})!=1:
            raise ValueError('Conflicting historical LFS pointer sizes: '+name)
        size,oid=min(values,key=lambda item:item[1])
        pointer_sha=pins[name]
        candidate=lfs_dir/pointer_sha[:2]/pointer_sha[2:4]/pointer_sha
        found[name]={'pointerBlobSHA':oid,'objectSHA256':pointer_sha,
                     'expectedSize':size,'localObjectPath':str(candidate)}
    return {'schema':SCHEMA,'lfsObjectCandidates':found,
            'allThreePointersVerified':all(found.values()),
            'nativeGeometryValidated':False,'mechanicalG2Certified':False}

def copy_lfs(entry,target,max_bytes=500_000_000):
    expected=entry['objectSHA256'];count=entry['expectedSize']
    if type(count) is not int or not 0<count<=max_bytes:raise ValueError('Invalid LFS payload size')
    if not HEX.fullmatch(expected):raise ValueError('Invalid LFS content hash')
    path=Path(entry['localObjectPath'])
    if path.is_symlink() or any(p.is_symlink() for p in path.parents):
        raise ValueError('LFS object path symlink rejected')
    nofollow=getattr(os,'O_NOFOLLOW',None)
    if nofollow is None:raise RuntimeError('O_NOFOLLOW required')
    fd=os.open(path,os.O_RDONLY|nofollow)
    try:
        st=os.fstat(fd)
        if not stat.S_ISREG(st.st_mode) or st.st_size!=count:
            raise ValueError('LFS payload not a regular file or size mismatch')
        h=hashlib.sha256();length=0
        with os.fdopen(os.dup(fd),'rb') as src,target.open('xb') as dst:
            for piece in iter(lambda:src.read(1<<20),b''):
                length+=len(piece)
                if length>max_bytes:raise ValueError('LFS object too large')
                h.update(piece);dst.write(piece)
        if length!=count or h.hexdigest()!=expected:
            raise ValueError('LFS object SHA or length mismatch')
        if hashlib.sha256(target.read_bytes()).hexdigest()!=expected:
            raise ValueError('Staged LFS copy not identical')
    finally:os.close(fd)

def restore(repo,destination,pins=None,inventory=None,lfs_dir=None):
    pins=dict(SOURCE_PINS if pins is None else pins)
    target=Path(destination)
    if target.exists() or target.is_symlink():raise FileExistsError('Refuse existing output')
    if any(parent.is_symlink() for parent in target.parents):
        raise ValueError('Symlinked staging parent')
    plan=locate(repo,pins,inventory,lfs_dir)
    if not plan['allThreePointersVerified']:
        raise ValueError('Not all pinned LFS pointers present in Git')
    for name,entry in plan['lfsObjectCandidates'].items():
        if Path(name).name!=name or name in ('.','..') or entry['objectSHA256']!=pins[name]:
            raise ValueError('Invalid target name or original SHA pin')
        source=Path(entry['localObjectPath'])
        if not source.is_file() or source.is_symlink():
            raise ValueError('Matching real LFS object not available')
    target.mkdir(parents=True,exist_ok=False);created=[]
    try:
        for name,entry in plan['lfsObjectCandidates'].items():
            path=target/name;created.append(path)
            copy_lfs(entry,path)
        report={'schema':SCHEMA,'restoredSource':{
            name:{'sourceSHA256':entry['objectSHA256'],'lfsPointerBlobSHA':entry['pointerBlobSHA']}
            for name,entry in plan['lfsObjectCandidates'].items()},
            'nativeGeometryValidated':False,'mechanicalG2Certified':False,
            'status':'ALL_PINNED_REAL_LFS_OBJECTS_RESTORED_G2_HOLD'}
        manifest=target/'P234AH_lfs_restore_audit.json';created.append(manifest)
        with manifest.open('x',encoding='utf-8') as stream:
            stream.write(json.dumps(report,indent=2,allow_nan=False)+'\n')
        return report
    except Exception:
        for path in reversed(created):path.unlink(missing_ok=True)
        target.rmdir()
        raise

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--repo',required=True,type=Path)
    p.add_argument('--stage-dir',required=True,type=Path)
    p.add_argument('--inventory',type=Path)
    p.add_argument('--lfs-dir',type=Path)
    a=p.parse_args()
    inventory=json.loads(a.inventory.read_text()) if a.inventory else None
    result=restore(a.repo,a.stage_dir,inventory=inventory,lfs_dir=a.lfs_dir)
    print(json.dumps({'status':result['status']}))
    return 0
if __name__=='__main__':sys.exit(main())
