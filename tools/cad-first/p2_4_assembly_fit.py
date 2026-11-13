#!/usr/bin/env python3
"""P2.4 project-authored CAD static-fit rebuild (NOT actual Formula 1 source).

Use --init, --profile HIGH, --profile BALANCED, --profile PERFORMANCE,
run p2_4_collision_audit.py, then --finalize.
CAD units millimetres, GLB units metres. Source: P2.3 analytic B-Rep.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
from pathlib import Path
import cadquery as cq
from p2_3_precision_upgrade import make_precision_parts
from p2_2_front_left_original import export_glb, QUALITY

def wp(z): return cq.Workplane("XY").workplane(offset=z)
def ring(inner, outer, z, height):
    return wp(z).circle(outer).circle(inner).extrude(height).val()
def cylinder(radius,z,height,x=0,y=0):
    return cq.Solid.makeCylinder(radius,height,cq.Vector(x,y,z),cq.Vector(0,0,1))
def bar(a,b,r):
    v=cq.Vector(*(b[i]-a[i] for i in range(3)))
    return cq.Solid.makeCylinder(r,v.Length,cq.Vector(*a),v.normalized())
def sha256(path): return hashlib.sha256(path.read_bytes()).hexdigest()

def make_fitted_parts():
    parts,previous_proof=make_precision_parts()
    changes={
        "onePieceForgedRim":True,"wheelSuspensionClearanceReworked":True,
        "hubAndStudFaceMateInsteadOfIntersection":True,
        "brakeHatMovedOutsideBearingAndUpright":True,
        "realRotorHatFastenerBores":True,"caliperRotorAndWheelSeparation":True,
        "caliperBridgesWithRealCastingReliefs":True,
        "notManufacturingCertified":True,
    }
    # Rebuild rim: ten source spokes are one connected forging, not ten
    # separate phantom mechanical parts overlapping the parent rim mesh.
    forged=parts["P2_RIM_FORGED_BARREL"]
    forged=forged.fuse(ring(31.5,69,51.1,11.9))
    for n in range(1,11):
        spoke=parts.pop(f"P2_RIM_SPOKE_{n:02d}").translate((0,0,3.2))
        forged=forged.fuse(spoke)
    del parts["P2_RIM_CENTRE_DISC"]
    parts["P2_RIM_FORGED_BARREL"]=forged
    parts["P2_CENTER_STUD_EXTERNAL_HELIX"]=(
        parts["P2_CENTER_STUD_EXTERNAL_HELIX"].cut(cylinder(30,49.5,5.5)))
    parts["P2_CENTER_LOCK_FACE_RING"]=ring(22.3,38.5,63,5)

    # Move cast upright interfaces inboard behind forged rim's sweep.
    upright=ring(70.5,95,-145,74)
    for joint,root,web_radius in [
        ((-98,114,-170),(-64,65,-121),21),
        ((-98,-114,-170),(-64,-65,-121),21),
        ((114,0,-170),(85,0,-121),18),
    ]:
        x,y,z=joint
        lug=(cq.Workplane("XY").box(54 if y else 39,66 if y else 46,30)
             .edges("|Z").chamfer(5).val().translate(cq.Vector(x,y,z)))
        upright=upright.fuse(lug).fuse(bar(root,joint,web_radius))
    for name,a,b,r in [
        ("P2_UPPER_WISHBONE_LINK",(-98,114,-170),(-355,225,-280),11),
        ("P2_LOWER_WISHBONE_LINK",(-98,-114,-170),(-360,-216,-285),13),
        ("P2_TIE_ROD",(114,0,-170),(-260,-49,-290),8),
    ]:
        parts[name]=bar(a,b,r).fuse(cq.Solid.makeSphere(r+5,cq.Vector(*a)))
        upright=upright.cut(cq.Solid.makeSphere(r+5.5,cq.Vector(*a)))
        end=tuple(a[i]+.23*(b[i]-a[i]) for i in range(3))
        upright=upright.cut(bar(a,end,r+.5))
    parts["P2_UPRIGHT_BEARING_CARRIER"]=upright

    # Rotor-hat sleeve now sits OUTBOARD of the upright/bearing, with a face
    # mating the rotor, rather than occupying their B-Rep volumes.
    hat=ring(42,122,-64,6).fuse(ring(42,64,-58,10))
    rotor=parts["P2_BRAKE_ROTOR_DRILLED_CARBON"]
    for i in range(6):
        angle=math.tau*i/6
        x,y=112*math.cos(angle),112*math.sin(angle)
        bore=cylinder(5.1,-86,35,x,y)
        hat=hat.cut(bore)
        rotor=rotor.cut(bore)
        shank=cylinder(4.5,-79,27,x,y)
        head=wp(-84).center(x,y).polygon(6,15).extrude(5).val()
        parts[f"P2_ROTOR_MOUNT_FASTENER_{i+1:02d}"]=head.fuse(shank)
        nut=wp(-58).center(x,y).polygon(6,18).extrude(6)
        nut=nut.cut(wp(-59).center(x,y).circle(4.9).extrude(8))
        parts[f"P2_ROTOR_MOUNT_NUT_{i+1:02d}"]=nut.val()
    parts["P2_BRAKE_ROTOR_HAT"]=hat
    parts["P2_BRAKE_ROTOR_DRILLED_CARBON"]=rotor

    # Moving the castings radially inboard clears the forged wheel barrel.
    for name in list(parts):
        if name.startswith("P2_CALIPER_"):
            parts[name]=parts[name].translate((0,-18,0))
        elif name.startswith("P2_BRAKE_PAD_"):
            parts[name]=parts[name].translate((0,-12,0))
    # Former through-pins pierced the rotating rotor. Replace with bridge
    # tie studs outside the rotor radius and inside the wheel barrel.
    for i in (1,2):
        del parts[f"P2_CALIPER_PAD_RETAINING_PIN_{i:02d}"]
    for i,side in enumerate((-1,1),1):
        x=side*20.0
        spine=cq.Workplane("XY").box(14,10,78).val().translate(cq.Vector(x,190,-66))
        for z in (-98,-34):
            tab=cq.Workplane("XY").box(14,30,10).val().translate(cq.Vector(x,175,z))
            spine=spine.fuse(tab)
        spine=spine.cut(cylinder(4.05,-111,90,x,190))
        label="L" if side<0 else "R"
        parts[f"P2_CALIPER_BRIDGE_{label}"]=spine
        parts[f"P2_CALIPER_BRIDGE_STUD_{i:02d}"]=(
            cylinder(3.65,-109,85,x,190).fuse(cylinder(6.05,-113,4,x,190)))
        for name in ("P2_CALIPER_INBOARD_CASTING","P2_CALIPER_OUTBOARD_CASTING"):
            parts[name]=parts[name].cut(spine)

    if len(parts)!=53: raise ValueError("P2.4 must produce 53 physical solids")
    for name,solid in parts.items():
        if (solid.isNull() or not solid.isValid() or solid.Volume()<=0
            or len(solid.Solids())!=1):
            raise ValueError(f"Invalid disconnected CAD solid: {name}")
    return parts,previous_proof,changes

def prepare(output):
    output.mkdir(parents=True,exist_ok=True)
    parts,proof,changes=make_fitted_parts()
    master=output/"P2_4_front_left_fitted_master.step"
    assembly=cq.Assembly(name="P2_4_FRONT_LEFT_FITTED_CAD_SOURCE")
    for name,solid in parts.items():assembly.add(solid,name=name)
    assembly.save(str(master),exportType="STEP")
    core={
        "schema":"podium-eds.p2.cad-first.front-corner.fit.v1",
        "source":"Original project-authored Formula-style CAD, derived from P2.3",
        "unitsCAD":"mm","unitsGLB":"m","axleOutboardCADAxis":"+Z",
        "cadSourceNature":"Static illustrative geometric mating; NOT Formula 1 OEM or manufacture-ready",
        "masterSTEP":master.name,"masterSTEPsha256":sha256(master),
        "partIds":list(parts),"totalCadSolids":len(parts),
        "p23SourcePrecisionEvidence":proof,
        "fitRevisions":changes,"staticCollisionAudit":None,
        "mechanicalTruth":{
            "allPairStaticVolumeIntersectionAudit":True,
            "sourceAssemblyBRepValid":True,
            "mechanicalDynamicClearanceCertified":False,
            "bearingPreloadAndStressCertified":False,
            "retentionAndThreadTorqueCertified":False,
            "hydraulicSealAndBrakeLoadsCertified":False,
            "f1OEMSource":False
        },"profiles":{}
    }
    (output/".P2_4_core.json").write_text(json.dumps(core,indent=2)+"\n")
    print("MASTER",len(parts),"valid CAD solids",master.stat().st_size,"bytes",flush=True)

def generate_profile(output,quality):
    file=output/f"P2_4_front_left_{quality.lower()}.glb"
    if quality=="HIGH":
        parts,_,_=make_fitted_parts()
        linear,angular=QUALITY[quality]
        counts=export_glb(parts,file,linear,angular)
        method="CAD_NATIVE_BREP_TESSELLATION"
    else:
        from p2_4_lod import create_lod
        high=output/"P2_4_front_left_high.glb"
        if not high.exists():raise ValueError("Generate CAD HIGH first")
        counts=create_lod(high,file,quality)
        linear,angular=None,None
        method="CAD_DERIVED_VTK_QUADRIC_DECIMATION"
    data={
        "file":file.name,"bytes":file.stat().st_size,"sha256":sha256(file),
        "totalTriangles":sum(counts.values()),"perPartTriangles":counts,
        "strategy":method,"linearToleranceMm":linear,"angularToleranceRad":angular,
    }
    (output/f".P2_4_{quality}.json").write_text(json.dumps(data,indent=2)+"\n")
    print(quality,data["totalTriangles"],"triangles",flush=True)

def finalize(output):
    result=json.loads((output/".P2_4_core.json").read_text())
    for quality in ("HIGH","BALANCED","PERFORMANCE"):
        record=json.loads((output/f".P2_4_{quality}.json").read_text())
        file=output/record["file"]
        if (not file.exists() or file.stat().st_size!=record["bytes"]
                or sha256(file)!=record["sha256"]):
            raise ValueError("Missing/corrupted GLB: "+quality)
        if set(record["perPartTriangles"])!=set(result["partIds"]):
            raise ValueError("Part identity changed: "+quality)
        result["profiles"][quality]=record
    counts=[result["profiles"][q]["totalTriangles"] for q in ("HIGH","BALANCED","PERFORMANCE")]
    if not counts[0]>counts[1]>counts[2]:
        raise ValueError("LOD face counts must be strictly descending")
    proofFile=output/"P2_4_static_fit_audit.json"
    if not proofFile.exists():raise ValueError("Run full static collision audit before finalizing")
    audit=json.loads(proofFile.read_text())
    if audit["sourcePartCount"]!=53 or audit["unresolvedPairs"]:
        raise ValueError("Static source collision audit unresolved")
    result["staticCollisionAudit"]={
        "file":proofFile.name,"sha256":sha256(proofFile),
        "totalPairs":audit["totalPairs"],"candidatePairs":audit["candidatePairs"],
        "unresolvedPairs":len(audit["unresolvedPairs"]),
        "volumeThresholdMm3":audit["volumeThresholdMm3"],
    }
    (output/"P2_4_fit_manifest.json").write_text(json.dumps(result,indent=2)+"\n")
    print("FINALIZED",len(result["partIds"]),"source CAD parts",counts)

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--out",type=Path,required=True)
    action=parser.add_mutually_exclusive_group(required=True)
    action.add_argument("--init",action="store_true")
    action.add_argument("--profile",choices=("HIGH","BALANCED","PERFORMANCE"))
    action.add_argument("--finalize",action="store_true")
    args=parser.parse_args()
    if args.init:prepare(args.out)
    elif args.profile:generate_profile(args.out,args.profile)
    else:finalize(args.out)
