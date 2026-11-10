"""Independent static source regression for P2.18 native helical rear center-lock."""
from __future__ import annotations

import json
from pathlib import Path
import tempfile
import unittest

import cadquery as cq
import trimesh

from p2_16_rear_wheel_end import parts as p216_parts
from p2_18_center_lock import (
    OLD_NUT, SPINDLE, NUT, PITCH_MM, build, combined_static_study,
    female_nut, male_spindle, source_parts,
)


class TestP218ThreadedCenterLock(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.parts = source_parts()

    def test_two_distinct_helical_brep_solids(self):
        self.assertEqual(set(self.parts), {SPINDLE, NUT})
        for body in self.parts.values():
            self.assertTrue(body.isValid())
            self.assertEqual(len(body.Solids()), 1)
            self.assertGreater(body.Volume(), 1000)
        # Both helical feature sets produce genuine curved CAD faces,
        # rather than a shader bump with unchanged B-Rep.
        self.assertGreaterEqual(len(self.parts[SPINDLE].Faces()), 15)
        self.assertGreaterEqual(len(self.parts[NUT].Faces()), 15)
        self.assertEqual(PITCH_MM, 3.0)

    def test_static_female_male_engagement_clearance(self):
        intersection=self.parts[SPINDLE].intersect(self.parts[NUT])
        self.assertLess(intersection.Volume(), .05)
        self.assertLess(self.parts[SPINDLE].BoundingBox().xlen, 50)
        self.assertGreater(self.parts[NUT].BoundingBox().xlen, 75)
        self.assertLess(self.parts[NUT].BoundingBox().zlen, 20)

    def test_prior_31_source_remains_unchanged_and_old_proxy_removed(self):
        base=p216_parts()
        self.assertIn(OLD_NUT,base)
        combined,audit=combined_static_study()
        self.assertEqual(len(combined),32)
        self.assertEqual(audit['solidPairs'],496)
        self.assertEqual(audit['broadphaseExcluded']+audit['exactBrepPairs'],496)
        self.assertTrue(audit['passStatic'])
        self.assertEqual(audit['unresolvedOverlap'],[])
        self.assertNotIn(OLD_NUT,combined)
        self.assertIn(SPINDLE,combined)
        self.assertIn(NUT,combined)
        self.assertFalse(audit['dynamicMechanicalG2Certified'])

    def test_step_and_glb_quality_profiles(self):
        with tempfile.TemporaryDirectory() as root:
            directory=Path(root)/'p218'
            manifest=build(directory)
            self.assertEqual(manifest['newCadSolids'],2)
            self.assertEqual(manifest['reviewAssemblySolids'],32)
            self.assertTrue(manifest['actualHelicalNativeBrep'])
            self.assertFalse(manifest['trueThreadEngagementCertified'])
            self.assertFalse(manifest['mechanicalG2Certified'])
            self.assertFalse(manifest['fullModelBIntegrated'])
            step=directory/manifest['nativeStep']['file']
            shapes=cq.importers.importStep(str(step)).solids().vals()
            self.assertEqual(len(shapes),2)
            self.assertTrue(all(shape.isValid() for shape in shapes))
            faces=[]
            for tier,profile in manifest['profiles'].items():
                scene=trimesh.load(directory/profile['file'],force='scene')
                self.assertEqual(set(scene.graph.nodes_geometry),{SPINDLE,NUT})
                self.assertTrue(all(g.is_watertight and g.is_winding_consistent for g in scene.geometry.values()),tier)
                rgba={tuple(int(v) for v in mesh.visual.material.baseColorFactor)
                      for mesh in scene.geometry.values()}
                self.assertEqual(rgba,{(135,146,157,255)})
                faces.append(profile['triangles'])
            self.assertGreater(faces[0],faces[1])
            self.assertGreater(faces[1],faces[2])
            with self.assertRaises(FileExistsError):
                build(directory)


if __name__=='__main__':
    unittest.main(verbosity=2)
