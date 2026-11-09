"""Native P2.13 spherical-joint source CAD tests; vehicle G2 remains HOLD."""
import hashlib,json,tempfile,unittest
from pathlib import Path
import cadquery as cq
import trimesh
from p2_13_rear_joint_prototype import (
 STATIONS,SOURCE_BEARING_TO_REPLACE,RACE_RADII_MM,
 BEARING_SPHERE_MM,RACE_CAVITY_SPHERE_MM,BALL_BORE_RADIUS_MM,
 parts_local,source_parts,review_pose,export,sha,ANGLES
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
 def test_original_step_three_source_lods_and_no_overwrite(self):
  with tempfile.TemporaryDirectory() as folder:
   p=Path(folder)/'p213'
   m=export(p)
   self.assertEqual(m['newCadSolids'],8)
   self.assertEqual(m['replacedOldCadSolids'],4)
   self.assertEqual(m['candidateCombinedCadSolids'],23)
   self.assertEqual(m['stepRoundtripSolids'],8)
   self.assertEqual(sha(p/m['masterSTEP']),m['masterSTEPsha256'])
   self.assertEqual(len(cq.importers.importStep(str(p/m['masterSTEP'])).solids().vals()),8)
   self.assertFalse(m['sphericalBallRetainedCertified'])
   self.assertFalse(m['actualSphericalArticulationCertified'])
   self.assertFalse(m['wholeCarClearanceCertified'])
   self.assertFalse(m['chassisHardpointsMeasured'])
   self.assertEqual(m['mechanicalG2'],'HOLD')
   counts=[]
   for tier in ('HIGH','BALANCED','PERFORMANCE'):
    row=m['profiles'][tier];file=p/row['file']
    self.assertEqual(sha(file),row['sha256'])
    scene=trimesh.load(file,force='scene')
    self.assertEqual(set(scene.graph.nodes_geometry),set(m['newCadPartIds']))
    self.assertTrue(all(g.is_watertight and g.is_winding_consistent for g in scene.geometry.values()))
    self.assertEqual(row['triangles'],sum(len(g.faces) for g in scene.geometry.values()))
    counts.append(row['triangles'])
   self.assertGreater(counts[0],counts[1])
   self.assertGreater(counts[1],counts[2])
   self.assertEqual(len(m['sourceCadFileSha256']),5)
   for source_name,digest in m['sourceCadFileSha256'].items():
    self.assertEqual(digest,hashlib.sha256(Path(__file__).with_name(source_name).read_bytes()).hexdigest())
   with self.assertRaises(FileExistsError):export(p)

if __name__=='__main__':unittest.main(verbosity=2)
