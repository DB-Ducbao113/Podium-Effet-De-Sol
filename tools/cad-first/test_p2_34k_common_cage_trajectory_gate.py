"""Synthetic contract tests for P2.34K, not native CAD validation."""
import copy,math,tempfile,unittest
from pathlib import Path
from p2_34k_common_cage_trajectory_gate import (
    J_SCHEMA,SOURCE_SHA,analyze,parse_report,phase_delta,transformed_translation,run)

def report(shaft,cup,bend=10,offset=(0,0,0),good=True):
    return {"schema":J_SCHEMA,"sourceSTEPsha256":SOURCE_SHA,"partCount":84,
        "originalCADModified":False,"mechanicalG2Certified":False,
        "pose":{"bendDeg":bend,"shaftSpinDeg":shaft,"cupSpinDeg":cup},
        "candidateCountMeetingExploratoryScreen":int(good),
        "bestCandidate":{"sharedCageLocalTranslationMm":list(offset),
          "classification":{"exploratoryCandidate":good}}}
def trace():
    return [report(0,0),report(2,2),report(4,4)]
class TestP234K(unittest.TestCase):
    def test_nominal_screen_not_certificate(self):
        a=analyze(trace())
        self.assertTrue(a["exploratoryTracePass"])
        self.assertFalse(a["continuousConstantVelocityCertified"])
        self.assertFalse(a["mechanicalG2Certified"])
    def test_native_failed_pose_holds(self):
        a=trace();a[1]=report(2,2,good=False)
        self.assertFalse(analyze(a)["exploratoryTracePass"])
    def test_missing_report(self):
        with self.assertRaises(ValueError):analyze(trace()[:2])
    def test_sha_tamper(self):
        a=report(0,0);a["sourceSTEPsha256"]="wrong"
        with self.assertRaises(ValueError):parse_report(a)
    def test_wrong_schema(self):
        a=report(0,0);a["schema"]="P2.34I"
        with self.assertRaises(ValueError):parse_report(a)
    def test_gap_in_phase(self):
        self.assertFalse(analyze([report(0,0),report(7,7),report(14,14)])["sampledContinuityScreenPass"])
    def test_ratio_change(self):
        self.assertFalse(analyze([report(0,0),report(2,1),report(4,2)])["sampledContinuityScreenPass"])
    def test_translation_jump(self):
        self.assertFalse(analyze([report(0,0),report(2,2,offset=(.4,0,0)),report(4,4)])["sampledContinuityScreenPass"])
    def test_mixed_bend_rejected(self):
        with self.assertRaisesRegex(ValueError,"Mixed bend"):analyze([report(0,0),report(2,2,bend=0),report(4,4)])
    def test_duplicate_pose_rejected(self):
        with self.assertRaisesRegex(ValueError,"Duplicate phase"):analyze([report(0,0),report(2,2),report(2,2)])
    def test_reverse_rejected(self):
        with self.assertRaisesRegex(ValueError,"increase"):analyze([report(4,4),report(2,2),report(0,0)])
    def test_phase_wrap(self):
        self.assertAlmostEqual(phase_delta(359,1),2)
        self.assertTrue(analyze([report(357,357),report(359,359),report(1,1)])["exploratoryTracePass"])
    def test_half_bend_translation_rotation(self):
        x=transformed_translation(parse_report(report(0,0,bend=10,offset=(0,1,0))))
        self.assertAlmostEqual(x[1],math.cos(math.radians(5)),places=10)
        self.assertAlmostEqual(x[2],math.sin(math.radians(5)),places=10)
    def test_nonfinite_rejected(self):
        a=report(0,0);a["bestCandidate"]["sharedCageLocalTranslationMm"][0]=float("nan")
        with self.assertRaises(ValueError):parse_report(a)
    def test_false_mechanical_claim_rejected(self):
        a=report(0,0);a["mechanicalG2Certified"]=True
        with self.assertRaises(ValueError):parse_report(a)
    def test_no_evidence_overwrite(self):
        with tempfile.TemporaryDirectory() as d:
            out=Path(d)/"existing.json";out.write_text("preserve")
            with self.assertRaises(FileExistsError):run([],out)
            self.assertEqual(out.read_text(),"preserve")
if __name__=="__main__":unittest.main(verbosity=2)
