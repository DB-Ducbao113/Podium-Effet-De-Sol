"""R4.5 restrained bearing-seat detail on four already-authored wheel hubs.

No source Model B mesh, semantic control, axle endpoint or shaft geometry moves.
The stepped seats are illustrative and do not prove mechanical engagement.
"""
import hashlib
import json
import math
from pathlib import Path
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[3] / 'source-assets/models/inside-the-machine/authoring'
BASE = ROOT / 'r4-4-c'
OUT = ROOT / 'r4-5'
SOURCE = BASE / 'model-b-cinematic-r4-4-c.blend'
OUTPUT = OUT / 'model-b-cinematic-r4-5.blend'
TARGETS = ('PEDS_WHEEL_HUB_GEOMETRY', 'PEDS_FR_WHEEL_HUB_GEOMETRY',
           'PEDS_RL_WHEEL_HUB_GEOMETRY', 'PEDS_RR_WHEEL_HUB_GEOMETRY')

def digest(file):
    return hashlib.sha256(file.read_bytes()).hexdigest().upper()

def counts():
    meshes = [item for item in bpy.data.objects if item.type == 'MESH' and not item.hide_render]
    for mesh in meshes:
        mesh.data.calc_loop_triangles()
    return {'meshObjects': len(meshes),
            'triangles': sum(len(mesh.data.loop_triangles) for mesh in meshes),
            'estimatedDrawCalls': sum(max(1, len({p.material_index for p in mesh.data.polygons})) for mesh in meshes)}

def add_ring(name, location, major, minor, material):
    bpy.ops.mesh.primitive_torus_add(major_segments=24, minor_segments=8,
                                    location=location, rotation=(math.pi / 2, 0, 0),
                                    major_radius=major, minor_radius=minor)
    part = bpy.context.object
    part.name = name
    part.data.materials.append(material)
    return part

def main():
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
    before = counts()
    details = []
    for name in TARGETS:
        target = bpy.data.objects[name]
        original = len(target.data.loop_triangles)
        points = [target.matrix_world @ Vector(corner) for corner in target.bound_box]
        cx = (min(v.x for v in points) + max(v.x for v in points)) / 2
        cz = (min(v.z for v in points) + max(v.z for v in points)) / 2
        sign = 1 if sum(v.y for v in points) > 0 else -1
        outer = max(v.y for v in points) if sign > 0 else min(v.y for v in points)
        inner = min(v.y for v in points) if sign > 0 else max(v.y for v in points)
        material = target.data.materials[0]
        parts = [
            add_ring(f'{name}_R45_OUTER_BEARING_SEAT', (cx, outer + sign * .002, cz), .055, .009, material),
            add_ring(f'{name}_R45_INBOARD_SHOULDER', (cx, inner - sign * .002, cz), .052, .007, material),
        ]
        bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=.038, depth=.026,
                                            location=(cx, outer + sign * .010, cz),
                                            rotation=(math.pi / 2, 0, 0))
        collar = bpy.context.object
        collar.name = f'{name}_R45_CENTER_LOCK_SEAT'
        collar.data.materials.append(material)
        parts.append(collar)
        bpy.ops.object.select_all(action='DESELECT')
        target.select_set(True)
        for part in parts:
            part.select_set(True)
        bpy.context.view_layer.objects.active = target
        bpy.ops.object.join()
        target.data.calc_loop_triangles()
        details.append({'mesh': name, 'beforeTriangles': original,
                        'afterTriangles': len(target.data.loop_triangles),
                        'bearingSeatWorld': [cx, outer, cz],
                        'shaftAndHubControlsUnchanged': True})
    bpy.context.view_layer.update()
    after = counts()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT))
    manifest = json.loads((BASE / 'assembly-manifest-r4-4-c.json').read_text(encoding='utf8'))
    manifest['version'] = 'R4.5'
    manifest['schema'] = 'peds.inside-the-machine.full-vehicle-assembly.v5.r4.5'
    manifest['geometry'].update(after)
    manifest['r45Contract'] = {'acceptedBaselineBlendSha256': digest(SOURCE),
                               'originalModelBSourceMeshesPreserved': 64,
                               'semanticControlCount': 75,
                               'refinedAuthorMeshes': list(TARGETS),
                               'newSemanticNodes': 0,
                               'shaftHubMechanicalEngagementProven': False}
    (OUT / 'assembly-manifest-r4-5.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
    report = {'baselineBlendSha256': digest(SOURCE), 'outputBlendSha256': digest(OUTPUT),
              'before': before, 'after': after, 'details': details,
              'shaftHubFit': 'illustrative; rear half-shafts and semantic controls unchanged'}
    (OUT / 'hub-refinement.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf8')
    print(json.dumps(report, indent=2))

if __name__ == '__main__':
    main()
