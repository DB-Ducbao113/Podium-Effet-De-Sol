"""P2.19 43-part mono material source review and source tamper regression."""
import json
import os
from pathlib import Path
import tempfile
import unittest
import trimesh

from p2_19_rear_wishbone_clearance import build as build_p219
from p2_19_composite_review import composite


class TestP219Composite(unittest.TestCase):
    def test_source_43_identity_three_lods_and_sha_guards(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)
            # The reference review uses an already SHA-verified independent
            # P2.18 rear32 bundle; never fabricates it when missing.
            base=Path(os.environ.get('PEDS_REAR32_REVIEW_DIR', str(
                Path(__file__).resolve().parents[2]/'p218-review')))
            if not (base/'P218_rear32_neutral_review_manifest.json').is_file():
                self.skipTest('P2.18 owner binary not available: complete source review remains HOLD')
            # build() expects its own empty folder.
            build_p219(root/'native')
            result=composite(base,root/'native',root/'view')
            self.assertEqual(result['partCount'],43)
            self.assertFalse(result['originalModelBIncluded'])
            self.assertFalse(result['mechanicalG2Certified'])
            tris=[]
            for tier,row in result['profiles'].items():
                shape=trimesh.load(root/'view'/row['file'],force='scene')
                self.assertEqual(len(shape.graph.nodes_geometry),43,tier)
                self.assertEqual(set(shape.graph.nodes_geometry),set(result['partIds']))
                self.assertTrue(all(mesh.is_watertight for mesh in shape.geometry.values()))
                colors={tuple(int(v) for v in g.visual.material.baseColorFactor)
                        for g in shape.geometry.values()}
                self.assertEqual(colors,{(135,146,157,255)})
                tris.append(row['triangles'])
            self.assertGreater(tris[0],tris[1])
            self.assertGreater(tris[1],tris[2])
            with self.assertRaises(FileExistsError):composite(base,root/'native',root/'view')
            manifest=json.loads((root/'native'/'P219_rear_wishbone_manifest.json').read_text())
            path=root/'native'/manifest['profiles']['BALANCED']['file']
            path.write_bytes(path.read_bytes()+b'damaged')
            with self.assertRaisesRegex(ValueError,'digest mismatch'):
                composite(base,root/'native',root/'broken')


if __name__=='__main__':unittest.main(verbosity=2)
