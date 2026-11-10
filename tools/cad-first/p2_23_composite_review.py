#!/usr/bin/env python3
"""SHA-verified P2.23 40-mesh monochrome rear-wheel source preview.

Only replaces original P2.22 hub and P2.18 spindle in a detached source
review. If upstream source SHA, 40 part IDs, PBR color or native static
geometric audit fails, no apparently completed car or GLB is emitted.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import trimesh

from p2_18_center_lock import SPINDLE
from p2_22_keyed_hub_rotor import HUB
from p2_23_spindle_hub_keyed_mate import SCHEMA as NATIVE_SCHEMA

SCHEMA = 'peds.cad-first.p223-40body-source-preview.v1'
COLOR = (135, 146, 157, 255)


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _read_scene(folder: Path, info: dict) -> trimesh.Scene:
    file = folder/info['file']
    if not file.is_file() or digest(file) != info['sha256']:
        raise ValueError('P2.23 source GLB SHA-256 mismatch: ' + str(file))
    return trimesh.load(file, force='scene')


def compose(old_dir: Path, native_dir: Path, out: Path) -> dict:
    if out.exists():
        raise FileExistsError('Cannot replace existing evidence or source preview')
    old = json.loads((old_dir/'P222_rear40_keyed_neutral_manifest.json').read_text())
    new = json.loads((native_dir/'P223_rear_keyed_spindle_hub_manifest.json').read_text())
    if old.get('schema') != 'peds.cad-first.p222-keyed-rear40-source-review.v1':
        raise ValueError('P2.22 previous native source schema mismatch')
    if new.get('schema') != NATIVE_SCHEMA:
        raise ValueError('P2.23 native source schema mismatch')
    if old.get('partCount') != 40 or new.get('preservedReviewBodyCount') != 40:
        raise ValueError('P2.23 expected original 40 named source parts')
    if old.get('uniformColor') != '#87929d' or new.get('materialColor') != '#87929d':
        raise ValueError('Shared engineering gray palette changed')
    audit = new.get('geometryAudit', {})
    native = audit.get('nativeStaticAudit', {})
    if not native.get('passStatic') or native.get('solidPairs') != 780 or \
       audit.get('nominalNativeHubSpindleOverlapMm3', float('inf')) > .05 or \
       audit.get('forcedRotationNativeOverlapMm3', 0) < 5:
        raise ValueError('P2.23 real 40-body native B-Rep source gate has not passed')
    source_step = new['sourceSTEP']
    step_path = native_dir/source_step['file']
    if not step_path.is_file() or digest(step_path) != source_step['sha256']:
        raise ValueError('P2.23 native STEP SHA-256 mismatch')
    old_names = set(old['partIds'])
    change_names = {HUB, SPINDLE}
    if len(old_names) != 40 or not change_names <= old_names or \
       set(audit['replacedNativePartIds']) != change_names:
        raise ValueError('P2.23 source ownership/part IDs invalid')
    out.mkdir(parents=True)
    profiles = {}
    for quality in ('HIGH', 'BALANCED', 'PERFORMANCE'):
        previous = _read_scene(old_dir, old['qualityProfiles'][quality])
        replacement = _read_scene(native_dir, new['profiles'][quality])
        if set(previous.graph.nodes_geometry) != old_names or \
           set(replacement.graph.nodes_geometry) != change_names:
            raise ValueError('P2.23 source mesh IDs do not match authenticated manifests')
        joined = trimesh.Scene()
        for scene in (previous, replacement):
            for node in scene.graph.nodes_geometry:
                if scene is previous and node in change_names:
                    continue
                transform, geom = scene.graph[node]
                mesh = scene.geometry[geom]
                if tuple(int(c) for c in mesh.visual.material.baseColorFactor) != COLOR:
                    raise ValueError('P2.23 material color is not uniform: ' + node)
                if not mesh.is_watertight or not mesh.is_winding_consistent:
                    raise ValueError('P2.23 original GLB source mesh is not manifold: ' + node)
                if node in joined.graph.nodes_geometry:
                    raise ValueError('P2.23 duplicated source mesh: ' + node)
                joined.add_geometry(mesh.copy(), geom_name=node, node_name=node,
                                    transform=transform)
        if set(joined.graph.nodes_geometry) != old_names or len(joined.geometry) != 40:
            raise ValueError('P2.23 composed review lost original source identities')
        path = out / ('P223_rear40_spindle_hub_neutral_' + quality.lower() + '.glb')
        path.write_bytes(joined.export(file_type='glb'))
        parsed = trimesh.load(path, force='scene')
        if set(parsed.graph.nodes_geometry) != old_names:
            raise ValueError('P2.23 GLB roundtrip lost source identities')
        profiles[quality] = {
            'file': path.name, 'sha256': digest(path), 'bytes': path.stat().st_size,
            'meshCount': len(parsed.graph.nodes_geometry),
            'triangles': sum(len(mesh.faces) for mesh in parsed.geometry.values()),
        }
    report = {
        'schema': SCHEMA,
        'status': 'P223_REAL_40BODY_SOURCE_PREVIEW_ONLY_G2_HOLD',
        'partCount': 40,
        'partIds': sorted(old_names),
        'replaceOnly': sorted(change_names),
        'uniformColor': '#87929d',
        'originalModelBIncluded': False,
        'actualChassisFitCertified': False,
        'mechanicalG2Certified': False,
        'axialSpindleRetentionCertified': False,
        'profiles': profiles,
    }
    (out/'P223_rear40_neutral_review_manifest.json').write_text(json.dumps(report, indent=2)+'\n')
    return report


if __name__ == '__main__':
    cli = argparse.ArgumentParser()
    cli.add_argument('--previous-dir', required=True, type=Path)
    cli.add_argument('--native-dir', required=True, type=Path)
    cli.add_argument('--out', required=True, type=Path)
    opts = cli.parse_args()
    print(json.dumps(compose(opts.previous_dir, opts.native_dir, opts.out), indent=2))
