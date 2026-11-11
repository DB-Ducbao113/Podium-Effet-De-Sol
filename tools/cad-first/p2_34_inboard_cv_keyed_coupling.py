#!/usr/bin/env python3
"""P2.34: engineering proposal — rigid 4-key shaft-to-CV-housing interface.

Source-authenticated original P2.33 STEP 76 native solids + original 76-name map.
Reworks *two* existing real CAD solids; preserves 76 names/solid count.
Adds four integral shaft keys, matching broached housing keyways and a
one-sided shaft shoulder contacting the housing at z=-245 mm.

This is NOT a real articulating CV joint, gearbox, torque/load, spline,
shaft axial retention, continuous motion, original full-car Model B, or G2.
All dimensional values are in mm. No source Model B binary is touched.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
from typing import Any

import cadquery as cq
from OCP.BRepExtrema import BRepExtrema_DistShapeShape

SCHEMA='peds.cad-first.p234-real-rear76-inboard-rigid-cv-keys.v1'
SOURCE_STEP_SHA='2807bfc253f2afaf76172fac06ed259051f970518bc3a3765c6c84e40438aa62'
SOURCE_INDEX_SHA='9063a7ed9631aa2dffe062b407c0d5ac3531035e0d3d4c4c2b86574ad53124b1'
SOURCE_AUDIT_SHA='2da6d77b96cf475bb76854245ef8570d089c87d7f9edcc88ae7ad4db810e4bc1'
SHAFT='P217_REAR_DRIVE_HALF_SHAFT_UNSPLINED'
HOUSING='P217_REAR_CV_HOUSING_PROTOTYPE'
BOOT='P217_REAR_CV_BOOT_ENVELOPE'
NEUTRAL='#87929d'
THRESHOLD_MM3=.05


def sha(path:Path)->str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def native_min_distance(a:cq.Shape,b:cq.Shape)->float:
    kernel=BRepExtrema_DistShapeShape(a.wrapped,b.wrapped)
    kernel.Perform()
    if not kernel.IsDone():
        raise RuntimeError('Native OpenCascade minimum distance kernel failed')
    return float(kernel.Value())


def get_source(step:Path,index:Path,audit:Path)->tuple[dict[str,cq.Shape],dict]:
    """Byte-authenticate P2.33 original native STEP, name map and static gate."""
    expected=((step,SOURCE_STEP_SHA),(index,SOURCE_INDEX_SHA),(audit,SOURCE_AUDIT_SHA))
    for path,expected_sha in expected:
        if not path.is_file() or sha(path)!=expected_sha:
            raise ValueError('Original P2.33 source SHA-256 mismatch: '+str(path))
    meta=json.loads(index.read_text())
    source_audit=json.loads(audit.read_text())
    names=meta['nameToZeroBasedSolidIndex']
    if (meta['partCount']!=76 or meta['sourceStepSHA256']!=SOURCE_STEP_SHA or
        len(names)!=76 or set(names.values())!=set(range(76))):
        raise ValueError('Authentic source native name index not bijective')
    if (source_audit.get('status')!='REAL_76_NATIVE_STATIC_PASS_G2_HOLD' or
        not source_audit['nativeCollisionAudit']['passNominal76Static']):
        raise ValueError('Original P2.33 76-BRep static audit did not PASS')
    solids=cq.importers.importStep(str(step)).solids().vals()
    if len(solids)!=76 or any(not s.isValid() or len(s.Solids())!=1 or s.Volume()<=0 for s in solids):
        raise ValueError('Source 76-native STEP roundtrip has invalid connected solids')
    if not {SHAFT,HOUSING,BOOT}<=set(names):
        raise ValueError('Original P2.17 source CV/shaft ID missing')
    return {name:solids[i] for name,i in names.items()}, {'step':sha(step),'map':sha(index),'audit':sha(audit)}


def keyed_inboard_mate(sh:cq.Shape,housing:cq.Shape)->tuple[cq.Shape,cq.Shape]:
    """Four native radial keys inside housing slots and single axial seating stop."""
    # P2.28 shaft r=18.4 and P2.17 ring inner r=21 at z=-245..-234.
    # A shoulder from z=-248..-245 ends flush on housing's inboard face.
    shoulder=cq.Solid.makeCylinder(25.0,3.0,cq.Vector(0,0,-248.0))
    sh=sh.fuse(shoulder).clean()
    for angle in (0,90,180,270):
        # Shaft key rooted through existing r=18.4 tenon; tip r=21.9.
        key=(cq.Workplane('XY').box(4.5,6.0,8.0).val()
             .translate((19.65,0,-239.5)).rotate((0,0,0),(0,0,1),angle))
        # Broached radial slot goes through housing's axial width 11 mm.
        # Tangential and radial clearance avoids nominal solid overlap.
        slot=(cq.Workplane('XY').box(4.8,6.9,14.0).val()
              .translate((20.6,0,-239.5)).rotate((0,0,0),(0,0,1),angle))
        sh=sh.fuse(key).clean()
        housing=housing.cut(slot).clean()
    for name,body in ((SHAFT,sh),(HOUSING,housing)):
        if body.isNull() or not body.isValid() or len(body.Solids())!=1 or body.Volume()<=0:
            raise ValueError('P2.34 modified native BRep not connected/valid: '+name)
    return sh,housing


def bbox_overlap(a:cq.Shape,b:cq.Shape)->bool:
    x,y=a.BoundingBox(),b.BoundingBox()
    return all(min(getattr(x,k+'max'),getattr(y,k+'max'))-
               max(getattr(x,k+'min'),getattr(y,k+'min'))>1e-6 for k in 'xyz')


def recheck_modified(source:dict[str,cq.Shape],updated:dict[str,cq.Shape])->dict:
    if len(source)!=76 or set(source)!=set(updated) or len({n for n in source if source[n] is not updated[n]})!=2:
        raise ValueError('Must preserve 76 exact native source names and replace exactly two solids')
    changed={SHAFT,HOUSING}
    unaffected=set(source)-changed
    excluded=0; exact=0; unexpected=[]; failures=[]; evaluated=[]
    for a in sorted(changed):
        for b in sorted(updated):
            if a==b or (b in changed and b<a):continue
            sa,sb=updated[a],updated[b]
            if not bbox_overlap(sa,sb):
                excluded+=1;continue
            exact+=1
            try:
                volume=float(sa.intersect(sb).Volume())
                if not math.isfinite(volume) or volume<0:raise RuntimeError('Invalid native Boolean volume')
                row={'first':a,'second':b,'intersectionMm3':round(volume,6)}
                evaluated.append(row)
                if volume>THRESHOLD_MM3:unexpected.append(row)
            except Exception as error:
                failures.append({'first':a,'second':b,'error':repr(error)})
    n=76*75//2
    inherited=len(unaffected)*(len(unaffected)-1)//2
    if inherited+excluded+exact!=n or excluded+exact!=149:
        raise AssertionError('P2.34 incremental 76-native source pair accounting failure')
    return {'allSourceBodies':76,'allSourcePairs':n,
        'inheritedAuthenticP233UnaffectedPairs':inherited,
        'newOrChangedAffectedPairs':149,'aabbExcludedAffectedPairs':excluded,
        'exactNativeOpenCascadeBooleanPairs':exact,'exactPairResults':evaluated,
        'significantInterferences':unexpected,'nativeKernelErrors':failures,
        'thresholdMm3':THRESHOLD_MM3,'nominalStaticPass':not unexpected and not failures,
        'articulatingCvCertified':False,'mechanicalG2Certified':False}


def prove_engagement(original:dict[str,cq.Shape],new:dict[str,cq.Shape])->dict[str,Any]:
    before=native_min_distance(original[SHAFT],original[HOUSING])
    after=native_min_distance(new[SHAFT],new[HOUSING])
    nominal_intersection=float(new[SHAFT].intersect(new[HOUSING]).Volume())
    forced={str(k):round(float(new[SHAFT].rotate((0,0,0),(0,0,1),k).intersect(new[HOUSING]).Volume()),6)
            for k in (-2.,2.)}
    boot_distance=native_min_distance(new[SHAFT],new[BOOT])
    if (not 2.59<before<2.61 or after>1e-4 or nominal_intersection>THRESHOLD_MM3
        or min(forced.values())<5 or boot_distance<0):
        raise ValueError('Shaft–CV ring seat/key geometry not verified')
    return {'originalShaftToCvHousingNativeDistanceMm':round(before,6),
        'newShaftShoulderToHousingDistanceMm':round(after,6),
        'nominalShaftToCvHousingOverlapMm3':round(nominal_intersection,6),
        'relativeRotationPositiveControlsDeg2Mm3':forced,
        'numberOfShaftKeys':4,'housingMatchingBroachedKeyways':4,
        'oneSidedAxialShoulderRadiusMm':25.0,'seatFaceZMm':-245.0,
        'shaftKeyBoxSizeMm':[4.5,6.0,8.0],
        'housingSlotBoxSizeMm':[4.8,6.9,14.0],
        'originalRingInnerRadiusMm':21.0,'originalShaftTenonRadiusMm':18.4,
        'originalShaftToCvBootGapMm':round(boot_distance,6),
        'jointIsRigidNotArticulating':True,
        'oppositeAxialRetentionCertified':False,'torqueStrengthCertified':False,
        'continuousSuspensionBumpToeRollCertified':False}


def write_export(updated:dict[str,cq.Shape],out:Path)->dict:
    assembly=cq.Assembly(name='P234_REAL_REAR76_RIGID_CV_KEYED_SOURCE_REVIEW_G2_HOLD')
    for name,part in sorted(updated.items()):assembly.add(part,name=name)
    step=out/'P234_original_rear76_inboard_keyed_static.step'
    assembly.save(str(step),exportType='STEP')
    bodies=cq.importers.importStep(str(step)).solids().vals()
    if len(bodies)!=76 or any(not s.isValid() or s.Volume()<=0 for s in bodies):
        raise ValueError('P2.34 native STEP roundtrip is not 76 valid connected solids')
    # Cache all imported signatures once. OCC Volume/BoundingBox are expensive
    # on detailed real source B-Reps; avoid thousands of repeat calls.
    keys=('xmin','xmax','ymin','ymax','zmin','zmax')
    loaded_signature={i:(float(b.Volume()),tuple(float(getattr(b.BoundingBox(),k)) for k in keys))
                      for i,b in enumerate(bodies)}
    original_signature={name:(float(part.Volume()),tuple(float(getattr(part.BoundingBox(),k)) for k in keys))
                        for name,part in updated.items()}
    remaining=set(range(len(bodies)));mapping={}
    for name,signature in sorted(original_signature.items()):
        vol,bb=signature
        candidates=[i for i in remaining if
            abs(loaded_signature[i][0]-vol)<=max(.1,vol*1e-5)
            and max(abs(x-y) for x,y in zip(loaded_signature[i][1],bb))<.02]
        if len(candidates)!=1:
            raise ValueError('P2.34 nonunique imported STEP solid index for '+name)
        mapping[name]=candidates[0];remaining.remove(candidates[0])
    payload={'schema':'peds.cad-first.p234-native76-step-part-index.v1',
        'sourceStepSHA256':sha(step),'partCount':76,
        'nameToZeroBasedSolidIndex':mapping,'mechanicalG2Certified':False}
    (out/'P234_rear76_source_name_map.json').write_text(json.dumps(payload,indent=2)+'\n')
    return {'file':step.name,'sha256':sha(step),'bytes':step.stat().st_size,
        'readbackSolids':len(bodies),'nameIndexedSolids':len(mapping)}


def run(source_step:Path,source_map:Path,source_audit:Path,out:Path,export_step:bool=True)->dict:
    if out.exists():raise FileExistsError('P2.34 refuses to overwrite any earlier source evidence')
    original,proof=get_source(source_step,source_map,source_audit)
    shaft,housing=keyed_inboard_mate(original[SHAFT],original[HOUSING])
    updated={**original,SHAFT:shaft,HOUSING:housing}
    fit=prove_engagement(original,updated)
    static=recheck_modified(original,updated)
    report={'schema':SCHEMA,'patch':'P2.34/54',
        'status':'RIGID_SHAFT_CV_HOUSING_NATIVE_STATIC_PASS_G2_HOLD' if static['nominalStaticPass']
          else 'NATIVE_SOURCE_INTERFERENCE_HOLD',
        'originalP233SourceSHA256':proof,'modifiedExistingSourceIds':[SHAFT,HOUSING],
        'originalSourcePartCount':76,'revisedSourcePartCount':76,
        'nominalMateEvidence':fit,'staticNativeAudit':static,
        'actualArticulatingCvJointDesigned':False,
        'originalModelBFullCarIncluded':False,'mechanicalG2Certified':False}
    out.mkdir(parents=True)
    (out/'P234_rear76_static_coupler_audit.json').write_text(json.dumps(report,indent=2)+'\n')
    if export_step and static['nominalStaticPass']:
        report['nativeSTEP']=write_export(updated,out)
        (out/'P234_rear76_static_coupler_audit.json').write_text(json.dumps(report,indent=2)+'\n')
    return report


if __name__=='__main__':
    ap=argparse.ArgumentParser()
    ap.add_argument('--p233-step',type=Path,required=True)
    ap.add_argument('--p233-name-map',type=Path,required=True)
    ap.add_argument('--p233-audit',type=Path,required=True)
    ap.add_argument('--out',type=Path,required=True)
    ap.add_argument('--no-step',action='store_true')
    args=ap.parse_args()
    r=run(args.p233_step,args.p233_name_map,args.p233_audit,args.out,not args.no_step)
    print(json.dumps({'status':r['status'],'audit':r['staticNativeAudit'],
        'nativeSTEP':r.get('nativeSTEP'),'mate':r['nominalMateEvidence']},indent=2))
    if not r['staticNativeAudit']['nominalStaticPass']:raise SystemExit(2)
