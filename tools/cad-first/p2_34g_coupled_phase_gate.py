#!/usr/bin/env python3
"""P2.34G: actual source84 6-ball, two-race COUPLED PHASE collision screen.

Input: byte-authenticated real P2.34E 84 B-Rep STEP, owner index and audit.
At prescribed bends, hold six genuine ball B-Reps at the prior half-bend
position; rotate BOTH original inner and outer native races by a single
candidate pair of shaft/cup phase angles. Compute real OCC intersection
volumes with all 12 ball/race combinations per trial. Classify a trial
against the previously used 0.05 mm3 per-pair reporting threshold.

Discrete phase screen only: no contact forces, continuous phase/suspension
sweep, solved CV kinematics, constant speed, torque rating or Model B full car.
"""
from __future__ import annotations
import argparse,csv,hashlib,json,math,sys
from pathlib import Path
import cadquery as cq
from OCP.BRepExtrema import BRepExtrema_DistShapeShape
from p2_34f_repo_native_contact_guard import PINS,source,rot,SHAFT,CUP,Z

BALLS=tuple(f'P234C_REAR_CV_TORQUE_BALL_{i:02d}' for i in range(1,7))
BENDS=(-10,0,10)
# Fixed, reproducible investigatory phases rather than fitted-to-answer phases.
PHASES=((0.,0.),(.2481,.6133),(.6241,.6133),(.6241,1.0254))
VOLUME_THRESHOLD_MM3=.05
SCHEMA='peds.cad-first.p234g-real-source84-coupled-phase-boolean.v1'
WITNESS_POSES=((0.,.6241,.6133),(10.,.2481,.6133),(10.,.6241,.6133),
               (10.,.6241,1.0254),(-10.,.6241,.6133))
CONTACT_WITNESS_MM=1e-5  # geometric, not loaded contact

def verify_original(root:Path)->dict:
    # 'source' performs exact source sha verification and import of actual 84 native solids.
    parts=source(root)
    if len(parts)!=84 or not {SHAFT,CUP,*BALLS}<=set(parts):
        raise ValueError('Source 84 native original driveshaft, cup and six balls missing')
    return parts

def pair_volumes(parts:dict,bend:float,shaft_phase:float,cup_phase:float)->dict:
    pivot=(0,0,Z)
    shaft=rot(rot(parts[SHAFT],'z',shaft_phase),'x',bend)
    cup=rot(parts[CUP],'z',-cup_phase)
    entries=[]
    for i,name in enumerate(BALLS,1):
        ball=rot(parts[name],'x',bend/2)
        vs=float(ball.intersect(shaft).Volume())
        vc=float(ball.intersect(cup).Volume())
        if not (math.isfinite(vs) and math.isfinite(vc) and vs>=0 and vc>=0):
            raise ValueError('OpenCascade returned invalid original native intersection')
        entries.append({'ball':i,'shaftOverlapMm3':round(vs,8),'cupOverlapMm3':round(vc,8),
                        'shaftExceedsThreshold':vs>VOLUME_THRESHOLD_MM3,
                        'cupExceedsThreshold':vc>VOLUME_THRESHOLD_MM3})
    invalid=[f"{r['ball']}:{side}" for r in entries for side in ('shaft','cup')
             if r[side+'ExceedsThreshold']]
    return {'bendDeg':bend,'shaftSpinDeg':shaft_phase,'cupSpinDeg':cup_phase,
            'ballRacePairs':12,'realExactBooleans':12,'thresholdMm3':VOLUME_THRESHOLD_MM3,
            'significantInterferenceCount':len(invalid),
            'significantPairIds':invalid,
            'maxBallShaftInterferenceMm3':round(max(r['shaftOverlapMm3'] for r in entries),8),
            'maxBallCupInterferenceMm3':round(max(r['cupOverlapMm3'] for r in entries),8),
            'sumBallRaceInterferenceMm3':round(sum(r['shaftOverlapMm3']+r['cupOverlapMm3'] for r in entries),8),
            'perBallNativeBooleanEvidence':entries,
            'sampledPoseNominalClearancePass':not invalid}

def exact_minimum(a:cq.Shape,b:cq.Shape)->float:
    probe=BRepExtrema_DistShapeShape(a.wrapped,b.wrapped)
    probe.Perform()
    if not probe.IsDone():raise ValueError('Native source nearest BRep surfaces failed')
    d=float(probe.Value())
    if not math.isfinite(d) or d<0:raise ValueError('Invalid real BRep surface distance')
    return d

def distance_witnesses(parts:dict,rows:list[dict])->list[dict]:
    selected=[]
    for bend,sp,cp in WITNESS_POSES:
        row=next((r for r in rows if r['bendDeg']==bend and r['shaftSpinDeg']==sp and r['cupSpinDeg']==cp),None)
        if row is None:raise ValueError('Witness is not in prescribed native pose matrix')
        shaft=rot(rot(parts[SHAFT],'z',sp),'x',bend)
        cup=rot(parts[CUP],'z',-cp)
        evidence=[]
        for i,name in enumerate(BALLS,1):
            ball=rot(parts[name],'x',bend/2)
            ds=exact_minimum(ball,shaft)
            dc=exact_minimum(ball,cup)
            native=row['perBallNativeBooleanEvidence'][i-1]
            both=ds<=CONTACT_WITNESS_MM and dc<=CONTACT_WITNESS_MM
            evidence.append({'ball':i,'shaftNativeMinDistanceMm':round(ds,8),
                'cupNativeMinDistanceMm':round(dc,8),
                'nearBothUnloadedSurfaces':both,
                'shaftNativeIntersectionMm3':native['shaftOverlapMm3'],
                'cupNativeIntersectionMm3':native['cupOverlapMm3']})
        selected.append({'bendDeg':bend,'shaftSpinDeg':sp,'cupSpinDeg':cp,
           'significantInterferenceCount':row['significantInterferenceCount'],
           'ballsNearBothNativeSurfaces':sum(e['nearBothUnloadedSurfaces'] for e in evidence),
           'allSixNearBothAndNoLargeInterference':not row['significantInterferenceCount']
               and all(e['nearBothUnloadedSurfaces'] for e in evidence),
           'ballWitnesses':evidence})
    return selected

def assess(parts:dict,phase_pairs=PHASES,bends=BENDS):
    rows=[]
    for bend in bends:
        for sp,cp in phase_pairs:
            rows.append(pair_volumes(parts,bend,sp,cp))
    if len(rows)!=len(bends)*len(phase_pairs):
        raise AssertionError('Prescribed source phase matrix incomplete')
    witness=distance_witnesses(parts,rows)
    danger=[r for r in rows if r['significantInterferenceCount']>0]
    if not danger:
        raise ValueError('P2.34G native source collision negative control unexpectedly all clear')
    return {'schema':SCHEMA,'patch':'P2.34/54',
            'status':'COUPLED_PHASE_NATIVE_COLLISION_FOUND_FUNCTIONAL_CV_G2_HOLD',
            'sourceSTEPsha256':PINS['P234E_source84_revised_six_ball_clearance.step'],
            'sourceNameMapSHA256':PINS['P234E_source84_name_index.json'],
            'originalSourceOwnerPartCount':84,
            'changedNativeSourcePartCount':0,
            'sampledBendAnglesDeg':list(bends),
            'prescribedShaftAndCupPhasePairsDeg':[list(pair) for pair in phase_pairs],
            'sampledCombinedPoseCount':len(rows),
            'newExactOpenCascadeNativeBooleanCount':len(rows)*12,
            'posesWithSignificantNativeInterference':len(danger),
            'posesWithNoSignificantInterference':len(rows)-len(danger),
            'nativePoseEvidence':rows,
            'exactBRepMinDistanceWitnessCount':len(WITNESS_POSES)*len(BALLS)*2,
            'bothRaceContactWitnessThresholdMm':CONTACT_WITNESS_MM,
            'twoRaceNativeDistanceWitnesses':witness,
            'continuousPhaseSpaceExhaustivelyProven':False,
            'simultaneousLoadedSixBallContactMeasured':False,
            'equalAngularVelocityOrTorqueCertified':False,
            'originalModelBVehicleIncluded':False,
            'mechanicalG2Certified':False}

def run(input_dir:Path,out_dir:Path):
    if out_dir.exists():raise FileExistsError('Refuses overwrite of source measurement evidence')
    parts=verify_original(input_dir)
    report=assess(parts)
    out_dir.mkdir(parents=True)
    (out_dir/'P234G_coupled_cv_phase_84native_audit.json').write_text(json.dumps(report,indent=2)+'\n')
    rows=[]
    for r in report['nativePoseEvidence']:
        rows.append({k:r[k] for k in ('bendDeg','shaftSpinDeg','cupSpinDeg',
            'significantInterferenceCount','maxBallShaftInterferenceMm3',
            'maxBallCupInterferenceMm3','sumBallRaceInterferenceMm3','sampledPoseNominalClearancePass')})
    with (out_dir/'P234G_coupled_cv_phase_matrix.csv').open('w',newline='') as fh:
        w=csv.DictWriter(fh,fieldnames=rows[0].keys());w.writeheader();w.writerows(rows)
    return report

if __name__=='__main__':
    a=argparse.ArgumentParser()
    a.add_argument('--p234e-native',type=Path,required=True)
    a.add_argument('--out',type=Path,required=True)
    ns=a.parse_args()
    r=run(ns.p234e_native,ns.out)
    print(json.dumps({k:r[k] for k in ('status','sampledCombinedPoseCount','newExactOpenCascadeNativeBooleanCount',
     'posesWithSignificantNativeInterference','posesWithNoSignificantInterference')},indent=2))
