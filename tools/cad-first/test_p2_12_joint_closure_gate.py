"""Pure source-geometry regression for P2.12 free toe adjustment anchoring."""
import tempfile,unittest,hashlib
from pathlib import Path
from p2_12_joint_closure_gate import audit

class JointClosureTest(unittest.TestCase):
    def test_fixed_bearing_nonclosure_across_source_angles(self):
        with tempfile.TemporaryDirectory() as d:
            path=Path(d)/'closure.json'
            evidence=audit(path)
            self.assertTrue(evidence['staticCenterClosurePass'])
            self.assertFalse(evidence['adjustedRigidFixedBearingClosurePass'])
            self.assertFalse(evidence['freeThreadMotionCanBeAcceptedAsVehicleToeMotion'])
            self.assertEqual(evidence['mechanicalG2'],'HOLD')
            self.assertEqual(len(evidence['samples']),7)
            poses={row['sleeveAngleDeg']:row for row in evidence['samples']}
            for angle in (-90,90):
                self.assertAlmostEqual(poses[angle]['outerEyeErrorFromFixedBearingMm'],.5)
                self.assertAlmostEqual(poses[angle]['innerEyeErrorFromFixedBearingMm'],.5)
                self.assertAlmostEqual(poses[angle]['eyeRadialOffsetRelativeToSourceBoreAxisMm'],.319087,places=5)
                self.assertFalse(poses[angle]['twoPinnedEyeCentersCloseWithinReviewThreshold'])
            for angle in (-180,180):
                self.assertTrue(poses[angle]['exceedsNominalRadialClearance'])
                self.assertAlmostEqual(poses[angle]['eyeRadialOffsetRelativeToSourceBoreAxisMm'],.638174,places=5)
            self.assertEqual(
                evidence['cadSourceSha256'],
                hashlib.sha256(Path(__file__).with_name('p2_12_toe_adjuster.py').read_bytes()).hexdigest(),
            )
            with self.assertRaises(FileExistsError):
                audit(path)

if __name__=='__main__':
    unittest.main(verbosity=2)
