#!/usr/bin/env python3
"""P2.4 complete STATIC CAD intersection audit, NOT CI or F1 fit certification.

Every unique part pair is considered. Nonoverlapping AABBs are rejected, and
all overlapping AABBs undergo exact OpenCascade B-Rep intersection. Dynamic
suspension, wheel travel, running loads and manufacturing tolerance remain OPEN.

python tools/cad-first/p2_4_collision_audit.py \
  --folder .local-assets/cad-first/front-left-p2-4
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
import time
from pathlib import Path
import cadquery as cq
from p2_4_assembly_fit import make_fitted_parts

AXIS_TOLERANCE_MM=0.00001
VOLUME_THRESHOLD_MM3=0.05

def sha256(path):return hashlib.sha256(path.read_bytes()).hexdigest()

def audit(folder):
    start=time.monotonic()
    parts,_,_=make_fitted_parts()
    names=list(parts)
    source=folder/"P2_4_front_left_fitted_master.step"
    if not source.exists():raise FileNotFoundError("Generate fitted STEP first")
    cad=cq.importers.importStep(str(source)).solids().vals()
    if len(cad)!=len(parts) or any(not s.isValid() or s.Volume()<=0 for s in cad):
        raise ValueError("STEP reimport B-Rep count/validity mismatch")
    original_sum=sum(s.Volume() for s in parts.values())
    roundtrip_sum=sum(s.Volume() for s in cad)
    if abs(original_sum-roundtrip_sum)>max(1,original_sum*1e-6):
        raise ValueError("CAD STEP roundtrip volume drift too large")
    boxes={name:shape.BoundingBox() for name,shape in parts.items()}
    total=len(names)*(len(names)-1)//2
    rejected=0
    candidates=0
    errors=[]
    collisions=[]
    tiny=[]
    max_volume=0
    for i,a in enumerate(names):
        for b in names[i+1:]:
            box1,box2=boxes[a],boxes[b]
            extents=[
                min(getattr(box1,axis+"max"),getattr(box2,axis+"max"))-
                max(getattr(box1,axis+"min"),getattr(box2,axis+"min"))
                for axis in "xyz"
            ]
            if any(x<=AXIS_TOLERANCE_MM for x in extents):
                rejected+=1
                continue
            candidates+=1
            try:
                volume=parts[a].intersect(parts[b]).Volume()
                if not math.isfinite(volume):
                    raise ValueError("Nonfinite Boolean intersection")
                max_volume=max(max_volume,volume)
                if volume>VOLUME_THRESHOLD_MM3:
                    collisions.append({
                        "a":a,"b":b,"interferenceMm3":round(volume,6)
                    })
                elif volume>0.00001:
                    tiny.append({
                        "a":a,"b":b,"interferenceMm3":round(volume,6)
                    })
            except Exception as exc:
                errors.append({"a":a,"b":b,"error":str(exc)})
    result={
        "schema":"podium-eds.p2.cad-first.static-fit-audit.v1",
        "scope":"All 53 CAD solids in one static assembled pose, AABB + exact OpenCascade Boolean intersection",
        "sourcePartCount":len(parts),
        "sourceSTEP":source.name,"sourceSTEPsha256":sha256(source),
        "roundtripCadSolids":len(cad),
        "roundtripCadFaces":sum(len(s.Faces()) for s in cad),
        "totalPairs":total,
        "candidatePairs":candidates,
        "broadphaseRejectedPairs":rejected,
        "AABBaxisToleranceMm":AXIS_TOLERANCE_MM,
        "volumeThresholdMm3":VOLUME_THRESHOLD_MM3,
        "maxPositiveOverlapMm3":round(max_volume,8),
        "unresolvedPairs":collisions+errors,
        "subThresholdContactPairs":tiny[:100],
        "sourceVolumeDifferenceMm3":round(abs(original_sum-roundtrip_sum),5),
        "allStaticPairsPass":not bool(collisions or errors),
        "notCertified":[
            "dynamic kinematics","wheel spin throughout 360 degrees",
            "suspension travel","thread torque","bearing preload",
            "thermal expansion","hydraulic loads","tolerance stacks",
            "F1 manufacturer authenticity"
        ],
        "seconds":round(time.monotonic()-start,2),
    }
    if total!=rejected+candidates:
        raise AssertionError("Unaccounted part pair(s)")
    if result["unresolvedPairs"]:
        raise ValueError("Collision audit failed: "+json.dumps(result["unresolvedPairs"][:10]))
    return result

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--folder",type=Path,required=True)
    args=parser.parse_args()
    result=audit(args.folder)
    (args.folder/"P2_4_static_fit_audit.json").write_text(
        json.dumps(result,indent=2)+"\n"
    )
    print(json.dumps(result,indent=2))
