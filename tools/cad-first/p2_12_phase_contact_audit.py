#!/usr/bin/env python3
"""Independent P2.12 B-Rep helical phase/solid-occupancy QA.

OCCT Boolean common() has returned ZERO on intentionally misphased native
helices despite crest vertices lying inside the female sleeve. Sample actual
source crest surfaces with the sleeve Solid.isInside predicate. At the six
nominal screw positions, no crest sample may be inside sleeve material;
both half-pitch misphase negative controls MUST be detected.

Finite-sample QA only, not continuous clearance, structural contact pressure,
load transmission, wear, torque, OEM authenticity or vehicle toe kinematics.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys

import numpy as np

HERE=Path(__file__).resolve().parent
SOURCE=HERE/"p2_12_toe_adjuster.py"
ANGLES=(-90,0,90)
RODS=("outer","inner")
SAMPLE_COUNT=30
TOLERANCE_MM=.002

def run_one(angle:int,side:str,misphased:bool=False)->dict:
    from p2_12_toe_adjuster import (
        A,D,PARTS,THREAD_PITCH_MM,MALE_THREAD_HEIGHT_MM,
        MALE_OUTER_START_MM,MALE_INNER_START_MM,THREAD_CREST_R_MM,
        build_new_parts,male_helix,v,
    )
    if angle not in ANGLES or side not in RODS:
        raise ValueError("Unsupported original P2.12 screw pose")
    if misphased and angle!=0:
        raise ValueError("Misphase negative control only at zero sleeve angle")
    if MALE_THREAD_HEIGHT_MM!=24 or THREAD_PITCH_MM!=2:
        raise ValueError("Wrong P2.12 v3 external helical pitch/length")
    sleeve=build_new_parts()[PARTS["sleeve"]]
    sleeve=sleeve.rotate(tuple(A),tuple(A+D),angle)
    shift=THREAD_PITCH_MM*angle/360*(-1 if side=="outer" else 1)
    if misphased:
        shift+=1 if side=="outer" else -1
    start=MALE_OUTER_START_MM if side=="outer" else MALE_INNER_START_MM
    crest=male_helix(start,MALE_THREAD_HEIGHT_MM,side=="inner")
    crest=crest.translate(tuple(D*shift))
    verts,_=crest.tessellate(.18,.28)
    xyz=np.asarray([p.toTuple() for p in verts],dtype=np.float64)
    rel=xyz-A
    axial=rel@D
    radial=np.linalg.norm(rel-np.outer(axial,D),axis=1)
    lo,hi=(60,66) if side=="outer" else (101,107)
    candidates=np.where((axial>lo)&(axial<hi)&
                        (radial>THREAD_CREST_R_MM-.37))[0]
    if len(candidates)<SAMPLE_COUNT:
        raise RuntimeError("Not enough source-thread crest samples")
    picks=candidates[np.linspace(0,len(candidates)-1,
                                 SAMPLE_COUNT,dtype=np.int64)]
    count=sum(bool(sleeve.isInside(v(xyz[i]),TOLERANCE_MM)) for i in picks)
    success=(count>=20 if misphased else count==0)
    if not success:
        raise RuntimeError(
            f"Native thread phase/solid occupation failure: {side}, {angle}, "
            f"negative={misphased}, occupied={count}/{SAMPLE_COUNT}")
    return {
        "angleDeg":angle,"rod":side,"deliberatelyMisphased":misphased,
        "axialTranslationMm":round(shift,6),
        "sourceCrestSamples":SAMPLE_COUNT,"crestSamplesInsideSleeve":count,
        "valid":True,
    }

def audit(out:Path,per_case_timeout:int=35)->dict:
    if out.exists():
        raise FileExistsError("Source-locked phase evidence already exists")
    if per_case_timeout<1:
        raise ValueError("Per-case timeout must be positive")
    out.parent.mkdir(parents=True,exist_ok=True)
    digest=hashlib.sha256(SOURCE.read_bytes()).hexdigest()
    cases=[(a,s,False) for a in ANGLES for s in RODS]
    cases.extend([(0,s,True) for s in RODS])
    samples=[]
    for angle,side,negative in cases:
        cmd=[sys.executable,str(Path(__file__).resolve()),
             "--angle",str(angle),"--rod",side]
        if negative:
            cmd.append("--misphase")
        try:
            proc=subprocess.run(cmd,cwd=HERE,text=True,capture_output=True,
                                timeout=per_case_timeout,check=False)
            if proc.returncode!=0:
                raise RuntimeError(proc.stderr[-1000:] or proc.stdout[-1000:] or
                                   "Helical contact subprocess failed")
            row=json.loads(proc.stdout.strip())
            if (row.get("angleDeg")!=angle or row.get("rod")!=side or
                row.get("deliberatelyMisphased") is not negative or
                row.get("sourceCrestSamples")!=SAMPLE_COUNT or
                row.get("valid") is not True):
                raise RuntimeError("Wrong independent source-crest case result")
            occupied=row.get("crestSamplesInsideSleeve")
            if not isinstance(occupied,int) or not 0<=occupied<=SAMPLE_COUNT:
                raise RuntimeError("Invalid occupied source-crest sample count")
            if (negative and occupied<20) or (not negative and occupied!=0):
                raise RuntimeError("Phase negative-control detection failure")
            samples.append(row)
        except Exception as error:
            fail={"schema":"podium-eds.p212.threaded-v3.phase-occupancy.v1",
                  "cadSourceSha256":digest,"complete":False,
                  "verifiedSamples":len(samples),"samples":samples,
                  "error":str(error),"mechanicalG2":"HOLD"}
            out.write_text(json.dumps(fail,indent=2)+"\n",encoding="utf8")
            raise
    result={
        "schema":"podium-eds.p212.threaded-v3.phase-occupancy.v1",
        "cadSourceSchema":"podium-eds.p2.cad-first.rear-toe-adjuster-threaded.v3",
        "cadSourceSha256":digest,
        "complete":True,"sampleCount":8,
        "matchedPhaseCases":6,"negativeControlCases":2,
        "surfaceSamplesPerCase":SAMPLE_COUNT,
        "matchingPhaseZeroIntrusions":True,
        "halfPitchNegativeControlsDetectIntrusion":True,
        "samples":samples,
        "method":"Native crest tessellation + OCC Solid.isInside on female sleeve",
        "scope":"Finite-sample phase-sensitivity, not continuous mechanical clearance",
        "mechanicalLoadCapacityCertified":False,
        "continuousMotionCertified":False,
        "mechanicalG2":"HOLD",
    }
    out.write_text(json.dumps(result,indent=2)+"\n",encoding="utf8")
    return result

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--out",type=Path)
    p.add_argument("--angle",type=int,choices=ANGLES)
    p.add_argument("--rod",choices=RODS)
    p.add_argument("--misphase",action="store_true")
    p.add_argument("--per-case-timeout",type=int,default=35)
    a=p.parse_args()
    if a.angle is not None or a.rod is not None:
        if a.angle is None or a.rod is None:
            p.error("Both --angle and --rod are required")
        result=run_one(a.angle,a.rod,a.misphase)
        print(json.dumps(result),flush=True)
        os._exit(0)
    if a.out is None:
        p.error("--out required for isolated eight-case phase audit")
    result=audit(a.out,a.per_case_timeout)
    print("P2.12 helical B-Rep solid-occupancy:",result["sampleCount"],"cases PASS")
