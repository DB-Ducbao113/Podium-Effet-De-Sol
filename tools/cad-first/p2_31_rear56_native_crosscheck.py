#!/usr/bin/env python3
"""P2.31 repo-native 48 STEP + eight original P2.10 B-Rep collision crosscheck.

P2.30 48-original STEP is the approved prior-native source; P2.10 builds the
additional eight *real author* CAD B-Reps, excluding superseded A-arms.
Checks 412 affected pairs by AABB + OCC exact Boolean. Existing 1128 pairs
are inherited from a separately pinned prior 48-native audit; not retested.
Original Model B, P2.12/P2.14, dynamics and mechanical G2 are NOT certified.
"""
from __future__ import annotations
import argparse,hashlib,json,math
from pathlib import Path
import cadquery as cq
from p2_10_rear_wishbone import build_parts

SCHEMA='peds.cad-first.p231-native56-cross-source-check.v1'
P210_SHA='e8cdb4b652300a514e7eb015bf3cc9020765d11e'
P29_SHA='0a6b95d53479b63006d2103b24efb44e846589b1'
P230_STEP_SHA='50d3856a8600e3826e8ce810cc6af74b301ffbacb940af7e355e2fbbaae654dc'
ARMS={'P210_REAR_LOWER_A_ARM_FORGED','P210_REAR_UPPER_A_ARM_FORGED'}
THRESHOLD_MM3=.05


def digest(path:Path)->str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def blob(path:Path)->str:
    raw=path.read_bytes()
    return hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()


def collision_check(previous:dict,fresh:dict,prior_pass:bool)->dict:
    if not prior_pass or len(previous)!=48 or len(fresh)!=8 or set(previous)&set(fresh):
        raise ValueError('Exactly 48 original prior PASS and 8 nonduplicated P2.10 B-Reps required')
    excluded=exact=0;collisions=[];kernel_errors=[];intersections=[]
    for name,part in fresh.items():
        for other,target in {**previous,**{n:p for n,p in fresh.items() if n>name}}.items():
            a,b=part.BoundingBox(),target.BoundingBox()
            if any(min(getattr(a,q+'max'),getattr(b,q+'max'))-
                   max(getattr(a,q+'min'),getattr(b,q+'min'))<=1e-6 for q in 'xyz'):
                excluded+=1;continue
            exact+=1
            try:
                v=float(part.intersect(target).Volume())
                if not math.isfinite(v) or v<0:raise ValueError('Invalid OCC Boolean result')
                item={'a':name,'b':other,'intersectionMm3':round(v,6)}
                intersections.append(item)
                if v>THRESHOLD_MM3:collisions.append(item)
            except Exception as exc:
                kernel_errors.append({'a':name,'b':other,'error':repr(exc)})
    if excluded+exact!=412:raise AssertionError('Missed part pairs in 56-native gate')
    return {'nativeParts':56,'totalUnorderedPairs':1540,'inheritedP230Pairs':1128,
            'newAffectedPairs':412,'newPairsAabbSeparated':excluded,'exactNativeBooleanPairs':exact,
            'exactNativeBooleanResults':intersections,'positiveInterferences':collisions,
            'kernelErrors':kernel_errors,'thresholdMm3':THRESHOLD_MM3,
            'passStatic':not collisions and not kernel_errors,
            'fullOriginalModelBInstalled':False,'sourceP212P214Included':False,
            'dynamicSuspensionCertified':False,'mechanicalG2Certified':False}


def run(p230_dir:Path,out:Path)->dict:
    if out.exists():raise FileExistsError('P2.31 cross-check refuses overwrite')
    root=Path(__file__).resolve().parent
    if blob(root/'p2_10_rear_wishbone.py')!=P210_SHA or blob(root/'p2_9_rear_upright.py')!=P29_SHA:
        raise ValueError('Original P2.9/P2.10 authoring source Git SHA changed')
    prior=json.loads((p230_dir/'P230_rear48_native_source_audit.json').read_text())
    src=p230_dir/'P230_rear48_original_static.step'
    if (digest(src)!=P230_STEP_SHA or prior.get('status')!='SOURCE48_STATIC_PASS_MECHANICAL_G2_HOLD'
        or prior.get('source48NativeSTEP',{}).get('sha256')!=P230_STEP_SHA
        or not prior.get('source48NativeAudit',{}).get('passNominal48SourceStatic')
        or prior['source48NativeAudit'].get('allUnorderedPairs')!=1128):
        raise ValueError('P2.30 original 48-native source evidence invalid')
    solids=cq.importers.importStep(str(src)).solids().vals()
    if len(solids)!=48 or any(s.isNull() or not s.isValid() or s.Volume()<=0 for s in solids):
        raise ValueError('P2.30 original STEP has invalid connected native parts')
    old={f'P230_STEP_NATIVE_SOLID_{i:02d}':s for i,s in enumerate(solids)}
    authored=build_parts()
    if len(authored)!=10 or not ARMS<=set(authored):
        raise ValueError('Unexpected original P2.10 native authoring source')
    new={k:v for k,v in authored.items() if k not in ARMS}
    audit=collision_check(old,new,True)
    report={'schema':SCHEMA,
        'status':'P231_NATIVE_56_CROSS_STATIC_PASS_G2_HOLD' if audit['passStatic'] else 'P231_INTERFERENCE_HOLD',
        'originalP210SourceGitBlob':P210_SHA,'originalP29SourceGitBlob':P29_SHA,
        'originalP230NativeSTEPsha256':P230_STEP_SHA,
        'prior48NativeSourceIds':prior['sourceIds'],'eightNewSourceIds':sorted(new),
        'nativeAudit':audit,'originalModelBIncluded':False,'mechanicalG2Certified':False}
    out.mkdir(parents=True)
    (out/'P231_rear56_native_crosscheck.json').write_text(json.dumps(report,indent=2)+'\n')
    return report

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--p230-dir',type=Path,required=True)
    p.add_argument('--out',type=Path,required=True)
    a=p.parse_args();r=run(a.p230_dir,a.out)
    print(json.dumps({'status':r['status'],'audit':r['nativeAudit']},indent=2))
    if not r['nativeAudit']['passStatic']:raise SystemExit(2)
