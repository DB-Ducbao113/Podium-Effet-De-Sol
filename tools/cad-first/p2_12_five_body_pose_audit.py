#!/usr/bin/env python3
"""P2.12 free five-part adjuster poses, not chassis suspension kinematics.

The sleeve rotates; RH/LH male rod ends and their respective locknuts move
axially in opposite directions. The 3 poses enumerate 10 pair checks each.
OCCT Boolean can false-negative on swept helices. The independent
p2_12_phase_contact_audit.py is mandatory, not replaced by this QA.
No continuous swept clearance, true rear structural mating or loading proved.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys

HERE=Path(__file__).resolve().parent
CAD=HERE/"p2_12_toe_adjuster.py"
ANGLES=(-90,0,90)

def single(angle:int)->dict:
    from p2_12_toe_adjuster import A,D,PARTS,THREAD_PITCH_MM,build_new_parts
    from p2_10_rear_wishbone import exact_static_audit
    if angle not in ANGLES:
        raise ValueError("Unknown P2.12 adjuster pose")
    bodies=build_new_parts()
    shift=THREAD_PITCH_MM*angle/360
    moved={
        PARTS["outer"]:bodies[PARTS["outer"]].translate(tuple(D*-shift)),
        PARTS["inner"]:bodies[PARTS["inner"]].translate(tuple(D*shift)),
        PARTS["sleeve"]:bodies[PARTS["sleeve"]].rotate(tuple(A),tuple(A+D),angle),
        PARTS["outerNut"]:bodies[PARTS["outerNut"]].translate(tuple(D*-shift)),
        PARTS["innerNut"]:bodies[PARTS["innerNut"]].translate(tuple(D*shift)),
    }
    report=exact_static_audit(moved)
    if report["pairCount"]!=10 or not report["passStatic"] or report["booleanErrors"]:
        raise RuntimeError("P2.12 five-body source native static-pose audit failed")
    return {
        "sleeveAngleDeg":angle,
        "outerShiftMm":round(-shift,6),"innerShiftMm":round(shift,6),
        "nativePairCount":10,"aabbExcluded":report["aabbExcluded"],
        "nativeBrepPairsEvaluated":report["nativeBrepIntersectionsEvaluated"],
        "recordedBrepPositiveOverlaps":len(report["unresolvedCollisions"]),
        "booleanErrors":len(report["booleanErrors"]),
        "booleanOnlyPassed":True,
        "phaseSurfaceOccupancyRequiredSeparately":True,
    }

def audit(out:Path,per_case_timeout:int=45)->dict:
    if out.exists():
        raise FileExistsError("Refusing to overwrite P2.12 five-body QA evidence")
    if per_case_timeout<=0:
        raise ValueError("Timeout must be positive")
    out.parent.mkdir(parents=True,exist_ok=True)
    digest=hashlib.sha256(CAD.read_bytes()).hexdigest()
    results=[]
    for angle in ANGLES:
        command=[sys.executable,str(Path(__file__).resolve()),"--angle",str(angle)]
        try:
            proc=subprocess.run(command,cwd=HERE,capture_output=True,text=True,
                                check=False,timeout=per_case_timeout)
            if proc.returncode:
                raise RuntimeError(proc.stderr[-1200:] or proc.stdout[-1200:])
            row=json.loads(proc.stdout.strip())
            if (row.get("sleeveAngleDeg")!=angle or
                row.get("nativePairCount")!=10 or
                row.get("booleanOnlyPassed") is not True or
                row.get("phaseSurfaceOccupancyRequiredSeparately") is not True):
                raise RuntimeError("Untrusted 5-body B-Rep result")
            results.append(row)
        except Exception as exc:
            fail={"schema":"podium-eds.p212.five-body-pose-audit.v1",
                  "cadSourceSha256":digest,"complete":False,
                  "error":str(exc),"poses":results,"mechanicalG2":"HOLD"}
            out.write_text(json.dumps(fail,indent=2)+"\n",encoding="utf8")
            raise
    evidence={
        "schema":"podium-eds.p212.five-body-pose-audit.v1",
        "cadSourceSha256":digest,
        "complete":True,"sampleCount":3,"anglesDeg":list(ANGLES),
        "pairChecks":30,"poses":results,
        "booleanOnlyAudit":True,"independentPhaseOccupancyQARequired":True,
        "fullNineteenBodyKinematicsCertified":False,
        "continuousCollisionClearanceCertified":False,
        "physicalRearChassisMatingCertified":False,
        "mechanicalG2":"HOLD",
    }
    out.write_text(json.dumps(evidence,indent=2)+"\n",encoding="utf8")
    return evidence

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--out",type=Path)
    parser.add_argument("--angle",type=int,choices=ANGLES)
    parser.add_argument("--per-case-timeout",type=int,default=45)
    args=parser.parse_args()
    if args.angle is not None:
        result=single(args.angle)
        print(json.dumps(result),flush=True)
        os._exit(0)
    if args.out is None:
        parser.error("--out required for 3-pose native QA")
    result=audit(args.out,args.per_case_timeout)
    print("P2.12 five-body free poses:",result["sampleCount"],"PASS; mechanical G2 HOLD")
