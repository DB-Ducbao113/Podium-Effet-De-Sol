"""Offline native B-Rep and glTF source gates for P2.16 independent rear wheel."""
import json
import math
import tempfile
import unittest
from pathlib import Path

import cadquery as cq
import trimesh

from p2_16_rear_wheel_end import (
    PREFIX, QUALITY, TYRE_DIAMETER_MM, TYRE_WIDTH_MM, TYRE_TREAD_WIDTH_MM,
    REAR_UPRIGHT_PROPOSAL_BORE_RADIUS_MM, axial_ring,
    build, pair_audit, parts, neutral_palette, rear_part_material_role,
)


class TestP216NativeRearWheelEnd(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog = parts()

    def test_exact_connected_brep_count(self):
        self.assertEqual(len(self.catalog), 23)
        self.assertEqual(len(set(self.catalog)), 23)
        self.assertTrue(all(shape.isValid() and len(shape.Solids()) == 1
                            for shape in self.catalog.values()))
        self.assertIn(PREFIX + 'FORGED_RIM_10_SPOKE', self.catalog)
        self.assertIn(PREFIX + 'TYRE_SLICK', self.catalog)

    def test_rear_source_tyre_envelope(self):
        tyre = self.catalog[PREFIX + 'TYRE_SLICK']
        bbox = tyre.BoundingBox()
        self.assertAlmostEqual(bbox.xlen, TYRE_DIAMETER_MM, delta=.001)
        self.assertAlmostEqual(bbox.ylen, TYRE_DIAMETER_MM, delta=.001)
        self.assertAlmostEqual(bbox.zlen, TYRE_WIDTH_MM, delta=.001)
        self.assertTrue(any(face.geomType() == 'CYLINDER' and
                            abs(face.BoundingBox().zlen - TYRE_TREAD_WIDTH_MM) < .01
                            for face in tyre.Faces()))
        self.assertAlmostEqual(self.catalog[PREFIX+'FORGED_RIM_10_SPOKE'].BoundingBox().xlen,
                               490.6, delta=.001)

    def test_p29_nominal_bearing_geometry_only(self):
        # A dimensional guard, NOT real P2.9 cross-source clearance proof.
        carrier_radius = REAR_UPRIGHT_PROPOSAL_BORE_RADIUS_MM
        self.assertLess(70.8, carrier_radius)
        self.assertGreater(58.5, 57.6)
        self.assertGreater(65.0, 61.5 + 2 * 1.60)

    def test_native_pair_clearances(self):
        result = pair_audit(self.catalog)
        self.assertTrue(result['passStatic'], result['unresolvedOverlap'])
        self.assertEqual(result['solidPairs'], 253)
        self.assertEqual(result['exactBrepPairs'] + result['broadphaseExcluded'], 253)
        self.assertFalse(result['mechanicalG2Certified'])

    def test_uniform_color_across_all_cad_roles(self):
        palette, rgba = neutral_palette()
        self.assertEqual(palette['schema'], 'peds.engineering.neutral-materials.v1')
        self.assertEqual(rgba, [135, 146, 157, 255])
        self.assertEqual({rear_part_material_role(name) for name in self.catalog} >=
                         {'tyre', 'rim', 'hub', 'bearing', 'hardware', 'carbon-brake'}, True)

    def test_glb_and_step_export_roundtrip(self):
        with tempfile.TemporaryDirectory() as directory:
            out = Path(directory) / 'rear-source'
            manifest = build(out)
            self.assertEqual(manifest['nativeStepRoundTripSolids'], 23)
            self.assertFalse(manifest['ownerModelBRearEnvelopeMeasured'])
            self.assertFalse(manifest['rearWheelStationMated'])
            self.assertFalse(manifest['rearUprightChassisMateCertified'])
            self.assertEqual(len(cq.importers.importStep(str(out / manifest['masterSTEP'])).solids().vals()), 23)
            self.assertTrue((out / 'P216_static_audit.json').exists())
            triangles = []
            for profile in QUALITY:
                record = manifest['profiles'][profile]
                data = trimesh.load(out / record['file'], force='scene')
                self.assertEqual(len(data.geometry), 23)
                self.assertEqual(set(data.graph.nodes_geometry), set(manifest['partIds']))
                self.assertTrue(all(mesh.is_watertight and mesh.is_winding_consistent
                                    for mesh in data.geometry.values()))
                self.assertAlmostEqual(data.extents[2], .45, delta=.001)
                material_colors = {
                    tuple(int(v) for v in mesh.visual.material.baseColorFactor)
                    for mesh in data.geometry.values()
                }
                self.assertEqual(material_colors, {(135, 146, 157, 255)})
                triangles.append(record['triangles'])
            self.assertGreater(triangles[0], triangles[1])
            self.assertGreater(triangles[1], triangles[2])

    def test_negative_source_shape(self):
        with self.assertRaises(ValueError):
            axial_ring(80, 70, 0, 5)
        with self.assertRaises(ValueError):
            axial_ring(60, 70, 0, -5)


if __name__ == '__main__':
    unittest.main(verbosity=2)
