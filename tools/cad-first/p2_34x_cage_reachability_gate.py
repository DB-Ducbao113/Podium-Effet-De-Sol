#!/usr/bin/env python3
"""P2.34X sampled CV ball-translation graph. Not a retention certificate."""
from __future__ import annotations
import argparse, hashlib, itertools, json, math
from collections import deque
from pathlib import Path

SOURCE_SHA = '9bd7ec6a60d5c4c9f1f3e421cb730fc252de026aae21dcf570584e5dda0ec63e'
SCHEMA = 'peds.cad-first.p234x-sampled-ball-configuration-graph.v1'
W_SCHEMA = 'peds.cad-first.p234w-face-normal-directional-cage-review.v1'
BALLS = tuple(f'P234C_REAR_CV_TORQUE_BALL_{i:02d}' for i in range(1, 7))
SHAFT = 'P217_REAR_DRIVE_HALF_SHAFT_UNSPLINED'
CUP = 'P217_REAR_CV_HOUSING_PROTOTYPE'
CAGE = 'P234C_REAR_CV_BALL_GUIDE_CAGE'


def finite(x, label):
    if type(x) not in (float, int) or not math.isfinite(x):
        raise ValueError(f'{label}: nonfinite number')
    return float(x)


def grid(step_mm=0.75, steps_per_axis=1):
    step = finite(step_mm, 'grid step')
    if not 0.1 <= step <= 1 or type(steps_per_axis) is not int or not 1 <= steps_per_axis <= 2:
        raise ValueError('Grid must be finite and bounded')
    return list(itertools.product(range(-steps_per_axis, steps_per_axis + 1), repeat=3))


def neighbors(node, available):
    for dimension in range(3):
        for delta in (-1, 1):
            next_node = tuple(x + (delta if i == dimension else 0) for i, x in enumerate(node))
            if next_node in available:
                yield next_node


def boundary(node, limit):
    return any(abs(a) == limit for a in node)


def reachable_nodes(free_nodes, free_edges, limit):
    """Graph connectivity only; a reached grid boundary is NOT outside the pocket."""
    start = (0, 0, 0)
    if start not in free_nodes:
        return {'initialConfigurationClear': False, 'reachableNodes': 0,
                'sampledBoundaryReachable': False, 'sampledShortestBoundaryPath': None}
    queue = deque([start]); previous = {start: None}
    target = None
    while queue:
        current = queue.popleft()
        if boundary(current, limit):
            target = current
            break
        for next_node in neighbors(current, free_nodes):
            edge = frozenset((current, next_node))
            if edge in free_edges and next_node not in previous:
                previous[next_node] = current
                queue.append(next_node)
    path = None
    if target is not None:
        path = []
        while target is not None:
            path.append(list(target))
            target = previous[target]
        path.reverse()
    return {'initialConfigurationClear': True, 'reachableNodes': len(previous),
            'sampledBoundaryReachable': path is not None,
            'sampledShortestBoundaryPath': path}


def collision_vector(ball, obstacles, translation, overlap_limit_mm3=1e-7):
    limit = finite(overlap_limit_mm3, 'overlap tolerance')
    if not 0 <= limit <= 0.001 or set(obstacles) != {'shaft', 'cup', 'cage'}:
        raise ValueError('Three CV obstacles and bounded overlap tolerance required')
    moved = ball.translate(tuple(finite(v, 'translation') for v in translation))
    measured = {}
    for name in ('shaft', 'cup', 'cage'):
        overlap = finite(float(moved.intersect(obstacles[name]).Volume()), name + ' overlap')
        if overlap < 0:
            raise ValueError('Negative native intersection')
        measured[name] = overlap
    return measured, all(v <= limit for v in measured.values())


def scan_ball(ball, obstacles, step_mm=0.75, steps_per_axis=1):
    """Sample nodes and half-edges; even a free edge may contain unseen collisions."""
    nodes = grid(step_mm, steps_per_axis)
    cache = {}
    def check(position):
        key = tuple(position)
        if key not in cache:
            cache[key] = collision_vector(ball, obstacles, tuple(step_mm * x for x in position))
        return cache[key]
    free = {p for p in nodes if check(p)[1]}
    edges = set()
    tested_edges = 0
    for p in nodes:
        if p not in free:
            continue
        for q in neighbors(p, free):
            if p >= q:
                continue
            tested_edges += 1
            center = tuple((x + y) / 2 for x, y in zip(p, q))
            if check(center)[1]:
                edges.add(frozenset((p, q)))
    connectivity = reachable_nodes(free, edges, steps_per_axis)
    first, _ = check((0, 0, 0))
    return {'gridNodeCount': len(nodes), 'sampledClearNodeCount': len(free),
            'sampledClearEdgeCount': len(edges), 'testedMidpointEdges': tested_edges,
            'actualNativeBooleanCalls': 3 * len(cache),
            'initialNativeOverlapMm3': first,
            **connectivity, 'continuousCollisionFreePathCertified': False,
            'actualBallEscapeFromPocketCertified': False,
            'completeCageContainmentCertified': False}


def inspect_pose(parts, pose, correction, offset, step_mm=0.75, steps_per_axis=1):
    from p2_34v_nearest_contact_witness import transform
    moved = transform(parts, pose, correction, offset)
    obstacles = {'shaft': moved[SHAFT], 'cup': moved[CUP], 'cage': moved[CAGE]}
    records = [{'ballSourceID': name, **scan_ball(moved[name], obstacles, step_mm, steps_per_axis)}
               for name in BALLS]
    return {'pose': pose, 'ballCount': len(records), 'ballEvidence': records,
            'ballsWithSampledBoundaryReachability': sum(r['sampledBoundaryReachable'] for r in records),
            'nativeBooleanCalls': sum(r['actualNativeBooleanCalls'] for r in records)}


def verify_w_parent(w, w_raw, m_raw, step_raw, expected_pose_count):
    if not isinstance(w, dict) or w.get('schema') != W_SCHEMA:
        raise ValueError('P2.34W report schema mismatch')
    if w.get('original84SourceSHA256') != SOURCE_SHA:
        raise ValueError('P2.34W original native STEP mismatch')
    if w.get('candidateSTEPsha256') != hashlib.sha256(step_raw).hexdigest():
        raise ValueError('P2.34W candidate STEP SHA mismatch')
    if w.get('p234mReportSHA256') != hashlib.sha256(m_raw).hexdigest():
        raise ValueError('P2.34W source path SHA mismatch')
    if w.get('poseCount') != expected_pose_count or expected_pose_count < 9:
        raise ValueError('P2.34W pose coverage incomplete')
    if w.get('mechanicalG2Certified') is not False or w.get('sourceModified') is not False:
        raise ValueError('Untrusted prior mechanical acceptance')
    if not isinstance(w.get('sampledPoseEvidence'), list) or len(w['sampledPoseEvidence']) != expected_pose_count:
        raise ValueError('Missing P2.34W native pose evidence')
    return hashlib.sha256(w_raw).hexdigest()


def run(source_dir, candidate_dir, m_file, w_file, out_file, step_mm=0.75, steps_per_axis=1):
    target = Path(out_file)
    if target.exists():
        raise FileExistsError('Refuse evidence overwrite')
    grid(step_mm, steps_per_axis)
    from p2_34n_track_candidate import validated_paths
    from p2_34f_repo_native_contact_guard import source
    from p2_34o_native_postcut_gate import validate_audit, establish_identity, verify_subtractive_geometry
    import cadquery as cq
    folder = Path(candidate_dir)
    step_raw = (folder / 'P234N_source84_track_cut_PROTOTYPE.step').read_bytes()
    audit_raw = (folder / 'P234N_prototype_native_audit.json').read_bytes()
    m_raw, w_raw = Path(m_file).read_bytes(), Path(w_file).read_bytes()
    samples = validated_paths(json.loads(m_raw))
    w = json.loads(w_raw)
    parent_sha = verify_w_parent(w, w_raw, m_raw, step_raw, len(samples))
    audit = json.loads(audit_raw)
    validate_audit(audit, step_raw, m_raw)
    original = source(Path(source_dir))
    imported = cq.importers.importStep(str(folder / 'P234N_source84_track_cut_PROTOTYPE.step')).solids().vals()
    mapping = establish_identity(original, imported, audit)
    parts = {name: imported[i] for name, i in mapping.items()}
    for name in (SHAFT, CUP):
        verify_subtractive_geometry(original[name], parts[name])
    evidence = [inspect_pose(parts, p, t, o, step_mm, steps_per_axis) for p, t, o in samples]
    result = {'schema': SCHEMA, 'original84SourceSHA256': SOURCE_SHA,
              'candidateSTEPsha256': hashlib.sha256(step_raw).hexdigest(),
              'candidateAuditSHA256': hashlib.sha256(audit_raw).hexdigest(),
              'p234mReportSHA256': hashlib.sha256(m_raw).hexdigest(), 'p234wReportSHA256': parent_sha,
              'poseCount': len(evidence), 'stepMm': step_mm, 'stepsPerAxis': steps_per_axis,
              'nativeBooleanCalls': sum(row['nativeBooleanCalls'] for row in evidence),
              'sampledConfigurationSpaceEvidence': evidence,
              'sampledBoundaryIsNotCageEscape': True,
              'fullCagePocketRetentionCertified': False,
              'continuousCollisionFreePathCertified': False,
              'surfaceStressCertified': False, 'constantVelocityCertified': False,
              'loadedTorqueCertified': False, 'mechanicalG2Certified': False,
              'status': 'P234X_FINITE_3D_CONFIGURATION_GRAPH_ONLY_G2_HOLD'}
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(result, indent=2, allow_nan=False) + '\n', encoding='utf-8')
    return result


if __name__ == '__main__':
    cli = argparse.ArgumentParser()
    for name in ('p234e-native', 'p234n-candidate', 'p234m-report', 'p234w-report', 'out'):
        cli.add_argument('--' + name, type=Path, required=True)
    cli.add_argument('--step-mm', type=float, default=0.75)
    cli.add_argument('--steps-per-axis', type=int, default=1)
    args = cli.parse_args()
    data = run(args.p234e_native, args.p234n_candidate, args.p234m_report,
               args.p234w_report, args.out, args.step_mm, args.steps_per_axis)
    print(json.dumps({'status': data['status'], 'poseCount': data['poseCount']}))
