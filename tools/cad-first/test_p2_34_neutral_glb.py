"""P2.34 SHA-authenticated 76-node THREE-tier neutral GLB tests."""
from __future__ import annotations
import json,os,unittest,tempfile,shutil
from pathlib import Path
import trimesh
from p2_34_rear76_neutral_preview import sha,compose,CHANGED,RGBA

BASE=Path(os.environ.get('PEDS_P234_PACKAGE_ROOT',str(Path(__file__).resolve().parents[1])))

class TestP234NeutralGLB(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.root=BASE/'review'
        cls.src=BASE/'p233-preview'
        cls.native=BASE/'native'
        cls.meta=json.loads((cls.root/'P234_rear76_neutral_preview_manifest.json').read_text())
        cls.old=json.loads((cls.src/'P233_rear76_source_preview_manifest.json').read_text())

    def test_three_source_named_tiers_neutral_and_watertight(self):
        self.assertEqual(self.meta['status'],'REAL_NATIVE_TWO_PART_REPLACEMENT_76_SOURCE_GLBS_PASS_G2_HOLD')
        self.assertEqual(set(self.meta['partIds']),set(self.old['partIds']))
        self.assertEqual(self.meta['reusedOriginalP233VisualMeshes'],74)
        self.assertEqual(set(self.meta['revisedNativePartIds']),CHANGED)
        self.assertFalse(self.meta['mechanicalG2Certified'])
        tri=[]
        for tier,item in self.meta['profiles'].items():
            glb=self.root/item['file'];self.assertEqual(sha(glb),item['sha256'])
            scene=trimesh.load(glb,force='scene')
            self.assertEqual(set(scene.graph.nodes_geometry),set(self.meta['partIds']))
            self.assertEqual(len(scene.geometry),76)
            self.assertTrue(all(g.is_watertight and g.is_winding_consistent for g in scene.geometry.values()))
            self.assertEqual({tuple(map(int,g.visual.material.baseColorFactor)) for g in scene.geometry.values()},{RGBA})
            tri.append(item['triangles'])
        self.assertGreater(tri[0],tri[1]);self.assertGreater(tri[1],tri[2])

    def test_modified_shapes_differ_but_74_other_source_meshes_unchanged(self):
        before=trimesh.load(self.src/self.old['profiles']['BALANCED']['file'],force='scene')
        after=trimesh.load(self.root/self.meta['profiles']['BALANCED']['file'],force='scene')
        for name in self.meta['partIds']:
            _,origkey=before.graph[name];_,newkey=after.graph[name]
            if name in CHANGED:
                self.assertNotEqual(before.geometry[origkey].identifier_hash,
                                    after.geometry[newkey].identifier_hash)
            else:
                self.assertEqual(before.geometry[origkey].identifier_hash,
                                 after.geometry[newkey].identifier_hash)

    def test_wrong_glb_sha_does_not_produce_output(self):
        with tempfile.TemporaryDirectory() as tmp:
            fake=Path(tmp)/'fake';shutil.copytree(self.src,fake)
            target=fake/self.old['profiles']['BALANCED']['file']
            target.write_bytes(target.read_bytes()+b'TAMPER')
            with self.assertRaisesRegex(ValueError,'SHA mismatch'):
                compose(fake,self.native,Path(tmp)/'blocked')
            self.assertFalse((Path(tmp)/'blocked').exists())
            with self.assertRaises(FileExistsError):compose(self.src,self.native,self.root)

if __name__=='__main__':unittest.main(verbosity=2)
