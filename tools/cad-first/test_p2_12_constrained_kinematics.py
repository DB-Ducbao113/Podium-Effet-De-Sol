"""P2.12 source-only 6DOF ideal rear kinematics regression.

Passing source linkage lengths does NOT certify real bearing alignment or the
owner's structural chassis, dynamic CAD collisions or actual F1 suspension.
"""
import hashlib
import tempfile
import unittest
from pathlib import Path
import numpy as np
from p2_12_constrained_kinematics import (
    ANGLES,SCHEMA,LENGTH_TOLERANCE_MM,MAX_TURN_DEG,
    immutable_source,solve_angle,run_report,
)

class ConstrainedSourceKinematicsTests(unittest.TestCase):
    def test_seven_ideal_linkage_poses(self):
        for angle in ANGLES:
            with self.subTest(sleeve=angle):
                row=solve_angle(angle)
                self.assertLess(row['maximumIdealLinkageConstraintResidualMm'],
                                LENGTH_TOLERANCE_MM)
                self.assertAlmostEqual(row['toeLengthChangeMm'],angle/90.,places=9)
                self.assertAlmostEqual(row['toeLengthResidualMm'],0,places=9)
                self.assertEqual(len(row['idealWishboneHingeSolutions']),2)
                self.assertFalse(row['sourceChassisHardpointsMeasured'])
                self.assertFalse(row['nativeBallJointArticulationValidated'])
                self.assertFalse(row['realVehicleKinematicsCertified'])
                self.assertEqual(row['mechanicalG2'],'HOLD')
                for arm in row['idealWishboneHingeSolutions']:
                    self.assertLess(arm['rigidArmOuterPivotClosureResidualMm'],.001)
                    self.assertFalse(arm['actualSphericalBearingArticulationCertified'])

    def test_pitch_to_ideal_upright_yaw_and_remaining_pin_axis_problem(self):
        zero=solve_angle(0)
        self.assertEqual(zero['uprightTranslationMm'],[0.,0.,0.])
        self.assertAlmostEqual(zero['toeBearingAxisMismatchDeg'],0,places=7)
        negative=solve_angle(-90)
        positive=solve_angle(90)
        self.assertAlmostEqual(negative['uprightEulerXYZDeg'][1],.301407,places=4)
        self.assertAlmostEqual(positive['uprightEulerXYZDeg'][1],-.299140,places=4)
        for pose in (negative,positive):
            self.assertGreater(pose['toeBearingAxisMismatchDeg'],.5)
            self.assertGreater(pose['idealWishboneHingeSolutions'][0][
                'bearingBoreToUprightPinAxisMismatchDeg'],.31)
            self.assertLess(pose['constraintJacobianConditionNumber'],1e8)

    def test_invalid_domain_or_nan_pickup_rejected(self):
        for turn in (MAX_TURN_DEG+1,float('inf'),float('nan')):
            with self.assertRaises(ValueError):
                solve_angle(turn)
        for key in ('toeOuter','toeInner'):
            original=immutable_source()
            original[key][0]=float('nan')
            with self.assertRaises((RuntimeError,ValueError)):
                solve_angle(90,original)

    def test_native_source_sha_roundtrip_no_fake_g2_approval(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'source-6dof.json'
            m=run_report(path)
            self.assertEqual(m['schema'],SCHEMA)
            self.assertEqual(m['sampleCount'],7)
            self.assertEqual(m['anglesDeg'],list(ANGLES))
            self.assertEqual(m['mechanicalG2'],'HOLD')
            self.assertTrue(m['provisionalHardpointsOnly'])
            self.assertTrue(m['sphericalJointCADNotVerified'])
            self.assertTrue(m['fullNativeBrepDynamicCollisionNotRun'])
            self.assertFalse(m['vehicleKinematicsCertified'])
            self.assertLess(m['maximumConstraintResidualMm'],LENGTH_TOLERANCE_MM)
            self.assertGreater(m['maximumBoreAxisMismatchDeg'],1.)
            self.assertEqual(m['cadSourceSha256'],hashlib.sha256(
                Path(__file__).with_name('p2_12_toe_adjuster.py').read_bytes()).hexdigest())
            with self.assertRaises(FileExistsError):run_report(path)

if __name__=='__main__':
    unittest.main(verbosity=2)
