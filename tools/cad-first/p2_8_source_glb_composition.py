#!/usr/bin/env python3
"""P2.8 CAD-derived preview GLBs, preserving exact original 59 source IDs.

Source of truth = P2.8 59-solid STEP. Unchanged bodies use locally stored,
SHA-verified P2.6 / P2.7 CAD-derived GLB meshes in the matching quality tier.
ONLY the revised P2.8 upright is newly tessellated from the source STEP.

These are composed *review* GLBs, NOT 59 independently retessellated CAD
solids in every tier. Check source manifest/step hashes and mesh identity.
"""
import argparse,hashlib,json
from pathlib import Path
import cadquery as cq
import numpy as np
import trimesh

OLD_LINKS={"P2_UPPER_WISHBONE_LINK","P2_LOWER_WISHBONE_LINK"}
UPRIGHT="P2_UPRIGHT_BEARING_CARRIER"
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()

def make(p26:Path,p27:Path,out:Path):
    m=json.loads((out/"P28_remate_manifest.json").read_text())
    a=json.loads((p26/"P2_6_steering_manifest.json").read_text())
    b=json.loads((p27/"P27_wishbone_manifest.json").read_text())
    source=out/m["masterSTEP"]
    if sha(source)!=m["masterSTEPsha256"]:
        raise ValueError("P2.8 STEP master not source-matched")
    originals=cq.importers.importStep(str(source)).solids().vals()
    if len(originals)!=59:raise ValueError("Wrong source solid count")
    new_upright=originals[m["partIds"].index(UPRIGHT)]
    if not new_upright.isValid():raise ValueError("New P2.8 upright invalid")
    expected=set(m["partIds"])
    profiles={}
    for quality,linear,angular in (
        ("HIGH",.035,.095),("BALANCED",.15,.25),
        ("PERFORMANCE",.45,.46)
    ):
        source_files=[]
        for folder,manifest in ((p26,a),(p27,b)):
            rec=manifest["profiles"][quality]
            file=folder/rec["file"]
            if sha(file)!=rec["sha256"]:
                raise ValueError("Unverified parent CAD GLB: "+file.name)
            source_files.append(file)
        stage=trimesh.Scene()
        for file in source_files:
            original=trimesh.load(file,force="scene")
            for name in original.graph.nodes_geometry:
                if name in OLD_LINKS or name==UPRIGHT:continue
                transform,mesh_id=original.graph.get(name)
                stage.add_geometry(original.geometry[mesh_id].copy(),
                                   geom_name=name,node_name=name,
                                   transform=transform)
        vertices,faces=new_upright.tessellate(linear,angular)
        mesh=trimesh.Trimesh(
            vertices=np.asarray([[v.x,v.y,v.z] for v in vertices])/1000,
            faces=np.asarray(faces,dtype=np.int32),process=False)
        mesh.visual=trimesh.visual.TextureVisuals(
            material=trimesh.visual.material.PBRMaterial(
                name="P2_UPRIGHT_BEARING_CARRIER_PBR",
                baseColorFactor=[124,133,143,255],
                metallicFactor=.76,roughnessFactor=.40,
                doubleSided=True))
        stage.add_geometry(mesh,geom_name=UPRIGHT,node_name=UPRIGHT)
        if set(stage.graph.nodes_geometry)!=expected:
            raise ValueError("Missing source semantic identities")
        glb=out/f"P28_integrated_{quality.lower()}.glb"
        glb.write_bytes(stage.export(file_type="glb"))
        loaded=trimesh.load(glb,force="scene")
        if set(loaded.graph.nodes_geometry)!=expected:
            raise ValueError("GLB export damaged source hierarchy")
        triangles=sum(len(g.faces) for g in loaded.geometry.values())
        profiles[quality]={
            "file":glb.name,"sha256":sha(glb),
            "bytes":glb.stat().st_size,
            "totalTriangles":triangles,
            "sourcePartCount":len(expected),
            "method":"SHA-matched original P2.6/P2.7 CAD-derived source GLBs plus newly tessellated P2.8 native STEP upright",
            "newUprightTriangles":len(mesh.faces),
            "newUprightTriMeshWatertight":bool(mesh.is_watertight)
        }
        print(quality,triangles,"triangles",len(expected),"named nodes")
    numbers=[profiles[t]["totalTriangles"] for t in ("HIGH","BALANCED","PERFORMANCE")]
    if numbers != sorted(numbers,reverse=True) or len(set(numbers))!=3:
        raise ValueError("Not distinct descending LODs")
    m["profiles"]=profiles
    m["glbProvenance"]="Composed CAD source preview, NOT independently tessellated 59 B-Rep bodies in every LOD"
    m["macroGeometrySignoff"]=False
    (out/"P28_remate_manifest.json").write_text(json.dumps(m,indent=2)+"\n")

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--p26",type=Path,required=True)
    p.add_argument("--p27",type=Path,required=True)
    p.add_argument("--out",type=Path,required=True)
    args=p.parse_args()
    make(args.p26,args.p27,args.out)
