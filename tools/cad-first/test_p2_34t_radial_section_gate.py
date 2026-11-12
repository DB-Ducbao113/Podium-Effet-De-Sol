"""P2.34T generic CadQuery B-Rep tests, not original owner STEP acceptance."""
import math,tempfile,unittest
from pathlib import Path
import cadquery as cq
import p2_34t_radial_section_gate as g
BASE=cq.Vector(0,0,-245)
def cup():
    return cq.Solid.makeCylinder(40,11,BASE).cut(cq.Solid.makeCylinder(35.5,11,BASE))
def shaft():return cq.Solid.makeCylinder(29,11,BASE)
class TestNativeRadialSections(unittest.TestCase):
    def test_shaft_span(self):
        x=g.radial_spans(shaft(),0,-239.5,20,30,.25)
        self.assertEqual(len(x),1)
        self.assertAlmostEqual(x[0]['sampledSpanMm'],9,delta=.01)
    def test_cup_span(self):
        x=g.radial_spans(cup(),30,-239.5,34.5,41,.2)
        self.assertEqual(len(x),1)
        self.assertAlmostEqual(x[0]['sampledSpanMm'],4.5,delta=.01)
    def test_shaft_cut_detected(self):
        altered=shaft().cut(cq.Solid.makeSphere(3,cq.Vector(28,0,-239.5),angleDegrees1=-90,angleDegrees2=90))
        self.assertFalse(g.inspect_race(shaft(),altered,'shaft',
          angles=(0,60,120,180),planes=(-240,-239),step=.2,min_span_mm=7)['allRaysPassExploratoryScreen'])
    def test_cup_cut_detected(self):
        altered=cup().cut(cq.Solid.makeSphere(2,cq.Vector(38.5,0,-239.5),angleDegrees1=-90,angleDegrees2=90))
        self.assertFalse(g.inspect_race(cup(),altered,'cup',
          angles=(0,60,120,180),planes=(-240,-239),step=.2,min_span_mm=4)['allRaysPassExploratoryScreen'])
    def test_untouched_shaft(self):
        self.assertTrue(g.inspect_race(shaft(),shaft(),'shaft',
          angles=(0,60,120,180),planes=(-240,-239),step=.25)['allRaysPassExploratoryScreen'])
    def test_untouched_cup(self):
        self.assertTrue(g.inspect_race(cup(),cup(),'cup',
          angles=(0,60,120,180),planes=(-240,-239),step=.25)['allRaysPassExploratoryScreen'])
    def test_absent_original_material_cannot_pass(self):
        empty=cq.Solid.makeSphere(1,cq.Vector(60,0,-239.5),angleDegrees1=-90,angleDegrees2=90)
        self.assertFalse(g.inspect_race(empty,empty,'cup',
          angles=(0,60,120,180),planes=(-240,-239),step=.25)['allRaysPassExploratoryScreen'])
    def test_multiple_material_intervals(self):
        recess=cq.Solid.makeCylinder(37.6,1,cq.Vector(0,0,-240)).cut(
            cq.Solid.makeCylinder(37.4,1,cq.Vector(0,0,-240)))
        self.assertEqual(len(g.radial_spans(cup().cut(recess),0,-239.5,34.5,41,.1)),2)
    def test_step_budget(self):
        with self.assertRaises(ValueError):g.radial_spans(cup(),0,-239.5,34.5,41,.001)
    def test_nan_rejected(self):
        with self.assertRaises(ValueError):g.finite(math.nan,'x')
    def test_insufficient_rays(self):
        with self.assertRaises(ValueError):g.inspect_race(cup(),cup(),'cup',angles=(0,),planes=(-240,-239))
    def test_axial_bounds(self):
        with self.assertRaises(ValueError):g.inspect_race(cup(),cup(),'cup',angles=(0,60,120,180),planes=(-239,5))
    def test_missing_sha_lineage(self):
        with self.assertRaises(ValueError):g.validate_lineage({},b'm',b'candidate',b'a',b's')
    def test_false_acceptance(self):
        m=b'm';step=b'candidate';audit=b'a';raw=b's'
        s={'schema':g.S_SCHEMA,'original84SourceSHA256':g.SOURCE_SHA,'sourceSolidCount':84,
           'parentP234MReportSHA256':g.sha256(m),'candidateSTEPsha256':g.sha256(step),
           'candidateAuditSHA256':g.sha256(audit),'mechanicalG2Certified':True,
           'originalGeometryModified':False,'protectedEnvelopeScreenPass':True,
           'upstreamSampledScreensPass':True,'sourceIdentityMappingRetained':{str(i):i for i in range(84)}}
        with self.assertRaises(ValueError):g.validate_lineage(s,m,step,audit,raw)
    def test_existing_evidence_unchanged(self):
        with tempfile.TemporaryDirectory() as d:
            out=Path(d)/'review.json';out.write_text('KEEP')
            with self.assertRaises(FileExistsError):g.run(d,d,d,d,out)
            self.assertEqual(out.read_text(),'KEEP')
if __name__=='__main__':unittest.main(verbosity=2)
