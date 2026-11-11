"""P2.28 original B-Rep halfshaft-hub nominal fit and independently exported STEP QA."""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import unittest

import cadquery as cq
import trimesh

from p2_28_halfshaft_hub_connection import (
    audit_source,HUB,SHAFT,CV,KEY_COUNT,native_distance,SCHEMA,build,
)

OUT=Path(os.environ.get('PEDS_P228_NATIVE_DIR', str(Path(__file__).resolve().parents[2]/'.local-assets/cad-first/p228-native')))

class TestP228Native(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.parts,cls.changed,cls.report=audit_source()

    def test_original_gap_and_new_seated_shouldered_fit(self):
        self.assertAlmostEqual(self.report['originalShaftToHubDistanceMm'],104,places=4)
        self.assertAlmostEqual(native_distance(self.parts[SHAFT],self.parts[HUB]),0,places=5)
        self.assertEqual(KEY_COUNT,4)
        self.assertEqual(set(self.changed),{HUB,SHAFT})
        self.assertEqual(len(self.parts),40)
        self.assertTrue(all(s.isValid() and len(s.Solids())==1 for s in self.changed.values()))

    def test_real_nominal_collision_and_angular_negative_control(self):
        audit=self.report['nativeStaticAudit']
        self.assertTrue(audit['passStatic'])
        self.assertEqual(audit['solidPairs'],780)
        self.assertEqual(audit['exactBrepPairs'],153)
        self.assertEqual(audit['unresolvedOverlap'],[])
        self.assertLess(self.parts[SHAFT].intersect(self.parts[HUB]).Volume(),.05)
        self.assertGreater(self.report['forcedRotationInterferenceMm3'],40)
        self.assertGreater(self.parts[SHAFT].rotate((0,0,0),(0,0,1),2).intersect(self.parts[HUB]).Volume(),40)

    def test_cv_and_axial_retention_remain_held(self):
        self.assertAlmostEqual(native_distance(self.parts[SHAFT],self.parts[CV]),2.6,places=4)
        self.assertAlmostEqual(self.report['shaftToCvBootRemainingGapMm'],4.6,places=4)
        self.assertFalse(self.report['realCvJointEngagementCertified'])
        self.assertFalse(self.report['axialClampingCertified'])
        self.assertFalse(self.report['mechanicalG2Certified'])
        self.assertFalse(self.report['originalModelBIntegrated'])

    def test_independent_native_step_roundtrip_and_three_source_lods(self):
        if not (OUT/'P228_halfshaft_hub_manifest.json').is_file():
            self.fail('Standalone original P2.28 native STEP/GLB bundle missing')
        document=json.loads((OUT/'P228_halfshaft_hub_manifest.json').read_text())
        self.assertEqual(document['schema'],SCHEMA)
        self.assertEqual(document['nativePartCount'],2)
        step=OUT/document['sourceSTEP']
        self.assertEqual(hashlib.sha256(step.read_bytes()).hexdigest(),document['sourceSTEPsha256'])
        solids=cq.importers.importStep(str(step)).solids().vals()
        self.assertEqual(len(solids),2)
        self.assertTrue(all(s.isValid() for s in solids))
        sizes=[]
        for tier,info in document['profiles'].items():
            glb=OUT/info['file']
            self.assertEqual(hashlib.sha256(glb.read_bytes()).hexdigest(),info['sha256'])
            scene=trimesh.load(glb,force='scene')
            self.assertEqual(set(scene.graph.nodes_geometry),{HUB,SHAFT},tier)
            self.assertTrue(all(m.is_watertight for m in scene.geometry.values()))
            self.assertEqual({tuple(int(c) for c in m.visual.material.baseColorFactor) for m in scene.geometry.values()},
                             {(135,146,157,255)})
            sizes.append(info['triangles'])
        self.assertGreater(sizes[0],sizes[1]);self.assertGreater(sizes[1],sizes[2])
        with self.assertRaises(FileExistsError):build(OUT)

    def test_authored_source_immutability(self):
        self.assertEqual(set(self.changed), {HUB,SHAFT})
        self.assertEqual(self.report['source40Solids'],40)
        self.assertFalse(self.report['originalFilesModified'])

if __name__=='__main__':unittest.main(verbosity=2)
