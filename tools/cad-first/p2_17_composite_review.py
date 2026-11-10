#!/usr/bin/env python3
"""Review-only P2.16+P2.17 native rear study: combine verified GLBs without relabeling them as Model B parts."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import trimesh

EXPECTED_RGBA = (135, 146, 157, 255)


def _verify(path: Path, expected: str) -> None:
    if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest() != expected:
        raise ValueError('Source CAD GLB hash mismatch: ' + str(path))


def composite(p216: Path, p217: Path, out: Path) -> dict:
    if out.exists() and any(out.iterdir()):
        raise FileExistsError('Refusing to overwrite review-only composite')
    one = json.loads((p216/'P216_rear_wheel_manifest.json').read_text())
    two = json.loads((p217/'P217_rear_brake_drive_manifest.json').read_text())
    if one.get('solidCount') != 23 or two.get('nativeSolids') != 8:
        raise ValueError('P2.16/P2.17 native source count not expected')
    if not one.get('staticCadAudit', {}).get('passStatic') or not two.get('crossP216StaticAudit', {}).get('passStatic'):
        raise ValueError('Static native source QA not passed')
    if one.get('materialBaseColor') != '#87929d' or two.get('materialBaseColor') != '#87929d':
        raise ValueError('Review source material policy is not unified')
    expected_ids = set(one['partIds'] + two['sourcePartIds'])
    if len(expected_ids) != 31:
        raise ValueError('Duplicate CAD part identity in composite')
    records = {}
    out.mkdir(parents=True, exist_ok=True)
    for tier in ('HIGH', 'BALANCED', 'PERFORMANCE'):
        p216_info = one['profiles'][tier]
        p217_info = two['qualityProfiles'][tier]
        a = p216 / p216_info['file']
        b = p217 / p217_info['file']
        _verify(a, p216_info['sha256'])
        _verify(b, p217_info['sha256'])
        result = trimesh.Scene()
        for src, expected_count in ((a, 23), (b, 8)):
            scene = trimesh.load(src, force='scene')
            if len(scene.graph.nodes_geometry) != expected_count:
                raise ValueError('Source GLB node count mismatch: ' + str(src))
            for node in scene.graph.nodes_geometry:
                transform, mesh_key = scene.graph[node]
                mesh = scene.geometry[mesh_key]
                rgba = tuple(int(x) for x in mesh.visual.material.baseColorFactor)
                if rgba != EXPECTED_RGBA:
                    raise ValueError('Nonuniform engineering source color: ' + node)
                if node in result.graph.nodes_geometry:
                    raise ValueError('Source part identity duplicated: ' + node)
                result.add_geometry(mesh.copy(), geom_name=node, node_name=node, transform=transform)
        if set(result.graph.nodes_geometry) != expected_ids:
            raise ValueError('Source part identity lost during review merge')
        path = out/('P217_rear31_neutral_review_'+tier.lower()+'.glb')
        path.write_bytes(result.export(file_type='glb'))
        reopened = trimesh.load(path, force='scene')
        if set(reopened.graph.nodes_geometry) != expected_ids:
            raise ValueError('Exported review GLB missing original part IDs')
        records[tier] = {
            'file':path.name, 'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
            'bytes':path.stat().st_size,
            'partCount':len(reopened.graph.nodes_geometry),
            'triangles':sum(len(mesh.faces) for mesh in reopened.geometry.values()),
        }
    report = {
        'schema':'peds.cad-first.p217-static-composite-review.v1',
        'status':'UNINSTALLED_STATIC_SOURCE_REVIEW_G2_HOLD',
        'modelBIncluded':False,'mechanicalG2Certified':False,
        'rearPartNames':sorted(expected_ids),
        'partCount':31,'unifiedColor':'#87929d',
        'sourceManifests':['P216_rear_wheel_manifest.json','P217_rear_brake_drive_manifest.json'],
        'profiles':records,
    }
    (out/'P217_rear31_neutral_review_manifest.json').write_text(json.dumps(report,indent=2)+'\n')
    return report


if __name__ == '__main__':
    cli = argparse.ArgumentParser()
    cli.add_argument('--p216-dir', type=Path, required=True)
    cli.add_argument('--p217-dir', type=Path, required=True)
    cli.add_argument('--out', type=Path, required=True)
    options = cli.parse_args()
    print(json.dumps(composite(options.p216_dir, options.p217_dir, options.out),indent=2))
