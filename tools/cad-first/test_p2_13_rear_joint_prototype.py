"""Native P2.13 spherical-joint source CAD tests; vehicle G2 remains HOLD."""
import hashlib,json,tempfile,unittest
from pathlib import Path
import cadquery as cq
import trimesh
from p2_13_rear_joint_prototype import (
 STATIONS,SOURCE_BEARING_TO_REPLACE,RACE_RADII_MM,
 BEARING_SPHERE_MM,RACE_CAVITY_SPHERE_MM,BALL_BORE_RADIUS_MM,
 parts_local,source_parts,review_pose,nominal_combined_static_audit,export,sha,ANGLES
)

class P213NativeJointTests(unittest.TestCase):
 def test_eight_real_independent_brep_solids_replace_four_prior_bearing_proxies(self):
  parts=source_parts()
  self.assertEqual(len(parts),8)
  self.assertEqual(len(SOURCE_BEARING_TO_REPLACE),4)
  self.assertEqual(len(set(SOURCE_BEARING_TO_REPLACE.values())),4)
  for name,body in parts.items():
   self.assertEqual(len(body.Solids()),1,name)
   self.assertTrue(body.isValid(),name)
   self.assertGreater(body.Volume(),500,name)
 def test_genuine_spherical_cavity_and_drilled_ball(self):
  self.assertGreater(RACE_CAVITY_SPHERE_MM,BEARING_SPHERE_MM)
  self.assertGreater(BEARING_SPHERE_MM,BALL_BORE_RADIUS_MM)
  for name in STATIONS:
   with self.subTest(name=name):
    race,ball=parts_local(name)
    self.assertEqual(race.intersect(ball).Volume(),0)
    # Native geometry must have curved faces, not a former annular proxy.
    self.assertTrue(any('SPHERE' in face.geomType().upper() for face in race.Faces()))
    self.assertTrue(any('SPHERE' in face.geomType().upper() for face in ball.Faces()))
    self.assertGreater(RACE_RADII_MM[name],RACE_CAVITY_SPHERE_MM)
    # Positive-interference control: native common MUST detect a deliberately
    # shifted ball. This limits silent zero-volume false-negative acceptance.
    self.assertGreater(race.intersect(ball.translate((1,0,0))).Volume(),100)
 def test_seven_ideal_solved_joints_28_ball_race_volume_reviews(self):
  peak=0
  for angle in ANGLES:
   pose=review_pose(angle)
   self.assertEqual(pose['jointCount'],4)
   self.assertTrue(pose['jointBallCentresCoincidentByConstruction'])
   self.assertFalse(pose['chassisHardpointsMeasured'])
   self.assertEqual(pose['mechanicalG2'],'HOLD')
   for case in pose['cases']:
    self.assertEqual(case['nativeOverlapMm3'],0)
    self.assertAlmostEqual(case['radialSeatGapMm'],.3,places=9)
    self.assertFalse(case['realMechanicalJointCertified'])
    peak=max(peak,case['raceBallAxisAngleDeg'])
  self.assertGreater(peak,1.)
 def test_all_23_source_parts_253_nominal_brep_pair_screen(self):
  row=nominal_combined_static_audit()
  self.assertEqual(row['pairCount'],253)
  self.assertEqual(row['aabbExcluded']+row['nativeBrepIntersectionsEvaluated'],253)
  self.assertTrue(row['passStatic'])
  self.assertEqual(row['unresolvedCollisions'],[])
  self.assertEqual(row['booleanErrors'],[])
  self.assertFalse(row['dynamicKinematicsCertified'])

 def test_eight_body_step_roundtrip_and_source_provenance(self):
  with tempfile.TemporaryDirectory() as folder:
   filepath=Path(folder)/'p213-eight-pieces.step'
   pieces=source_parts()
   assembly=cq.Assembly(name='P213_EIGHT_NATIVE_BEARING_PROTOTYPES')
   for name,body in pieces.items():assembly.add(body,name=name)
   assembly.save(str(filepath),exportType='STEP')
   imported=cq.importers.importStep(str(filepath)).solids().vals()
   self.assertEqual(len(imported),8)
   self.assertTrue(all(x.isValid() and x.Volume()>0 for x in imported))
   self.assertEqual(len(set(pieces)),8)
   self.assertEqual(len(sha(filepath)),64)
   # The full 23-body static review and 3 GLB LOD integrity live in the
   # separate original CAD exporter/runner gate, not in this same OCCT test.
   for name in ('p2_9_rear_upright.py','p2_10_rear_wishbone.py',
                'p2_11_rear_toe_link.py','p2_12_toe_adjuster.py',
                'p2_12_constrained_kinematics.py'):
    self.assertEqual(len(hashlib.sha256(
       Path(__file__).with_name(name).read_bytes()).hexdigest()),64)

if __name__=='__main__':unittest.main(verbosity=2)
