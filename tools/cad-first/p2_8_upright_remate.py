#!/usr/bin/env python3
"""P2.8 experimental full-corner static CAD remating — NOT manufacturing ready.

Rebuilds project-owned P2.6 + P2.7 native CadQuery shapes, removes obsolete
two straight wishbone rods, machines the P2.6 upright to clear four P2.7
A-arm/stud profiles, and checks all 59 choose 2 assembled pairs.

The cutter's 0.3 mm AABB half-width expansion is a *visual clearance study*,
not a minimum guaranteed machining clearance. Direct original-tool cuts
are additionally applied because nonuniform OpenCascade transformations
can leave positive Boolean overlap. Disconnected upright fragments are
REMOVED and explicitly measured, NOT hidden. Full strength, hardpoint
structure, bump/steering coupled motion remain unverified and blocked.
"""
from __future__ import annotations
import argparse, hashlib, json, math, time
from pathlib import Path
import cadquery as cq
from OCP.gp import gp_GTrsf, gp_Mat, gp_XYZ
from OCP.BRepBuilderAPI import BRepBuilderAPI_GTransform
from p2_6_steering_relief import make_steering_parts
from p2_7_wishbone_cad import build_parts

LEGACY={"P2_UPPER_WISHBONE_LINK","P2_LOWER_WISHBONE_LINK"}
UPRIGHT="P2_UPRIGHT_BEARING_CARRIER"
INTERFERING=(
 "P27_UPPER_A_ARM_FORGED","P27_UPPER_OUTER_JOINT_STUD",
 "P27_LOWER_A_ARM_FORGED","P27_LOWER_OUTER_JOINT_STUD"
)
OVERLAP_THRESHOLD_MM3=.05

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def approximate_inflation(shape,half_width_mm=.3):
    bound=shape.BoundingBox()
    extents=[bound.xlen,bound.ylen,bound.zlen]
    center=[(getattr(bound,d+"min")+getattr(bound,d+"max"))/2 for d in "xyz"]
    scales=[1+2*half_width_mm/max(e,1) for e in extents]
    sx,sy,sz=scales
    tr=gp_GTrsf()
    tr.SetVectorialPart(gp_Mat(sx,0,0,0,sy,0,0,0,sz))
    tr.SetTranslationPart(gp_XYZ(*(center[i]*(1-scales[i]) for i in range(3))))
    return cq.Shape(BRepBuilderAPI_GTransform(shape.wrapped,tr,True).Shape())

def author():
    p26,_=make_steering_parts()
    p27=build_parts()
    retained={key:part for key,part in p26.items() if key not in LEGACY}
    if len(retained)!=51 or len(p27)!=8:
        raise ValueError("CAD source identities changed")
    upright=retained[UPRIGHT]
    before=upright.Volume()
    cuts=[]
    for name in INTERFERING:
        tool=p27[name]
        prior=upright.intersect(tool).Volume()
        upright=upright.cut(approximate_inflation(tool)).cut(tool)
        cuts.append({"part":name,"initialOverlapMm3":round(prior,4)})
    upright=upright.fix()
    fragments=[]
    if len(upright.Solids())>1:
        separate=sorted(upright.Solids(),key=lambda s:s.Volume(),reverse=True)
        fragments=[{"volumeMm3":round(x.Volume(),4),"faces":len(x.Faces())} for x in separate[1:]]
        upright=separate[0]  # Missing joint lug topology MUST be reauthored in next gate.
    if not upright.isValid() or len(upright.Solids())!=1:
        raise ValueError("Upright became invalid or disconnected")
    retained[UPRIGHT]=upright
    retained.update(p27)
    if len(retained)!=59 or any(not x.isValid() or x.Volume()<=0 or len(x.Solids())!=1 for x in retained.values()):
        raise ValueError("59-source-solid validity gate failed")
    return retained,{
        "uprightBeforeMm3":before,"uprightAfterMm3":upright.Volume(),
        "uprightRemovedMm3":before-upright.Volume(),
        "separatedFragmentsRemoved":fragments,"machinedParts":cuts,
        "designLimit":"joint boss structural topology NOT certified, full suspension motion NOT tested"
    }

def static_audit(parts):
    names=list(parts)
    bounds={name:shape.BoundingBox() for name,shape in parts.items()}
    excluded=0;booleans=0;collisions=[];errors=[];max_volume=0.
    for i,name in enumerate(names):
        for other in names[i+1:]:
            a,b=bounds[name],bounds[other]
            if any(min(getattr(a,d+"max"),getattr(b,d+"max"))-
                   max(getattr(a,d+"min"),getattr(b,d+"min"))<=1e-5
                   for d in "xyz"):
                excluded+=1
                continue
            booleans+=1
            try:
                v=parts[name].intersect(parts[other]).Volume()
                if not math.isfinite(v):raise ValueError("non-finite overlap")
                max_volume=max(max_volume,v)
                if v>OVERLAP_THRESHOLD_MM3:
                    collisions.append({"a":name,"b":other,"mm3":round(v,5)})
            except Exception as err:
                errors.append({"a":name,"b":other,"error":str(err)})
    n=len(names)*(len(names)-1)//2
    if n!=excluded+booleans:raise AssertionError("missing tested pair")
    return {
        "schema":"podium-eds.p2.cad-first.remate-static-audit.v1",
        "partCount":len(parts),"totalPairs":n,"aabbExcluded":excluded,
        "exactBrepPairs":booleans,"unresolvedPairs":collisions,
        "booleanErrors":errors,"maxPositiveOverlapMm3":max_volume,
        "thresholdMm3":OVERLAP_THRESHOLD_MM3,
        "singleStaticPosePass":not (collisions or errors),
        "steeringTravelAndBumpValidated":False,"jointLoadStrengthValidated":False
    }

def main(out:Path):
    out.mkdir(parents=True,exist_ok=True)
    bodies,machining=author()
    audit=static_audit(bodies)
    step=out/"P28_integrated_59_solid_master.step"
    assembly=cq.Assembly(name="P28_ORIGINAL_FULL_CORNER_STATIC_FIT")
    for name,body in bodies.items():assembly.add(body,name=name)
    assembly.save(str(step),exportType="STEP")
    roundtrip=cq.importers.importStep(str(step)).solids().vals()
    manifest={
        "schema":"podium-eds.p2.cad-first.full-corner.remate.v1",
        "source":"Project-authored P2.6/P2.7 original B-Rep",
        "unitsCAD":"mm","unitsGLB":"m","masterSTEP":step.name,
        "masterSTEPsha256":digest(step),"totalCadSolids":len(bodies),
        "partIds":list(bodies),"machining":machining,"staticFit":audit,
        "roundtripSolids":len(roundtrip),
        "roundtripFaces":sum(len(x.Faces()) for x in roundtrip),
        "allRoundtripValid":all(x.isValid() and x.Volume()>0 for x in roundtrip),
        "notValidated":["coupled bump + steering","structural upright boss support",
                        "actual ball joint rotation","loads/stress/fatigue",
                        "manufacturing tolerances","F1 OEM authenticity"],
        "profiles":{}
    }
    (out/"P28_static_audit.json").write_text(json.dumps(audit,indent=2)+"\n")
    (out/"P28_remate_manifest.json").write_text(json.dumps(manifest,indent=2)+"\n")
    if len(roundtrip)!=59 or not manifest["allRoundtripValid"] or not audit["singleStaticPosePass"]:
        raise RuntimeError("P2.8 static source audit FAIL")
    print("STATIC ONLY: PASS",len(roundtrip),"solids",audit["totalPairs"],"pairs",
          audit["exactBrepPairs"],"exact B-Rep Boolean checks")

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--out",required=True,type=Path)
    args=p.parse_args()
    main(args.out)
