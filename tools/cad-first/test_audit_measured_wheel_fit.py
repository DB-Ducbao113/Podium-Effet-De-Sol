#!/usr/bin/env python3
"""Synthetic regression of P2.54 browser-export wheel placement audit.
No synthetic input here certifies manufacturer CAD or mechanical fit.
"""
from __future__ import annotations
import copy
import math
import unittest
from audit_measured_wheel_fit import audit


def fixture(quat=(0.,0.,0.,1.), user_offset=(0.,0.,0.)):
    source=[.23,.05,-.157]
    target=[1.4,.2,.9]
    x,y,z,w=quat
    a,b,c=source
    tx,ty,tz=2*(y*c-z*b),2*(z*a-x*c),2*(x*b-y*a)
    rotated=[a+w*tx+y*tz-z*ty,
             b+w*ty+z*tx-x*tz,
             c+w*tz+x*ty-y*tx]
    translated=[target[i]+user_offset[i]-rotated[i] for i in range(3)]
    probe={
      "modelB":{"meshCount":13},
      "p28":{"meshCount":59,"subassemblies":{
        "P2_TYRE_SLICK_BODY":{"sourceBoundsM":[[-.332,-.332,-.157],[.332,.332,.157]]}
      }}
    }
    wheels=[
      {"station":station,"side":side,"outerRadiusM":.332,
       "matchingWheelSamples":400,"hubSamples":120}
      for station in ("front","rear") for side in (-1,1)
    ]
    placement={
      "ownerSourceWheelCalibration":{
        "p28Scale":1,"normalizedShellScale":.18,
        "wheels":wheels,"radiusSpreadFraction":0,
        "frontPositiveZCenterM":target,
        "originalP28WheelCenterM":source,
        "axleSpacingPreviewM":3.25,
      },
      "resolvedOriginalRootTransform":{
        "stagingBasis":"measured_wheel","scale":1,
        "modelBShellUnitScale":.18,
        "rotationQuaternion":list(quat),
        "translationM":translated,
      },
      "placement":{"translationM":list(user_offset)},
    }
    return probe,placement


class RotatedWheelAudit(unittest.TestCase):
    def test_identity_pose(self):
        probe,placement=fixture()
        result=audit(probe,placement)
        self.assertLess(result["max_front_wheel_center_offset_m"],1e-10)
        self.assertEqual(result["mechanical_gate"],"G2_HOLD")

    def test_rotated_90_and_180_degree_quaternions(self):
        for q in ((0,0,math.sqrt(.5),math.sqrt(.5)),(1,0,0,0)):
            with self.subTest(quaternion=q):
                probe,placement=fixture(q)
                self.assertLess(audit(probe,placement)["max_front_wheel_center_offset_m"],1e-10)

    def test_explicit_manual_offset_does_not_fake_failure(self):
        probe,placement=fixture((0,0,math.sqrt(.5),math.sqrt(.5)),(.02,-.015,.03))
        self.assertLess(audit(probe,placement)["max_front_wheel_center_offset_m"],1e-10)

    def test_real_mismatched_wheel_pose_above_five_mm_fails(self):
        probe,placement=fixture()
        placement["resolvedOriginalRootTransform"]["translationM"][0]+=.006
        with self.assertRaisesRegex(ValueError,"rotated wheel center"):
            audit(probe,placement)

    def test_invalid_rotation_is_not_accepted(self):
        for q in ((0,0,0,0),(math.inf,0,0,1),(0,0,0,1.2)):
            with self.subTest(quaternion=q):
                probe,placement=fixture()
                placement["resolvedOriginalRootTransform"]["rotationQuaternion"]=list(q)
                with self.assertRaises(ValueError):audit(probe,placement)

    def test_nonfinite_and_missing_manual_offset_are_rejected(self):
        probe,placement=fixture()
        placement["placement"]["translationM"]=[math.nan,0,0]
        with self.assertRaises(ValueError):audit(probe,placement)
        probe,placement=fixture()
        del placement["placement"]
        with self.assertRaisesRegex(ValueError,"offsets missing"):audit(probe,placement)

    def test_never_promotes_visual_pass_to_mechanical_fit(self):
        probe,placement=fixture()
        result=audit(copy.deepcopy(probe),copy.deepcopy(placement))
        self.assertFalse(result["full_car_2026_certified"])
        self.assertEqual(result["status"],"VISUAL_4_WHEEL_ENVELOPE_FIT_PASS")
        self.assertEqual(result["mechanical_gate"],"G2_HOLD")


if __name__=="__main__":
    unittest.main()
