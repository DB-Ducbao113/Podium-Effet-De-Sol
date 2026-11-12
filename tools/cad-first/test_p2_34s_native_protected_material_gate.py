"""P2.34S: generic CadQuery B-Rep smoke tests, NOT original owner STEP QA."""
import hashlib,math,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
import cadquery as cq
import p2_34s_native_protected_material_gate as s

def reports():
    candidate=b'candidate';m=b'm';a=b'a';mapping={str(i):i for i in range(84)}
    o={'schema':s.O_SCHEMA,'mechanicalG2Certified':False,
       'parentP234MReportSHA256':s.sha(m),'candidateAuditSHA256':s.sha(a),
       'original84SourceSHA256':s.SOURCE_SHA,'candidateSTEPsha256':s.sha(candidate),
       'mappedSourceSolidCount':84,'unalteredSolidMatches':82,
       'identityMapFromGeometricMatchingNotStableSTEPLabels':mapping,
       'allSampledPoseScreensPass':True}
    p={'schema':s.P_SCHEMA,'mechanicalG2Certified':False,
       'parentP234MReportSHA256':s.sha(m),'candidateAuditSHA256':s.sha(a),
       'original84SHA256':s.SOURCE_SHA,'candidateSHA256':s.sha(candidate),
       'solidCount':84,'unchangedSolidCount':82,'identityMap':mapping,
       'originalBaselineCollisionsPreservedNotNecessarilySafe':True,
       'midpointCount':12,'fullPoseCount':21,'fullScreenExploratoryPass':True}
    return o,p,candidate,m,a

class TestP234S(unittest.TestCase):
    def test_native_shaft_protection_retained(self):
        src=cq.Solid.makeCylinder(29,11,cq.Vector(0,0,-245))
        cut=cq.Solid.makeSphere(2,cq.Vector(29,0,-239.5),angleDegrees1=-90,angleDegrees2=90)
        self.assertTrue(s.protected_material(src,src.cut(cut),s.protective_zones(cq)['shaft'])['protectiveEnvelopePass'])
    def test_native_shaft_core_loss_detected(self):
        src=cq.Solid.makeCylinder(29,11,cq.Vector(0,0,-245))
        cut=cq.Solid.makeSphere(3,cq.Vector(24,0,-239.5),angleDegrees1=-90,angleDegrees2=90)
        self.assertFalse(s.protected_material(src,src.cut(cut),s.protective_zones(cq)['shaft'])['protectiveEnvelopePass'])
    def test_native_cup_shell_retained(self):
        base=cq.Vector(0,0,-245)
        src=cq.Solid.makeCylinder(40,11,base).cut(cq.Solid.makeCylinder(35.5,11,base))
        cut=cq.Solid.makeSphere(1,cq.Vector(35.5,0,-239.5),angleDegrees1=-90,angleDegrees2=90)
        self.assertTrue(s.protected_material(src,src.cut(cut),s.protective_zones(cq)['cup'])['protectiveEnvelopePass'])
    def test_native_cup_shell_loss_detected(self):
        base=cq.Vector(0,0,-245)
        src=cq.Solid.makeCylinder(40,11,base).cut(cq.Solid.makeCylinder(35.5,11,base))
        cut=cq.Solid.makeSphere(2,cq.Vector(38.5,0,-239.5),angleDegrees1=-90,angleDegrees2=90)
        self.assertFalse(s.protected_material(src,src.cut(cut),s.protective_zones(cq)['cup'])['protectiveEnvelopePass'])
    def test_empty_native_protection_fails(self):
        src=cq.Solid.makeSphere(1,cq.Vector(100,0,-239.5))
        with self.assertRaises(ValueError):s.protected_material(src,src,s.protective_zones(cq)['shaft'])
    def test_original_hash_guard(self):
        o,p,step,m,a=reports()
        with self.assertRaisesRegex(ValueError,'Original STEP'):
            s.verify_reports(o,p,b'wrong',step,m,a,b'o')
    def test_candidate_hash_guard(self):
        o,p,step,m,a=reports()
        with self.assertRaisesRegex(ValueError,'Candidate STEP'):
            s.verify_reports(o,p,b'wrong',b'changed',m,a,b'o')
    def test_identity_disagreement(self):
        o,p,step,m,a=reports();p['identityMap']={}
        with patch.object(s,'sha',side_effect=lambda raw:s.SOURCE_SHA if raw==b'fixture' else hashlib.sha256(raw).hexdigest()):
            with self.assertRaisesRegex(ValueError,'mappings disagree'):
                s.verify_reports(o,p,b'fixture',step,m,a,b'o')
    def test_status_remains_hold(self):
        result=s.summarize({'shaft':{'protectiveEnvelopePass':True},
                            'cup':{'protectiveEnvelopePass':True}},
                           {'oSampledPoseScreenPass':False,'pFull84RegressionScreenPass':True})
        self.assertFalse(result['exploratoryReviewAllGatesPass'])
        self.assertFalse(result['mechanicalG2Certified'])
        self.assertFalse(result['actualLocalWallThicknessFieldMeasured'])
    def test_missing_cup(self):
        with self.assertRaises(ValueError):s.summarize({'shaft':{'protectiveEnvelopePass':True}}, {})
    def test_nonfinite(self):
        with self.assertRaises(ValueError):s.finite(math.nan,'test')
    def test_invalid_protection(self):
        with self.assertRaises(ValueError):s.protective_zones(cq,shaft_core_radius_mm=29)
    def test_no_overwrite(self):
        with tempfile.TemporaryDirectory() as d:
            target=Path(d)/'review.json';target.write_text('KEEP')
            with self.assertRaises(FileExistsError):s.run(d,d,d,d,d,target)
            self.assertEqual(target.read_text(),'KEEP')
if __name__=='__main__':unittest.main(verbosity=2)
