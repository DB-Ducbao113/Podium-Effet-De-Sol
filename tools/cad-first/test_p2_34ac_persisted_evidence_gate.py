"""P2.34AC persisted M/N evidence tests; metadata fixtures, never owner CAD."""
import hashlib,json,tempfile,unittest
from pathlib import Path
import p2_34ac_persisted_evidence_gate as ac

def fixture(folder):
    folder=Path(folder);folder.mkdir(parents=True,exist_ok=True)
    m=folder/'M.json';m.write_text('{"schema":"test"}\n')
    step=folder/ac.STEP_NAME;step.write_bytes(b'fake STEP, only for metadata test')
    pins={'P234E_source84_revised_six_ball_clearance.step':ac.SOURCE_SHA,
          'P234E_source84_name_index.json':'1'*64,
          'P234E_source84_ball_contact_audit.json':'2'*64}
    audit={'schema':ac.N_SCHEMA,'nativeSourceSHA256':pins,
           'parentP234MReportSHA256':ac.digest(m.read_bytes()),
           'outputCandidateSHA256':ac.digest(step.read_bytes()),
           'sourcePartCount':84,'changedParts':[ac.SHAFT,ac.CUP],
           'original84Retained':True,'sourceGeometryUnchanged':True,
           'cutterIsDiscreteSphereUnionNotMachinedSmoothGroove':True,
           'postCutNativeCollisionScreenCompleted':False,
           'mechanicalG2Certified':False,'constantVelocityCertified':False,
           'loadedTorqueCertified':False}
    (folder/ac.AUDIT_NAME).write_text(json.dumps(audit))
    return m,step,pins,audit

class TestPersistedEvidence(unittest.TestCase):
    def test_valid_n_source_audit(self):
        with tempfile.TemporaryDirectory() as d:
            m,_,pins,audit=fixture(d)
            self.assertEqual(len(ac.check_n(audit,d,m,pins)['p234nAuditSHA256']),64)
    def test_candidate_mutation_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            m,step,pins,audit=fixture(d);step.write_bytes(b'different STEP')
            with self.assertRaisesRegex(ValueError,'STEP SHA'):ac.check_n(audit,d,m,pins)
    def test_m_mutation_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            m,_,pins,audit=fixture(d);m.write_bytes(b'tamper')
            with self.assertRaisesRegex(ValueError,'parent report'):ac.check_n(audit,d,m,pins)
    def test_audit_mutation_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            m,_,pins,audit=fixture(d)
            (Path(d)/ac.AUDIT_NAME).write_text('{"wrong":true}')
            with self.assertRaisesRegex(ValueError,'differs'):ac.check_n(audit,d,m,pins)
    def test_missing_n_audit_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            m,_,pins,audit=fixture(d)
            (Path(d)/ac.AUDIT_NAME).unlink()
            with self.assertRaises(ValueError):ac.check_n(audit,d,m,pins)
    def test_empty_step_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            m,step,pins,audit=fixture(d);step.write_bytes(b'')
            with self.assertRaisesRegex(ValueError,'empty'):ac.check_n(audit,d,m,pins)
    def test_untrusted_flags(self):
        with tempfile.TemporaryDirectory() as d:
            m,_,pins,audit=fixture(d);audit['mechanicalG2Certified']=True
            (Path(d)/ac.AUDIT_NAME).write_text(json.dumps(audit))
            with self.assertRaisesRegex(ValueError,'certificate'):ac.check_n(audit,d,m,pins)
    def test_scope_changed(self):
        with tempfile.TemporaryDirectory() as d:
            m,_,pins,audit=fixture(d);audit['changedParts']=[ac.CUP,ac.SHAFT]
            (Path(d)/ac.AUDIT_NAME).write_text(json.dumps(audit))
            with self.assertRaisesRegex(ValueError,'scope'):ac.check_n(audit,d,m,pins)
    def test_symlink_audit_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            m,_,pins,audit=fixture(d);auditfile=Path(d)/ac.AUDIT_NAME
            real=Path(d)/'real.json';auditfile.rename(real);auditfile.symlink_to(real)
            with self.assertRaisesRegex(ValueError,'symlink'):ac.check_n(audit,d,m,pins)
    def test_returned_m_diverges(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'m.json';p.write_text('{"foo":1}')
            with self.assertRaisesRegex(ValueError,'differs'):ac.persisted_json(p,{'foo':2})
    def test_m_uses_actual_report(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'m.json'
            r={'schema':ac.M_SCHEMA,'original84StepSHA256':ac.SOURCE_SHA,
               'manifestSHA256':'gridsha','original84SolidCount':84,'originalCADModified':False,
               'mechanicalG2Certified':False,'poseCount':9,'perPose':[{}]*9,
               'allBendTracesFound':False,'allChosenPathsCrossBendScreen':False}
            p.write_text(json.dumps(r))
            self.assertEqual(ac.check_m(r,p,'gridsha')['p234mSHA256'],ac.digest(p.read_bytes()))
    def test_invalid_json(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'bad.json';p.write_text('not json')
            with self.assertRaisesRegex(ValueError,'Malformed'):ac.persisted_json(p)

if __name__=='__main__':unittest.main(verbosity=2)
