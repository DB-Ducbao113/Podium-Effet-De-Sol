"""Source-independent numerical and provenance contracts, NOT owner STEP CAD QA."""
import copy,json,math,tempfile,unittest
from pathlib import Path
import p2_34r_centerline_spline_gate as r

def fixture():
    lines=[]
    for bend in (-10,0,10):
        for ball in r.BALLS:
            for side in ('shaft','cup'):
                lines.append({'bendDeg':bend,'ballSourceID':ball,'race':side,
                    'shaftPhaseSamplesDeg':[0,1,2,3],
                    'sourceLocalBallCenterPointsMm':[[0,0,0],[1,0,0],[2,0,0],[3,0,0]]})
    return {'schema':r.Q_SCHEMA,'source84SHA256':r.SOURCE_SHA,
        'originalNativeSourcePartCount':84,'originalGeometryModified':False,
        'mechanicalG2Certified':False,'parentP234MReportSHA256':'a'*64,
        'sourceLocalRaceCenterlines':lines}

class GateTests(unittest.TestCase):
    def test_36_full_traces(self):
        a=r.analyze(fixture())
        self.assertEqual(a['sourceTraceCount'],36)
        self.assertEqual(a['diagnosticFlagCount'],0)
        self.assertFalse(a['mechanicalG2Certified'])
    def test_straight_zero_curvature(self):
        t=r.analyze_trace([0,1,2],[(0,0,0),(1,0,0),(2,0,0)])
        self.assertAlmostEqual(t['maximumSampledCurvatureInvMm'],0)
    def test_analytic_shared_derivative(self):
        p=[(0,0,0),(1,1,0),(2,0,0)]
        slopes,steps=r.tangents(p,[0,1,2])
        left=r.hermite(p[0],p[1],slopes[0],slopes[1],1,1)[1]
        right=r.hermite(p[1],p[2],slopes[1],slopes[2],1,0)[1]
        for x,y in zip(left,right):self.assertAlmostEqual(x,y)
    def test_approximate_curvature_positive(self):
        t=r.analyze_trace([0,1,2],[(0,0,0),(1,1,0),(2,0,0)])
        self.assertGreater(t['maximumSampledCurvatureInvMm'],0)
    def test_degenerate_source_rejected(self):
        d=fixture();d['sourceLocalRaceCenterlines'][0]['sourceLocalBallCenterPointsMm'][1]=[0,0,0]
        with self.assertRaises(ValueError):r.analyze(d)
    def test_wrong_sha(self):
        d=fixture();d['source84SHA256']='tampered'
        with self.assertRaises(ValueError):r.analyze(d)
    def test_wrong_schema(self):
        d=fixture();d['schema']='made-up'
        with self.assertRaises(ValueError):r.analyze(d)
    def test_duplicate_trace(self):
        d=fixture();d['sourceLocalRaceCenterlines'][1]=copy.deepcopy(d['sourceLocalRaceCenterlines'][0])
        with self.assertRaises(ValueError):r.analyze(d)
    def test_missing_trace(self):
        d=fixture();d['sourceLocalRaceCenterlines'].pop()
        with self.assertRaises(ValueError):r.analyze(d)
    def test_false_certification(self):
        d=fixture();d['mechanicalG2Certified']=True
        with self.assertRaises(ValueError):r.analyze(d)
    def test_nonfinite(self):
        d=fixture();d['sourceLocalRaceCenterlines'][0]['sourceLocalBallCenterPointsMm'][1][0]=math.nan
        with self.assertRaises(ValueError):r.analyze(d)
    def test_bad_phase(self):
        d=fixture();d['sourceLocalRaceCenterlines'][0]['shaftPhaseSamplesDeg'][2]=1
        with self.assertRaises(ValueError):r.analyze(d)
    def test_wrong_bend_count(self):
        d=fixture();d['sourceLocalRaceCenterlines']=[x for x in d['sourceLocalRaceCenterlines'] if x['bendDeg']!=-10]
        with self.assertRaises(ValueError):r.analyze(d)
    def test_corrupt_parent_sha(self):
        d=fixture();d['parentP234MReportSHA256']='xyz'
        with self.assertRaises(ValueError):r.analyze(d)
    def test_wrong_ball(self):
        d=fixture();d['sourceLocalRaceCenterlines'][0]['ballSourceID']='FAKE'
        with self.assertRaises(ValueError):r.analyze(d)
    def test_thresholds(self):
        with self.assertRaises(ValueError):r.analyze(fixture(),maximum_review_deviation=-1)
    def test_sampling_limit(self):
        with self.assertRaises(ValueError):r.analyze(fixture(),samples_per_segment=2)
    def test_cusp(self):
        with self.assertRaisesRegex(ValueError,'cusp'):r.curvature((0,0,0),(1,1,1))
    def test_refuses_overwrite(self):
        with tempfile.TemporaryDirectory() as d:
            source=Path(d)/'source.json';source.write_text(json.dumps(fixture()))
            output=Path(d)/'existing.json';output.write_text('unchanged')
            with self.assertRaises(FileExistsError):r.run(source,output)
            self.assertEqual(output.read_text(),'unchanged')
    def test_report_provenance_hash(self):
        with tempfile.TemporaryDirectory() as d:
            source=Path(d)/'source.json';source.write_text(json.dumps(fixture()))
            output=Path(d)/'output.json'
            report=r.run(source,output)
            self.assertEqual(len(report['inputP234QReportSHA256']),64)
            self.assertFalse(report['postCutWallThicknessMeasured'])
            self.assertFalse(report['C2ContinuousRaceSurfaceCertified'])
if __name__=='__main__':unittest.main(verbosity=2)
