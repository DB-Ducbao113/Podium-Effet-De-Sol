#!/usr/bin/env python3
"""P1.2: audit real GLB bounding boxes for lock-before-wheel staging.

Pure standard-library tool; no model mutation, no write to public assets.
Run:
  python tools/inside-the-machine/p1/audit_center_lock_clearance.py \\
    --source /path/to/inside-the-machine.zip --out /tmp/p1-2-clearance.json

NOTE: AABB axial clearance is an initial *visual separation* metric only.
It is NOT proof of physical mesh-mesh noninterpenetration or shaft/hub fitment.
"""
import argparse
import hashlib
import itertools
import json
from math import isfinite
from pathlib import Path
import struct
import zipfile

GLB_PROFILES = ('high', 'balanced', 'performance')
FRONT_NUT = 'PEDS_CENTER_LOCK_NUT'
OUTER_WHEEL = 'PEDS_WHEEL_OUTER'
SOURCE_NUT_DISTANCE = 0.34  # +Y source / -Z GLB
SOURCE_WHEEL_DISTANCE = 0.66
PILOT_NUT_DISTANCE = 0.84  # P1.2 staged lookdev, NOT modified source
MIN_VISUAL_CLEARANCE_METERS = 0.08


def mult(a, b):
    return [
        [sum(a[i][k] * b[k][j] for k in range(4)) for j in range(4)]
        for i in range(4)
    ]


def identity():
    return [[float(i == j) for j in range(4)] for i in range(4)]


def local_matrix(node):
    if 'matrix' in node:
        source = node['matrix']  # glTF serializes in column-major order
        return [[source[col * 4 + row] for col in range(4)] for row in range(4)]
    x, y, z, w = node.get('rotation', (0, 0, 0, 1))
    sx, sy, sz = node.get('scale', (1, 1, 1))
    tx, ty, tz = node.get('translation', (0, 0, 0))
    return [
        [(1 - 2 * (y*y + z*z))*sx, (2 * (x*y - z*w))*sy, (2 * (x*z + y*w))*sz, tx],
        [(2 * (x*y + z*w))*sx, (1 - 2 * (x*x + z*z))*sy, (2 * (y*z - x*w))*sz, ty],
        [(2 * (x*z - y*w))*sx, (2 * (y*z + x*w))*sy, (1 - 2 * (x*x + y*y))*sz, tz],
        [0.0, 0.0, 0.0, 1.0],
    ]


def transform_point(mat, point):
    return tuple(sum(mat[i][j] * point[j] for j in range(3)) + mat[i][3] for i in range(3))


def parse_glb(binary):
    if len(binary) < 20 or binary[:4] != b'glTF':
        raise ValueError('Invalid glTF binary magic')
    version, size = struct.unpack_from('<II', binary, 4)
    if version != 2 or size != len(binary):
        raise ValueError('Invalid glTF v2 header')
    json_size, chunk_type = struct.unpack_from('<I4s', binary, 12)
    if chunk_type != b'JSON':
        raise ValueError('Missing JSON chunk')
    return json.loads(binary[20:20 + json_size])


def axial_bounds(gltf, named_control):
    nodes = gltf['nodes']
    roots = [i for i, value in enumerate(nodes) if value.get('name') == named_control]
    if len(roots) != 1:
        raise ValueError(f'Expected one {named_control} node, got {len(roots)}')
    parents = {child: index for index, parent in enumerate(nodes)
               for child in parent.get('children', [])}

    transform_cache = {}
    def world_matrix(index):
        if index not in transform_cache:
            parent = parents.get(index)
            transform_cache[index] = mult(
                world_matrix(parent) if parent is not None else identity(),
                local_matrix(nodes[index]),
            )
        return transform_cache[index]

    positions = []
    leaf_count = 0
    stack = roots.copy()
    while stack:
        index = stack.pop()
        node = nodes[index]
        stack.extend(node.get('children', []))
        if 'mesh' not in node:
            continue
        for primitive in gltf['meshes'][node['mesh']]['primitives']:
            accessor = gltf['accessors'][primitive['attributes']['POSITION']]
            if not ('min' in accessor and 'max' in accessor):
                raise ValueError(f'Position accessor without bounds in {named_control}')
            low, high = accessor['min'], accessor['max']
            for corner in itertools.product(*zip(low, high)):
                positions.append(transform_point(world_matrix(index), corner))
            leaf_count += 1

    if not leaf_count:
        raise ValueError(f'No geometry descendants of {named_control}')
    if not all(isfinite(number) for pos in positions for number in pos):
        raise ValueError('Non-finite geometry bounds')
    return {
        'min': [min(pos[axis] for pos in positions) for axis in range(3)],
        'max': [max(pos[axis] for pos in positions) for axis in range(3)],
        'primitives': leaf_count,
    }


def inspect(source, minimum_clearance):
    with zipfile.ZipFile(source) as archive:
        files = {
            profile: next(
                (path for path in archive.namelist()
                 if path.endswith('/model-b-cinematic-r4-5-' + profile + '.glb')),
                None,
            )
            for profile in GLB_PROFILES
        }
        if not all(files.values()):
            raise ValueError('Original source ZIP lacks one or more R4.5 profiles')

        result = {
            'source': source.name,
            'sourceConvention': '+Y left (Blender) maps to -Z left (GLB)',
            'validation': 'axial AABB-only, not collision/certified mechanical fitment',
            'originalOffsets': {'centerLock': SOURCE_NUT_DISTANCE, 'outerWheel': SOURCE_WHEEL_DISTANCE},
            'pilotOffsets': {'centerLock': PILOT_NUT_DISTANCE, 'outerWheel': SOURCE_WHEEL_DISTANCE},
            'minimumRequiredVisualClearanceM': minimum_clearance,
            'profiles': {},
        }
        for profile, filename in files.items():
            binary = archive.read(filename)
            gltf = parse_glb(binary)
            nut, wheel = axial_bounds(gltf, FRONT_NUT), axial_bounds(gltf, OUTER_WHEEL)
            # Full extraction along -Z (GLB): nut's inboard face must
            # remain more negative than wheel's outboard face.
            original = (wheel['min'][2] - SOURCE_WHEEL_DISTANCE) - (nut['max'][2] - SOURCE_NUT_DISTANCE)
            staged = (wheel['min'][2] - SOURCE_WHEEL_DISTANCE) - (nut['max'][2] - PILOT_NUT_DISTANCE)
            result['profiles'][profile] = {
                'file': filename.rsplit('/', 1)[-1],
                'sha256': hashlib.sha256(binary).hexdigest(),
                'sourceBounds': {'nut': nut, 'outerWheel': wheel},
                'originalFullExtractionAxialClearanceM': round(original, 6),
                'pilotFullExtractionAxialClearanceM': round(staged, 6),
                'pilotPass': staged >= minimum_clearance,
            }
            if not result['profiles'][profile]['pilotPass']:
                raise ValueError(f'{profile}: pilot visual clearance below {minimum_clearance} m')
        return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--min-clearance', type=float, default=MIN_VISUAL_CLEARANCE_METERS)
    args = parser.parse_args()
    report = inspect(args.source, args.min_clearance)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
    for profile, data in report['profiles'].items():
        print(profile.upper(), 'source:', data['originalFullExtractionAxialClearanceM'],
              'm, staged:', data['pilotFullExtractionAxialClearanceM'], 'm PASS')
    print('NOTE: full mesh collisions and real browser playback still need QA.')


if __name__ == '__main__':
    main()
