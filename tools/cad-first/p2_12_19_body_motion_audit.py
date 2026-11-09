#!/usr/bin/env python3
"""P2.12 v3: 19-solid free adjuster pose collision and pinned-bearing closure.

Retains 14 P2.9-P2.11 bodies at their nominal original datums and moves
the 5 P2.12 sources as in the free-thread demonstration. Native BRep
Boolean common() can give false-negative zero for helical interference.
The independent 12-case solid-occupancy test remains mandatory.

A free-screw pose with fixed earlier joint/bearing datums cannot certify
real vehicle rear toe kinematics. This reports the measured nonclosure.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
import os
import subprocess
import sys
from pathlib import Path

HERE=Path(__file__).resolve().parent
SOURCE=HERE/'p2_12_toe_adjuster.py'
ANGLES=(-90,0,90)
CLOSURE_OBSERVATION_MM=.01 # Source review threshold, NOT an OEM fit tolerance.

def one_pose(angle:int)->dict:
    from p2_12_toe_adjuster import A,B,D,PARTS,THREAD_PITCH_MM,all_parts
    from p2_10_rear_wishbone import exact_static_audit
    if angle not in ANGLES:raise ValueError('Unknown P2.12 pose')
    parts=all_parts()
    if len(parts)!=19:raise RuntimeError('Expected all 19 original CAD bodies')
    turn=THREAD_PITCH_MM*angle/360
    outer_shift=-turn
    inner_shift=turn
    for key,shift in (('outer',outer_shift),('inner',inner_shift),
                      ('outerNut',outer_shift),('innerNut',inner_shift)):
        part=PARTS[key]
        parts[part]=parts[part].translate(tuple(D*shift))
    sleeve=PARTS['sleeve']
    parts[sleeve]=parts[sleeve].rotate(tuple(A),tuple(A+D),angle)

    # The old upright/arms/toe bearings and pin remain at their authored
    # static positions. Do not secretly translate their pickup points.
    audit=exact_static_audit(parts)
    if (audit['pairCount']!=171 or
        audit['aabbExcluded']+audit['nativeBrepIntersectionsEvaluated']!=171 or
        audit['booleanErrors'] or audit['unresolvedCollisions']):
        raise RuntimeError('Incomplete or colliding source native 19-body pose')
    outer_error=math.dist(A,A+D*outer_shift)
    inner_error=math.dist(B,B+D*inner_shift)
    if (not math.isclose(outer_error,abs(turn),abs_tol=1e-9)
        or not math.isclose(inner_error,abs(turn),abs_tol=1e-9)):
        raise RuntimeError('Unexpected toe rod eye-centre displacement')
    max_error=max(outer_error,inner_error)
    return {
      'sleeveAngleDeg':angle,
      'movingSourceParts':5,
      'fixedEarlierSourceParts':14,
      'totalCadBodies':19,
      'pairCount':audit['pairCount'],
      'aabbExcluded':audit['aabbExcluded'],
      'nativeBrepPairsEvaluated':audit['nativeBrepIntersectionsEvaluated'],
      'recordedNativePositiveOverlaps':audit['unresolvedCollisions'],
      'nativeBooleanExceptions':audit['booleanErrors'],
      'booleanStaticReviewOnly':True,
      'knownHelicalBooleanFalseNegatives':True,
      'outerRodTranslationMm':round(outer_shift,9),
      'innerRodTranslationMm':round(inner_shift,9),
      'outerPinnedEyeDatumErrorMm':round(outer_error,9),
      'innerPinnedEyeDatumErrorMm':round(inner_error,9),
      'maximumPinnedEyeDatumErrorMm':round(max_error,9),
      'pinnedEyeClosureWithin0p01mm':max_error<=CLOSURE_OBSERVATION_MM,
      'vehicleKinematicsCertified':False,
    }

def audit(out:Path,per_case_timeout:int=110)->dict:
    if out.exists():raise FileExistsError('Refusing to overwrite previous 19-body QA')
    out.parent.mkdir(parents=True,exist_ok=True)
    sha=hashlib.sha256(SOURCE.read_bytes()).hexdigest()
    records=[]
    for angle in ANGLES:
        args=[sys.executable,str(Path(__file__).resolve()),'--angle',str(angle)]
        try:
            process=subprocess.run(args,cwd=HERE,text=True,capture_output=True,
                                   timeout=per_case_timeout,check=False)
            if process.returncode:
                raise RuntimeError('Native CAD pose '+str(angle)+': '+
                                   (process.stderr[-1500:] or process.stdout[-1500:]))
            row=json.loads(process.stdout.strip())
            if (row.get('sleeveAngleDeg')!=angle or row.get('totalCadBodies')!=19
                or row.get('movingSourceParts')!=5 or row.get('fixedEarlierSourceParts')!=14
                or row.get('pairCount')!=171 or
                row.get('nativeBrepPairsEvaluated',0)+row.get('aabbExcluded',0)!=171
                or row.get('recordedNativePositiveOverlaps')!=[]
                or row.get('nativeBooleanExceptions')!=[]):
                raise RuntimeError('Incomplete/untrusted native 19-body CAD evidence')
            records.append(row)
        except Exception as error:
            failed={
              'schema':'podium-eds.p212.v3.all-19-pose-closure.v1',
              'complete':False,'sourceSha256':sha,'cases':records,
              'error':str(error),'mechanicalG2':'HOLD',
            }
            out.write_text(json.dumps(failed,indent=2)+'\n',encoding='utf8')
            raise
    if (len(records)!=3
        or records[1]['pinnedEyeClosureWithin0p01mm'] is not True
        or records[0]['pinnedEyeClosureWithin0p01mm'] is not False
        or records[2]['pinnedEyeClosureWithin0p01mm'] is not False):
        raise RuntimeError('Toe eye closure blocker changed; inspect physical source')
    result={
      'schema':'podium-eds.p212.v3.all-19-pose-closure.v1',
      'sourceSchema':'podium-eds.p2.cad-first.rear-toe-adjuster-threaded.v3',
      'sourceSha256':sha,
      'complete':True,'sampleCount':3,'anglesDeg':list(ANGLES),
      'pairClassifications':513,'cases':records,
      'nominalPinnedEyeClosureWithin0p01mm':True,
      'adjustedPinnedEyeClosureWithin0p01mm':False,
      'independentThreadSurfaceOccupancyRequired':True,
      'continuousKinematicsCertified':False,
      'actualChassisHardpointsVerified':False,
      'mechanicalG2':'HOLD',
    }
    out.write_text(json.dumps(result,indent=2)+'\n',encoding='utf8')
    return result

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--out',type=Path)
    p.add_argument('--angle',type=int,choices=ANGLES)
    p.add_argument('--per-case-timeout',type=int,default=110)
    options=p.parse_args()
    if options.angle is not None:
        result=one_pose(options.angle)
        print(json.dumps(result),flush=True)
        os._exit(0) # Avoid OpenCascade finalizer hangs in child processes.
    if options.out is None:
        p.error('--out required for full 19-body source audit')
    report=audit(options.out,options.per_case_timeout)
    print('P2.12 19-body source pose audit complete; pinned-eye G2 HOLD')
