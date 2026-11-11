"""P2.34M source-independent contracts. All fake volumes are synthetic, never CAD QA."""
import copy
import json
import math
import sys
import types
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import p2_34m_cage_orientation_native as m


def clean():
    return ([{'shaftGapMm': 0., 'cupGapMm': 0.,
              'shaftOverlapMm3': 0., 'cupOverlapMm3': 0.} for _ in range(6)],
            [0.]*15, [0.]*6)


def candidate(x=0., y=0., z=0., turn=0.):
    return {'worldTranslationMm': [x, y, z], 'cageRotationCorrectionXYZDeg': [turn, 0, 0],
            'classification': {'exploratoryPass': True}}


def row(bend, shaft, cup, candidates):
    return {'pose': {'bendDeg': bend, 'shaftSpinDeg': shaft, 'cupSpinDeg': cup},
            'qualifyingCandidates': candidates}


def grid():
    return {'schema': m.GRID_SCHEMA, 'poses': [
        {'bendDeg': bend, 'shaftSpinDeg': phase, 'cupSpinDeg': phase}
        for bend in (-10, 0, 10) for phase in (0, 2, 4)]}


class CageOrientationContracts(unittest.TestCase):
    def test_default_grid_count_and_baseline(self):
        c = m.trial_grid()
        self.assertEqual(len(c), 49)
        self.assertEqual(c[0], ((0., 0., 0.), (0., 0., 0.)))

    def test_axis_orientations(self):
        a = m.candidate_axes(.5)
        self.assertEqual(len(a), 7)
        self.assertEqual(len(set(a)), 7)
        self.assertEqual(a[1], (-.5, 0, 0))

    def test_invalid_orientation(self):
        for x in (0, -1, 1.6, True, float('nan')):
            with self.subTest(x=x), self.assertRaises(ValueError):m.candidate_axes(x)

    def test_budget(self):
        with self.assertRaisesRegex(ValueError, 'Too many'):m.trial_grid(.2, .6, .5)

    def test_vector_rotation(self):
        a = m.apply_rot_vector((0, 1, 0), 'x', 90)
        self.assertAlmostEqual(a[2], 1)
        b = m.apply_rot_vector((1, 0, 0), 'z', 90)
        self.assertAlmostEqual(b[1], 1)
        c = m.apply_rot_vector((0, 0, 1), 'y', 90)
        self.assertAlmostEqual(c[0], 1)

    def test_rotated_translation(self):
        v = m.translate_in_cage_frame((0, 1, 0), 10, (0, 0, 0))
        self.assertAlmostEqual(v[1], math.cos(math.radians(5)))
        self.assertAlmostEqual(v[2], math.sin(math.radians(5)))

    def test_clean_contact_not_mechanical_certification(self):
        self.assertTrue(m.validate_contact(*clean())['exploratoryPass'])

    def test_missing_race_proximity(self):
        race, balls, cage = clean()
        race[0]['cupGapMm'] = .01
        self.assertEqual(m.validate_contact(race, balls, cage)['ballsWithMissingDualRaceProximity'], 1)

    def test_race_interference(self):
        race, balls, cage = clean()
        race[4]['shaftOverlapMm3'] = .06
        self.assertEqual(m.validate_contact(race, balls, cage)['significantBallRacePairs'], 1)

    def test_ball_ball_collision(self):
        race, balls, cage = clean()
        balls[2] = .06
        self.assertEqual(m.validate_contact(race, balls, cage)['significantBallBallPairs'], 1)

    def test_cage_pocket_collision(self):
        race, balls, cage = clean()
        cage[0] = .001
        self.assertEqual(m.validate_contact(race, balls, cage)['cageBallIntersections'], 1)

    def test_nonfinite_rejected(self):
        race, balls, cage = clean()
        cage[0] = float('nan')
        with self.assertRaises(ValueError):m.validate_contact(race, balls, cage)

    def test_negative_volume_rejected(self):
        race, balls, cage = clean()
        race[0]['cupOverlapMm3'] = -1
        with self.assertRaises(ValueError):m.validate_contact(race, balls, cage)

    def test_ball_pair_count_required(self):
        a, b, c = clean()
        with self.assertRaises(ValueError):m.validate_contact(a, b[:-1], c)

    def test_preset_grid_9(self):
        p = m.pose_grid(grid())
        self.assertEqual(len(p), 9)
        self.assertEqual(p[0], (-10., 0., 0.))

    def test_reject_duplicate_pose(self):
        x = grid();x['poses'][1] = copy.deepcopy(x['poses'][0])
        with self.assertRaises(ValueError):m.pose_grid(x)

    def test_reject_missing_bend(self):
        x = grid();x['poses'] = x['poses'][:6]
        with self.assertRaises(ValueError):m.pose_grid(x)

    def test_reject_nonmatching_phase_grid(self):
        x = grid();x['poses'][-1]['cupSpinDeg'] = 4.5
        with self.assertRaises(ValueError):m.pose_grid(x)

    def test_reject_reversed_phase(self):
        x = grid();x['poses'][0], x['poses'][1] = x['poses'][1], x['poses'][0]
        with self.assertRaises(ValueError):m.pose_grid(x)

    def test_reject_phase_ratio(self):
        x = grid()
        for p in x['poses']:
            p['cupSpinDeg'] = p['shaftSpinDeg']*.8
        with self.assertRaises(ValueError):m.pose_grid(x)

    def test_reject_phase_step(self):
        x = grid()
        for p in x['poses']:
            p['shaftSpinDeg'] *= 4;p['cupSpinDeg'] *= 4
        with self.assertRaises(ValueError):m.pose_grid(x)

    def test_non_greedy_path(self):
        rows = [row(10,0,0,[candidate(0),candidate(.4)]),
                row(10,2,2,[candidate(.4)]),row(10,4,4,[candidate(.4)])]
        got = m.trace_one_bend(rows)
        self.assertTrue(got['sampledPathExists'])
        self.assertEqual(got['sampledPath'][0]['candidateIndex'],1)

    def test_no_path_when_jump(self):
        rows = [row(10,0,0,[candidate(0)]),row(10,2,2,[candidate(.4)]),
                row(10,4,4,[candidate(0)])]
        self.assertFalse(m.trace_one_bend(rows)['sampledPathExists'])

    def test_no_path_when_orientation_jumps(self):
        rows = [row(10,0,0,[candidate()]),row(10,2,2,[candidate(turn=1)]),
                row(10,4,4,[candidate(turn=1)])]
        self.assertFalse(m.trace_one_bend(rows)['sampledPathExists'])

    def test_zero_candidate_blocks(self):
        rows = [row(10,0,0,[candidate()]),row(10,2,2,[]),row(10,4,4,[candidate()])]
        self.assertFalse(m.trace_one_bend(rows)['sampledPathExists'])

    def test_cross_bend_continuity(self):
        a = m.trace_one_bend([row(-10,p,p,[candidate()]) for p in (0,2,4)])
        b = m.trace_one_bend([row(0,p,p,[candidate()]) for p in (0,2,4)])
        c = m.evaluate([a,b])
        self.assertTrue(c[0]['selectedPathCrossBendPass'])

    def test_cross_bend_orientation_limit(self):
        a = m.trace_one_bend([row(-15,p,p,[candidate()]) for p in (0,2,4)])
        b = m.trace_one_bend([row(15,p,p,[candidate()]) for p in (0,2,4)])
        self.assertFalse(m.evaluate([a,b])[0]['selectedPathCrossBendPass'])

    def test_grid_schema_rejected(self):
        x=grid();x['schema']='p234J'
        with self.assertRaises(ValueError):m.pose_grid(x)

    def test_mock_native_candidate_uses_all_33_pair_checks(self):
        # Fake source objects only verify geometry API orchestration/accounting.
        # They do NOT assert OCC shape intersection or clearance correctness.
        calls = {'overlaps': 0, 'distances': 0, 'rotations': 0}
        class FakeIntersection:
            def Volume(self): return 0.
        class FakeShape:
            def rotate(self, *args):
                calls['rotations'] += 1
                return FakeShape()
            def translate(self, *args): return FakeShape()
            def intersect(self, other):
                calls['overlaps'] += 1
                return FakeIntersection()
        def minimum(a, b):
            calls['distances'] += 1
            return 0.
        native = types.SimpleNamespace(exact_minimum=minimum)
        names = [m.SHAFT, m.CUP, m.CAGE, *m.BALLS]
        with patch.dict(sys.modules, {'p2_34g_coupled_phase_gate': native}):
            a, b, c = m.measure_group({name: FakeShape() for name in names},
                                       10., .6241, 1.0254, (0., .5, 0.), (.2, 0., 0.))
        self.assertEqual((len(a), len(b), len(c)), (6, 15, 6))
        self.assertEqual(calls['overlaps'], 33)
        self.assertEqual(calls['distances'], 12)
        self.assertTrue(m.validate_contact(a, b, c)['exploratoryPass'])

    def test_mock_native_pose_49_candidates_and_accounting(self):
        class FakeVolume:
            def Volume(self): return 0.
        class FakeShape:
            def rotate(self, *args): return self
            def translate(self, *args): return self
            def intersect(self, other): return FakeVolume()
        native = types.SimpleNamespace(exact_minimum=lambda a,b: 0.)
        all_source = {name: FakeShape() for name in [m.SHAFT,m.CUP,m.CAGE,*m.BALLS]}
        for i in range(84 - len(all_source)):
            all_source[f'OTHER_SOURCE_{i}'] = FakeShape()
        with patch.dict(sys.modules, {'p2_34g_coupled_phase_gate': native}):
            result = m.measure_pose(all_source, (10.,.6241,1.0254), m.trial_grid())
        self.assertEqual(result['testedCandidates'],49)
        self.assertEqual(result['nativeBooleanChecks'],49*33)
        self.assertEqual(result['nativeDistanceChecks'],49*12)
        self.assertEqual(result['qualificationCount'],49)
        self.assertEqual(result['qualifyingCandidates'][0]['worldTranslationMm'], [0.,0.,0.])

    def test_reject_no_overwrite_before_source_loader(self):
        with tempfile.TemporaryDirectory() as d:
            path=Path(d)/'report.json';path.write_text('original')
            with self.assertRaises(FileExistsError):m.run(d,'irrelevant',path)
            self.assertEqual(path.read_text(),'original')


if __name__ == '__main__':
    unittest.main(verbosity=2)
