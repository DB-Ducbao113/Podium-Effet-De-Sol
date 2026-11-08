#!/usr/bin/env python3
"""Non-destructive original Model B + P2.8 AABB preview, NOT B-Rep mechanical QA."""
from __future__ import annotations
import argparse, hashlib, json, math
from pathlib import Path
import numpy as np
import trimesh

def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as fd:
        for block in iter(lambda: fd.read(1 << 20), b''):
            h.update(block)
    return h.hexdigest()

def rigid_transform(record: dict) -> np.ndarray:
    if record.get('scale') != 1:
        raise ValueError('Original CAD must not be scaled')
    xyz = record.get('translationM')
    xyzw = record.get('rotationQuaternion')
    if not isinstance(xyz, list) or len(xyz) != 3 or not isinstance(xyzw, list) or len(xyzw) != 4:
        raise ValueError('Expected original-root translation and quaternion')
    if not all(type(x) in (int, float) and math.isfinite(x) for x in xyz + xyzw):
        raise ValueError('Invalid finite transform')
    q = np.asarray([xyzw[3], xyzw[0], xyzw[1], xyzw[2]], dtype=float)
    if abs(np.linalg.norm(q) - 1) > 1e-3:
        raise ValueError('Rotation quaternion not normalized')
    matrix = trimesh.transformations.quaternion_matrix(q)
    matrix[:3, 3] = xyz
    return matrix

def mesh_boxes(scene: trimesh.Scene, root=None) -> dict:
    output = {}
    root = np.eye(4) if root is None else root
    for node in scene.graph.nodes_geometry:
        world, geom = scene.graph.get(node)
        part = scene.geometry[geom]
        corners = trimesh.bounds.corners(part.bounds)
        coords = trimesh.transformations.transform_points(corners, root @ world)
        output[node] = np.stack([coords.min(axis=0), coords.max(axis=0)])
    return output

def intersection_candidates(body: dict, corner: dict):
    overlaps = []
    for a, ba in body.items():
        for b, bb in corner.items():
            shared = np.minimum(ba[1], bb[1]) - np.maximum(ba[0], bb[0])
            if np.all(shared > 0):
                overlaps.append({'model_b_node': a, 'p28_node': b,
                                 'aabb_intersection_m': [float(x) for x in shared],
                                 'aabb_overlap_volume_m3': float(np.prod(shared))})
    return sorted(overlaps, key=lambda x: -x['aabb_overlap_volume_m3'])

def inspect(modelb: Path, p28dir: Path, placement: Path, tier='BALANCED') -> dict:
    manifest = json.loads((p28dir / 'P28_remate_manifest.json').read_text(encoding='utf8'))
    if manifest.get('schema') != 'podium-eds.p2.cad-first.full-corner.remate.v1':
        raise ValueError('P2.8 original source manifest required')
    ids = manifest.get('partIds', [])
    if len(ids) != 59 or len(set(ids)) != 59:
        raise ValueError('Expected 59 unique project-authored part IDs')
    if manifest.get('totalCadSolids') != 59 or not manifest.get('allRoundtripValid'):
        raise ValueError('Missing native CAD source result')
    profile = manifest['profiles'][tier]
    glb = p28dir / profile['file']
    if not glb.is_file() or glb.stat().st_size != profile['bytes'] or digest(glb) != profile['sha256']:
        raise ValueError('P2.8 GLB integrity mismatch')
    source_step = p28dir / manifest['masterSTEP']
    if not source_step.is_file() or digest(source_step) != manifest['masterSTEPsha256']:
        raise ValueError('Original P2.8 STEP missing or tampered')
    p = json.loads(placement.read_text(encoding='utf8'))
    if p.get('schema') != 'podium-eds.assembly-preview.placement.v1':
        raise ValueError('Wrong placement record schema')
    if p.get('cornerSha256') != profile['sha256'] or p.get('p28PartCount') != 59:
        raise ValueError('Placement does not match exact source GLB')
    registration = p.get('resolvedOriginalRootTransform')
    if not isinstance(registration, dict):
        raise ValueError('No resolved 3D placement was exported from browser')
    matrix = rigid_transform(registration)
    shell = trimesh.load(modelb, force='scene')
    corner = trimesh.load(glb, force='scene')
    if set(corner.graph.nodes_geometry) != set(ids):
        raise ValueError('Unexpected source identities in original corner GLB')
    body_bounds = mesh_boxes(shell)
    corner_bounds = mesh_boxes(corner, matrix)
    candidates = intersection_candidates(body_bounds, corner_bounds)
    return {'gate': 'G2_HOLD', 'scope': 'VISUAL_AABB_PREFLIGHT_ONLY',
            'model_b_sha256': digest(modelb), 'p28_sha256': digest(glb),
            'p28_step_sha256': digest(source_step),
            'model_b_mesh_nodes': len(body_bounds), 'p28_mesh_nodes': len(corner_bounds),
            'candidate_aabb_pairs': len(candidates), 'largest_50_candidates': candidates[:50],
            'placement': registration, 'body_bounds_m': shell.bounds.tolist(),
            'source_corner_bounds_m': corner.bounds.tolist(),
            'limitations': ['AABB overlaps are not exact polygon intersections',
                'Model B is a showroom polygon asset, not a B-Rep chassis',
                'Cannot certify mating, physical clearance, kinematics, or load paths',
                'Hidden visual shell meshes have not been removed from physical calculations'],
            'mechanical_mate_validated': False, 'release_approved': False}

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--modelb', type=Path, required=True)
    p.add_argument('--p28-dir', type=Path, required=True)
    p.add_argument('--placement', type=Path, required=True)
    p.add_argument('--quality', choices=['HIGH','BALANCED','PERFORMANCE'], default='BALANCED')
    p.add_argument('--out', type=Path, required=True)
    args = p.parse_args()
    result = inspect(args.modelb, args.p28_dir, args.placement, args.quality)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(result, indent=2) + '\n', encoding='utf8')
    print(f"AABB PREVIEW ONLY: {result['candidate_aabb_pairs']} broadphase candidates, G2 HOLD")

if __name__ == '__main__':
    main()
