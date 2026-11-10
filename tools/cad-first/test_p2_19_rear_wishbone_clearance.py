"""P2.19 source-first regression: P2.10 arm-to-P2.16 rear rim exact B-Rep fit."""
from pathlib import Path
import tempfile
import unittest

import cadquery as cq
import trimesh

from p2_9_rear_upright import DATUMS_MM
from p2_10_rear_wishbone import ARM_PICKUPS_MM, build_parts as p210_parts
from p2_16_rear_wheel_end import parts as p216_parts
from p2_19_rear_wishbone_clearance import (
    ARMS, revised_arm, revised_suspension, full_source_audit, build,
)


class TestP219RearWishboneClearance(unittest.TestCase):
    def test_original_rim_collision_reproduced_and_repaired(self):
        old = p210_parts()
        rim = p216_parts()['P216_REAR_FORGED_RIM_10_SPOKE']
        actual = {key: old[key].intersect(rim).Volume() for key in ARMS}
        self.assertGreater(actual[ARMS[0]], 400)
        self.assertGreater(actual[ARMS[1]], 150)
        for name in ARMS:
            fixed = revised_arm(name.split('_')[2])
            self.assertTrue(fixed.isValid())
            self.assertEqual(len(fixed.Solids()), 1)
            self.assertLess(fixed.intersect(rim).Volume(), .05)

    def test_hardpoint_coordinates_and_part_names_retained(self):
        entries = revised_suspension()
        self.assertEqual(len(entries),11)
        self.assertEqual(len(set(entries)),11)
        self.assertEqual(ARM_PICKUPS_MM['UPPER']['outerUprightBore'],DATUMS_MM['upperClevisBore'])
        self.assertEqual(ARM_PICKUPS_MM['LOWER']['outerUprightBore'],DATUMS_MM['lowerClevisBore'])
        self.assertIn(ARMS[0],entries)
        self.assertIn(ARMS[1],entries)

    def test_full_43_source_static_pair_screen(self):
        source, audit = full_source_audit()
        self.assertEqual(len(source), 43)
        self.assertEqual(audit['solidPairs'],903)
        self.assertEqual(audit['broadphaseExcluded'] + audit['exactBrepPairs'],903)
        self.assertTrue(audit['passStatic'],audit['unresolvedOverlap'])
        self.assertFalse(audit['rearOriginalModelBFitCertified'])
        self.assertFalse(audit['modelBHardpointsMeasured'])
        self.assertFalse(audit['mechanicalG2Certified'])

    def test_step_and_monochrome_lod_source(self):
        with tempfile.TemporaryDirectory() as temp:
            out=Path(temp)/'p219'
            manifest=build(out)
            self.assertEqual(manifest['revisedPartCount'], 2)
            self.assertFalse(manifest['mechanicalG2Certified'])
            self.assertEqual(manifest['materialBaseColor'],'#87929d')
            imported=cq.importers.importStep(str(out/manifest['nativeStep']['file'])).solids().vals()
            self.assertEqual(len(imported),2)
            self.assertTrue(all(s.isValid() for s in imported))
            triangles=[]
            for quality, profile in manifest['profiles'].items():
                scene=trimesh.load(out/profile['file'],force='scene')
                self.assertEqual(set(scene.graph.nodes_geometry),set(ARMS))
                self.assertTrue(all(g.is_watertight for g in scene.geometry.values()),quality)
                colors={tuple(int(c) for c in g.visual.material.baseColorFactor) for g in scene.geometry.values()}
                self.assertEqual(colors,{(135,146,157,255)})
                triangles.append(profile['triangles'])
            self.assertGreater(triangles[0],triangles[1])
            self.assertGreater(triangles[1],triangles[2])
            with self.assertRaises(FileExistsError): build(out)

    def test_invalid_side_cannot_create_fake_arm(self):
        with self.assertRaises(ValueError):revised_arm('LEFT')


if __name__=='__main__': unittest.main(verbosity=2)
