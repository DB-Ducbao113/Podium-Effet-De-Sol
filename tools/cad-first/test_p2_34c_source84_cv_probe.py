"""P2.34c original B-Rep source84 repository-level integration regression.

Requires original SHA-pinned P2.34B native STEP bundle. Without that real
source, tests SKIP rather than inventing a car, CV housing, or fixture PASS.
"""
from __future__ import annotations
import json,os,tempfile,shutil,unittest
from pathlib import Path
from p2_34c_source84_cv_probe import actual_source,new_parts,audit_pairs,local_angles,run

SOURCE=Path(os.environ.get('PEDS_P234B_ORIGINAL_NATIVE',
 str(Path(__file__).resolve().parents[2]/'.local-assets/cad-first/p234b-native')))

class TestP234cSource84(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  if not (SOURCE/'P234B_rear77_split_retaining_ring_native_static.step').is_file():
   raise unittest.SkipTest('Authentic P2.34B source77 STEP not present; no synthetic substitute')

 def test_original_source_84_static_and_11_angles(self):
  with tempfile.TemporaryDirectory() as temp:
   r=run(SOURCE,Path(temp)/'proof')
   static=r['nominalStatic'];pose=r['sampledAngularPose']
   self.assertEqual((r['partCount'],static['allUnorderedPairs'],static['newAffectedPairs']),(84,3486,711))
   self.assertEqual((static['aabbSeparated'],static['exactOpenCascadeBooleanPairs']),(682,29))
   self.assertEqual((pose['poseCount'],pose['posePairs'],pose['exactOpenCascadeBooleans']),(11,396,231))
   self.assertFalse(static['significantClashes'])
   self.assertTrue(pose['sampledLocalPass'])
   self.assertGreater(pose['shaftTwoDegreeBallObstructionMm3'],.05)
   self.assertGreater(pose['housingTwoDegreeBallObstructionMm3'],.05)
   self.assertFalse(r['realCvAngularVelocityTransmissionCertified'])
   self.assertTrue(r['legacyCclipNoLongerRetainsHousing'])
   self.assertFalse(r['mechanicalG2Certified'])
   self.assertEqual(json.loads((Path(temp)/'proof/P234C_source84_repo_probe.json').read_text())['partCount'],84)
   with self.assertRaises(FileExistsError):run(SOURCE,Path(temp)/'proof')

 def test_original_source_sha_tamper_is_rejected(self):
  with tempfile.TemporaryDirectory() as d:
   folder=Path(d)/'source';shutil.copytree(SOURCE,folder)
   p=folder/'P234B_rear77_source_name_map.json'
   p.write_bytes(p.read_bytes()+b'tampered')
   with self.assertRaisesRegex(ValueError,'SHA mismatch'):
    actual_source(folder)

 def test_incorrect_part_ownership_is_rejected(self):
  original=actual_source(SOURCE)
  incomplete={k:v for k,v in original.items() if k!='P217_REAR_CV_HOUSING_PROTOTYPE'}
  with self.assertRaises(ValueError):
   audit_pairs(incomplete,{**incomplete,**new_parts(original)})

if __name__=='__main__':unittest.main(verbosity=2)
