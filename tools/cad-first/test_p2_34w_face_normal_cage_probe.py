"""P2.34W native OpenCascade generic-shape tests, NOT owner 84-solid validation."""
import hashlib
import math
import tempfile
import unittest
from pathlib import Path
import cadquery as cq
import p2_34w_face_normal_cage_probe as w

def ball(x,y=0,z=0,r=2):
    return cq.Solid.makeSphere(r,cq.Vector(x,y,z),angleDegrees1=-90,angleDegrees2=90)

class TestW(unittest.TestCase):
    def test_separated_sphere_face_normal(self):
        result=w.nearest_face_normals(ball(0),ball(5))
        self.assertAlmostEqual(result['minimumGapMm'],1,places=5)
        self.assertTrue(result['faceNormalOrientationScreenPass'])
        self.assertGreaterEqual(result['availableFaceNormalWitnesses'],1)

    def test_contact_is_ambiguous(self):
        result=w.nearest_face_normals(ball(0),ball(4))
        self.assertFalse(result['faceNormalOrientationScreenPass'])
        self.assertEqual(result['availableFaceNormalWitnesses'],0)

    def test_penetration_is_ambiguous(self):
        result=w.nearest_face_normals(ball(0),ball(3))
        self.assertFalse(result['faceNormalOrientationScreenPass'])

    def test_directional_cage_probe(self):
        result=w.cage_directional_probe(ball(0),ball(20))
        self.assertEqual(len(result['directions']),6)
        self.assertEqual(result['unobstructedDirectionCount'],6)
        self.assertFalse(result['pocketContainmentCertified'])

    def test_directional_probe_interferes(self):
        cage=ball(3,0,0,2)
        result=w.cage_directional_probe(ball(0),cage)
        positive_x=result['directions'][0]
        self.assertFalse(positive_x['allTestedOffsetsClear'])

    def test_negative_epsilon(self):
        with self.assertRaises(ValueError):w.nearest_face_normals(ball(0),ball(5),epsilon_mm=-1)

    def test_invalid_probe_limit(self):
        with self.assertRaises(ValueError):w.cage_directional_probe(ball(0),ball(20),(-1,))

    def test_nonfinite_protection(self):
        with self.assertRaises(ValueError):w.finite(math.nan,'sample')

    def test_valid_upstream_sha(self):
        raw=b'V';step=b'step';m=b'M'
        parent={'schema':w.V_SCHEMA,'original84SourceSHA256':w.SOURCE_SHA,
                'candidateSTEPsha256':hashlib.sha256(step).hexdigest(),
                'p234mReportSHA256':hashlib.sha256(m).hexdigest(),
                'mechanicalG2Certified':False,'surfaceContactNormalsCertified':False,
                'allSampledProximityScreensPass':True,'poseCount':9}
        self.assertEqual(w.verify_parent(parent,raw,step,m),hashlib.sha256(raw).hexdigest())
        with self.assertRaises(ValueError):w.verify_parent(parent,raw,b'changed',m)

    def test_unaccepted_parent(self):
        p={'schema':w.V_SCHEMA,'original84SourceSHA256':w.SOURCE_SHA,
           'candidateSTEPsha256':hashlib.sha256(b'step').hexdigest(),
           'p234mReportSHA256':hashlib.sha256(b'M').hexdigest(),
           'mechanicalG2Certified':False,'surfaceContactNormalsCertified':False,
           'allSampledProximityScreensPass':False,'poseCount':9}
        with self.assertRaises(ValueError):w.verify_parent(p,b'V',b'step',b'M')

    def test_false_certificate(self):
        p={'schema':w.V_SCHEMA,'original84SourceSHA256':w.SOURCE_SHA,
           'candidateSTEPsha256':hashlib.sha256(b'step').hexdigest(),
           'p234mReportSHA256':hashlib.sha256(b'M').hexdigest(),
           'mechanicalG2Certified':True,'surfaceContactNormalsCertified':False,
           'allSampledProximityScreensPass':True,'poseCount':9}
        with self.assertRaises(ValueError):w.verify_parent(p,b'V',b'step',b'M')

    def test_existing_report_unchanged(self):
        with tempfile.TemporaryDirectory() as directory:
            output=Path(directory)/'existing.json'
            output.write_text('KEEP')
            with self.assertRaises(FileExistsError):
                w.run(directory,directory,directory,directory,output)
            self.assertEqual(output.read_text(),'KEEP')

if __name__=='__main__':
    unittest.main(verbosity=2)
