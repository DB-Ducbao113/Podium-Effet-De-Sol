"""Blender -b audit (read-only source GLB, writes reports only).

Usage:
blender --background --factory-startup --python blender_topology_audit.py -- \
    --model path/to/DECODED-WORKING-COPY.glb --out .local-assets/inside-the-machine/audits/p0

Blender's stock importer might reject EXT_meshopt_compression. In that case use
an approved decoded *working copy* or original authoring .blend. NEVER mutate
or overwrite the frozen candidate.
"""
import argparse
import json
import sys
import traceback
from pathlib import Path
from datetime import datetime, timezone

import bpy
from mathutils import Vector


def connected_components(mesh):
    n = len(mesh.vertices)
    if n == 0:
        return 0
    parent = list(range(n))
    rank = [0] * n

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    for edge in mesh.edges:
        x, y = (find(x) for x in edge.vertices)
        if x != y:
            if rank[x] < rank[y]:
                x, y = y, x
            parent[y] = x
            if rank[x] == rank[y]:
                rank[x] += 1
    return len(set(find(i) for i in range(n)))


def inspect_mesh(obj):
    mesh = obj.data
    mesh.calc_loop_triangles()
    bounds = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    bbox_min = [min(v[i] for v in bounds) for i in range(3)]
    bbox_max = [max(v[i] for v in bounds) for i in range(3)]
    return {
        "name": obj.name,
        "parent": obj.parent.name if obj.parent else None,
        "vertices": len(mesh.vertices),
        "edges": len(mesh.edges),
        "polygons": len(mesh.polygons),
        "triangles": len(mesh.loop_triangles),
        "connected_components_by_vertex_edges": connected_components(mesh),
        "material_names": [slot.material.name if slot.material else "[none]" for slot in obj.material_slots],
        "location": list(obj.location),
        "rotation_euler": list(obj.rotation_euler),
        "scale": list(obj.scale),
        "world_matrix_rows": [[float(obj.matrix_world[i][j]) for j in range(4)] for i in range(4)],
        "bbox_world_min": list(bbox_min),
        "bbox_world_max": list(bbox_max),
    }


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", type=Path, required=True)
    ap.add_argument("--out", type=Path, required=True)
    args = ap.parse_args(argv)
    args.out.mkdir(parents=True, exist_ok=True)
    info = {
        "audit_kind": "BLENDER_TOPOLOGY_INSPECTION_NOT_VISUAL_APPROVAL",
        "created_utc": datetime.now(timezone.utc).isoformat(),
        "input": str(args.model.resolve()),
        "blender_version": bpy.app.version_string,
        "status": "PENDING",
        "mesh_objects": [],
        "warnings": [],
    }
    try:
        bpy.ops.wm.read_factory_settings(use_empty=True)
        if args.model.suffix.lower() == ".blend":
            bpy.ops.wm.open_mainfile(filepath=str(args.model.resolve()))
        elif args.model.suffix.lower() == ".glb":
            bpy.ops.import_scene.gltf(filepath=str(args.model.resolve()))
        else:
            raise ValueError("Only .glb or .blend is supported")
        bpy.context.view_layer.update()
        objects = [o for o in bpy.data.objects if o.type == "MESH"]
        info["mesh_objects"] = [inspect_mesh(obj) for obj in objects]
        info["mesh_count"] = len(objects)
        info["triangles_total"] = sum(x["triangles"] for x in info["mesh_objects"])
        info["vertices_total"] = sum(x["vertices"] for x in info["mesh_objects"])
        info["loose_component_total"] = sum(x["connected_components_by_vertex_edges"] for x in info["mesh_objects"])
        info["warnings"].extend([
            "Connected components are NOT semantic groups; each component may be meaningless for engineering cutaways.",
            "Bounding boxes are from imported object space; compare with the original Blender source and runtime rotation/scale.",
            "No splitting, remeshing, auto-explode, exporting, or Blender-file saving was performed.",
        ])
        info["status"] = "INSPECTED_NOT_APPROVED"
    except Exception as exc:
        info["status"] = "BLOCKED_IMPORT_OR_INSPECTION"
        info["error"] = str(exc)
        info["traceback"] = traceback.format_exc()
        info["warnings"].append("If Meshopt import fails, decode a local working copy using verified tools. Preserve the original asset and SHA-256.")
    output = args.out / "p0-blender-topology.json"
    output.write_text(json.dumps(info, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"P0 topology result: {info['status']} | {output}")
    if info["status"] != "INSPECTED_NOT_APPROVED":
        raise SystemExit(2)


if __name__ == "__main__":
    main()
