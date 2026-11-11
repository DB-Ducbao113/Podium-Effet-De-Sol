#!/usr/bin/env python3
"""P2.34M/54: native six-ball/cage rigid-orientation feasibility at multiple CV poses.

Keeps the SHA-pinned original P2.34E 84 STEP solids immutable. No redesigned
race geometry, true cage mechanism, dynamic contact, velocity or torque claim.
"""
from __future__ import annotations

import argparse
import hashlib
import itertools
import json
import math
from pathlib import Path

# Align with P2.34F/J original source IDs, without importing CAD engines for pure tests.
BALLS = tuple(f'P234C_REAR_CV_TORQUE_BALL_{i:02d}' for i in range(1, 7))
CAGE = 'P234C_REAR_CV_BALL_GUIDE_CAGE'
CUP = 'P217_REAR_CV_HOUSING_PROTOTYPE'
SHAFT = 'P217_REAR_DRIVE_HALF_SHAFT_UNSPLINED'
PIN = '9bd7ec6a60d5c4c9f1f3e421cb730fc252de026aae21dcf570584e5dda0ec63e'


def phase_delta(a, b):
    d = (finite(b, 'next phase')-finite(a, 'previous phase')+180) % 360 - 180
    if abs(abs(d)-180) < 1e-8:
        raise ValueError('Ambiguous 180-degree phase jump')
    return d


def offsets(step_mm=.2, radius_mm=.2):
    step = finite(step_mm, 'step')
    radius = finite(radius_mm, 'radius')
    if not 0 < step <= 2 or not 0 <= radius <= 2:
        raise ValueError('Invalid local translation grid')
    n = math.floor(radius/step+1e-10)
    if n > 6:
        raise ValueError('Native grid budget exceeded')
    values = [i*step for i in range(-n, n+1)]
    return sorted((tuple(float(x) for x in v) for v in itertools.product(values, repeat=3)
                   if math.dist((0, 0, 0), v) <= radius+1e-9),
                  key=lambda v: (round(sum(x*x for x in v), 12), v))
SCHEMA = 'peds.cad-first.p234m-cage-orientation-native-grid.v1'
GRID_SCHEMA = 'peds.cad-first.p234m-prescribed-pose-grid.v1'
PIVOT_Z = -239.5  # Source-native rear corner pivot in mm; inherited from P2.34F.
MAX_POSES = 36
MAX_CANDIDATES_PER_POSE = 256
RACE_VOLUME_REVIEW_MM3 = 0.05
RACE_PROXIMITY_REVIEW_MM = 1e-5
CAGE_PENETRATION_NUMERIC_EPS_MM3 = 1e-9


def finite(value, name):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise ValueError(f'{name} must be a finite number')
    return float(value)


def candidate_axes(tilt_deg=0.5):
    """One-axis-at-a-time tilt probes, not a full SO(3) solution."""
    magnitude = finite(tilt_deg, 'tilt')
    if not 0 < magnitude <= 1.5:
        raise ValueError('Tilt must be within (0, 1.5] degrees')
    result = [(0., 0., 0.)]
    for axis in range(3):
        for sign in (-1, 1):
            v = [0., 0., 0.]
            v[axis] = sign * magnitude
            result.append(tuple(v))
    return result


def apply_rot_vector(vector, axis, degrees):
    """Right-hand rotation about X/Y/Z. Pure Python for independent tests."""
    x, y, z = vector
    a = math.radians(degrees)
    co, si = math.cos(a), math.sin(a)
    if axis == 'x':
        return (x, y * co - z * si, y * si + z * co)
    if axis == 'y':
        return (x * co + z * si, y, -x * si + z * co)
    if axis == 'z':
        return (x * co - y * si, x * si + y * co, z)
    raise ValueError('Invalid rotation axis')


def translate_in_cage_frame(offset_mm, bend_deg, correction_deg):
    v = tuple(offset_mm)
    for axis, angle in (('x', bend_deg/2), ('x', correction_deg[0]),
                        ('y', correction_deg[1]), ('z', correction_deg[2])):
        v = apply_rot_vector(v, axis, angle)
    return v


def native_rotate(shape, axis, angle):
    directions = {'x': (1., 0., PIVOT_Z), 'y': (0., 1., PIVOT_Z),
                  'z': (0., 0., PIVOT_Z+1.)}
    return shape.rotate((0, 0, PIVOT_Z), directions[axis], angle)


def orient(shape, bend_deg, correction_deg):
    result = native_rotate(shape, 'x', bend_deg/2)
    for axis, value in zip('xyz', correction_deg):
        if value:
            result = native_rotate(result, axis, value)
    return result


def shape_volume(shape_a, shape_b):
    v = finite(float(shape_a.intersect(shape_b).Volume()), 'native intersection')
    if v < 0:
        raise ValueError('Negative B-Rep volume')
    return v


def measure_group(parts, bend, shaft_phase, cup_phase, cage_tilt=(0., 0., 0.), move_local=(0., 0., 0.)):
    """One candidate: two races against all six transformed source-native balls.

    The original cage and every ball receive *identical* rigid motion, so the
    six cage/ball and 15 ball/ball overlap volumes are orientation-invariant.
    The native bodies are queried, not fused, rescaled or changed in-place.
    """
    from p2_34g_coupled_phase_gate import exact_minimum
    shaft = native_rotate(native_rotate(parts[SHAFT], 'z', shaft_phase), 'x', bend)
    cup = native_rotate(parts[CUP], 'z', -cup_phase)
    translation = translate_in_cage_frame(move_local, bend, cage_tilt)
    balls = [orient(parts[name], bend, cage_tilt).translate(translation) for name in BALLS]
    cage = orient(parts[CAGE], bend, cage_tilt).translate(translation)
    ball_races = []
    for ball in balls:
        ds = finite(float(exact_minimum(ball, shaft)), 'shaft distance')
        dc = finite(float(exact_minimum(ball, cup)), 'cup distance')
        if min(ds, dc) < 0:
            raise ValueError('Negative B-Rep distance')
        ball_races.append({'shaftGapMm': ds, 'cupGapMm': dc,
                           'shaftOverlapMm3': shape_volume(ball, shaft),
                           'cupOverlapMm3': shape_volume(ball, cup)})
    ball_pairs = [shape_volume(balls[i], balls[j]) for i in range(6) for j in range(i+1, 6)]
    cage_pairs = [shape_volume(ball, cage) for ball in balls]
    return ball_races, ball_pairs, cage_pairs


def validate_contact(ball_races, ball_pairs, cage_pairs):
    if not isinstance(ball_races, list) or len(ball_races) != 6 or len(ball_pairs) != 15 or len(cage_pairs) != 6:
        raise ValueError('Require exactly six balls, 15 ball pairs and 6 cage/ball pairs')
    values = [*ball_pairs, *cage_pairs]
    for r in ball_races:
        values.extend(r[key] for key in ('shaftGapMm', 'cupGapMm', 'shaftOverlapMm3', 'cupOverlapMm3'))
    if any(finite(v, 'B-Rep witness') < 0 for v in values):
        raise ValueError('Invalid negative B-Rep witness')
    gap_balls = sum(max(r['shaftGapMm'], r['cupGapMm']) > RACE_PROXIMITY_REVIEW_MM for r in ball_races)
    race_clashes = sum(r[key] > RACE_VOLUME_REVIEW_MM3 for r in ball_races for key in ('shaftOverlapMm3', 'cupOverlapMm3'))
    ball_clashes = sum(v > RACE_VOLUME_REVIEW_MM3 for v in ball_pairs)
    cage_clashes = sum(v > CAGE_PENETRATION_NUMERIC_EPS_MM3 for v in cage_pairs)
    return {'ballsWithMissingDualRaceProximity': gap_balls, 'significantBallRacePairs': race_clashes,
            'significantBallBallPairs': ball_clashes, 'cageBallIntersections': cage_clashes,
            'exploratoryPass': not (gap_balls or race_clashes or ball_clashes or cage_clashes)}


def pose_grid(data):
    if not isinstance(data, dict) or data.get('schema') != GRID_SCHEMA or not isinstance(data.get('poses'), list):
        raise ValueError('Expected exact P2.34M prescribed pose-grid schema')
    poses = data['poses']
    if len(poses) < 9 or len(poses) > MAX_POSES:
        raise ValueError('Require 3+ bends x 3+ phases, at most 36 poses')
    bends = {}
    seen = set()
    for item in poses:
        if not isinstance(item, dict):
            raise ValueError('Invalid pose')
        b, sp, cp = (finite(item.get(k), k) for k in ('bendDeg', 'shaftSpinDeg', 'cupSpinDeg'))
        if abs(b) > 15 or min(sp, cp) < 0 or max(sp, cp) > 360:
            raise ValueError('Pose outside intended diagnostic range')
        if (b, sp, cp) in seen:
            raise ValueError('Duplicate bend/phase pose')
        seen.add((b, sp, cp))
        bends.setdefault(b, []).append((sp, cp))
    if len(bends) < 3:
        raise ValueError('Need at least 3 distinct bend angles')
    reference = None
    for angle, phases in bends.items():
        if len(phases) < 3 or phases != sorted(phases):
            raise ValueError('Phases for each bend must be ordered by increasing input phase')
        if reference is None:
            reference = phases
        if phases != reference:
            raise ValueError('Use identical phase pairs across all bends')
        for (s0, c0), (s1, c1) in zip(phases, phases[1:]):
            ds, dc = phase_delta(s0, s1), phase_delta(c0, c1)
            if not (0 < ds <= 5 and 0 < dc <= 5 and abs(dc/ds - 1) <= .01):
                raise ValueError('Input/cup phase cadence fails exploratory path limits')
    if list(bends) != sorted(bends):
        raise ValueError('Bend groups must appear in ascending order')
    return [(b, s, c) for b, phases in bends.items() for s, c in phases]


def trial_grid(step_mm=.2, radius_mm=.2, tilt_deg=.5):
    xyz = offsets(step_mm, radius_mm)
    orientation = candidate_axes(tilt_deg)
    if len(xyz) * len(orientation) > MAX_CANDIDATES_PER_POSE:
        raise ValueError('Too many native B-Rep trial candidates per pose')
    # Zero position and zero correction first.
    return [(o, d) for o in orientation for d in xyz]


def measure_pose(parts, pose, trials):
    bend, shaft_phase, cup_phase = pose
    if len(parts) != 84 or not {SHAFT, CUP, CAGE, *BALLS} <= set(parts):
        raise ValueError('Original 84 source IDs missing')
    candidates = []
    baseline = None
    for orientation, move in trials:
        race, ball, cage = measure_group(parts, bend, shaft_phase, cup_phase, orientation, move)
        label = validate_contact(race, ball, cage)
        item = {'cageRotationCorrectionXYZDeg': list(orientation),
                'cageFrameTranslationMm': list(move),
                'worldTranslationMm': list(translate_in_cage_frame(move, bend, orientation)),
                'classification': label}
        if not any(orientation) and not any(move):
            baseline = {'classification': label, 'ballRaces': race,
                        'ballBallOverlapMm3': ball, 'ballCageOverlapMm3': cage}
        if label['exploratoryPass']:
            item['ballRaceNativeWitnesses'] = race
            item['ballBallNativeOverlapMm3'] = ball
            item['cageBallNativeOverlapMm3'] = cage
            candidates.append(item)
    if baseline is None:
        raise AssertionError('Zero-offset neutral candidate missing')
    return {'pose': {'bendDeg': bend, 'shaftSpinDeg': shaft_phase, 'cupSpinDeg': cup_phase},
            'testedCandidates': len(trials), 'qualifyingCandidates': candidates,
            'qualificationCount': len(candidates), 'baseline': baseline,
            'nativeBooleanChecks': len(trials)*33,
            'nativeDistanceChecks': len(trials)*12}


def trace_one_bend(rows, max_shift_mm=.25, max_correction_step_deg=.75):
    """DP across *all* qualifying poses at fixed bend; no greedy pruning."""
    if len(rows) < 3:
        raise ValueError('At least three phase samples required')
    shift = finite(max_shift_mm, 'shift limit')
    angular = finite(max_correction_step_deg, 'rotation limit')
    if shift <= 0 or angular <= 0:
        raise ValueError('Invalid path bounds')
    first = rows[0]['qualifyingCandidates']
    prior = {i: (0., [i]) for i in range(len(first))}
    reach = [len(prior)]
    for current_idx in range(1, len(rows)):
        before, current = rows[current_idx-1]['qualifyingCandidates'], rows[current_idx]['qualifyingCandidates']
        successors = {}
        for j, b in enumerate(current):
            options = []
            for i, (cost, path) in prior.items():
                a = before[i]
                travel = math.dist(a['worldTranslationMm'], b['worldTranslationMm'])
                spin = math.dist(a['cageRotationCorrectionXYZDeg'], b['cageRotationCorrectionXYZDeg'])
                if travel <= shift + 1e-10 and spin <= angular + 1e-10:
                    options.append((cost + travel + .01 * spin, path + [j]))
            if options:
                successors[j] = min(options, key=lambda x: (round(x[0], 10), x[1]))
        prior = successors
        reach.append(len(prior))
    winner = min(prior.values(), key=lambda x: (round(x[0], 10), x[1])) if prior else None
    samples = []
    if winner:
        for idx, candidate_index in enumerate(winner[1]):
            c = rows[idx]['qualifyingCandidates'][candidate_index]
            samples.append({'pose': rows[idx]['pose'], 'candidateIndex': candidate_index,
                            'cageRotationCorrectionXYZDeg': c['cageRotationCorrectionXYZDeg'],
                            'worldTranslationMm': c['worldTranslationMm']})
    return {'bendDeg': rows[0]['pose']['bendDeg'], 'reachableStatesPerPhase': reach,
            'sampledPathExists': winner is not None, 'sampledPath': samples}


def evaluate(paths, bend_shift_mm=.5, bend_orientation_step_deg=6.0):
    """Cross-bend *chosen-path* diagnostic; not a joint 2-D path solution."""
    result = []
    for a, b in zip(paths, paths[1:]):
        if not a['sampledPathExists'] or not b['sampledPathExists']:
            result.append({'bendPair': [a['bendDeg'], b['bendDeg']], 'selectedPathCrossBendPass': False,
                           'reason': 'A bend lacks a sampled path'})
            continue
        checks = []
        for x, y in zip(a['sampledPath'], b['sampledPath']):
            shift = math.dist(x['worldTranslationMm'], y['worldTranslationMm'])
            orient = abs(y['pose']['bendDeg']-x['pose']['bendDeg'])/2 + math.dist(
                x['cageRotationCorrectionXYZDeg'], y['cageRotationCorrectionXYZDeg'])
            checks.append({'inputPhaseDeg': x['pose']['shaftSpinDeg'],
                           'translationDifferenceMm': shift, 'conservativeOrientationDifferenceDeg': orient,
                           'screenPass': shift <= bend_shift_mm and orient <= bend_orientation_step_deg})
        result.append({'bendPair': [a['bendDeg'], b['bendDeg']],
                       'selectedPathCrossBendPass': all(c['screenPass'] for c in checks),
                       'selectedPairChecks': checks})
    return result


def run(source_dir, manifest_path, out_path, step=.2, radius=.2, tilt=.5):
    output = Path(out_path)
    if output.exists():
        raise FileExistsError('Refusing to overwrite original CAD measurement evidence')
    from p2_34f_repo_native_contact_guard import source, PINS
    raw = Path(manifest_path).read_bytes()
    poses = pose_grid(json.loads(raw))
    trials = trial_grid(step, radius, tilt)
    originals = source(Path(source_dir))  # SHA-256 verifies STEP, owner name-map + audit.
    measured = [measure_pose(originals, pose, trials) for pose in poses]
    groups = {}
    for record in measured:
        groups.setdefault(record['pose']['bendDeg'], []).append(record)
    paths = [trace_one_bend(group) for group in groups.values()]
    cross = evaluate(paths)
    result = {'schema': SCHEMA, 'original84StepSHA256': PIN,
              'original84SourceFileSHA256': PINS,
              'manifestSHA256': hashlib.sha256(raw).hexdigest(),
              'original84SolidCount': 84, 'originalCADModified': False,
              'poseCount': len(measured), 'perPoseTrialCount': len(trials),
              'nativeBooleanChecks': sum(x['nativeBooleanChecks'] for x in measured),
              'nativeDistanceChecks': sum(x['nativeDistanceChecks'] for x in measured),
              'orientationSampling':'axis_aligned_xyz_corrections_about_native_pivot_after_half_bend',
              'perPose': measured, 'perBendSampledPaths': paths,
              'crossBendSelectedPathDiagnostic': cross,
              'allBendTracesFound': all(x['sampledPathExists'] for x in paths),
              'allChosenPathsCrossBendScreen': all(x['selectedPathCrossBendPass'] for x in cross),
              'fullConjugateTrackDesignCertified': False,
              'fullOrientationSO3SpaceSearched': False,
              'interSampleNativeContactProven': False, 'constantAngularVelocityCertified': False,
              'loadedTorqueTransferCertified': False, 'mechanicalG2Certified': False,
              'status': 'MULTI_BEND_SAMPLED_NATIVE_CAGE_ORIENTATION_DIAGNOSTIC_G2_HOLD'}
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, indent=2, allow_nan=False)+'\n', encoding='utf-8')
    return result


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--p234e-native', type=Path, required=True)
    p.add_argument('--pose-grid', type=Path, required=True)
    p.add_argument('--out', type=Path, required=True)
    p.add_argument('--grid-step-mm', type=float, default=.2)
    p.add_argument('--grid-radius-mm', type=float, default=.2)
    p.add_argument('--cage-tilt-deg', type=float, default=.5)
    args = p.parse_args()
    r = run(args.p234e_native, args.pose_grid, args.out,
            args.grid_step_mm, args.grid_radius_mm, args.cage_tilt_deg)
    print(json.dumps({'status': r['status'], 'poseCount': r['poseCount'],
                      'allBendTracesFound': r['allBendTracesFound']}))
