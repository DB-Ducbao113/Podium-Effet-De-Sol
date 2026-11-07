#!/usr/bin/env python3
"""P2.3 CAD precision upgrade: self-authored study, NOT certified F1 hardware.

Requires p2_2_front_left_original.py. CAD units mm, GLB metres.
Run --init; then three SEPARATE --profile calls; lastly --finalize.
Each profile in its own process avoids OpenCascade tessellation cache reuse.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path

import cadquery as cq
from p2_2_front_left_original import make_parts, export_glb, QUALITY

PITCH_MM=3.0
BALL_PITCH_RADIUS_MM=50.0
BALL_RADIUS_MM=5.96
BEARING_GROOVE_RADIUS_MM=6.06
CALIPER_PISTON_RADIUS_MM=13.8
CALIPER_BORE_RADIUS_MM=13.9

def wp(z):
    return cq.Workplane("XY").workplane(offset=z)

def cylinder(radius,z,height,x=0,y=0):
    return cq.Solid.makeCylinder(radius,height,cq.Vector(x,y,z),cq.Vector(0,0,1))

def upgrade_parts(parts):
    proof={}
    # Replaces oversized P2.2 nut bore with a genuine swept female groove.
    base=(wp(68).polygon(12,73).extrude(27).faces(">Z").edges()
          .chamfer(1.2).cut(wp(67).circle(19.75).extrude(29)).val())
    helix=cq.Wire.makeHelix(PITCH_MM,26.0,19.6).translate((0,0,67))
    cutter=(cq.Workplane("XZ")
            .polyline([(19.48,65.45),(22.15,67.0),(19.48,68.55)])
            .close().sweep(helix,isFrenet=True).val())
    nut=base.cut(cutter)
    parts["P2_CENTER_LOCK_NUT_BORE"]=nut
    proof["nutHelicalGrooveVolumeMm3"]=round(base.Volume()-nut.Volume(),4)
    proof["studNutIntersectionMm3"]=round(
        parts["P2_CENTER_STUD_EXTERNAL_HELIX"].intersect(nut).Volume(),8)

    groove=cq.Solid.makeTorus(
        BALL_PITCH_RADIUS_MM,BEARING_GROOVE_RADIUS_MM,
        cq.Vector(0,0,-107),cq.Vector(0,0,1))
    inner=wp(-126).circle(45.7).circle(31.1).extrude(38).val()
    outer=wp(-126).circle(69).circle(54.3).extrude(38).val()
    parts["P2_BEARING_INNER_RACE"]=inner.cut(groove)
    parts["P2_BEARING_OUTER_RACE"]=outer.cut(groove)
    proof["innerRaceGrooveVolumeMm3"]=round(
        inner.Volume()-parts["P2_BEARING_INNER_RACE"].Volume(),4)
    proof["outerRaceGrooveVolumeMm3"]=round(
        outer.Volume()-parts["P2_BEARING_OUTER_RACE"].Volume(),4)

    retainer=wp(-115).circle(53.3).circle(46.7).extrude(8).val()
    ball_cut=cq.Workplane("XY").sphere(BALL_RADIUS_MM+0.34).val()
    for i in range(12):
        angle=math.tau*i/12
        location=cq.Vector(BALL_PITCH_RADIUS_MM*math.cos(angle),
                           BALL_PITCH_RADIUS_MM*math.sin(angle),-107)
        retainer=retainer.cut(ball_cut.translate(location))
    parts["P2_BEARING_RETAINER_12_POCKET"]=retainer
    for label,z in [("INBOARD",-124.8),("OUTBOARD",-90.8)]:
        parts[f"P2_BEARING_DUST_SHIELD_{label}"]=(
            wp(z).circle(54.0).circle(45.9).extrude(0.95).val())

    max_race=0.0
    max_cage=0.0
    for i in range(12):
        ball=parts[f"P2_BEARING_BALL_{i+1:02d}"]
        for label in ("P2_BEARING_INNER_RACE","P2_BEARING_OUTER_RACE"):
            max_race=max(max_race,ball.intersect(parts[label]).Volume())
        max_cage=max(max_cage,ball.intersect(retainer).Volume())
    proof["maxBallRaceIntersectionMm3"]=round(max_race,8)
    proof["maxBallRetainerIntersectionMm3"]=round(max_cage,8)
    proof["nominalBearingBallGrooveClearanceMm"]=round(
        BEARING_GROOVE_RADIUS_MM-BALL_RADIUS_MM,3)

    # Machined bores from EXISTING castings; pistons remain four named bodies.
    spots=[(-25.0,158.0),(25.0,158.0)]
    for side,name,bore_z,bore_h,piston_z,piston_h in [
        ("INBOARD","P2_CALIPER_INBOARD_CASTING",-103.0,15.0,-102.0,11.7),
        ("OUTBOARD","P2_CALIPER_OUTBOARD_CASTING",-43.0,9.0,-52.7,18.7),
    ]:
        body=parts[name]
        for i,(x,y) in enumerate(spots,1):
            body=body.cut(cylinder(CALIPER_BORE_RADIUS_MM,bore_z,bore_h,x,y))
            parts[f"P2_CALIPER_PISTON_{side}_{i:02d}"]=(
                cylinder(CALIPER_PISTON_RADIUS_MM,piston_z,piston_h,x,y))
        parts[name]=body
    for i,x in enumerate((-25.0,25.0),1):
        for name in ("P2_CALIPER_INBOARD_CASTING",
                     "P2_CALIPER_OUTBOARD_CASTING"):
            parts[name]=parts[name].cut(cylinder(4.05,-107,82,x,190))
        parts[f"P2_CALIPER_PAD_RETAINING_PIN_{i:02d}"]=(
            cylinder(3.65,-109,86,x,190))

    max_piston=0.0
    for side in ("INBOARD","OUTBOARD"):
        casting=parts[f"P2_CALIPER_{side}_CASTING"]
        for i in (1,2):
            piston=parts[f"P2_CALIPER_PISTON_{side}_{i:02d}"]
            max_piston=max(max_piston,casting.intersect(piston).Volume())
    proof["largestPistonHousingIntersectionMm3"]=round(max_piston,8)
    proof["pistonBoreRadialClearanceMm"]=round(
        CALIPER_BORE_RADIUS_MM-CALIPER_PISTON_RADIUS_MM,3)
    proof["caliperPistonCount"]=4
    proof["retainerPocketCount"]=12
    proof["caliperPinCount"]=2

    for name,solid in parts.items():
        if (solid.isNull() or not solid.isValid() or
            solid.Volume()<=0 or len(solid.Solids())!=1):
            raise ValueError(f"Invalid P2.3 B-Rep source solid: {name}")
    for name in ("nutHelicalGrooveVolumeMm3","innerRaceGrooveVolumeMm3",
                 "outerRaceGrooveVolumeMm3"):
        if proof[name]<=100:raise ValueError("Physical groove not machined: "+name)
    for name in ("studNutIntersectionMm3","maxBallRaceIntersectionMm3",
                 "maxBallRetainerIntersectionMm3",
                 "largestPistonHousingIntersectionMm3"):
        if proof[name]>=0.0001:raise ValueError("Targeted collision detected: "+name)
    return parts,proof

def make_precision_parts():
    return upgrade_parts(make_parts())

def _core(parts,proof,step):
    return {
        "schema":"podium-eds.p2.cad-first.front-corner.precision.v1",
        "source":"P2.2 original B-Rep with project-authored P2.3 machining",
        "unitsCAD":"mm","unitsGLB":"m","axleOutboardCADAxis":"+Z",
        "masterSTEP":step.name,
        "masterSTEPsha256":hashlib.sha256(step.read_bytes()).hexdigest(),
        "totalCadSolids":len(parts),"partIds":list(parts),"geometryProof":proof,
        "mechanicalTruth":{
            "maleAndFemale3DHelix":True,
            "innerAndOuterRacewayToroidalGroove":True,
            "bearingCageWithRealSphericalPockets":True,
            "caliperPistonBoreGeometry":True,
            "preliminarySelectedPairIntersectionChecked":True,
            "physicalMechanicalFitCertified":False,
            "loadsStressThermalCertified":False,
            "authenticF1Provenance":False,
        },
        "profiles":{}
    }

def prepare_master(output):
    output.mkdir(parents=True,exist_ok=True)
    parts,proof=make_precision_parts()
    assembly=cq.Assembly(name="P2_3_FRONT_LEFT_PRECISION_STUDY")
    for name,shape in parts.items():assembly.add(shape,name=name)
    step=output/"P2_3_front_left_precision_master.step"
    assembly.save(str(step),exportType="STEP")
    (output/".P2_3_core.json").write_text(
        json.dumps(_core(parts,proof,step),indent=2)+"\n")
    print("PREPARED",len(parts),"CAD solids",step.stat().st_size,"bytes")

def generate_profile(output,quality):
    output.mkdir(parents=True,exist_ok=True)
    parts,_=make_precision_parts()
    linear,angular=QUALITY[quality]
    glb=output/f"P2_3_front_left_{quality.lower()}.glb"
    triangles=export_glb(parts,glb,linear,angular)
    record={
        "file":glb.name,"sha256":hashlib.sha256(glb.read_bytes()).hexdigest(),
        "bytes":glb.stat().st_size,"totalTriangles":sum(triangles.values()),
        "perPartTriangles":triangles,"linearToleranceMm":linear,
        "angularToleranceRad":angular,
    }
    (output/f".P2_3_profile_{quality}.json").write_text(
        json.dumps(record,indent=2)+"\n")
    print("EXPORTED",quality,len(parts),"parts",sum(triangles.values()),"triangles")

def finalize(output):
    core=json.loads((output/".P2_3_core.json").read_text())
    for quality in ("HIGH","BALANCED","PERFORMANCE"):
        record=json.loads((output/f".P2_3_profile_{quality}.json").read_text())
        path=output/record["file"]
        if (not path.exists() or path.stat().st_size!=record["bytes"] or
            hashlib.sha256(path.read_bytes()).hexdigest()!=record["sha256"]):
            raise ValueError("GLB integrity mismatch: "+quality)
        if set(record["perPartTriangles"])!=set(core["partIds"]):
            raise ValueError("GLB semantic part IDs mismatch: "+quality)
        core["profiles"][quality]=record
    counts=[core["profiles"][p]["totalTriangles"]
            for p in ("HIGH","BALANCED","PERFORMANCE")]
    if not counts[0]>counts[1]>counts[2]:
        raise ValueError("Tessellation LODs must decrease in complexity")
    (output/"P2_3_precision_manifest.json").write_text(
        json.dumps(core,indent=2)+"\n")
    print("FINALIZED",core["totalCadSolids"],"solids, 3 true LODs")

if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out",type=Path,required=True)
    operation=parser.add_mutually_exclusive_group(required=True)
    operation.add_argument("--init",action="store_true")
    operation.add_argument("--profile",choices=("HIGH","BALANCED","PERFORMANCE"))
    operation.add_argument("--finalize",action="store_true")
    args=parser.parse_args()
    if args.init:prepare_master(args.out)
    elif args.profile:generate_profile(args.out,args.profile)
    else:finalize(args.out)
