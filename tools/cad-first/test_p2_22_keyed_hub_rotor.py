"""Native P2.22 source regression: hub/rotor fit, four keyed interfaces and QA."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import tempfile
import unittest

import cadquery as cq
import trimesh

from p2_22_keyed_hub_rotor import (
    HUB,HAT,ROTOR,SEAL,KEY_COUNT,broached_hat,keyed_hub,
    native_revisions,joined_source,native_distance,build,
)
from p2_21_rear_rotor_mount import repaired_source as prior_source


class TestP222KeyedRearRotor(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.previous,_,_=prior_source()
        cls.current,cls.changes,cls.audit=joined_source()

    def test_original_gap_fixed_by_actual_brep_contact(self):
        self.assertAlmostEqual(native_distance(self.previous[HUB],self.previous[HAT]),.4,places=4)
        self.assertLess(native_distance(self.current[HUB],self.current[HAT]),1e-4)
        self.assertLess(native_distance(self.current[HAT],self.current[ROTOR]),1e-4)
        self.assertEqual(KEY_COUNT,4)
        self.assertEqual(len(self.current),40)
        self.assertEqual(set(self.changes),{HUB,HAT,SEAL})

    def test_native_nominal_brep_clearance_and_positive_rotation_control(self):
        native=self.audit['nominalStaticAudit']
        self.assertEqual(native['solidPairs'],780)
        self.assertEqual(native['exactBrepPairs'],146)
        self.assertTrue(native['passStatic'])
        self.assertEqual(native['unresolvedOverlap'],[])
        self.assertGreater(self.audit['angularNegativeControlIntersectionMm3'],20)
        self.assertFalse(self.audit['transmittedTorqueCertified'])
        self.assertFalse(self.audit['functionalSealCertified'])
        self.assertFalse(self.audit['mechanicalG2Certified'])
        # The keyways have nominal clearance; a forced 0.5-degree rotation
        # is detected as *interference*, not accepted as free wheel spin.
        displaced=self.current[HAT].rotate((0,0,0),(0,0,1),0.5)
        self.assertGreater(self.current[HUB].intersect(displaced).Volume(),20)
        self.assertLess(self.current[HUB].intersect(self.current[HAT]).Volume(),.05)

    def test_three_connected_source_solids_and_seal_envelope_truth(self):
        self.assertTrue(all(x.isValid() and len(x.Solids())==1 for x in self.changes.values()))
        self.assertLess(self.changes[SEAL].BoundingBox().zmax,-94.9)
        self.assertFalse(self.audit['positiveCenterLockRetentionCertified'])
        self.assertFalse(self.audit['authenticModelBWheelStationMeasured'])

    def test_fail_closed_missing_owner_and_wrong_collar(self):
        with self.assertRaisesRegex(ValueError,'Missing P2.21 source owner'):
            native_revisions({HUB:self.previous[HUB]})

    def test_step_three_tier_mesh_color_and_no_overwrite(self):
        with tempfile.TemporaryDirectory() as directory:
            output=Path(directory)/'p222'
            report=build(output)
            self.assertEqual(report['nativeSTEPsolids'],3)
            self.assertEqual(report['uniformColor'],'#87929d')
            step=output/report['nativeSTEP']
            self.assertEqual(hashlib.sha256(step.read_bytes()).hexdigest(),report['nativeSTEPhash'])
            imported=cq.importers.importStep(str(step)).solids().vals()
            self.assertEqual(len(imported),3)
            self.assertTrue(all(s.isValid() for s in imported))
            faces=[]
            for tier,record in report['qualityProfiles'].items():
                glb=output/record['file']
                self.assertEqual(hashlib.sha256(glb.read_bytes()).hexdigest(),record['sha256'])
                scene=trimesh.load(glb,force='scene')
                self.assertEqual(set(scene.graph.nodes_geometry),set(self.changes),tier)
                self.assertTrue(all(m.is_watertight for m in scene.geometry.values()))
                self.assertEqual({tuple(int(v) for v in m.visual.material.baseColorFactor)
                                  for m in scene.geometry.values()},{(135,146,157,255)})
                faces.append(record['triangles'])
            self.assertGreater(faces[0],faces[1])
            self.assertGreater(faces[1],faces[2])
            with self.assertRaises(FileExistsError):build(output)


if __name__=='__main__':
    unittest.main(verbosity=2)
