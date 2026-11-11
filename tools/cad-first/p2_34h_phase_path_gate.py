#!/usr/bin/env python3
"""P2.34H sampled native CV phase-path gate. Not a CV/torque certification."""
import argparse,json,math
from pathlib import Path

SCHEMA="peds.cad-first.p234h-cv-phase-path-review.v1"

def number(x,name):
    if isinstance(x,bool) or not isinstance(x,(int,float)) or not math.isfinite(x):
        raise ValueError(f"{name}: finite numeric value required")
    return float(x)

def delta(current,previous):
    d=(number(current,"phase")-number(previous,"phase")+180)%360-180
    if abs(abs(d)-180)<1e-7:raise ValueError("Ambiguous 180 degree phase jump")
    return d

def check_pose(p,volume_limit=.05,gap_limit=1e-5):
    bend=number(p.get("bendDeg"),"bend")
    shaft=number(p.get("shaftSpinDeg"),"shaft phase")
    cup=number(p.get("cupSpinDeg"),"cup phase")
    balls=p.get("ballWitnesses")
    if not isinstance(balls,list) or len(balls)!=6:raise ValueError("Exactly six native ball witnesses required")
    seen=set();collisions=0;gaps=0
    for b in balls:
        index=b.get("ball")
        if type(index) is not int or index not in range(1,7) or index in seen:
            raise ValueError("Missing or duplicate native ball ID")
        seen.add(index)
        sd=number(b.get("shaftNativeMinDistanceMm"),"shaft distance")
        cd=number(b.get("cupNativeMinDistanceMm"),"cup distance")
        sv=number(b.get("shaftNativeIntersectionMm3"),"shaft overlap")
        cv=number(b.get("cupNativeIntersectionMm3"),"cup overlap")
        if min(sd,cd,sv,cv)<0:raise ValueError("Negative B-Rep measurement")
        collisions+=int(sv>volume_limit)+int(cv>volume_limit)
        gaps+=int(sd>gap_limit or cd>gap_limit)
    return dict(bendDeg=bend,shaftSpinDeg=shaft,cupSpinDeg=cup,
                significantOverlapPairs=collisions,ballsWithRaceGap=gaps,
                sampledPoseCandidate=collisions==0 and gaps==0)

def assess(samples,max_step_deg=5.,max_ratio_error=.01):
    max_step_deg=number(max_step_deg,"max step")
    max_ratio_error=number(max_ratio_error,"ratio tolerance")
    if max_step_deg<=0 or not 0<=max_ratio_error<1:raise ValueError("Invalid phase limits")
    if not isinstance(samples,list) or len(samples)<3:
        raise ValueError("At least three independently measured poses required")
    rows=[check_pose(p) for p in samples]
    if any(abs(p["bendDeg"]-rows[0]["bendDeg"])>1e-9 for p in rows):
        raise ValueError("Mixed bend angles")
    segments=[]
    for previous,current in zip(rows,rows[1:]):
        di=delta(current["shaftSpinDeg"],previous["shaftSpinDeg"])
        dc=delta(current["cupSpinDeg"],previous["cupSpinDeg"])
        if di<=1e-7 or dc< -1e-7:raise ValueError("Nonmonotonic input or reversed cup phase")
        ratio=dc/di
        segments.append(dict(inputStepDeg=di,cupStepDeg=dc,ratio=ratio,
            cadencePass=di<=max_step_deg and dc<=max_step_deg,
            ratioPass=abs(ratio-1)<=max_ratio_error))
    contact=all(p["sampledPoseCandidate"] for p in rows)
    cadence=all(s["cadencePass"] for s in segments)
    speed=all(s["ratioPass"] for s in segments)
    return dict(schema=SCHEMA,bendDeg=rows[0]["bendDeg"],sampleCount=len(rows),
        poseEvidence=rows,phaseSegments=segments,
        sampledBothRaceProximityAndCollisionGate=contact,
        sampledPhaseIncrementGate=speed,sampleCadenceGate=cadence,
        sampledPathDiagnosticPass=contact and cadence and speed,
        continuousPathCertified=False,actualAngularVelocityMeasured=False,
        torqueTransferCertified=False,mechanicalG2Certified=False,
        status="SAMPLED_PATH_REVIEW_ONLY_G2_HOLD")

def main():
    cli=argparse.ArgumentParser()
    cli.add_argument("--input",required=True,type=Path)
    cli.add_argument("--out",required=True,type=Path)
    args=cli.parse_args()
    if args.out.exists():raise FileExistsError("Refuses overwrite of audit output")
    result=assess(json.loads(args.input.read_text(encoding="utf-8")))
    args.out.write_text(json.dumps(result,indent=2)+"\n",encoding="utf-8")
    print(result["status"])
if __name__=="__main__":main()
