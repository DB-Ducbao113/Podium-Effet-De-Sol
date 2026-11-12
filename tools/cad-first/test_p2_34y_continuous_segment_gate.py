import hashlib,math,tempfile,unittest
from pathlib import Path
import cadquery as cq
import p2_34y_continuous_segment_gate as y

def sphere(x,r=.2):
    return cq.Solid.makeSphere(r,cq.Vector(x,0,0),angleDegrees1=-90,angleDegrees2=90)
def obstacles(x):
    return {name:sphere(x) for name in ('shaft','cup','cage')}

class Tests(unittest.TestCase):
    def test_undisturbed_translation_certified(self):
        r=y.edge_clearance(sphere(0),obstacles(5),(0,0,0),(1,0,0))
        self.assertEqual(r['classification'],'CLEAR')
        self.assertTrue(r['provenSeparatedAlongThisStraightTranslation'])
    def test_middle_collision_blocked(self):
        r=y.edge_clearance(sphere(0),obstacles(.5),(0,0,0),(1,0,0))
        self.assertEqual(r['classification'],'BLOCKED')
    def test_touching_midpoint_unknown(self):
        r=y.edge_clearance(sphere(0),obstacles(.9),(0,0,0),(1,0,0),max_depth=0)
        self.assertEqual(r['classification'],'UNKNOWN')
    def test_refinement_proves_close_but_clear(self):
        displaced={name:sphere(1.1).translate((0,.5,0)) for name in ('shaft','cup','cage')}
        r=y.edge_clearance(sphere(0),displaced,(0,0,0),(1,0,0),max_depth=6)
        self.assertEqual(r['classification'],'CLEAR')
        self.assertGreater(r['subsegmentsVisited'],1)
    def test_invalid_obstacles(self):
        with self.assertRaises(ValueError):y.edge_clearance(sphere(0),{'cage':sphere(5)},(0,0,0),(1,0,0))
    def test_zero_length(self):
        with self.assertRaises(ValueError):y.edge_clearance(sphere(0),obstacles(5),(0,0,0),(0,0,0))
    def test_nan(self):
        with self.assertRaises(ValueError):y.point([0,math.nan,0])
    def test_path_validation(self):
        self.assertEqual(y.verified_path_nodes([[0,0,0],[1,0,0]],.75,1)[1],(.75,0,0))
    def test_path_jump_rejected(self):
        with self.assertRaises(ValueError):y.verified_path_nodes([[0,0,0],[2,0,0]],.75,2)
    def test_parent_mismatch(self):
        with self.assertRaises(ValueError):y.verify_parent({},b'x',b'm',b's',[])
    def test_refuse_existing(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'keep.json';p.write_text('KEEP')
            with self.assertRaises(FileExistsError):y.run(d,d,d,d,p)
            self.assertEqual(p.read_text(),'KEEP')
    def test_real_gap(self):
        self.assertAlmostEqual(y.distance(sphere(0),sphere(1)),.6,places=5)

if __name__=='__main__':unittest.main(verbosity=2)
