"""Export the authored R4.3 blend into three review GLB profiles."""
import hashlib
import json
from pathlib import Path

import bpy

REPO = Path(__file__).resolve().parents[3]
ROOT = REPO / "source-assets/models/inside-the-machine/exports"
BLEND = REPO / "source-assets/models/inside-the-machine/authoring/r4-5/model-b-cinematic-r4-5.blend"
RATIOS = {"HIGH": 1.0, "BALANCED": .78, "PERFORMANCE": .56}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest().upper()


def stats():
    meshes = [obj for obj in bpy.data.objects if obj.type == "MESH" and not obj.hide_render]
    for obj in meshes: obj.data.calc_loop_triangles()
    return {
        "meshObjects": len(meshes),
        "triangles": sum(len(obj.data.loop_triangles) for obj in meshes),
        "estimatedDrawCalls": sum(max(1, len({p.material_index for p in obj.data.polygons})) for obj in meshes),
    }


def main():
    records = []
    for profile, ratio in RATIOS.items():
        bpy.ops.wm.open_mainfile(filepath=str(BLEND))
        reduced = []
        if ratio < 1:
            for obj in bpy.data.objects:
                if obj.type != "MESH" or obj.hide_render or len(obj.data.polygons) < 180:
                    continue
                existing = "_ORIGINAL" in obj.name or "SOURCE_SURFACE" in obj.name
                r42_interior = obj.get("peds_provenance") == "newly_authored_rev1_inner_structure"
                r43_mechanical = obj.get("peds_provenance") == "r4_3_authored_illustrative_mechanical_system"
                if not (existing or r42_interior or r43_mechanical):
                    continue
                modifier = obj.modifiers.new(f"R4.5 {profile} reduction", "DECIMATE")
                modifier.ratio = ratio
                bpy.context.view_layer.objects.active = obj
                obj.select_set(True)
                bpy.ops.object.modifier_apply(modifier=modifier.name)
                obj.select_set(False)
                reduced.append(obj.name)
        path = ROOT / f"model-b-cinematic-r4-5-{profile.lower()}.glb"
        bpy.ops.export_scene.gltf(
            filepath=str(path), export_format="GLB", use_visible=True,
            export_cameras=False, export_lights=False, export_extras=True,
            export_yup=True, export_apply=False,
        )
        records.append({"profile": profile, "path": path.name, "bytes": path.stat().st_size,
                        "sha256": sha(path), **stats(), "reducedObjects": sorted(reduced)})
    report = {"sourceBlendSha256": sha(BLEND), "profiles": records}
    (ROOT / "profile-export-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()

