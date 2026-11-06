#!/usr/bin/env python3
"""P2.3 focused local STEP / GLB audit (not CI or fit certification).

python tools/cad-first/p2_3_audit_precision.py \
  --folder .local-assets/cad-first/front-left-p2-3 \
  --report .local-assets/cad-first/front-left-p2-3/audit.json
"""
import argparse
import hashlib
import json
from pathlib import Path

import cadquery as cq
import numpy as np
import trimesh

def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def audit(folder):
    m=json.loads((folder/"P2_3_precision_manifest.json").read_text())
    if m["schema"]!="podium-eds.p2.cad-first.front-corner.precision.v1":
        raise ValueError("Unrecognized P2.3 manifest schema")
    step=folder/m["masterSTEP"]
    if not step.is_file() or sha256(step)!=m["masterSTEPsha256"]:
        raise ValueError("Missing or hash-mismatched B-Rep STEP master")
    solids=cq.importers.importStep(str(step)).solids().vals()
    if len(solids)!=m["totalCadSolids"] or len(solids)!=len(m["partIds"]):
        raise ValueError("B-Rep solid hierarchy count mismatch")
    if not all(not x.isNull() and x.isValid() and x.Volume()>0 for x in solids):
        raise ValueError("Invalid CAD solid in STEP master")
    report={
        "schema":"podium-eds.p2.cad-first.precision-audit.v1",
        "master":step.name,
        "stepSha256":m["masterSTEPsha256"],
        "validCadSolids":len(solids),
        "cadFaces":sum(len(x.Faces()) for x in solids),
        "realGeometryFeatures":m["geometryProof"],
        "rights":"project-authored educational CAD, not OEM Formula 1",
        "tolerancesCertified":False,
        "fullAssemblyCollisionChecked":False,
        "realWebGLVisualApproved":False,
        "profiles":{},
    }
    previous=None
    for profile in ("HIGH","BALANCED","PERFORMANCE"):
        row=m["profiles"][profile]
        path=folder/row["file"]
        if (not path.is_file() or path.stat().st_size!=row["bytes"] or
            sha256(path)!=row["sha256"]):
            raise ValueError("Missing or corrupted "+profile+" GLB")
        scene=trimesh.load(path,force="scene")
        ids=set(scene.graph.nodes_geometry)
        triangles=sum(len(g.faces) for g in scene.geometry.values())
        if ids!=set(m["partIds"]) or ids!=set(row["perPartTriangles"]):
            raise ValueError(profile+" does not preserve CAD source identities")
        if triangles!=row["totalTriangles"] or (previous is not None and triangles>=previous):
            raise ValueError(profile+" has invalid LOD tessellation count")
        if not np.isfinite(scene.bounds).all():
            raise ValueError(profile+" bounds are not finite")
        previous=triangles
        report["profiles"][profile]={
            "valid":True,"parts":len(ids),"triangles":triangles,
            "bytes":path.stat().st_size,"sha256":row["sha256"],
        }
    proof=m["geometryProof"]
    for key in ("studNutIntersectionMm3","maxBallRaceIntersectionMm3",
                "maxBallRetainerIntersectionMm3",
                "largestPistonHousingIntersectionMm3"):
        if proof[key]>0.0001:
            raise ValueError("Selected pair overlap: "+key)
    for key in ("nutHelicalGrooveVolumeMm3","innerRaceGrooveVolumeMm3",
                "outerRaceGrooveVolumeMm3"):
        if proof[key]<=100:
            raise ValueError("Claimed CAD groove not physically cut: "+key)
    return report

if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--folder",required=True,type=Path)
    parser.add_argument("--report",type=Path)
    args=parser.parse_args()
    result=audit(args.folder)
    text=json.dumps(result,indent=2)+"\n"
    if args.report:
        args.report.parent.mkdir(parents=True,exist_ok=True)
        args.report.write_text(text)
    print(text)
