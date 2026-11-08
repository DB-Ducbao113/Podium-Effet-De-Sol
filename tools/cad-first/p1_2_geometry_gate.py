#!/usr/bin/env python3
"""Read-only P1.1 geometry preflight; never certifies a Formula 1 silhouette."""
import argparse
import hashlib
import json
from pathlib import Path
import trimesh

TIERS=("high","balanced","performance")
REQUIRED=("front","rear","left","right","top","underside","front_three_quarter","rear_three_quarter")

def checksum(path):
    sha=hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda:stream.read(1048576),b""):sha.update(chunk)
    return sha.hexdigest()

def inspect(root,reference):
    refs=json.loads(reference.read_text(encoding="utf-8"))
    results={"schema":"peds.full-car-v2.p1-2-geometry-gate.v1",
             "source":"P1.1 REJECTED silhouette study","profiles":{},"errors":[],"gates":{}}
    names={}
    dimensions={}
    for tier in TIERS:
        path=root/"output"/("PEDS_2026_P1_"+tier+".glb")
        scene=trimesh.load(path,force="scene")
        nodes=set(scene.graph.nodes_geometry)
        opened=[]
        winding=[]
        triangles=0
        for name in nodes:
            mesh=scene.geometry[scene.graph[name][1]]
            triangles+=len(mesh.faces)
            if not mesh.is_watertight:opened.append(name)
            if not mesh.is_winding_consistent:winding.append(name)
        names[tier]=nodes
        dimensions[tier]=scene.bounds[1]-scene.bounds[0]
        results["profiles"][tier]={"sha256":checksum(path),"named_mesh_count":len(nodes),
          "triangles":triangles,"open_meshes":sorted(opened),
          "inconsistent_winding":sorted(winding),
          "bounds_m":[round(float(v),6) for v in dimensions[tier]]}
    if len({frozenset(v) for v in names.values()})!=1:
        results["errors"].append("LOD_NODE_ID_MISMATCH")
    drift_mm=max(max(abs(dimensions[tier]-dimensions["high"]))*1000 for tier in TIERS)
    results["max_lod_bounds_drift_mm"]=round(float(drift_mm),3)
    if drift_mm>0.5:
        results["errors"].append("LOD_BOUND_DRIFT_GT_0_5_MM_REVIEW")
    views=refs["views"]
    if isinstance(views,list):
        uncalibrated=[x["id"] for x in views if x["id"] in REQUIRED and (x.get("status")!="calibrated" or not x.get("camera_matrix"))]
    else:
        uncalibrated=[name for name in REQUIRED if not views.get(name,{}).get("calibrated_reference")]
    missing=set(REQUIRED)-({v["id"] for v in views} if isinstance(views,list) else set(views))
    if missing:results["errors"].append("MISSING_REQUIRED_REFERENCE_VIEW:"+",".join(sorted(missing)))
    results["uncalibrated_views"]=uncalibrated
    mesh_fails=any(item["open_meshes"] for item in results["profiles"].values())
    results["gates"]={
        "G0_REFERENCE":"HOLD" if uncalibrated or missing else "NEEDS_INDEPENDENT_REVIEW",
        "G1_SILHOUETTE":"HOLD_OWNER_REJECTED",
        "G1_MESH":"FAIL" if mesh_fails else "PASS_OFFLINE_ONLY",
        "G2_MECHANICAL":"NOT_TESTED",
        "G3_WEBGL":"NOT_TESTED"
    }
    results["release_approved"]=False
    return results

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--model-dir",type=Path,required=True)
    parser.add_argument("--reference-index",type=Path,required=True)
    parser.add_argument("--output",type=Path,required=True)
    args=parser.parse_args()
    report=inspect(args.model_dir,args.reference_index)
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"gates":report["gates"],"errors":report["errors"],
      "triangles":{k:v["triangles"] for k,v in report["profiles"].items()}},indent=2))

if __name__=="__main__":
    main()
