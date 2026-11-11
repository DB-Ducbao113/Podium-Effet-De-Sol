"""Contract tests with synthetic fixtures only; NOT native B-Rep QA."""
import math,unittest
from p2_34h_phase_path_gate import check_pose,assess,delta
def pose(a,b,gap=0.,overlap=0.,bend=10):
    return {"bendDeg":bend,"shaftSpinDeg":a,"cupSpinDeg":b,
      "ballWitnesses":[{"ball":i,"shaftNativeMinDistanceMm":gap,
      "cupNativeMinDistanceMm":gap,"shaftNativeIntersectionMm3":overlap,
      "cupNativeIntersectionMm3":0.} for i in range(1,7)]}
class PhasePathContract(unittest.TestCase):
    def test_penetration_not_contact(self):
        self.assertFalse(check_pose(pose(0,0,overlap=.07))["sampledPoseCandidate"])
    def test_gap_not_contact(self):
        self.assertFalse(check_pose(pose(0,0,gap=.001))["sampledPoseCandidate"])
    def test_synthetic_pass_not_certification(self):
        r=assess([pose(0,0),pose(2,2),pose(4,4)])
        self.assertTrue(r["sampledPathDiagnosticPass"])
        self.assertFalse(r["continuousPathCertified"])
        self.assertFalse(r["torqueTransferCertified"])
        self.assertFalse(r["mechanicalG2Certified"])
    def test_ratio_fail(self):
        self.assertFalse(assess([pose(0,0),pose(2,1),pose(4,2)])["sampledPhaseIncrementGate"])
    def test_sparse_fail(self):
        self.assertFalse(assess([pose(0,0),pose(6,6),pose(12,12)])["sampleCadenceGate"])
    def test_wrap(self):
        self.assertAlmostEqual(delta(1,359),2)
        self.assertTrue(assess([pose(357,357),pose(359,359),pose(1,1)])["sampledPhaseIncrementGate"])
    def test_bends(self):
        with self.assertRaisesRegex(ValueError,"Mixed bend"):
            assess([pose(0,0),pose(1,1,bend=-10),pose(2,2)])
    def test_duplicate(self):
        p=pose(0,0);p["ballWitnesses"][1]["ball"]=1
        with self.assertRaisesRegex(ValueError,"duplicate"):check_pose(p)
    def test_nan(self):
        p=pose(0,0);p["ballWitnesses"][0]["cupNativeIntersectionMm3"]=math.nan
        with self.assertRaisesRegex(ValueError,"finite"):check_pose(p)
    def test_reverse_or_ambiguous(self):
        with self.assertRaisesRegex(ValueError,"Nonmonotonic"):
            assess([pose(0,0),pose(1,-1),pose(2,-2)])
        with self.assertRaisesRegex(ValueError,"Ambiguous"):
            assess([pose(0,0),pose(180,180),pose(182,182)])
if __name__=="__main__":unittest.main(verbosity=2)
