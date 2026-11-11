"""Read-only inspection of the frozen R4.4-C Blender assembly and manifest."""
import json
from pathlib import Path
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[3] / 'source-assets/models/inside-the-machine/authoring'
BASE = ROOT / 'r4-4-c'
OUT = ROOT / 'r4-5'

def descendants(node):
    result = []
    for child in node.children:
        result.append(child)
        result.extend(descendants(child))
    return result

def summary(record):
    node = bpy.data.objects.get(record['node'])
    if node is None:
        return {'id': record['id'], 'node': record['node'], 'error': 'node missing'}
    meshes = [item for item in descendants(node) if item.type == 'MESH']
    def bounds(mesh):
        points = [mesh.matrix_world @ Vector(corner) for corner in mesh.bound_box]
        return [[min(point[axis] for point in points), max(point[axis] for point in points)] for axis in range(3)]
    return {
        'id': record['id'], 'controlNode': node.name, 'controlType': node.type,
        'manifestProvenance': record['provenance'], 'meshCount': len(meshes),
        'triangles': sum(len(mesh.data.loop_triangles) for mesh in meshes),
        'meshes': [{
            'name': mesh.name, 'triangles': len(mesh.data.loop_triangles),
            'objectProvenance': mesh.get('provenance'),
            'materials': [slot.material.name if slot.material else None for slot in mesh.material_slots],
            'parent': mesh.parent.name if mesh.parent else None,
            'worldBounds': bounds(mesh),
        } for mesh in meshes],
    }

def main():
    bpy.ops.wm.open_mainfile(filepath=str(BASE / 'model-b-cinematic-r4-4-c.blend'))
    manifest = json.loads((BASE / 'assembly-manifest-r4-4-c.json').read_text(encoding='utf8'))
    selected = [record for record in manifest['components'] if (
        record['id'].startswith(('POWERTRAIN.', 'COOLING_LEFT.', 'COOLING_RIGHT.'))
        or record['id'].endswith(('WHEEL_HUB', 'CENTER_LOCK_NUT', 'HUB_MOUNT_INTERFACE'))
    )]
    records = [summary(record) for record in selected]
    report = {'source': str(BASE / 'model-b-cinematic-r4-4-c.blend'),
              'componentCount': len(records), 'records': records,
              'missingNodes': [item['id'] for item in records if 'error' in item],
              'authoredRearLeftHub': next(item for item in records if item['id'] == 'REAR_LEFT_WHEEL.WHEEL_HUB')}
    (OUT / 'mechanical-source-audit.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
    print(json.dumps({'componentCount': report['componentCount'], 'missingNodes': report['missingNodes'],
                      'rearLeftHub': report['authoredRearLeftHub']}, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
