"""P2.34E actual BRep source-gated repo regression (no fake 84-part CAD)."""
import os,shutil,tempfile,unittest
from pathlib import Path
from p2_34e_repo_contact_gap import check,source
INPUT=Path(os.environ.get('PEDS_P234D_SOURCE_NATIVE',str(Path(__file__).resolve().parents[2]/'.local-assets/cad-first/p234d-native')))
class TestP234eRepo(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  if not (INPUT/'P234D_rear84_integral_ball_end_lips_native.step').is_file():
   raise unittest.SkipTest('Missing authentic original P2.34D STEP; no stand-in proof')
 def test_real_84_native_clearance_and_first_contact(self):
  with tempfile.TemporaryDirectory() as d:
   folder=Path(d)/'out';doc=check(INPUT,folder)
   self.assertEqual((doc['sourceBodies'],doc['changedNativePairs']),(84,483))
   self.assertEqual((doc['aabbSeparated'],doc['exactNativeBooleans']),(465,18))
   self.assertEqual(doc['ballTrackMinimumDistanceChecks'],198)
   self.assertEqual(len(doc['poses']),11)
   self.assertGreater(min(r['minShaftGapMm'] for r in doc['poses']),.05)
   self.assertFalse(doc['loadedTorquePathCertified'])
   self.assertFalse(doc['mechanicalG2Certified'])
   with self.assertRaises(FileExistsError):check(INPUT,folder)
 def test_original_sha_tampering_fails_closed(self):
  with tempfile.TemporaryDirectory() as d:
   temp=Path(d)/'source';shutil.copytree(INPUT,temp)
   p=temp/'P234D_rear84_source_index.json';p.write_bytes(p.read_bytes()+b'bad')
   with self.assertRaisesRegex(ValueError,'SHA mismatch'):source(temp)
if __name__=='__main__':unittest.main(verbosity=2)
