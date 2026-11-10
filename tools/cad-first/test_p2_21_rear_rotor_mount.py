"""Native P2.21 rotor/hat interface source regression using real P2.16-P2.18 geometry."""
import tempfile
from pathlib import Path
import unittest
import cadquery as cq
import trimesh
from p2_16_rear_wheel_end import parts as p216_parts
from p2_17_rear_brake_drive import source_parts as p217_parts
from p2_21_rear_rotor_mount import (
    build, repaired_source, revised_parts, native_distance, HAT,ROTOR,SEAL,PREFIX
)

class TestP221RotorHat(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.original={**p216_parts(),**p217_parts()}
        cls.source,cls.changed,cls.report=repaired_source()

    def test_real_original_gap_detected(self):
        self.assertAlmostEqual(native_distance(self.original[HAT],self.original[ROTOR]),
                               4.1231056256,delta=.0001)
        self.assertEqual(len(self.source),40)
        self.assertEqual(len(self.changed),11)

    def test_revised_contact_and_remaining_hub_gap(self):
        self.assertLess(native_distance(self.changed[HAT],self.changed[ROTOR]),1e-4)
        self.assertAlmostEqual(self.report['hatToHubRadialUnbridgedGapMm'],.4,places=4)
        self.assertLess(self.source[HAT].intersect(self.source[ROTOR]).Volume(),.05)
        self.assertTrue(self.report['staticAudit']['passStatic'])
        self.assertEqual(self.report['staticAudit']['solidPairs'],780)
        self.assertEqual(self.report['staticAudit']['exactBrepPairs'],140)
        self.assertFalse(self.report['mechanicalG2Certified'])

    def test_eight_distinct_bolts_and_source_revision_provenance(self):
        ids=[k for k in self.changed if k.startswith(PREFIX)]
        self.assertEqual(len(ids),8)
        self.assertEqual(set(self.changed)-set(ids),{HAT,ROTOR,SEAL})
        self.assertTrue(all(p.isValid() and len(p.Solids())==1 for p in self.changed.values()))
        self.assertGreater(self.original[ROTOR].Volume(),self.changed[ROTOR].Volume())
        self.assertNotEqual(self.original[SEAL].BoundingBox().zmin,self.changed[SEAL].BoundingBox().zmin)
        self.assertFalse(self.report['originalSourceFilesChanged'])

    def test_incorrect_mating_source_fails_closed(self):
        with self.assertRaisesRegex(ValueError,'original mating source absent'):
            revised_parts({ROTOR:self.original[ROTOR]})

    def test_roundtrip_and_pbr_color_all_lods(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)/'source'
            result=build(root)
            self.assertEqual(result['STEProundtripSolids'],11)
            self.assertEqual(result['fullReviewSolids'],40)
            self.assertEqual(result['baseMaterial'],'#87929d')
            step=cq.importers.importStep(str(root/result['source']['file'])).solids().vals()
            self.assertEqual(len(step),11)
            self.assertTrue(all(x.isValid() for x in step))
            tris=[]
            for tier,record in result['qualityProfiles'].items():
                mesh=trimesh.load(root/record['file'],force='scene')
                self.assertEqual(set(mesh.graph.nodes_geometry),set(self.changed),tier)
                self.assertTrue(all(x.is_watertight for x in mesh.geometry.values()))
                self.assertEqual({tuple(int(v) for v in x.visual.material.baseColorFactor)
                                  for x in mesh.geometry.values()},{(135,146,157,255)})
                tris.append(record['triangles'])
            self.assertGreater(tris[0],tris[1]);self.assertGreater(tris[1],tris[2])
            with self.assertRaises(FileExistsError):build(root)

if __name__=='__main__':unittest.main(verbosity=2)
