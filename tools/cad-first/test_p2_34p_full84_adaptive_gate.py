"""P2.34P 20 source-independent contract tests; no owner STEP or native OCC."""
import math,sys,tempfile,types,unittest
from pathlib import Path
from unittest.mock import patch
# Running pure contracts without installed CAD: shim prior-module entry points.
# Repo production run imports actual P2.34O/P2.34N dependencies instead.
o=types.ModuleType('p2_34o_native_postcut_gate')
o.AUDIT_FILE='P234N_prototype_native_audit.json'
o.SHA_FILE='P234N_source84_track_cut_PROTOTYPE.step'
o.SOURCE_SHA='9bd7ec6a60d5c4c9f1f3e421cb730fc252de026aae21dcf570584e5dda0ec63e'
o.SHAFT='P217_REAR_DRIVE_HALF_SHAFT_UNSPLINED'
o.CUP='P217_REAR_CV_HOUSING_PROTOTYPE'
o.BALLS=tuple(f'P234C_REAR_CV_TORQUE_BALL_{i:02d}' for i in range(1,7))
o.finite=lambda x,name: (_ for _ in ()).throw(ValueError(name)) if isinstance(x,bool) or not isinstance(x,(int,float)) or not math.isfinite(x) else float(x)
for n in ('establish_identity','validate_audit','verify_subtractive_geometry'):
    setattr(o,n,lambda *a: (_ for _ in ()).throw(RuntimeError('Native integration required')))
with patch.dict(sys.modules,{'p2_34o_native_postcut_gate':o,
                             'p2_34n_track_candidate':types.SimpleNamespace(validated_paths=lambda *a:None)}):
    import p2_34p_full84_adaptive_gate as p

class Box:
    xmin=ymin=zmin=-1
    xmax=ymax=zmax=1
class Fake:
    def __init__(self,volume=0.,separate=False,valid=True):
        self.volume=volume;self.separate=separate;self.valid=valid
    def BoundingBox(self):
        if self.separate:return type('B',(),dict(xmin=10,xmax=11,ymin=10,ymax=11,zmin=10,zmax=11))()
        return Box()
    def intersect(self,other):
        if not self.valid:raise RuntimeError('Boolean failure')
        return type('X',(),{'Volume':lambda x:self.volume})()
    def rotate(self,*args):return self
    def translate(self,*args):return self
def pose(bend,phase):
    return (dict(bendDeg=bend,shaftSpinDeg=phase,cupSpinDeg=phase),[0,0,0],[0,0,0])

class TestP234P(unittest.TestCase):
    def test_full_pair_count(self):
        _,x=p.scan_pairs({str(i):Fake() for i in range(84)})
        self.assertEqual((x['unorderedPairs'],x['exactBooleans']),(3486,3486))
    def test_aabb_skips(self):
        _,x=p.scan_pairs({str(i):Fake(separate=i==0) for i in range(84)})
        self.assertEqual(x['aabbSeparated'],83)
    def test_missing_part(self):
        with self.assertRaises(ValueError):p.scan_pairs({str(i):Fake() for i in range(83)})
    def test_new_collision(self):
        self.assertEqual(p.compare_pairs({}, {('a','b'):.08})['newOrIncreasedOverlapCount'],1)
    def test_old_collision_not_new(self):
        self.assertTrue(p.compare_pairs({('a','b'):.2},{('a','b'):.21})['pairwiseScreenPass'])
    def test_small_overlap_not_certification(self):
        self.assertTrue(p.compare_pairs({}, {('a','b'):.01})['pairwiseScreenPass'])
    def test_nan(self):
        with self.assertRaises(ValueError):p.compare_pairs({}, {('a','b'):float('nan')})
    def test_negative_boolean(self):
        with self.assertRaises(ValueError):p.boolean_volume(Fake(-1),Fake())
    def test_boolean_failure_not_suppressed(self):
        with self.assertRaises(RuntimeError):p.boolean_volume(Fake(valid=False),Fake())
    def test_phase_midpoint(self):
        self.assertEqual(p.midpoint(pose(10,0),pose(10,2))[0]['shaftSpinDeg'],1)
    def test_bend_midpoint(self):
        self.assertEqual(p.midpoint(pose(-10,2),pose(0,2))[0]['bendDeg'],-5)
    def test_12_midpoints(self):
        s=[pose(b,t) for b in (-10,0,10) for t in (0,2,4)]
        rows=p.scheduled_midpoints(s)
        self.assertEqual(len(rows),12)
        self.assertEqual(sum(x['edgeType']=='phase' for x in rows),6)
    def test_rectangular_required(self):
        s=[pose(b,t) for b in (-10,0,10) for t in (0,2,4)]
        s[-1]=pose(15,4)
        with self.assertRaises(ValueError):p.scheduled_midpoints(s)
    def test_duplicate(self):
        s=[pose(b,t) for b in (-10,0,10) for t in (0,2,4)]
        s[-1]=s[-2]
        with self.assertRaises(ValueError):p.scheduled_midpoints(s)
    def test_accounting(self):
        n={'unorderedPairs':3486,'exactBooleans':100,'aabbSeparated':3386}
        r={'originalCounts':n,'revisedCounts':n,'delta':{'pairwiseScreenPass':True}}
        self.assertEqual(p.summarize([r,r])['actualNativeBooleanCount'],400)
    def test_retains_failed_pose(self):
        n={'unorderedPairs':3486,'exactBooleans':100,'aabbSeparated':3386}
        r={'originalCounts':n,'revisedCounts':n,'delta':{'pairwiseScreenPass':False}}
        self.assertEqual(p.summarize([r])['failingPoseIndices'],[0])
    def test_reject_missing_accounting(self):
        n={'unorderedPairs':3486,'exactBooleans':3,'aabbSeparated':12}
        with self.assertRaises(ValueError):p.summarize([{'originalCounts':n,'revisedCounts':n,'delta':{'pairwiseScreenPass':True}}])
    def test_existing_output_immutable(self):
        with tempfile.TemporaryDirectory() as t:
            q=Path(t)/'result.json';q.write_text('SAFE')
            with self.assertRaises(FileExistsError):p.run(t,t,t,q)
            self.assertEqual(q.read_text(),'SAFE')
    def test_cv_subset_transform(self):
        fake=types.SimpleNamespace(native_rotate=lambda x,*a:x,
             orient=lambda x,*a:x,translate_in_cage_frame=lambda x,*a:x)
        ids=[p.SHAFT,p.CUP,p.CAGE,*p.BALLS]
        with patch.dict(sys.modules,{'p2_34m_cage_orientation_native':fake}):
            self.assertEqual(len(p.pose_transforms({x:Fake() for x in ids},pose(10,2)[0],[0]*3,[0]*3)),9)
    def test_threshold_refusal(self):
        with self.assertRaises(ValueError):p.compare_pairs({}, {},threshold=0)

if __name__=='__main__':unittest.main(verbosity=2)
