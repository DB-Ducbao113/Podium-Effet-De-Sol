"""P2.34Q pure numerical QA; no owner-source STEP or machining claims."""
import math,sys,types,unittest
from unittest.mock import patch

# Isolated contracts without the owner-only CAD environment.
n=types.ModuleType('p2_34n_track_candidate')
n.BALLS=tuple('BALL_%02d'%i for i in range(1,7))
n.SOURCE_SHA='9bd7ec6a60d5c4c9f1f3e421cb730fc252de026aae21dcf570584e5dda0ec63e'
n.validated_paths=lambda r:r['samples']
n.ball_center=lambda xyz,pose,tilt,off:(xyz[0]+pose['shaftSpinDeg'],xyz[1],xyz[2])
n.to_race_local=lambda xyz,pose,side:xyz if side=='shaft' else (xyz[0],xyz[1]+pose['cupSpinDeg'],xyz[2])
with patch.dict(sys.modules,{'p2_34n_track_candidate':n}):
    import p2_34q_native_centerline_review as q

class Point:
    x=0.;y=0.;z=0.
class Part:
    def Center(self):return Point()

def report():
    return {'samples':[(dict(bendDeg=b,shaftSpinDeg=s,cupSpinDeg=s),[0,0,0],[0,0,0])
                       for b in (-10,0,10) for s in (0.,.5,1.)]}
class TestNativeCenterlineContracts(unittest.TestCase):
    def test_straight_line(self):
        r=q.triplet_metrics((0,0,0),(1,0,0),(2,0,0))
        self.assertEqual(r['discreteCurvatureInvMm'],0)
        self.assertIsNone(r['threePointRadiusMm'])
    def test_curvature(self):
        r=q.triplet_metrics((1,0,0),(0,1,0),(-1,0,0))
        self.assertAlmostEqual(r['threePointRadiusMm'],1,places=6)
    def test_double_back(self):
        with self.assertRaises(ValueError):q.triplet_metrics((0,0,0),(1,0,0),(0,0,0))
    def test_coincident(self):
        with self.assertRaises(ValueError):q.triplet_metrics((0,0,0),(0,0,0),(1,0,0))
    def test_nonfinite(self):
        with self.assertRaises(ValueError):q.finite(float('nan'),'value')
    def test_all_traces(self):
        rows=q.centerlines({name:Part() for name in n.BALLS}|{f'X{i}':Part() for i in range(78)},report())
        self.assertEqual(len(rows),36)
        self.assertEqual(q.assess(rows)['mechanicalG2Certified'],False)
    def test_missing_source_bodies(self):
        with self.assertRaises(ValueError):q.centerlines({name:Part() for name in n.BALLS},report())
    def test_missing_bend(self):
        r=report();r['samples']=r['samples'][:6]
        with self.assertRaises(ValueError):q.centerlines({name:Part() for name in n.BALLS}|{f'X{i}':Part() for i in range(78)},r)
    def test_large_chord_flag(self):
        lines=[{'bendDeg':0,'ballSourceID':'X','race':'cup','maxChordMm':10.,'maxDiscreteTurnDeg':0.}]*12
        self.assertFalse(q.assess(lines)['sampledCenterlineScreenPass'])
    def test_turn_flag(self):
        lines=[{'bendDeg':0,'ballSourceID':'X','race':'cup','maxChordMm':.1,'maxDiscreteTurnDeg':90.}]*12
        self.assertFalse(q.assess(lines)['sampledCenterlineScreenPass'])
    def test_threshold_bounds(self):
        with self.assertRaises(ValueError):q.assess([],0,20)
    def test_incomplete_traces(self):
        with self.assertRaises(ValueError):q.assess([{}])
    def test_not_a_smoothness_certificate(self):
        lines=[{'bendDeg':0,'ballSourceID':'X','race':'cup','maxChordMm':.1,'maxDiscreteTurnDeg':0.}]*12
        self.assertFalse(q.assess(lines)['continuousC1C2SmoothnessCertified'])
        self.assertFalse(q.assess(lines)['raceWallThicknessMeasured'])
if __name__=='__main__':unittest.main(verbosity=2)
