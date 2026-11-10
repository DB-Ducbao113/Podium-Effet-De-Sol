#!/usr/bin/env python3
"""P2.23 independent source cross-gate with SHA-verified P2.19 two-arm STEP.

80 B-Rep candidate cross pairs, not full P2.9-P2.14 or original Model B.
"""
from __future__ import annotations
import argparse,hashlib,json,math
from pathlib import Path
import cadquery as cq
from p2_23_spindle_hub_keyed_mate import joined_source_223

SCHEMA='peds.cad-first.p223-p219-rear-rotor-clearance.v1'

def run(step_folder:Path,out:Path)->dict:
    if out.exists():raise FileExistsError('Refuse overwriting source review')
    source=json.loads((step_folder/'P219_rear_wishbone_manifest.json').read_text())
    if source.get('schema')!='peds.cad-first.p219-rear-double-wishbone-clearance.v1' or source.get('revisedPartCount')!=2 or not source.get('staticSourceAudit',{}).get('passStatic'):
        raise ValueError('P2.19 original CAD source audit not valid')
    info=source['nativeStep']
    step=step_folder/info['file']
    if not step.is_file() or hashlib.sha256(step.read_bytes()).hexdigest()!=info['sha256']:
        raise ValueError('Original P2.19 native STEP SHA-256 mismatch')
    arms=cq.importers.importStep(str(step)).solids().vals()
    if len(arms)!=2 or any(not arm.isValid() or len(arm.Solids())!=1 for arm in arms):
        raise ValueError('P2.19 source STEP invalid')
    wheel,_,study=joined_source_223()
    collisions=[]
    excluded=booleans=0
    for i,arm in enumerate(arms):
        a=arm.BoundingBox()
        for name,body in wheel.items():
            b=body.BoundingBox()
            if any(min(getattr(a,q+'max'),getattr(b,q+'max'))-max(getattr(a,q+'min'),getattr(b,q+'min'))<=1e-6 for q in 'xyz'):
                excluded+=1;continue
            booleans+=1
            vol=float(arm.intersect(body).Volume())
            if not math.isfinite(vol) or vol>0.05:
                collisions.append({'armIndex':i,'name':name,'volumeMm3':vol})
    if booleans+excluded!=80:
        raise AssertionError('Two source arm vs 40 rear interface pairs not fully screened')
    result={'schema':SCHEMA,
            'status':'P223_P219_TWO_ARM_STATIC_CLEARANCE_PASS_G2_HOLD' if not collisions else 'CROSS_SOURCE_INTERFERENCE_HOLD',
            'exactNativeSourceP219StepSha256':info['sha256'],
            'candidatePairs':80,'aabbExcluded':excluded,'exactBRepPairs':booleans,
            'unresolvedOverlap':collisions,'passTwoArmStatic':not collisions,
            'p223RearPartCount':40,'realP219SourceArms':2,
            'allP29P214SourceVerified':False,'originalModelBInstalled':False,
            'dynamicSuspensionCertified':False,'mechanicalG2Certified':False,
            'mountClearanceReport':study}
    out.mkdir(parents=True)
    (out/'P223_vs_P219_two_arm_audit.json').write_text(json.dumps(result,indent=2)+'\n')
    return result

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--p219-dir',type=Path,required=True)
    parser.add_argument('--out',type=Path,required=True)
    args=parser.parse_args()
    report=run(args.p219_dir,args.out)
    print(json.dumps({key:report[key] for key in ('status','candidatePairs','exactBRepPairs','aabbExcluded','passTwoArmStatic')},indent=2))
    if not report['passTwoArmStatic']:raise SystemExit(2)
