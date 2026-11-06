#!/usr/bin/env python3
"""P2.2 local B-Rep/GLB audit. Never counts as a CI or physical fit certificate.

python tools/cad-first/p2_2_audit_front_left.py \
  --folder .local-assets/cad-first/front-left --report /tmp/p2-2-review.json
"""
import argparse
import hashlib
import json
from pathlib import Path

import cadquery as cq
import numpy as np
import trimesh


def sha256(file):
    return hashlib.sha256(file.read_bytes()).hexdigest()


def inspect(folder):
    manifest = json.loads((folder / "P2_front_left_manifest.json").read_text())
    if manifest.get("schema") != "podium-eds.p2.cad-first.front-corner.v1":
        raise ValueError("Wrong P2.2 manifest schema")
    if manifest.get("unitsCAD") != "mm" or manifest.get("unitsGLB") != "m":
        raise ValueError("Unknown CAD/GLB scale")
    master = folder / manifest["masterSTEP"]
    if not master.is_file() or sha256(master) != manifest["masterSTEPsha256"]:
        raise ValueError("Original STEP master absent or corrupted")
    solids = cq.importers.importStep(str(master)).solids().vals()
    if len(solids) != manifest["totalCadSolids"] or len(solids) != len(manifest["parts"]):
        raise ValueError("STEP CAD solid count does not match the source manifest")
    if not all(not s.isNull() and s.isValid() and s.Volume() > 0 for s in solids):
        raise ValueError("Invalid B-Rep CAD solid")
    if not all("F1" not in str(x) for x in manifest["mechanicalTruth"].keys()):
        raise ValueError("Mechanical claims need independent validation")
    last_triangles = None
    source_ids = {row["id"] for row in manifest["parts"]}
    report = {
        "schema": "podium-eds.p2.cad-first.front-corner.audit.v1",
        "source": "original project-authored educational B-Rep",
        "step": master.name,
        "solidCount": len(solids),
        "cadFaces": sum(len(s.Faces()) for s in solids),
        "profiles": {},
        "certifiedF1": False,
        "mechanicalFitCertified": False,
        "browserVisualApproved": False,
    }
    for quality in ["HIGH", "BALANCED", "PERFORMANCE"]:
        row = manifest["profiles"][quality]
        path = folder / row["file"]
        if not path.is_file() or path.stat().st_size != row["bytes"] or sha256(path) != row["sha256"]:
            raise ValueError(f"Wrong or missing {quality} GLB")
        scene = trimesh.load(path, force="scene")
        nodes = set(scene.graph.nodes_geometry)
        if nodes != source_ids or nodes != set(row["perPartTriangles"]):
            raise ValueError(f"{quality} changed semantic source-part names")
        triangles = sum(len(geometry.faces) for geometry in scene.geometry.values())
        if triangles != row["totalTriangles"]:
            raise ValueError(f"{quality} triangle count incorrect")
        if last_triangles is not None and triangles >= last_triangles:
            raise ValueError("LOD geometry is not strictly decreasing")
        last_triangles = triangles
        if not np.isfinite(scene.bounds).all():
            raise ValueError(f"{quality} geometry has non-finite bounds")
        report["profiles"][quality] = {
            "triangles": triangles,
            "meshes": len(nodes),
            "sha256": row["sha256"],
            "boundsMeters": scene.bounds.round(5).tolist(),
        }
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--folder", type=Path, required=True)
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()
    evidence = inspect(args.folder)
    text = json.dumps(evidence, indent=2) + "\n"
    print(text)
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(text)
