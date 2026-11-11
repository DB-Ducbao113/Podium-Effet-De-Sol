"""P2.32 real P2.31 STEP-to-76 ownership and fail-closed SHA regression."""
from __future__ import annotations
import json,os,shutil,tempfile,unittest
from pathlib import Path
from p2_32_repo_gate import audit,STEP_SHA

ROOT=Path(os.environ.get('PEDS_P232_DATA',str(Path(__file__).resolve().parents[2]/'.local-assets/cad-first/p232-source')))
STEP=ROOT/'P231_rear56_original_native_static.step'
NAMES=ROOT/'P231_step56_source_name_map.json'

class TestP232RepoGate(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  if not STEP.is_file() or not NAMES.is_file():
   raise unittest.SkipTest('Original P2.31 source STEP/name map absent; no substitute geometry')

 def test_actual_original_names_to_76_count(self):
  with tempfile.TemporaryDirectory() as d:
   data=audit(STEP,NAMES,Path(d)/'out')
   self.assertEqual(data['p231OriginalSTEPsha256'],STEP_SHA)
   self.assertEqual(data['candidateParts'],76)
   self.assertEqual(data['candidateAllPairs'],2850)
   self.assertEqual(data['inheritedOld54Pairs'],1431)
   self.assertEqual(data['newNativePairsPending'],1419)
   self.assertEqual(len(data['newToePartIds']),6)
   self.assertEqual(len(data['newSplitJointPartIds']),16)
   self.assertFalse(data['realOriginal76NativeCollisionGateExecuted'])
   self.assertFalse(data['mechanicalG2Certified'])
   self.assertFalse(data['originalSourceFilesVerifiedInLocalCheckout'])

 def test_missing_original_sources_fail_closed(self):
  with tempfile.TemporaryDirectory() as d:
   with self.assertRaises(FileNotFoundError):
    audit(STEP,NAMES,Path(d)/'out',Path(d)/'no-source')
   self.assertFalse((Path(d)/'out').exists())

 def test_real_step_tamper_refused_and_no_overwrite(self):
  with tempfile.TemporaryDirectory() as d:
   folder=Path(d)
   bad=folder/'bad.step';bad.write_bytes(STEP.read_bytes()+b'corrupt')
   with self.assertRaisesRegex(ValueError,'sha256 mismatch'):
    audit(bad,NAMES,folder/'blocked')
   self.assertFalse((folder/'blocked').exists())
   audit(STEP,NAMES,folder/'output')
   with self.assertRaises(FileExistsError):audit(STEP,NAMES,folder/'output')

if __name__=='__main__':unittest.main(verbosity=2)
