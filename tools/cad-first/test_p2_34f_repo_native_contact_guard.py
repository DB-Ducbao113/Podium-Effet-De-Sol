"""P2.34F GitHub-side original source84 independent native CAD guard tests."""
from __future__ import annotations
import os,shutil,tempfile,unittest
from pathlib import Path
from p2_34f_repo_native_contact_guard import probe,source
ROOT=Path(os.environ.get('PEDS_P234F_INPUT',str(Path(__file__).resolve().parents[1]/'inputs/P234E_native')))
class TestP234FRepo(unittest.TestCase):
 def test_native_original_brep_contact_brackets_and_perturbation(self):
  with tempfile.TemporaryDirectory() as d:
   r=probe(ROOT,Path(d)/'out')
   self.assertEqual(r['realBRepCount'],84)
   self.assertGreater(r['twoIndependentRaceContactBrackets']['shaft']['disjointGapMm'],.005)
   self.assertGreater(r['twoIndependentRaceContactBrackets']['cup']['disjointGapMm'],.01)
   self.assertAlmostEqual(r['originalShaftBallGapMm'],.073885,delta=.0001)
   self.assertGreater(r['offsetMmToBooleanOverlapMm3']['0.12'],.05)
   self.assertFalse(r['actualTransmissionSpeedRatioMeasured'])
   self.assertFalse(r['mechanicalG2Certified'])
   with self.assertRaises(FileExistsError):probe(ROOT,Path(d)/'out')
 def test_source_tampering_rejected(self):
  with tempfile.TemporaryDirectory() as d:
   new=Path(d)/'source';new.mkdir()
   for f in ROOT.iterdir():shutil.copy2(f,new/f.name)
   x=new/'P234E_source84_name_index.json';x.write_bytes(x.read_bytes()+b'bad')
   with self.assertRaisesRegex(ValueError,'SHA-256 mismatch'):source(new)
if __name__=='__main__':unittest.main(verbosity=2)
