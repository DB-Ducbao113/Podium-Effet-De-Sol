"""Source-independent synthetic logic contracts; not mechanical acceptance."""
import math,unittest
from p2_34j_common_cage_rigid_search import classification,score,verify_pose

def fixture(gap=0,shaft=0,cup=0):
    return ([dict(shaftGapMm=gap,cupGapMm=gap,shaftOverlapMm3=shaft,cupOverlapMm3=cup) for _ in range(6)],[0.]*15,[0.]*6)
class TestCommonCage(unittest.TestCase):
    def test_neutral_logic(self):self.assertTrue(classification(*fixture())['exploratoryCandidate'])
    def test_missing_gap(self):self.assertEqual(classification(*fixture(gap=.001))['ballsWithMissingRaceProximity'],6)
    def test_shaft_overlap(self):self.assertFalse(classification(*fixture(shaft=.051))['exploratoryCandidate'])
    def test_cup_overlap(self):self.assertFalse(classification(*fixture(cup=.051))['exploratoryCandidate'])
    def test_ball_ball_overlap(self):
        a,b,c=fixture();b[3]=.2
        self.assertEqual(classification(a,b,c)['significantBallBallPairs'],1)
    def test_cage_overlap_even_below_threshold(self):
        a,b,c=fixture();c[0]=.001
        self.assertTrue(classification(a,b,c)['anyCageBallIntersection'])
        self.assertFalse(classification(a,b,c)['exploratoryCandidate'])
    def test_negative_measurement(self):
        a,b,c=fixture();a[0]['cupGapMm']=-1
        with self.assertRaises(ValueError):classification(a,b,c)
    def test_nan(self):
        a,b,c=fixture();c[3]=math.nan
        with self.assertRaises(ValueError):classification(a,b,c)
    def test_six_required(self):
        a,b,c=fixture()
        with self.assertRaises(ValueError):classification(a[:-1],b,c)
    def test_ranking_qualifying(self):
        a=classification(*fixture());b=classification(*fixture(gap=.1))
        self.assertLess(score(a,(0,0,0)),score(b,(0,0,0)))
    def test_bounds(self):
        self.assertEqual(verify_pose(-10,.6241,1.0254),(-10.,.6241,1.0254))
        with self.assertRaises(ValueError):verify_pose(30,0,0)
    def test_boolean_rejected(self):
        with self.assertRaises(ValueError):verify_pose(True,0,0)
if __name__=='__main__':unittest.main(verbosity=2)
