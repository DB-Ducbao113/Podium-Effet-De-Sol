import unittest,math,tempfile,hashlib
from pathlib import Path
import cadquery as cq
import p2_34v_nearest_contact_witness as q

def sphere(x,r=2):return cq.Solid.makeSphere(r,cq.Vector(x,0,0),angleDegrees1=-90,angleDegrees2=90)
class Tests(unittest.TestCase):
 def test_sphere_gap(self):
  w=q.closest(sphere(0),sphere(5));self.assertAlmostEqual(w['minimumDistanceMm'],1,places=6)
  self.assertAlmostEqual(w['nearestWitnesses'][0]['unitBallToOtherIfSeparated'][0],1,places=6)
  self.assertFalse(w['distanceDirectionIsSurfaceNormalCertified'])
 def test_touch(self):
  self.assertAlmostEqual(q.closest(sphere(0),sphere(4))['minimumDistanceMm'],0,places=5)
 def test_collision(self):
  self.assertAlmostEqual(q.closest(sphere(0),sphere(3))['minimumDistanceMm'],0,places=5)
 def test_three_counterparts(self):
  w={k:{'minimumDistanceMm':.01} for k in ('shaft','cup','cage')}
  z={k:0. for k in w};r=q.classify(w,z)
  self.assertTrue(r['exploratoryNoPenetrationAndRaceProximity'])
  self.assertFalse(r['cageBallCapturedByClosedPocketCertified'])
 def test_race_gap(self):
  w={k:{'minimumDistanceMm':.01} for k in ('shaft','cup','cage')};w['shaft']['minimumDistanceMm']=.1
  self.assertEqual(q.classify(w,{k:0. for k in w})['raceContactsBeyondProximity'],['shaft'])
 def test_penetration(self):
  w={k:{'minimumDistanceMm':0.} for k in ('shaft','cup','cage')};z={k:0. for k in w};z['cage']=.01
  self.assertIn('cage',q.classify(w,z)['counterpartIntersections'])
 def test_wrong_counterpart_count(self):
  with self.assertRaises(ValueError):q.classify({'shaft':{}},{'shaft':0.})
 def test_nan(self):
  with self.assertRaises(ValueError):q.finite(float('nan'),'bad')
 def test_source_lineage(self):
  raw=b'U';step=b'STEP';r={'schema':q.U_SCHEMA,'sourceSTEPsha256':q.SHA,
    'candidateSTEPsha256':hashlib.sha256(step).hexdigest(),'mechanicalG2Certified':False,
    'allSampledNativeRayScreensPass':True}
  self.assertEqual(q.validate_parent(r,raw,step),hashlib.sha256(raw).hexdigest())
  with self.assertRaises(ValueError):q.validate_parent(r,raw,b'changed')
 def test_false_g2_claim(self):
  r={'schema':q.U_SCHEMA,'sourceSTEPsha256':q.SHA,'candidateSTEPsha256':hashlib.sha256(b'a').hexdigest(),
     'mechanicalG2Certified':True,'allSampledNativeRayScreensPass':True}
  with self.assertRaises(ValueError):q.validate_parent(r,b'U',b'a')
 def test_existing_file_preserved(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d)/'out';p.write_text('ORIGINAL')
   with self.assertRaises(FileExistsError):q.run(d,d,d,d,p)
   self.assertEqual(p.read_text(),'ORIGINAL')
if __name__=='__main__':unittest.main(verbosity=2)
