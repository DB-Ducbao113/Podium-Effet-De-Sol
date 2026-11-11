"""P2.34I source-independent contracts, never original B-Rep acceptance tests."""
import math,unittest
from p2_34i_native_ball_center_search import offsets,finite,convert_offset,classify,rank

def sample(sg=0,cg=0,so=0,co=0,ko=0):
    return dict(shaftGapMm=sg,cupGapMm=cg,cageGapMm=0,
                shaftOverlapMm3=so,cupOverlapMm3=co,cageOverlapMm3=ko)
class TestP234I(unittest.TestCase):
    def test_grid_zero_and_determinism(self):
        a=offsets(.2,.4)
        self.assertEqual(a[0],(0.,0.,0.))
        self.assertEqual(a,offsets(.2,.4))
    def test_grid_spherical(self):
        self.assertNotIn((.4,.4,.4),offsets(.2,.4))
        self.assertTrue(all(math.dist((0,0,0),x)<=.4+1e-9 for x in offsets(.2,.4)))
    def test_invalid_grid(self):
        for a,b in ((0,.4),(-1,.4),(.1,-.2),(.01,2),(3,.4)):
            with self.subTest(a=a,b=b),self.assertRaises(ValueError):offsets(a,b)
    def test_nonfinite(self):
        for x in (True,False,math.nan,math.inf,'1'):
            with self.subTest(x=x),self.assertRaises(ValueError):finite(x,'x')
    def test_local_coordinates(self):
        self.assertEqual(convert_offset((.2,-.1,.4),((1,0,0),(0,1,0),(0,0,1))),(.2,-.1,.4))
    def test_clean_two_sided_nearby(self):
        self.assertTrue(classify(sample())['screenCandidate'])
    def test_gap_rejected(self):
        self.assertFalse(classify(sample(sg=.001))['screenCandidate'])
    def test_shaft_overlap_rejected(self):
        self.assertFalse(classify(sample(so=.051))['screenCandidate'])
    def test_cup_overlap_rejected(self):
        self.assertFalse(classify(sample(co=.051))['screenCandidate'])
    def test_cage_overlap_rejected_even_when_small(self):
        self.assertFalse(classify(sample(ko=.0001))['screenCandidate'])
    def test_subthreshold_overlap_still_unloaded(self):
        c=classify(sample(so=.01))
        self.assertTrue(c['screenCandidate'])
        self.assertTrue(c['unloadedNativeContactOnly'])
    def test_rank_penetration(self):
        self.assertLess(rank(sample(),(0,0,0)),rank(sample(so=.1),(0,0,0)))
    def test_rank_gap(self):
        self.assertLess(rank(sample(),(0,0,0)),rank(sample(sg=.2),(0,0,0)))
if __name__=='__main__':unittest.main(verbosity=2)
