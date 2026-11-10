#!/usr/bin/env python3
"""SHA-pinned 32-part rear CAD preview; NOT a Model B car or G2 proof.

Inputs are the real P2.17 31-part review GLB and P2.18 native two-part GLB.
The prior P2.16 unthreaded nut is removed ONLY from this review render.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import trimesh

from p2_18_center_lock import OLD_NUT, SPINDLE, NUT

COLOR = (135, 146, 157, 255)


def _verified_file(folder: Path, info: dict) -> Path:
    path = folder / info['file']
    if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest() != info['sha256']:
        raise ValueError('SHA-256 mismatch on CAD preview source: '+str(path))
    return path


def composite(rear31: Path, thread: Path, out: Path) -> dict:
    if out.exists() and any(out.iterdir()):
        raise FileExistsError('Do not overwrite an earlier rear32 review')
    base = json.loads((rear31/'P217_rear31_neutral_review_manifest.json').read_text())
    new = json.loads((thread/'P218_threaded_center_lock_manifest.json').read_text())
    if base.get('schema') != 'peds.cad-first.p217-static-composite-review.v1' or base.get('partCount') != 31:
        raise ValueError('P2.17 review manifest provenance mismatch')
    if new.get('schema') != 'peds.cad-first.p218-threaded-rear-center-lock-source.v1' or new.get('newCadSolids') != 2:
        raise ValueError('P2.18 native thread manifest provenance mismatch')
    if not new.get('combinedStaticSourceAudit', {}).get('passStatic'):
        raise ValueError('New native mechanical static gate failed')
    if base.get('unifiedColor') != '#87929d' or new.get('uniformMaterialColor') != '#87929d':
        raise ValueError('Engineering neutral palette mismatch')
    expected = (set(base['rearPartNames'])-{OLD_NUT})|{SPINDLE,NUT}
    if len(expected) != 32 or OLD_NUT not in base['rearPartNames']:
        raise ValueError('Exact 31-1+2 source IDs not preserved')
    out.mkdir(parents=True, exist_ok=True)
    outputs = {}
    for tier in ('HIGH', 'BALANCED', 'PERFORMANCE'):
        old_path = _verified_file(rear31, base['profiles'][tier])
        new_path = _verified_file(thread, new['profiles'][tier])
        previous = trimesh.load(old_path, force='scene')
        replacement = trimesh.load(new_path, force='scene')
        if set(previous.graph.nodes_geometry) != set(base['rearPartNames']) or set(replacement.graph.nodes_geometry) != {SPINDLE,NUT}:
            raise ValueError('Wrong source CAD node identities at '+tier)
        scene = trimesh.Scene()
        for source in (previous,replacement):
            for node in source.graph.nodes_geometry:
                if node == OLD_NUT:
                    continue
                transform, geom_key = source.graph[node]
                original = source.geometry[geom_key]
                if tuple(int(x) for x in original.visual.material.baseColorFactor) != COLOR:
                    raise ValueError('CAD color drift at '+node)
                if node in scene.graph.nodes_geometry:
                    raise ValueError('Duplicated CAD mesh node: '+node)
                scene.add_geometry(original.copy(), node_name=node, geom_name=node, transform=transform)
        if set(scene.graph.nodes_geometry) != expected:
            raise ValueError('Incompatible rear32 CAD overlay')
        path = out/('P218_rear32_neutral_review_'+tier.lower()+'.glb')
        path.write_bytes(scene.export(file_type='glb'))
        reopened = trimesh.load(path, force='scene')
        if set(reopened.graph.nodes_geometry) != expected:
            raise ValueError('GLB roundtrip lost rear CAD source names')
        outputs[tier] = {'file':path.name,
                         'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
                         'bytes':path.stat().st_size,
                         'partCount':len(reopened.graph.nodes_geometry),
                         'triangles':sum(len(mesh.faces) for mesh in reopened.geometry.values())}
    report = {'schema':'peds.cad-first.p218-static-composite-review.v1',
              'status':'UNINSTALLED_REAR_CAD_REVIEW_G2_HOLD',
              'partCount':32,'rearPartIds':sorted(expected),'removedPrototype':OLD_NUT,
              'uniformColor':'#87929d','modelBIncluded':False,
              'mechanicalG2Certified':False,'profiles':outputs}
    (out/'P218_rear32_neutral_review_manifest.json').write_text(json.dumps(report,indent=2)+'\n')
    return report


if __name__ == '__main__':
    cli=argparse.ArgumentParser()
    cli.add_argument('--rear31-dir',required=True,type=Path)
    cli.add_argument('--thread-dir',required=True,type=Path)
    cli.add_argument('--out',required=True,type=Path)
    args=cli.parse_args()
    print(json.dumps(composite(args.rear31_dir,args.thread_dir,args.out),indent=2))
