#!/usr/bin/env python3
"""P1.0 offline audit of the 7 front-left wheel nodes across 3 R4.5 GLBs.

Source can be the original owner ZIP or an extracted exports directory.
Pure Python standard library. Does not alter model assets or publish them.
Example:
  python tools/inside-the-machine/p1/audit_front_left.py \
    --source /path/to/inside-the-machine.zip --out /tmp/p1-wheel-audit.json
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import struct
import zipfile

PROFILES = ('high', 'balanced', 'performance')
PART = 'FRONT_LEFT_WHEEL'


def read_assets(source: Path):
    files = ['assembly-manifest-r4-5.json'] + [
        f'model-b-cinematic-r4-5-{profile}.glb' for profile in PROFILES
    ]
    if source.is_dir():
        blobs = {name: (source / name).read_bytes() for name in files}
    elif source.suffix.lower() == '.zip':
        with zipfile.ZipFile(source) as archive:
            blobs = {}
            for name in files:
                matches = [path for path in archive.namelist()
                           if path == name or path.endswith('/' + name)]
                if len(matches) != 1:
                    raise ValueError(f'Expected one {name}, found {len(matches)}')
                blobs[name] = archive.read(matches[0])
    else:
        raise ValueError('Use extracted exports directory or original R4.5 ZIP')
    return json.loads(blobs.pop(files[0])), blobs


def parse_glb(binary: bytes) -> dict:
    if len(binary) < 20 or binary[:4] != b'glTF':
        raise ValueError('Invalid GLB magic')
    version, byte_count = struct.unpack_from('<II', binary, 4)
    if version != 2 or byte_count != len(binary):
        raise ValueError('Invalid GLB v2 byte length')
    size, kind = struct.unpack_from('<I4s', binary, 12)
    if kind != b'JSON' or 20 + size > len(binary):
        raise ValueError('Invalid GLB JSON chunk')
    return json.loads(binary[20:20 + size])


def inspect_part(gltf: dict, node_name: str, expected_parent: str) -> dict:
    nodes = gltf['nodes']
    indices = [i for i, node in enumerate(nodes) if node.get('name') == node_name]
    if len(indices) != 1:
        raise ValueError(f'{node_name}: expected exactly one node, got {len(indices)}')
    root = indices[0]
    parents = {child: i for i, node in enumerate(nodes) for child in node.get('children', [])}
    ancestor = root
    path = []
    while ancestor in parents:
        ancestor = parents[ancestor]
        path.append(nodes[ancestor].get('name', ''))
    if expected_parent not in path:
        raise ValueError(f'{node_name}: outside expected parent {expected_parent}')
    queue = [root]
    found = set()
    primitives = []
    while queue:
        index = queue.pop()
        if index in found:
            continue
        found.add(index)
        node = nodes[index]
        queue.extend(node.get('children', []))
        if 'mesh' in node:
            primitives.extend(gltf['meshes'][node['mesh']]['primitives'])
    if not primitives:
        raise ValueError(f'{node_name}: control node has no mesh descendants')
    triangles = sum(
        gltf['accessors'][part['indices']]['count'] // 3
        if 'indices' in part
        else gltf['accessors'][part['attributes']['POSITION']]['count'] // 3
        for part in primitives
    )
    material_ids = sorted({part['material'] for part in primitives if 'material' in part})
    return {
        'controlNode': node_name,
        'parentChain': path,
        'descendantNodes': len(found),
        'primitives': len(primitives),
        'triangles': triangles,
        'materials': [gltf['materials'][i].get('name', str(i)) for i in material_ids],
    }


def audit(source: Path) -> dict:
    manifest, blobs = read_assets(source)
    assembly = next(item for item in manifest['assemblies'] if item['id'] == PART)
    parts = [part for part in manifest['components'] if part['parentAssemblyId'] == PART]
    if len(parts) != 7:
        raise ValueError(f'Expected 7 first-corner components, found {len(parts)}')
    result = {
        'schema': 'peds.itm.p1-source-audit.v1',
        'manifestVersion': manifest['version'],
        'sourceCoordinates': manifest['coordinateSystem'],
        'assembly': PART,
        'parts': [
            {
                'semanticId': part['id'],
                'node': part['node'],
                'pivotWorldZUp': part['pivotWorld'],
                'explodedOffsetZUp': part['explodedOffset'],
                'provenance': part['provenance'],
                'animationOrder': part['animationOrder'],
            }
            for part in parts
        ],
        'blockers': {
            'reassemblyPass': manifest['animation']['reassemblyPass'],
            'shaftHubMechanicalEngagementProven':
                manifest['r45Contract']['shaftHubMechanicalEngagementProven'],
        },
        'profiles': {},
    }
    for profile in PROFILES:
        binary = blobs[f'model-b-cinematic-r4-5-{profile}.glb']
        gltf = parse_glb(binary)
        result['profiles'][profile] = {
            'bytes': len(binary),
            'sha256': hashlib.sha256(binary).hexdigest(),
            'nodeCount': len(gltf['nodes']),
            'meshCount': len(gltf['meshes']),
            'parts': {
                part['id']: inspect_part(gltf, part['node'], assembly['node'])
                for part in parts
            },
        }
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', required=True, type=Path)
    parser.add_argument('--out', required=True, type=Path)
    args = parser.parse_args()
    result = audit(args.source)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print('P1.0: PASS — 7/7 semantic parts across all three GLB profiles.')
    print('P1.1 blocked pending real WebGL visual & reassembly verification.')


if __name__ == '__main__':
    main()
