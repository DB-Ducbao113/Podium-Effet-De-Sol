"""P2.23 genuine P2.22/P2.18 rear B-Rep source regression; no OEM claim."""
from __future__ import annotations

import hashlib
from pathlib import Path
import tempfile
import unittest
import os

import cadquery as cq
import trimesh

from p2_18_center_lock import SPINDLE
from p2_22_keyed_hub_rotor import HUB, joined_source as previous_source
from p2_23_spindle_hub_keyed_mate import (
    KEYS, SCHEMA, TENON_OUTER_RADIUS_MM, HUB_BORE_RADIUS_MM,
    joined_source_223, revised_parts, build,
)


class TestP223SpindleHub(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.base, _, _ = previous_source()
        cls.joined, cls.changed, cls.proof = joined_source_223()

    def test_real_original_thread_survives_as_brep(self):
        self.assertEqual(set(self.changed), {HUB, SPINDLE})
        self.assertEqual(len(self.joined), 40)
        self.assertEqual(len(set(self.joined)), 40)
        self.assertEqual(KEYS, 4)
        self.assertAlmostEqual(self.proof['originalHelixMissingVolumeMm3'], 0, places=5)
        self.assertGreater(self.changed[SPINDLE].Volume(), self.base[SPINDLE].Volume())
        self.assertLess(self.changed[HUB].Volume(), self.base[HUB].Volume())
        self.assertTrue(all(shape.isValid() and len(shape.Solids()) == 1
                            for shape in self.changed.values()))

    def test_native_40body_static_interference(self):
        audit = self.proof['nativeStaticAudit']
        self.assertTrue(audit['passStatic'], audit['unresolvedOverlap'])
        self.assertEqual(audit['solidPairs'], 780)
        self.assertEqual(audit['broadphaseExcluded'] + audit['exactBrepPairs'], 780)
        self.assertEqual(audit['exactBrepPairs'], 146)
        self.assertEqual(audit['unresolvedOverlap'], [])
        self.assertLess(self.proof['nominalNativeHubSpindleOverlapMm3'], .05)
        self.assertFalse(self.proof['mechanicalG2Certified'])
        self.assertFalse(self.proof['axialRetentionCertified'])
        self.assertFalse(self.proof['p220Original63BodyCrossSourcePassed'])

    def test_four_key_bore_clearance_and_angular_negative_control(self):
        self.assertAlmostEqual(HUB_BORE_RADIUS_MM-TENON_OUTER_RADIUS_MM, .35, places=5)
        self.assertAlmostEqual(self.proof['radialTenonToBoreClearanceMm'], .35, places=5)
        self.assertEqual(self.proof['keyGrooveDimensionsMm'], [3.8, 5.4, 14.3])
        self.assertEqual(self.proof['keyTabDimensionsMm'], [3.0, 4.2, 13.2])
        self.assertLess(self.proof['originalHubSpindleForcedOverlapMm3'], .05)
        self.assertGreater(self.proof['forcedRotationNativeOverlapMm3'], 5)
        twisted = self.joined[SPINDLE].rotate((0,0,0),(0,0,1),2.0)
        self.assertGreater(self.joined[HUB].intersect(twisted).Volume(), 5)
        self.assertLess(self.joined[HUB].intersect(self.joined[SPINDLE]).Volume(), .05)

    def test_missing_owners_and_invalid_dimensions_cannot_be_published(self):
        with self.assertRaisesRegex(ValueError, 'Missing original'):
            revised_parts({HUB:self.base[HUB]})
        self.assertFalse(self.proof['transmittedTorqueCertified'])
        self.assertFalse(self.proof['bearingPreloadCertified'])

    def test_real_step_roundtrip_three_lod_and_one_gray(self):
        # Validate the exact output of the independent author CLI. Running a
        # second heavyweight OCC source export within this process may hang.
        output=Path(os.environ.get('PEDS_P223_NATIVE_DIR', str(
            Path(__file__).resolve().parents[2]/'.local-assets/cad-first/p223-native')))
        if not (output/'P223_rear_keyed_spindle_hub_manifest.json').is_file():
            self.skipTest('Actual standalone P2.23 CLI outputs not present; cannot substitute fixture')
        import json
        result=json.loads((output/'P223_rear_keyed_spindle_hub_manifest.json').read_text())
        self.assertEqual(result['schema'], SCHEMA)
        self.assertEqual(result['nativeRevisedSolids'], 2)
        self.assertEqual(result['preservedReviewBodyCount'], 40)
        self.assertEqual(result['materialColor'], '#87929d')
        self.assertFalse(result['originalModelBIntegrated'])
        info=result['sourceSTEP']
        step=output/info['file']
        self.assertEqual(hashlib.sha256(step.read_bytes()).hexdigest(), info['sha256'])
        solids=cq.importers.importStep(str(step)).solids().vals()
        self.assertEqual(len(solids), 2)
        self.assertTrue(all(b.isValid() for b in solids))
        triangles=[]
        for quality, profile in result['profiles'].items():
            file=output/profile['file']
            self.assertEqual(hashlib.sha256(file.read_bytes()).hexdigest(),profile['sha256'])
            scene=trimesh.load(file,force='scene')
            self.assertEqual(set(scene.graph.nodes_geometry), {HUB,SPINDLE},quality)
            self.assertEqual(len(scene.geometry),2)
            self.assertTrue(all(g.is_watertight for g in scene.geometry.values()))
            self.assertEqual({tuple(int(v) for v in g.visual.material.baseColorFactor)
                              for g in scene.geometry.values()},{(135,146,157,255)})
            triangles.append(profile['triangles'])
        self.assertGreater(triangles[0],triangles[1])
        self.assertGreater(triangles[1],triangles[2])
        with self.assertRaises(FileExistsError):build(output)


if __name__=='__main__':unittest.main(verbosity=2)
