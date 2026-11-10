"""P2.21 reference rear32 + native 11-source composite regression."""
import json
from pathlib import Path
import tempfile
import unittest
import trimesh
from p2_21_rear_rotor_mount import build as p221_build,ROTOR,HAT,SEAL
from p2_21_composite_review import composite

class TestP221Composite(unittest.TestCase):
    def test_40_part_glb_identity_and_source_tamper(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            original=Path(__file__).resolve().parents[2]/'p218'/'rear32-review'
            if not (original/'P218_rear32_neutral_review_manifest.json').exists():
                self.skipTest('Authentic P2.18 rear32 ZIP not available: no surrogate accepted')
            p221_build(root/'p221')
            report=composite(original,root/'p221',root/'joined')
            self.assertEqual(report['partCount'],40)
            self.assertEqual(report['newFastenerCount'],8)
            self.assertEqual(set(report['replacedOldIds']),{ROTOR,HAT,SEAL})
            self.assertFalse(report['originalModelBIncluded'])
            self.assertFalse(report['mechanicalG2Certified'])
            tris=[]
            for tier,record in report['profiles'].items():
                scene=trimesh.load(root/'joined'/record['file'],force='scene')
                self.assertEqual(set(scene.graph.nodes_geometry),set(report['partIds']))
                self.assertEqual(len(scene.geometry),40)
                self.assertEqual({tuple(int(v) for v in g.visual.material.baseColorFactor)
                                  for g in scene.geometry.values()}, {(135,146,157,255)})
                tris.append(record['triangles'])
            self.assertGreater(tris[0],tris[1])
            self.assertGreater(tris[1],tris[2])
            with self.assertRaises(FileExistsError):
                composite(original,root/'p221',root/'joined')
            meta=json.loads((root/'p221'/'P221_rear_rotor_hat_manifest.json').read_text())
            item=meta['qualityProfiles']['BALANCED']
            bad=root/'p221'/item['file']
            bad.write_bytes(bad.read_bytes()+b'bad')
            with self.assertRaisesRegex(ValueError,'SHA-256 mismatch'):
                composite(original,root/'p221',root/'tampered')

if __name__=='__main__':unittest.main(verbosity=2)
