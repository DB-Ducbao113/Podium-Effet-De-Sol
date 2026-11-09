#!/usr/bin/env python3
"""P2.12 v3 phase-locked rear toe thread-pair interference QA.

Six separate CadQuery/OCCT child processes. Fails closed for crashes,
timeouts, some geometric collisions or insufficient locknut-to-sleeve gaps.
WARNING: OCCT Boolean common() has produced FALSE NEGATIVE zero overlap on
intentionally misphased helical source geometry. This volumetric sweep
MUST be accompanied by p2_12_phase_contact_audit.py's 12 independent
solid-occupancy and phase-negative-control cases before local acceptance.
These are free screw-pair movements, NOT rear chassis or vehicle suspension
kinematics, dynamic certification or material load validation.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import subprocess
import sys

HERE=Path(__file__).resolve().parent
SOURCE=HERE/"p2_12_toe_adjuster.py"
ANGLES=(-90,0,90)
RODS=("outer","inner")
THRESHOLD_MM3=.05

def one_pose(degrees:int,rod_name:str)->dict:
    from p2_12_toe_adjuster import (
        A,D,PARTS,THREAD_PITCH_MM,MALE_THREAD_HEIGHT_MM,
        OUTER_NUT_RANGE_MM,INNER_NUT_RANGE_MM,
        SLEEVE_START_MM,SLEEVE_END_MM,build_new_parts,
    )
    if degrees not in ANGLES or rod_name not in RODS:
        raise ValueError("Unrecognized P2.12 test motion")
    if MALE_THREAD_HEIGHT_MM!=24:
        raise ValueError("P2.12 v3 must use the short engaged 24 mm crest")
    solids=build_new_parts()
    turn=solids[PARTS["sleeve"]].rotate(tuple(A),tuple(A+D),degrees)
    axial=THREAD_PITCH_MM*degrees/360 * (-1 if rod_name=="outer" else 1)
    rod=solids[PARTS[rod_name]].translate(tuple(D*axial))
    overlap=turn.intersect(rod).Volume()
    if rod_name=="outer":
        gap=SLEEVE_START_MM-(OUTER_NUT_RANGE_MM[1]+axial)
    else:
        gap=(INNER_NUT_RANGE_MM[0]+axial)-SLEEVE_END_MM
    if not math.isfinite(overlap) or overlap>THRESHOLD_MM3:
        raise ValueError("Original P2.12 thread source has a collision")
    if gap<1.9:
        raise ValueError("Locknut-to-sleeve axial gap disappears")
    return {
        "sleeveAngleDeg":degrees,
        "rodEnd":rod_name,
        "rodAxialTranslationMm":round(axial,6),
        "positiveOverlapMm3":round(overlap,9),
        "nominalSleeveLocknutAxialGapMm":round(gap,6),
        "passed":True,
    }

def scan(out:Path,per_case_timeout:int=28)->dict:
    if out.exists():
        raise FileExistsError("Never overwrite previous native CAD evidence: "+str(out))
    out.parent.mkdir(parents=True,exist_ok=True)
    current_sha=hashlib.sha256(SOURCE.read_bytes()).hexdigest()
    records=[]
    for angle in ANGLES:
        for name in RODS:
            command=[sys.executable,str(Path(__file__).resolve()),
                     "--angle",str(angle),"--rod",name]
            try:
                p=subprocess.run(command,cwd=HERE,text=True,capture_output=True,
                                 timeout=per_case_timeout,check=False)
                if p.returncode!=0:
                    raise RuntimeError("Isolated OCCT process failed: "+p.stderr[-1000:])
                item=json.loads(p.stdout.strip())
                if (item.get("passed") is not True or
                    item.get("sleeveAngleDeg")!=angle or
                    item.get("rodEnd")!=name or
                    not math.isfinite(item.get("positiveOverlapMm3",float("nan"))) or
                    item["positiveOverlapMm3"]>THRESHOLD_MM3 or
                    item.get("nominalSleeveLocknutAxialGapMm",0)<1.9):
                    raise RuntimeError("Isolated P2.12 B-Rep evidence failed validation")
                records.append(item)
            except (subprocess.TimeoutExpired,Exception) as error:
                result={"schema":"podium-eds.p212.threaded-v3.isolated-pair-sweep.v1",
                        "cadSourceSchema":"podium-eds.p2.cad-first.rear-toe-adjuster-threaded.v3",
                        "cadSourceSha256":current_sha,
                        "complete":False,"sampleCount":len(records),
                        "error":str(error),"samples":records,
                        "mechanicalG2":"HOLD"}
                out.write_text(json.dumps(result,indent=2)+"\n")
                raise
    result={
        "schema":"podium-eds.p212.threaded-v3.isolated-pair-sweep.v1",
        "cadSourceSchema":"podium-eds.p2.cad-first.rear-toe-adjuster-threaded.v3",
        "cadSourceSha256":current_sha,
        "complete":True,"sampleCount":len(records),
        "anglesDeg":list(ANGLES),
        "samples":records,
        "maximumPositiveOverlapMm3":max(row["positiveOverlapMm3"] for row in records),
        "minimumLocknutGapMm":min(row["nominalSleeveLocknutAxialGapMm"] for row in records),
        "threadPairsPassLimitedSweep":True,
        "chassisToeKinematicsCertified":False,
        "fullDynamicAssemblyInterferenceTested":False,
        "mechanicalG2":"HOLD",
    }
    out.write_text(json.dumps(result,indent=2)+"\n")
    return result

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--out",type=Path)
    p.add_argument("--angle",type=int,choices=ANGLES)
    p.add_argument("--rod",choices=RODS)
    p.add_argument("--per-case-timeout",type=int,default=28)
    a=p.parse_args()
    if a.angle is not None or a.rod is not None:
        if a.angle is None or a.rod is None:
            p.error("Both --angle and --rod are required")
        result=one_pose(a.angle,a.rod)
        print(json.dumps(result),flush=True)
        # Avoid OCCT finalizer hangs after successful geometry checks.
        os._exit(0)
    if a.out is None:
        p.error("--out is required for the isolated six-pose sweep")
    report=scan(a.out,a.per_case_timeout)
    print("P2.12 v3:",report["sampleCount"],
          "isolated B-Rep screw-pairs PASS; chassis G2 HOLD")
