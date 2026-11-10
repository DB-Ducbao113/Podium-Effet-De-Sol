"""Offline source identity, clearance and neutral-PBR tests for P2.17."""
from pathlib import Path
import tempfile
import unittest

import cadquery as cq
import trimesh

from p2_16_rear_wheel_end import parts as p216_parts
from p2_17_rear_brake_drive import PREFIX, build, source_parts, _role
from p2_16_rear_wheel_end import pair_audit


class TestRearBrakeDrive(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.parts = source_parts()

    def test_eight_independent_valid_solids(self):
        self.assertEqual(len(self.parts), 8)
        self.assertEqual(len(set(self.parts)), 8)
        self.assertTrue(all(k.startswith(PREFIX) for k in self.parts))
        self.assertTrue(all(v.isValid() and len(v.Solids()) == 1 for v in self.parts.values()))

    def test_real_rotor_caliper_separated_by_static_clearance(self):
        combined = {**p216_parts(), **self.parts}
        a = pair_audit(combined)
        self.assertEqual(a['solidPairs'], 465)
        self.assertEqual(a['exactBrepPairs'] + a['broadphaseExcluded'], 465)
        self.assertTrue(a['passStatic'], a['unresolvedOverlap'])
        self.assertFalse(a['mechanicalG2Certified'])

    def test_material_role_mapping(self):
        self.assertEqual(_role(PREFIX+'BRAKE_PAD_INBOARD'),'friction-pad')
        self.assertEqual(_role(PREFIX+'BRAKE_CALIPER_CAST_BODY'),'caliper')
        self.assertEqual(_role(PREFIX+'CV_BOOT_ENVELOPE'),'rear-joint')
        self.assertEqual(_role(PREFIX+'DRIVE_HALF_SHAFT_UNSPLINED'),'hardware')

    def test_cad_export_and_mesh_policy(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)/'p217'
            manifest=build(root)
            self.assertEqual(manifest['nativeSolids'],8)
            self.assertEqual(len(cq.importers.importStep(str(root/manifest['source']['step'])).solids().vals()),8)
            self.assertTrue(manifest['crossP216StaticAudit']['passStatic'])
            for field in ('modelBRearStationMeasured','crossP29P210P212P214Verified',
                          'functionalCVJointClaim','mechanicalG2Certified'):
                self.assertFalse(manifest[field])
            self.assertEqual(manifest['materialBaseColor'],'#87929d')
            counts=[]
            for level,profile in manifest['qualityProfiles'].items():
                geometry=trimesh.load(root/profile['file'],force='scene')
                self.assertEqual(len(geometry.geometry),8,level)
                self.assertEqual(set(geometry.graph.nodes_geometry),set(manifest['sourcePartIds']))
                self.assertTrue(all(m.is_watertight for m in geometry.geometry.values()))
                colors={tuple(int(v) for v in g.visual.material.baseColorFactor)
                        for g in geometry.geometry.values()}
                self.assertEqual(colors,{(135,146,157,255)})
                counts.append(profile['triangles'])
            self.assertGreater(counts[0],counts[1])
            self.assertGreater(counts[1],counts[2])
            with self.assertRaises(FileExistsError):
                build(root)


if __name__ == '__main__':
    unittest.main(verbosity=2)
