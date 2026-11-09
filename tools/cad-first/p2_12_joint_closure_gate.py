#!/usr/bin/env python3
"""P2.12: fail-closed kinematic closure evidence for fixed P2.11 toe joints.

The free-screw animation moves rod eyes, but the existing P2.11 spherical
bearing proxy centres remain at their design datums. This test quantifies
the mismatch without relying on OCC's unreliable helical Boolean common().
It is not an OEM tolerance, a chassis fit or a mechanical certification.
"""
from __future__ import annotations
import argparse,hashlib,json,math
from pathlib import Path
import numpy as np
from p2_12_toe_adjuster import A,B,D,THREAD_PITCH_MM,SCHEMA
from p2_11_rear_toe_link import RADIUS_MM

ANGLES=(-180,-90,-45,0,45,90,180)
OBSERVATION_MM=.01  # source review threshold only, not an OEM clearance

def audit(out:Path)->dict:
    if out.exists():raise FileExistsError('Refusing to overwrite kinematic QA evidence')
    source=Path(__file__).with_name('p2_12_toe_adjuster.py')
    sha=hashlib.sha256(source.read_bytes()).hexdigest()
    if SCHEMA!='podium-eds.p2.cad-first.rear-toe-adjuster-threaded.v3':
        raise ValueError('Wrong P2.12 revision')
    eye_bore=float(RADIUS_MM['eyeBore'])
    bearing_outer=float(RADIUS_MM['bearingOuter'])
    radial_clearance=eye_bore-bearing_outer
    if abs(radial_clearance-.4)>1e-6:raise RuntimeError('P2.11 bearing envelope changed')
    if not math.isclose(float(np.linalg.norm(D)),1,abs_tol=1e-12):
        raise ValueError('Rod axis must be unit length')
    cases=[]
    for angle in ANGLES:
        travel=THREAD_PITCH_MM*angle/360
        outer=(A-D*travel).tolist()
        inner=(B+D*travel).tolist()
        outer_err=math.dist(outer,A)
        inner_err=math.dist(inner,B)
        # Native P2.11 annular bearings have axes along source Z.
        radial=abs(travel)*math.hypot(float(D[0]),float(D[1]))
        cases.append({
            'sleeveAngleDeg':angle,
            'outerRodAxialMotionMm':round(-travel,6),
            'innerRodAxialMotionMm':round(travel,6),
            'outerEyeErrorFromFixedBearingMm':round(outer_err,6),
            'innerEyeErrorFromFixedBearingMm':round(inner_err,6),
            'eyeRadialOffsetRelativeToSourceBoreAxisMm':round(radial,6),
            'exceedsNominalRadialClearance':radial>radial_clearance+1e-9,
            'twoPinnedEyeCentersCloseWithinReviewThreshold':max(outer_err,inner_err)<=OBSERVATION_MM,
        })
    if (len(cases)!=7 or not cases[3]['twoPinnedEyeCentersCloseWithinReviewThreshold']
        or any(c['twoPinnedEyeCentersCloseWithinReviewThreshold'] for i,c in enumerate(cases) if i!=3)
        or not cases[0]['exceedsNominalRadialClearance']
        or not cases[6]['exceedsNominalRadialClearance']):
        raise RuntimeError('Expected pinned-joint closure blocker disappeared; remeasure geometry')
    evidence={
        'schema':'podium-eds.p212.v3.joint-closure-blocker.v1',
        'cadSourceSchema':SCHEMA,'cadSourceSha256':sha,
        'sourceJointCoordinatesAreProposalsNotMeasuredChassis':True,
        'bearingOuterRadiusMm':bearing_outer,
        'rodEyeBoreRadiusMm':eye_bore,
        'nominalRadialGapMm':round(radial_clearance,6),
        'observationThresholdMm':OBSERVATION_MM,
        'sampleCount':len(cases),'anglesDeg':list(ANGLES),'samples':cases,
        'staticCenterClosurePass':True,
        'adjustedRigidFixedBearingClosurePass':False,
        'freeThreadMotionCanBeAcceptedAsVehicleToeMotion':False,
        'fullNineteenBodyKinematicsCertified':False,
        'mechanicalG2':'HOLD',
        'interpretation':'Fixed bearing datum violates rod-eye centre closure at nonzero turn; requires physically measured chassis/upright remate.',
    }
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(evidence,indent=2)+'\n',encoding='utf8')
    return evidence

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--out',type=Path,required=True)
    report=audit(p.parse_args().out)
    print('P2.12 joint-closure HOLD detected:',report['sampleCount'],'angles')
