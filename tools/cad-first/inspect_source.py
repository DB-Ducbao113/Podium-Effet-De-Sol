#!/usr/bin/env python3
"""P2 CAD-first *local* source audit, not a CI or a physical-fit test.

Usage:
  python tools/cad-first/inspect_source.py --folder .local-assets/cad-first/reference

Fails on missing master, bad SHA, non-B-Rep geometry, empty CAD, false LOD
or names/units mismatch. It deliberately does not approve source copyright.
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


def validate(folder: Path):
    manifest_path = folder / "P2_fastener_reference_manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if manifest.get("schema") != "podium-eds.p2.cad-first.reference.v1":
        raise ValueError("Unrecognized CAD-first manifest")
    step = folder / manifest["masterSTEP"]
    if not step.is_file() or sha256(step) != manifest["masterSTEPsha256"]:
        raise ValueError("CAD master STEP missing or hash incorrect")
    solids = cq.importers.importStep(str(step)).solids().vals()
    if len(solids) < 2:
        raise ValueError("Not an independently modeled multi-part CAD assembly")
    for solid in solids:
        if solid.isNull() or not solid.isValid() or solid.Volume() <= 0:
            raise ValueError("A STEP B-Rep solid is invalid")

    result = {"master": step.name, "cadSolids": len(solids), "LOD": {}}
    reference_names = None
    previous_triangles = None
    for profile in ("HIGH", "BALANCED", "PERFORMANCE"):
        record = manifest["profiles"][profile]
        file = folder / record["file"]
        if not file.is_file() or file.stat().st_size != record["bytes"] or sha256(file) != record["sha256"]:
            raise ValueError(f"Wrong GLB or SHA-256 for {profile}")
        scene = trimesh.load(file, force="scene")
        parts = sorted(scene.graph.nodes_geometry)
        if len(parts) < 2 or len(parts) != len(solids):
            raise ValueError(f"{profile}: GLB part count doesn't match STEP CAD solids")
        if reference_names is not None and reference_names != parts:
            raise ValueError(f"{profile}: semantic part names differ between detail tiers")
        reference_names = parts
        triangle_count = sum(len(mesh.faces) for mesh in scene.geometry.values())
        if triangle_count != record["totalTriangles"] or triangle_count <= 0:
            raise ValueError(f"{profile}: triangles differ from authoring manifest")
        if previous_triangles is not None and triangle_count >= previous_triangles:
            raise ValueError(f"{profile}: not lower-detail than preceding tier")
        previous_triangles = triangle_count
        if not np.isfinite(scene.bounds).all():
            raise ValueError(f"{profile}: non-finite physical bounds")
        result["LOD"][profile] = {
            "triangles": triangle_count,
            "bytes": file.stat().st_size,
            "partNames": parts,
        }
    result["mechanicalTruth"] = manifest["mechanicalTruth"]
    result["rightsApprovedForPublicWebsite"] = False
    result["checks"] = "STEP B-Rep, GLB hashes, semantic nodes, 3 genuine LODs"
    return result


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--folder", type=Path, required=True)
    p.add_argument("--report", type=Path)
    args = p.parse_args()
    report = validate(args.folder)
    print(json.dumps(report, indent=2))
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
