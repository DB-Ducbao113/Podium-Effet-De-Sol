"""Native original P2.9/P2.17/P2.28 rear caliper-carrier source QA."""
from __future__ import annotations
import hashlib,json,os
from pathlib import Path
import unittest
import cadquery as cq
import trimesh
from p2_9_rear_upright import PART_ID as UPRIGHT,build_rear_upright
from p2_16_rear_wheel_end import parts as original_wheel
from p2_17_rear_brake_drive import source_parts
from p2_29_caliper_upright_carrier import (
 CARRIER,CALIPER,CAL_BOLT,UPR_BOLT,SOURCE_EXPECTED,verify_source,
 native_distance,revised_parts,static_source,REVIEW_SCHEMA,build)

OUT=Path(os.environ.get('PEDS_P229_NATIVE_DIR',str(Path(__file__).resolve().parents[2]/'.local-assets/cad-first/p229-native')))

class TestP229Native(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.all,cls.new,cls.record=static_source()

 def test_verbatim_original_git_source(self):
  self.assertEqual(verify_source(),SOURCE_EXPECTED)
  self.assertEqual(self.record['sourceGitBlobsVerified']['p2_9_rear_upright.py'],
                   '0a6b95d53479b63006d2103b24efb44e846589b1')

 def test_real_original_gap_closed_by_brep_faces(self):
  self.assertAlmostEqual(self.record['originalCaliperUprightMinimumDistanceMm'],82.615071,places=4)
  self.assertLess(native_distance(self.new[CALIPER],self.new[CARRIER]),1e-4)
  self.assertLess(native_distance(self.new[UPRIGHT],self.new[CARRIER]),1e-4)
  self.assertEqual(len(self.new),7)
  self.assertEqual(len(self.all),46)
  self.assertEqual(set(self.new),{UPRIGHT,CALIPER,CARRIER,*CAL_BOLT,*UPR_BOLT})
  self.assertTrue(all(p.isValid() and len(p.Solids())==1 for p in self.new.values()))

 def test_all_46_native_parts_exact_brep_clearance(self):
  audit=self.record['source46NativeStaticAudit']
  self.assertTrue(audit['passStatic'],audit['unresolvedOverlap'])
  self.assertEqual(audit['solidPairs'],1035)
  self.assertEqual(audit['exactBrepPairs'],197)
  self.assertEqual(audit['broadphaseExcluded'],838)
  self.assertEqual(audit['unresolvedOverlap'],[])
  self.assertFalse(self.record['mechanicalG2Certified'])
  self.assertFalse(self.record['nativeRear56WithRemainingP210BodiesVerified'])

 def test_rim_interference_negative_control_for_outboard_bolt_head(self):
  rim=original_wheel()['P216_REAR_FORGED_RIM_10_SPOKE']
  for name in CAL_BOLT:
   self.assertLess(self.new[name].intersect(rim).Volume(),.05)
  # A positive control reproduces the 18.7 mm³ interference from the
  # initially designed outboard head at the 223-mm rim inner flange.
  from p2_29_caliper_upright_carrier import cyl_y
  bad=cyl_y(5.,220,3,-10,-90)
  self.assertGreater(bad.intersect(rim).Volume(),10)

 def test_step_roundtrip_glb_source_and_no_overwrite(self):
  receipt=json.loads((OUT/'P229_caliper_carrier_source_manifest.json').read_text())
  self.assertEqual(receipt['schema'],REVIEW_SCHEMA)
  self.assertEqual(receipt['revisedAndNewNativeBodies'],7)
  step=OUT/receipt['nativeSTEP']['file']
  self.assertEqual(hashlib.sha256(step.read_bytes()).hexdigest(),receipt['nativeSTEP']['sha256'])
  solids=cq.importers.importStep(str(step)).solids().vals()
  self.assertEqual(len(solids),7)
  self.assertTrue(all(s.isValid() for s in solids))
  tris=[]
  for tier,info in receipt['profiles'].items():
   f=OUT/info['file'];self.assertEqual(hashlib.sha256(f.read_bytes()).hexdigest(),info['sha256'])
   glb=trimesh.load(f,force='scene')
   self.assertEqual(set(glb.graph.nodes_geometry),set(self.new),tier)
   self.assertTrue(all(m.is_watertight for m in glb.geometry.values()))
   self.assertEqual({tuple(int(c) for c in m.visual.material.baseColorFactor) for m in glb.geometry.values()},
                    {(135,146,157,255)})
   tris.append(info['triangles'])
  self.assertGreater(tris[0],tris[1]);self.assertGreater(tris[1],tris[2])
  with self.assertRaises(FileExistsError):build(OUT)

if __name__=='__main__':unittest.main(verbosity=2)
