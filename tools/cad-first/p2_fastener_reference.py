#!/usr/bin/env python3
"""P2 original CAD/B-Rep reference: generic, NOT authentic F1 center-lock.

Requirements: cadquery, numpy, trimesh (see requirements.txt).
Usage:
  python tools/cad-first/p2_fastener_reference.py --out .local-assets/cad-first/reference

Exports an analytic STEP master and three separately tessellated named-part GLBs.
Dimensions are millimeters inside CAD; GLB coordinates are meters.
"""
import argparse
import hashlib
import json
from pathlib import Path

import cadquery as cq
import numpy as np
import trimesh

PARTS = (
    "P2_STUD_HELICAL_THREAD",
    "P2_HEX_NUT",
    "P2_HARDENED_WASHER",
    "P2_HUB_SPACER",
)
COLORS = {
    PARTS[0]: ([167, 177, 186, 255], 0.82, 0.28),
    PARTS[1]: ([115, 126, 140, 255], 0.78, 0.32),
    PARTS[2]: ([197, 201, 203, 255], 0.72, 0.37),
    PARTS[3]: ([68, 76, 85, 255], 0.54, 0.42),
}


def make_parts():
    """Parametric 1.75mm-pitch external HELIX, separate nut/washer/spacer.

    This is a visual engineering reference. The female thread, mechanical
    clearances, materials and mounting interface are NOT certified.
    """
    pitch = 1.75
    root = cq.Workplane("XY").circle(5.12).extrude(28).val()
    helix = cq.Wire.makeHelix(pitch, 20.5, 5.12)
    profile = cq.Workplane("XZ").polyline(
        [(5.10, -0.54), (6.00, 0), (5.10, 0.54)]
    ).close()
    stud = root.fuse(profile.sweep(helix, isFrenet=True).val())
    head = (cq.Workplane("XY").workplane(offset=28)
            .circle(9.6).extrude(7).edges("%Circle").chamfer(0.55).val())
    socket = (cq.Workplane("XY").workplane(offset=31.4)
              .polygon(6, 9.2).extrude(4.3).val())
    stud = stud.fuse(head).cut(socket)

    nut = (cq.Workplane("XY").workplane(offset=4.1)
           .polygon(6, 21.0).extrude(9.1)
           .faces(">Z").edges().chamfer(0.45)
           .faces("<Z").edges().chamfer(0.45))
    nut = nut.cut(
        cq.Workplane("XY").workplane(offset=3.6).circle(6.25).extrude(10.0)
    ).val()
    washer = (cq.Workplane("XY").workplane(offset=13.9)
              .circle(12.0).circle(6.4).extrude(2.4)
              .edges("%Circle").chamfer(0.17).val())
    spacer = (cq.Workplane("XY").workplane(offset=16.3)
              .circle(17.5).circle(6.45).extrude(11.4)
              .faces(">Z").edges().chamfer(0.5)
              .faces("<Z").edges().chamfer(0.5).val())

    output = dict(zip(PARTS, (stud, nut, washer, spacer)))
    for name, shape in output.items():
        if shape.isNull() or not shape.isValid() or shape.Volume() <= 0:
            raise ValueError(f"Invalid B-Rep geometry: {name}")
    return output


def write_glb(parts, target, linear_mm, angular_rad):
    scene = trimesh.Scene()
    counts = {}
    for name, shape in parts.items():
        vertices, faces = shape.tessellate(linear_mm, angular_rad)
        positions = np.array([[v.x, v.y, v.z] for v in vertices]) / 1000.0
        indices = np.asarray(faces, dtype=np.int32)
        mesh = trimesh.Trimesh(vertices=positions, faces=indices, process=False)
        if not len(mesh.faces) or not np.isfinite(mesh.vertices).all():
            raise ValueError(f"Invalid tessellation: {name}")
        rgba, metallic, roughness = COLORS[name]
        mesh.visual = trimesh.visual.TextureVisuals(
            material=trimesh.visual.material.PBRMaterial(
                name=f"{name}_PBR", baseColorFactor=rgba,
                metallicFactor=metallic, roughnessFactor=roughness,
                doubleSided=True,
            ),
        )
        scene.add_geometry(mesh, node_name=name, geom_name=name)
        counts[name] = len(mesh.faces)
    target.write_bytes(scene.export(file_type="glb"))
    return counts


def generate(out):
    out.mkdir(parents=True, exist_ok=True)
    parts = make_parts()
    assembly = cq.Assembly(name="P2_FASTENER_REFERENCE_ASSEMBLY")
    for name, shape in parts.items():
        assembly.add(shape, name=name)
    step_file = out / "P2_fastener_reference_CAD_master.step"
    assembly.save(str(step_file), exportType="STEP")

    profiles = {}
    for quality, (tolerance, angle) in {
        "HIGH": (0.025, 0.09),
        "BALANCED": (0.08, 0.16),
        "PERFORMANCE": (0.25, 0.32),
    }.items():
        path = out / f"P2_fastener_reference_{quality.lower()}.glb"
        # Each CAD body must be freshly constructed: OCC tessellation caches
        # face triangulations on the shape, ignoring subsequent LOD requests.
        counts = write_glb(make_parts(), path, tolerance, angle)
        profiles[quality] = {
            "file": path.name,
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            "bytes": path.stat().st_size,
            "totalTriangles": sum(counts.values()),
            "perPartTriangles": counts,
            "linearToleranceMm": tolerance,
            "angularToleranceRad": angle,
        }

    manifest = {
        "schema": "podium-eds.p2.cad-first.reference.v1",
        "name": "Original fastener study — NOT F1-certified engineering data",
        "unitsCAD": "mm",
        "unitsGLB": "m",
        "sourceType": "CadQuery B-Rep, swept external helix and separate solids",
        "license": "Independent original educational model; third-party rights not implied",
        "mechanicalTruth": {
            "boltExternalHelix": True,
            "nutInternalThreadVerified": False,
            "shaftHubToleranceCertified": False,
            "f1PartProvenance": False,
        },
        "masterSTEP": step_file.name,
        "masterSTEPsha256": hashlib.sha256(step_file.read_bytes()).hexdigest(),
        "parts": [
            {
                "id": name,
                "solidVolumeMm3": round(shape.Volume(), 3),
                "boundsMm": [
                    [round(shape.BoundingBox().xmin, 3), round(shape.BoundingBox().ymin, 3), round(shape.BoundingBox().zmin, 3)],
                    [round(shape.BoundingBox().xmax, 3), round(shape.BoundingBox().ymax, 3), round(shape.BoundingBox().zmax, 3)],
                ],
            }
            for name, shape in parts.items()
        ],
        "profiles": profiles,
    }
    (out / "P2_fastener_reference_manifest.json").write_text(
        json.dumps(manifest, indent=2), encoding="utf-8"
    )
    return manifest


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()
    manifest = generate(args.out)
    print(json.dumps({
        name: {"triangles": details["totalTriangles"], "bytes": details["bytes"]}
        for name, details in manifest["profiles"].items()
    }, indent=2))
