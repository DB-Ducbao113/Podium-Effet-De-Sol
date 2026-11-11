"""P2.34E GitHub regression of authentic original source native B-Reps.

Independently checks the changed-source nominal collision scope and selected
actual angular clearances; full 11-pose manifest is produced by the CLI gate.
No synthetic source bodies, mock car, or mechanical CV pass.
"""
from __future__ import annotations
import os,shutil,tempfile,unittest,math
from pathlib import Path
from p2_34e_repo_contact_gap import source,resize,near,minimum,turn,first_touch,BALLS,SHAFT,CUP,CAGE
INPUT=Path(os.environ.get('PEDS_P234D_SOURCE_NATIVE',
 str(Path(__file__).resolve().parents[2]/'.local-assets/cad-first/p234d-native')))
class TestP234eRepo(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  if not (INPUT/'P234D_rear84_integral_ball_end_lips_native.step').is_file():
   raise unittest.SkipTest('Missing authentic original P2.34D STEP; no stand-in proof')
 def test_actual_nominal_BRep_and_extreme_angles(self):
  prior=source(INPUT);new=resize(prior)
  self.assertEqual(len(new),84)
  self.assertEqual(len(set(new)-set(BALLS)),78)
  unchanged=set(prior)-set(BALLS)
  self.assertTrue(all(prior[n] is new[n] for n in unchanged))
  sep=exact=0
  ids=sorted(new)
  for i,a in enumerate(ids):
   for b in ids[i+1:]:
    if a in unchanged and b in unchanged:continue
    if not near(new[a],new[b]):sep+=1;continue
    exact+=1
    self.assertLess(new[a].intersect(new[b]).Volume(),.05)
  self.assertEqual((sep,exact),(465,18))
  for angle in (-10,0,10):
   shaft=turn(new[SHAFT],angle);cage=turn(new[CAGE],angle/2)
   for name in BALLS:
    ball=turn(new[name],angle/2)
    self.assertGreater(minimum(ball,shaft),.05)
    self.assertGreater(minimum(ball,new[CUP]),.05)
    self.assertGreater(minimum(ball,cage),.05)
  before=first_touch(prior[BALLS[0]],prior[SHAFT]);after=first_touch(new[BALLS[0]],new[SHAFT])
  self.assertAlmostEqual(before,1.088257,delta=.002)
  self.assertAlmostEqual(after,.623657,delta=.002)
  self.assertLess(after,before)
 def test_original_sha_tampering_fails_closed(self):
  with tempfile.TemporaryDirectory() as d:
   temp=Path(d)/'source';shutil.copytree(INPUT,temp)
   p=temp/'P234D_rear84_source_index.json';p.write_bytes(p.read_bytes()+b'bad')
   with self.assertRaisesRegex(ValueError,'SHA mismatch'):source(temp)
if __name__=='__main__':unittest.main(verbosity=2)
