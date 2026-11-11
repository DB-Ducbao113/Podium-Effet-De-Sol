"""P2.27 authentic source and fail-closed distance bound regression."""
import json
from pathlib import Path
import tempfile
import shutil
import unittest
import trimesh
from p2_27_rear51_mate_gap_audit import audit,verified_scene,distance_bracket_mm,MATES

DATA=Path(__file__).resolve().parent/'source'

class TestP227Gaps(unittest.TestCase):
 def test_51_real_names_and_sha(self):
  meshes,_=verified_scene(DATA)
  self.assertEqual(len(meshes),51)
  self.assertTrue(all(m.is_watertight for m in meshes.values()))

 def test_provable_direct_separations(self):
  with tempfile.TemporaryDirectory() as tmp:
   report=audit(DATA,Path(tmp)/'report')
   by_id={r['mateId']:r for r in report['rows']}
   self.assertEqual(report['matePairCount'],14)
   self.assertEqual(report['partCount'],51)
   self.assertGreaterEqual(by_id['shaft_to_hub']['aabbDistanceLowerBoundMm'],103.9)
   self.assertGreaterEqual(by_id['caliper_to_upright']['aabbDistanceLowerBoundMm'],32.9)
   self.assertGreaterEqual(by_id['shaft_to_cv_housing']['aabbDistanceLowerBoundMm'],3.9)
   self.assertTrue(all(by_id[x]['guaranteedNoDirectContactAtNominalPose'] for x in
                       ('shaft_to_hub','caliper_to_upright','shaft_to_cv_housing')))
   self.assertFalse(report['mechanicalG2Certified'])
   self.assertFalse(report['original71BrepGatePassed'])
   with self.assertRaises(FileExistsError):audit(DATA,Path(tmp)/'report')

 def test_mathematical_bounds_on_separated_boxes(self):
  a=trimesh.creation.box(extents=(.01,.01,.01))
  b=a.copy();b.apply_translation((.025,0,0))
  lower,upper=distance_bracket_mm(a,b)
  self.assertAlmostEqual(lower,15,places=4)
  self.assertAlmostEqual(upper,15,places=4)

 def test_missing_manifest_rejected(self):
  with tempfile.TemporaryDirectory() as tmp:
   with self.assertRaisesRegex(ValueError,'manifest SHA256 mismatch'):
    verified_scene(Path(tmp))

 def test_tampered_glb_rejected_without_output(self):
  with tempfile.TemporaryDirectory() as tmp:
   d=Path(tmp)/'source';d.mkdir()
   manifest=DATA/'P225_rear51_source_manifest.json'
   shutil.copy2(manifest,d/manifest.name)
   info=json.loads(manifest.read_text())['profiles']['BALANCED']
   glb=DATA/info['file']
   shutil.copy2(glb,d/glb.name)
   (d/glb.name).write_bytes((d/glb.name).read_bytes()+b'tampered')
   with self.assertRaisesRegex(ValueError,'GLB SHA256 mismatch'):
    audit(d,Path(tmp)/'result')
   self.assertFalse((Path(tmp)/'result').exists())

if __name__=='__main__':unittest.main(verbosity=2)
