#!/usr/bin/env python3
"""Compose real P2.12 + P2.14 rear GLBs as exactly 31 original CAD meshes.

19 original P2.12 - 4 obsolete bearing proxies + 16 native P2.14 = 31.
This is a source-identity-preserving STATIC visual asset, never a vehicle
mechanical mate, certified joint motion, new car design or rear CAD STEP.
"""
from __future__ import annotations
import argparse,hashlib,json
from pathlib import Path
import trimesh

SCHEMA="podium-eds.original-model-b.rear31-source-visual.v1"

def sha(path:Path)->str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

def load(directory:Path,manifest_name:str,quality:str,ids_key:str,count:int):
    manifest=directory/manifest_name
    data=json.loads(manifest.read_text(encoding="utf8"))
    row=data["profiles"][quality]
    asset=directory/row["file"]
    if (not asset.is_file() or asset.stat().st_size!=row["bytes"]
        or sha(asset)!=row["sha256"]):
        raise RuntimeError("Original CAD GLB missing or SHA mismatch: "+str(asset))
    ids=data[ids_key]
    if len(ids)!=count or len(set(ids))!=count:
        raise RuntimeError("Original CAD source part IDs invalid")
    scene=trimesh.load(asset,force="scene")
    nodes=list(scene.graph.nodes_geometry)
    if len(nodes)!=count or len(set(nodes))!=count or set(nodes)!=set(ids):
        raise RuntimeError("Original CAD native GLB node identities mismatch")
    pieces={}
    for node in nodes:
        transform,geometry=scene.graph.get(node)
        mesh=scene.geometry[geometry].copy()
        mesh.apply_transform(transform)
        if not mesh.is_watertight or not mesh.is_winding_consistent:
            raise RuntimeError("Original CAD mesh not watertight: "+node)
        pieces[node]=mesh
    return data,asset,pieces

def compose(p212:Path,p214:Path,out:Path,quality:str="BALANCED")->dict:
    if out.exists() and any(out.iterdir()):
        raise FileExistsError("Refuse to overwrite previous source CAD review")
    a,asset_a,parts_a=load(p212,"P212_rear_toe_adjuster_manifest.json",
                           quality,"partIds",19)
    b,asset_b,parts_b=load(p214,"P214_split_race_manifest.json",
                           quality,"newPartNames",16)
    static=b.get("nominalStaticAudit",{})
    if (a.get("schema")!="podium-eds.p2.cad-first.rear-toe-adjuster-threaded.v3"
        or a.get("threadGeometryRevision")!="P2.12-R3-BREP-LOCKNUT-ENGAGEMENT"
        or a.get("nativeStaticAudit",{}).get("pairCount")!=171
        or a.get("nativeStaticAudit",{}).get("passStatic") is not True
        or a.get("mechanicalMateCertified") is not False
        or b.get("schema")!="podium-eds.p214.split-race-radial-assembly.v1"
        or b.get("candidateCombinedSourceSolids")!=31
        or b.get("newNativeSolidCount")!=16
        or b.get("axialRetentionCertified") is not False
        or b.get("mechanicalG2")!="HOLD"
        or static.get("pairCount")!=465 or static.get("passStatic") is not True
        or b.get("discreteAssemblyPathAudit",{}).get("finiteInsertionPairChecks")!=144):
        raise RuntimeError("P2.12 / P2.14 source CAD or G2 mechanical evidence invalid")
    removed=list(b["replacesSourceBearingProxies"].values())
    if len(removed)!=4 or len(set(removed))!=4 or any(x not in parts_a for x in removed):
        raise RuntimeError("Exactly four original P2.12 annular bearing IDs required")
    parts={**{k:v for k,v in parts_a.items() if k not in removed},**parts_b}
    if len(parts)!=31 or len(set(parts))!=31 or set(parts)&set(removed):
        raise RuntimeError("Source native rear 31 part composition invalid")
    result=trimesh.Scene()
    for name,mesh in parts.items():
        result.add_geometry(mesh,geom_name=name,node_name=name)
    out.mkdir(parents=True,exist_ok=True)
    glb=out/f"PEDS_rear_31_source_{quality.lower()}.glb"
    glb.write_bytes(result.export(file_type="glb"))
    reread=trimesh.load(glb,force="scene")
    if (len(reread.graph.nodes_geometry)!=31
        or set(reread.graph.nodes_geometry)!=set(parts)
        or not all(g.is_watertight and g.is_winding_consistent
                   for g in reread.geometry.values())):
        raise RuntimeError("Source combined GLB 31-node roundtrip failed")
    manifest={
      "schema":SCHEMA,"scope":"STATIC REAR CAD VISUAL ONLY - NOT FULL MODEL B",
      "quality":quality,"p212SourceGlbSha256":sha(asset_a),
      "p214SourceGlbSha256":sha(asset_b),"sourceP212PartCount":19,
      "sourceP214PartCount":16,"sourceRemovedAnnularBearingNames":sorted(removed),
      "sourcePartIds":list(parts),"nativeVisualSourceCount":31,
      "glbFile":glb.name,"glbSHA256":sha(glb),"glbBytes":glb.stat().st_size,
      "glbTriangleCount":sum(len(g.faces) for g in reread.geometry.values()),
      "allSourceMeshesWatertight":True,
      "ownerModelBOriginalShellIncluded":False,
      "ownerChassisRearHardpointsMeasured":False,
      "dynamic31BodyNativeBrepCollisionCertified":False,
      "sphericalBearingAxialRetentionCertified":False,
      "mechanicalG2":"HOLD",
    }
    (out/"PEDS_rear_31_source_manifest.json").write_text(
        json.dumps(manifest,indent=2)+"\n",encoding="utf8")
    return manifest

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--p212-dir",type=Path,required=True)
    p.add_argument("--p214-dir",type=Path,required=True)
    p.add_argument("--out",type=Path,required=True)
    p.add_argument("--quality",choices=("HIGH","BALANCED","PERFORMANCE"),default="BALANCED")
    args=p.parse_args()
    r=compose(args.p212_dir,args.p214_dir,args.out,args.quality)
    print("P2.12/P2.14 original source GLB composite:",r["nativeVisualSourceCount"],
          "mesh nodes; G2 HOLD")
