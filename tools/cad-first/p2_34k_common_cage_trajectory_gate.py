#!/usr/bin/env python3
"""P2.34K: fail-closed sampled common-cage trajectory analysis of P2.34J native reports.

This DOES NOT solve six-ball moving contacts, true cage rotation or torque.
"""
from __future__ import annotations
import argparse,hashlib,json,math
from pathlib import Path
SCHEMA="peds.cad-first.p234k-sampled-common-cage-trajectory.v1"
J_SCHEMA="peds.cad-first.p234j-original84-common-cage-translation.v1"
SOURCE_SHA="9bd7ec6a60d5c4c9f1f3e421cb730fc252de026aae21dcf570584e5dda0ec63e"

def finite(x,label):
    if isinstance(x,bool) or not isinstance(x,(int,float)) or not math.isfinite(x):
        raise ValueError(label+" must be finite")
    return float(x)

def phase_delta(a,b):
    d=(finite(b,"next phase")-finite(a,"previous phase")+180)%360-180
    if abs(abs(d)-180)<1e-8:raise ValueError("Ambiguous 180 degree phase jump")
    return d

def parse_report(data):
    if not isinstance(data,dict) or data.get("schema")!=J_SCHEMA:
        raise ValueError("Not an authentic-format P2.34J report")
    if data.get("sourceSTEPsha256")!=SOURCE_SHA or data.get("partCount")!=84 or data.get("originalCADModified") is not False:
        raise ValueError("Source provenance or unchanged native part count invalid")
    pose=data.get("pose")
    if not isinstance(pose,dict):raise ValueError("Missing native pose")
    bend=finite(pose.get("bendDeg"),"bend")
    shaft=finite(pose.get("shaftSpinDeg"),"shaft")
    cup=finite(pose.get("cupSpinDeg"),"cup")
    if abs(bend)>15 or abs(shaft)>360 or abs(cup)>360:
        raise ValueError("Unsupported pose")
    best=data.get("bestCandidate")
    if not isinstance(best,dict):raise ValueError("Missing J best candidate")
    offset=best.get("sharedCageLocalTranslationMm")
    if not isinstance(offset,list) or len(offset)!=3:raise ValueError("Missing cage translation")
    xyz=tuple(finite(x,"offset") for x in offset)
    if any(abs(x)>2 for x in xyz):raise ValueError("Offset outside P2.34I/J search budget")
    label=best.get("classification")
    if not isinstance(label,dict) or type(label.get("exploratoryCandidate")) is not bool:
        raise ValueError("Missing explicitly evaluated native collision label")
    if data.get("candidateCountMeetingExploratoryScreen",0)<0:
        raise ValueError("Invalid candidate count")
    if label["exploratoryCandidate"] and data.get("candidateCountMeetingExploratoryScreen",0)<1:
        raise ValueError("Candidate count contradicts native best result")
    if data.get("mechanicalG2Certified") is not False:
        raise ValueError("Unexpected mechanical certification claim")
    return {"bendDeg":bend,"shaftSpinDeg":shaft,"cupSpinDeg":cup,
            "offsetLocalMm":xyz,"sourcePoseScreenPass":label["exploratoryCandidate"]}

def transformed_translation(p):
    # J: local translation is rotated by half the sampled bend around X.
    x,y,z=p["offsetLocalMm"];a=math.radians(p["bendDeg"]/2)
    return (x,y*math.cos(a)-z*math.sin(a),y*math.sin(a)+z*math.cos(a))

def quaternion_x(deg):
    t=math.radians(deg)/2
    return (math.sin(t),0.,0.,math.cos(t))

def analyze(reports,max_phase_step_deg=5.,max_translation_step_mm=.25,
            max_cage_orientation_step_deg=5.,max_speed_ratio_error=.01):
    step=finite(max_phase_step_deg,"phase limit")
    shift=finite(max_translation_step_mm,"translation limit")
    rot=finite(max_cage_orientation_step_deg,"orientation limit")
    ratio_limit=finite(max_speed_ratio_error,"ratio limit")
    if min(step,shift,rot)<=0 or not 0<=ratio_limit<1:
        raise ValueError("Invalid sampling limits")
    if not isinstance(reports,list) or len(reports)<3:
        raise ValueError("Need >=3 native P2.34J pose reports")
    poses=[parse_report(r) for r in reports]
    if any(abs(p["bendDeg"]-poses[0]["bendDeg"])>1e-8 for p in poses):
        raise ValueError("Mixed bend angles: compare distinct bends in separate traces")
    if len({(p["shaftSpinDeg"],p["cupSpinDeg"]) for p in poses})!=len(poses):
        raise ValueError("Duplicate phase pairs")
    for p in poses:
        p["worldTranslationMm"]=transformed_translation(p)
        p["assumedHalfBendCageQuaternionXYZW"]=quaternion_x(p["bendDeg"]/2)
    transitions=[]
    for a,b in zip(poses,poses[1:]):
        ds=phase_delta(a["shaftSpinDeg"],b["shaftSpinDeg"])
        dc=phase_delta(a["cupSpinDeg"],b["cupSpinDeg"])
        if ds<=0 or dc<=0:raise ValueError("Input and cup phase magnitudes must increase together")
        translation_mm=math.dist(a["worldTranslationMm"],b["worldTranslationMm"])
        cage_deg=abs(b["bendDeg"]-a["bendDeg"])/2
        ratio=dc/ds
        transitions.append({
            "inputPhaseStepDeg":ds,"cupPhaseStepDeg":dc,
            "outputInputPhaseIncrementRatio":ratio,
            "sharedCageTranslationStepMm":translation_mm,
            "assumedHalfBendOrientationStepDeg":cage_deg,
            "phaseStepPass":max(ds,dc)<=step,
            "translationStepPass":translation_mm<=shift,
            "orientationStepPass":cage_deg<=rot,
            "ratioStepPass":abs(ratio-1)<=ratio_limit})
    all_native=all(p["sourcePoseScreenPass"] for p in poses)
    all_paths=all(all(t[k] for k in (
        "phaseStepPass","translationStepPass","orientationStepPass","ratioStepPass"))
                  for t in transitions)
    return {"schema":SCHEMA,"sourceSTEPsha256":SOURCE_SHA,"source84Modified":False,
            "poseCount":len(poses),"bendDeg":poses[0]["bendDeg"],
            "poseWitnesses":poses,"transitions":transitions,
            "allSampledNativePoseScreensPass":all_native,
            "sampledContinuityScreenPass":all_paths,
            "exploratoryTracePass":all_native and all_paths,
            "usesIndependentP234JBestPoseOnly":True,
            "cageOrientationAssumedHalfBendNotSolved":True,
            "adaptiveBetweenSamplesValidationComplete":False,
            "sixBallConjugateTrajectoriesProven":False,
            "continuousConstantVelocityCertified":False,
            "loadedTorqueTransferCertified":False,
            "mechanicalG2Certified":False,
            "status":"SAMPLED_CAGE_PATH_DIAGNOSTIC_ONLY_G2_HOLD"}

def run(inputs,out):
    out=Path(out)
    if out.exists():raise FileExistsError("Refuses evidence overwrite")
    paths=[Path(p) for p in inputs]
    if len(paths)!=len(set(paths)):raise ValueError("Duplicate report paths")
    data=[];provenance=[]
    for p in paths:
        raw=p.read_bytes()
        data.append(json.loads(raw))
        provenance.append({"file":p.name,"sha256":hashlib.sha256(raw).hexdigest()})
    report=analyze(data)
    report["inputReportSHA256"]=provenance
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(report,indent=2,allow_nan=False)+"\n",encoding="utf8")
    return report

if __name__=="__main__":
    cli=argparse.ArgumentParser()
    cli.add_argument("--j-report",required=True,nargs="+",type=Path)
    cli.add_argument("--out",required=True,type=Path)
    args=cli.parse_args()
    report=run(args.j_report,args.out)
    print(json.dumps({"status":report["status"],"exploratoryTracePass":report["exploratoryTracePass"],
                      "poseCount":report["poseCount"]}))
