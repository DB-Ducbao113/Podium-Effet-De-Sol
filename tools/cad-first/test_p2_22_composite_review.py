"""P2.22 native 40-part GLB provenance, material and anti-tamper regression."""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import tempfile
import unittest

import trimesh

from p2_22_composite_review import compose
from p2_22_keyed_hub_rotor import build, HUB, HAT, SEAL


class TestP222SourceReview(unittest.TestCase):
    def test_exact_40_native_source_meshes_three_tiers_and_tamper_rejected(self):
        prior=Path(os.environ.get('PEDS_P221_REAR40_DIR', str(
            Path(__file__).resolve().parents[2]/'.local-assets/cad-first/p221-rear40-review')))
        if not (prior/'P221_rear40_neutral_review_manifest.json').is_file():
            self.skipTest('Original P2.21 source bundle unavailable; no fabricated replacement')
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)
            native=root/'native'
            build(native)
            review=root/'preview'
            record=compose(prior,native,review)
            self.assertEqual(record['partCount'],40)
            self.assertEqual(set(record['replacedIds']),{HUB,HAT,SEAL})
            self.assertEqual(record['uniformColor'],'#87929d')
            self.assertFalse(record['originalModelBIncluded'])
            self.assertFalse(record['mechanicalG2Certified'])
            tris=[]
            for tier,info in record['qualityProfiles'].items():
                file=review/info['file']
                self.assertEqual(hashlib.sha256(file.read_bytes()).hexdigest(),info['sha256'])
                scene=trimesh.load(file,force='scene')
                self.assertEqual(len(scene.graph.nodes_geometry),40,tier)
                self.assertEqual(set(scene.graph.nodes_geometry),set(record['partIds']))
                self.assertTrue(all(m.is_watertight for m in scene.geometry.values()))
                self.assertEqual({tuple(int(v) for v in m.visual.material.baseColorFactor)
                                  for m in scene.geometry.values()},{(135,146,157,255)})
                tris.append(info['triangles'])
            self.assertGreater(tris[0],tris[1])
            self.assertGreater(tris[1],tris[2])
            with self.assertRaises(FileExistsError):compose(prior,native,review)
            ref=json.loads((native/'P222_keyed_hub_hat_manifest.json').read_text())
            p=native/ref['qualityProfiles']['BALANCED']['file']
            p.write_bytes(p.read_bytes()+b'tamper')
            with self.assertRaisesRegex(ValueError,'SHA-256 mismatch'):
                compose(prior,native,root/'tampered')


if __name__=='__main__':
    unittest.main(verbosity=2)
