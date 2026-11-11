#!/usr/bin/env python3
"""P2.30 exact 48-original-B-Rep rear source static integration.

P2.29 verified 46 native solids (40 wheel/brake/drive, revised P2.9
upright, caliper carrier and 4 studs) + SHA-pinned P2.19 two real revised
A-arm STEP bodies. Unlike the prior mesh-only rear56, this checks every
previously-unverified native pair against the current P2.29 source.

Only nominal pose mechanical envelope; does NOT include the 8 remaining
P2.10 bodies, P2.11/P2.12/P2.14, original Model B GLB, OEM fitting or
moving suspension. G2 remains HOLD even on this static pass.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
from typing import Any

import cadquery as cq

import p2_29_caliper_upright_carrier as p229_source
from p2_29_caliper_upright_carrier import (
    static_source, verify_source, git_blob, UPRIGHT, CALIPER, CARRIER,
    CAL_BOLT, UPR_BOLT,
)

SCHEMA = 'peds.cad-first.p230-rear48-native-brep-source-gate.v1'
SOURCE_P229_GIT_BLOB='afb997e6a8b0b08a8e30a354cadeb6de92a34475'
SOURCE_P219_STEP_SHA='cad06f6632b1c6ef38f9e92130b7ac220af802c271556fd813aad1be397537fa'
SOURCE_P219_MANIFEST_SCHEMA='peds.cad-first.p219-rear-double-wishbone-clearance.v1'
UPPER='P210_REAR_UPPER_A_ARM_FORGED'
LOWER='P210_REAR_LOWER_A_ARM_FORGED'
THRESHOLD_MM3=0.05


def sha(path:Path)->str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def exact_arm_step(folder:Path)->tuple[dict[str,cq.Shape],dict]:
    manifest=folder/'P219_rear_wishbone_manifest.json'
    info=json.loads(manifest.read_text(encoding='utf-8'))
    if info.get('schema') != SOURCE_P219_MANIFEST_SCHEMA or info.get('revisedPartCount') != 2:
        raise ValueError('Original P2.19 source manifest/schema wrong')
    previous=info.get('staticSourceAudit',{})
    if not previous.get('passStatic') or previous.get('solidPairs') != 903:
        raise ValueError('P2.19 full original 43-body static audit missing')
    step_info=info.get('nativeStep',{})
    if (step_info.get('sha256') != SOURCE_P219_STEP_SHA
            or step_info.get('roundtripSolids') != 2):
        raise ValueError('P2.19 revised A-arm native STEP SHA/solids not approved')
    step=folder/step_info['file']
    if not step.is_file() or sha(step) != SOURCE_P219_STEP_SHA:
        raise ValueError('P2.19 STEP bytes fail SHA-256 authenticity')
    solids=cq.importers.importStep(str(step)).solids().vals()
    if len(solids)!=2 or any(x.isNull() or not x.isValid() or len(x.Solids())!=1 for x in solids):
        raise ValueError('Native P2.19 A-arm STEP does not contain two valid solids')
    by_sign={}
    for body in solids:
        bounds=body.BoundingBox()
        center=(bounds.ymin+bounds.ymax)/2
        if center>110 and UPPER not in by_sign:by_sign[UPPER]=body
        elif center< -110 and LOWER not in by_sign:by_sign[LOWER]=body
        else:raise ValueError('Native original P2.19 A-arm coordinate/frame changed')
    if set(by_sign)!={UPPER,LOWER}:
        raise ValueError('Unexpected P2.19 native arm identities')
    return by_sign,{'P219OriginalStepSha256':sha(step),
                    'P219OriginalManifestSha256':sha(manifest),
                    'armIdentifiers':sorted(by_sign),'armStepRoundtripSolids':len(solids)}


def overlap(a:Any,b:Any)->bool:
    x=a.BoundingBox();y=b.BoundingBox()
    return all(min(getattr(x,axis+'max'),getattr(y,axis+'max'))-
               max(getattr(x,axis+'min'),getattr(y,axis+'min'))>1e-6 for axis in 'xyz')


def incremental_audit(old:dict[str,cq.Shape],added:dict[str,cq.Shape],
                      prior_static_pass:bool,threshold:float=THRESHOLD_MM3)->dict:
    if not prior_static_pass:
        raise ValueError('P2.29 original native 46-body B-Rep gate not passed')
    if set(old)&set(added) or not added or not math.isfinite(threshold) or threshold<0:
        raise ValueError('Invalid P2.30 original native source ownership / tolerance')
    for name,s in {**old,**added}.items():
        if s.isNull() or not s.isValid() or len(s.Solids())!=1 or s.Volume()<=0:
            raise ValueError('P2.30 invalid original source solid: '+name)
    names=sorted({**old,**added})
    carry=len(old)*(len(old)-1)//2
    excluded=exact=0
    collisions=[];failures=[];positive_pairs=[]
    for i,a in enumerate(names):
        for b in names[i+1:]:
            if a in old and b in old:continue
            sa=(old.get(a) if a in old else added[a]);sb=(old.get(b) if b in old else added[b])
            if not overlap(sa,sb):excluded+=1;continue
            exact+=1
            try:
                v=float(sa.intersect(sb).Volume())
                if not math.isfinite(v) or v<0:raise ValueError('Invalid OCC Boolean intersection volume')
                positive_pairs.append({'a':a,'b':b,'overlapMm3':round(v,6)})
                if v>threshold:collisions.append({'a':a,'b':b,'overlapMm3':round(v,6)})
            except Exception as e:
                failures.append({'a':a,'b':b,'error':repr(e)})
    n=len(names)*(len(names)-1)//2
    if carry+excluded+exact!=n:
        raise AssertionError('P2.30 48-source pair-accounting failure')
    return {'allNativeSourceBodies':len(names),'allUnorderedPairs':n,
        'inheritedP229NativeOldOldPairs':carry,
        'newOrChangedPairs':n-carry,
        'newCrossPairsAabbExcluded':excluded,'newCrossPairsOpenCascadeExact':exact,
        'exactPairs':positive_pairs,'thresholdMm3':threshold,
        'interferences':collisions,'kernelFailures':failures,
        'passNominal48SourceStatic':not collisions and not failures,
        'allP210P212P214Checked':False,'realModelBInstalled':False,
        'dynamicSuspensionOrLoadCertified':False,'mechanicalG2Certified':False}


def run(p219_dir:Path,out:Path,export_step:bool=False)->dict:
    if out.exists():raise FileExistsError('P2.30 requires new output folder')
    local_source=Path(p229_source.__file__).resolve()
    if git_blob(local_source)!=SOURCE_P229_GIT_BLOB:
        raise ValueError('P2.29 original authoring source Git blob identity changed')
    verified=verify_source()
    rear46,_,prior=static_source()
    if (len(rear46)!=46 or prior.get('schema')!='peds.cad-first.p229-original-p29-caliper-carrier-static.v1'
        or not prior['source46NativeStaticAudit']['passStatic']
        or prior['source46NativeStaticAudit']['solidPairs']!=1035):
        raise ValueError('P2.29 genuine 46-native-source pass missing')
    arms,original_proof=exact_arm_step(p219_dir)
    result=incremental_audit(rear46,arms,True)
    if result['allNativeSourceBodies']!=48 or result['allUnorderedPairs']!=1128:
        raise ValueError('Not the original 48 native source body partition')
    record={'schema':SCHEMA,
            'status':'SOURCE48_STATIC_PASS_MECHANICAL_G2_HOLD' if result['passNominal48SourceStatic']
               else 'SOURCE48_INTERFERENCE_HOLD',
            'p229SourceGitBlob':git_blob(local_source),
            'p229DependencySourceBlobs':verified,
            'p219ArmSource':original_proof,
            'p229Native46Manifest':prior,
            'source48NativeAudit':result,
            'sourceIds':sorted({**rear46,**arms}),
            'preservesAllOriginalSourceNames':True,
            'partCount':48,
            'expectedLatestRear56SourceMeshCount':56,
            'notIncluded8P210NativeBodies':True,
            'p212P214NativeSourcesNotIncluded':True,
            'originalModelBIncluded':False,
            'mechanicalG2Certified':False}
    out.mkdir(parents=True)
    (out/'P230_rear48_native_source_audit.json').write_text(json.dumps(record,indent=2)+'\n')
    if export_step and result['passNominal48SourceStatic']:
        assembly=cq.Assembly(name='P230_REAL_REAR48_NATIVE_STATIC_SOURCE_G2_HOLD')
        for name,shape in {**rear46,**arms}.items():assembly.add(shape,name=name)
        path=out/'P230_rear48_original_static.step'
        assembly.save(str(path),exportType='STEP')
        imported=cq.importers.importStep(str(path)).solids().vals()
        if len(imported)!=48 or any(not b.isValid() for b in imported):
            raise ValueError('Original P2.30 STEP failed 48 B-Rep roundtrip')
        record['source48NativeSTEP']={'file':path.name,'sha256':sha(path),'roundtripSolids':48,
                                      'manufacturingOrG2Certified':False}
        (out/'P230_rear48_native_source_audit.json').write_text(json.dumps(record,indent=2)+'\n')
    return record


if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--p219-native-dir',type=Path,required=True)
    p.add_argument('--out',type=Path,required=True)
    p.add_argument('--export-step',action='store_true')
    a=p.parse_args()
    report=run(a.p219_native_dir,a.out,a.export_step)
    print(json.dumps({'status':report['status'],'nativeCrossAudit':report['source48NativeAudit'],
                      'nativeSTEP':report.get('source48NativeSTEP')},indent=2),flush=True)
    if not report['source48NativeAudit']['passNominal48SourceStatic']:raise SystemExit(2)
