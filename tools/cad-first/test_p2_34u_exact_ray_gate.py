"""Generic OCC B-Rep tests for P2.34U; not owner-source 84-solid validation."""
import math,sys,types,unittest,tempfile
from pathlib import Path
from unittest.mock import patch
import cadquery as cq
import p2_34u_exact_ray_gate as q
BASE=cq.Vector(0,0,-245)
def shell():
    return cq.Solid.makeCylinder(40,11,BASE).cut(cq.Solid.makeCylinder(35.5,11,BASE))
def sample(shape,angle,z,lo,hi,step):
    n=math.ceil((hi-lo)/step);r=[lo+(hi-lo)*i/n for i in range(n+1)]
    flags=[bool(shape.isInside(cq.Vector(x*math.cos(math.radians(angle)),x*math.sin(math.radians(angle)),z),1e-7)) for x in r]
    out=[];start=None
    for i in range(n):
        if flags[i] and start is None:start=r[i]
        if start is not None and (not flags[i+1] or i==n-1):
            out.append({'sampledSpanMm':r[i+1]-start});start=None
    return out
class TestP234U(unittest.TestCase):
    def test_native_shell_intersections(self):
        z=q.exact_intervals(shell(),0,-239.5,34.5,41)
        self.assertEqual(len(z['materialIntervals']),1)
        self.assertAlmostEqual(z['materialIntervals'][0]['materialSpanMm'],4.5,places=6)
    def test_detect_narrow_notch(self):
        notch=cq.Solid.makeBox(.02,2,3,cq.Vector(37.43,-1,-241))
        z=q.exact_intervals(shell().cut(notch),0,-239.5,34.5,41)
        self.assertEqual(len(z['materialIntervals']),2)
        self.assertAlmostEqual(z['materialIntervals'][0]['radialEndMm'],37.43,places=6)
    def test_legacy_sample_misses_narrow_notch(self):
        notch=cq.Solid.makeBox(.02,2,3,cq.Vector(37.43,-1,-241))
        candidate=shell().cut(notch)
        self.assertEqual(len(q.exact_intervals(candidate,0,-239.5,34.5,41)['materialIntervals']),2)
        self.assertEqual(len(sample(candidate,0,-239.5,34.5,41,.1)),1)
    def test_valid_parent_contract(self):
        raw=b'report';s={'schema':q.T_SCHEMA,'source84SHA256':q.SOURCE_SHA,
            'p234mReportSHA256':q.sha(b'm'),'p234sReportSHA256':q.sha(b's'),
            'candidateSTEPsha256':q.sha(b'step'),'mechanicalG2Certified':False,
            'originalSourceModified':False,'allLocalSectionScreensPass':True}
        self.assertEqual(q.verify_parent(s,b'm',b's',b'step',raw)['parentP234TReportSHA256'],q.sha(raw))
    def test_wrong_parent_sha(self):
        with self.assertRaises(ValueError):q.verify_parent({},b'm',b's',b'step',b't')
    def test_outside_z_domain(self):
        with self.assertRaises(ValueError):q.exact_intervals(shell(),0,0,34,41)
    def test_empty_ray_range(self):
        with self.assertRaises(ValueError):q.exact_intervals(shell(),0,-239.5,40,40)
    def test_nan(self):
        with self.assertRaises(ValueError):q.finite(float('nan'),'x')
    def test_ray_missing_solid(self):
        sphere=cq.Solid.makeSphere(1,cq.Vector(60,0,-239.5),angleDegrees1=-90,angleDegrees2=90)
        self.assertEqual(q.exact_intervals(sphere,0,-239.5,34.5,41)['materialIntervals'],[])
    def test_legacy_agreement_on_intact_shell(self):
        with patch.dict(sys.modules,{'p2_34t_radial_section_gate':types.SimpleNamespace(radial_spans=sample)}):
            self.assertEqual(q.inspect(shell(),shell(),'cup')['TtoOCCDisagreementCount'],0)
    def test_legacy_disagreement_on_narrow_notch(self):
        notch=cq.Solid.makeBox(.02,2,3,cq.Vector(37.43,-1,-241))
        with patch.dict(sys.modules,{'p2_34t_radial_section_gate':types.SimpleNamespace(radial_spans=sample)}):
            self.assertGreater(q.inspect(shell(),shell().cut(notch),'cup')['TtoOCCDisagreementCount'],0)
    def test_no_audit_overwrite(self):
        with tempfile.TemporaryDirectory() as d:
            f=Path(d)/'existing.json';f.write_text('KEEP')
            with self.assertRaises(FileExistsError):q.run(d,d,d,d,d,f)
            self.assertEqual(f.read_text(),'KEEP')
if __name__=='__main__':unittest.main(verbosity=2)
