"""P2.25 actual user-provided CAD GLBs; SHA pinned, no synthetic source claim."""
from __future__ import annotations
import json
import os
import shutil
from pathlib import Path
import tempfile
import unittest

import trimesh

from p2_25_rear51_mesh_review import (
    compose,load_manifest,owner_partition,aabb_cross_source_audit,load_scene,
    OLD_SCHEMA, NEW_SCHEMA, EXPECTED_REVISIONS,
)

DATA=Path(os.environ.get('PEDS_P225_SOURCES', str(Path(__file__).resolve().parents[2]/'.local-assets/cad-first/p225-sources')))

class TestP225OwnerGLB(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.a=DATA/'rear43';cls.b=DATA/'rear40'
        cls.am=load_manifest(cls.a,'P219_rear43_neutral_review_manifest.json',OLD_SCHEMA,43)
        cls.bm=load_manifest(cls.b,'P223_rear40_neutral_review_manifest.json',NEW_SCHEMA,40)

    def test_authenticated_source_ownership(self):
        susp,wheel,meta=owner_partition(self.am,self.bm)
        self.assertEqual((len(susp),len(wheel),len(susp|wheel)),(11,40,51))
        self.assertEqual(meta['legacyRear40OverwrittenIds'],32)
        self.assertIn('P210_REAR_UPPER_A_ARM_FORGED',susp)

    def test_correct_real_input_sha_three_lods(self):
        for tier in ('HIGH','BALANCED','PERFORMANCE'):
            self.assertEqual(len(load_scene(self.a,self.am,set(self.am['partIds']),tier).geometry),43)
            self.assertEqual(len(load_scene(self.b,self.bm,set(self.bm['partIds']),tier).geometry),40)

    def test_actual_review_export_51_names_and_neutral_color(self):
        with tempfile.TemporaryDirectory() as tmp:
            out=Path(tmp)/'view'
            record=compose(self.a,self.b,out)
            self.assertEqual(record['partCount'],51)
            for tier,delta in record['partGeometryChangeAudit'].items():
                self.assertEqual(set(delta['revisedNativePartIds']),EXPECTED_REVISIONS,tier)
                self.assertEqual(delta['unchangedSharedPartCount'],27)
                self.assertEqual(delta['addedStudCount'],8)
            self.assertFalse(record['sourceP212P214Included'])
            self.assertFalse(record['mechanicalG2Certified'])
            self.assertEqual(record['uniformBaseColor'],'#87929d')
            tris=[]
            for name,info in record['profiles'].items():
                scene=trimesh.load(out/info['file'],force='scene')
                self.assertEqual(len(scene.graph.nodes_geometry),51,name)
                self.assertEqual(set(scene.graph.nodes_geometry),set(record['partIds']))
                self.assertEqual({tuple(int(v) for v in geo.visual.material.baseColorFactor)
                                  for geo in scene.geometry.values()},{(135,146,157,255)})
                tris.append(info['triangles'])
            self.assertGreater(tris[0],tris[1]);self.assertGreater(tris[1],tris[2])
            self.assertEqual(record['crossSourceMeshAabbAudit']['candidatePairs'],440)
            self.assertEqual(record['crossSourceMeshAabbAudit']['aabbOverlapCandidates'],35)
            self.assertFalse(record['crossSourceMeshAabbAudit']['staticCollisionFreeCertified'])
            with self.assertRaises(FileExistsError):compose(self.a,self.b,out)

    def test_corrupt_glb_is_rejected_before_creating_review(self):
        with tempfile.TemporaryDirectory() as tmp:
            fake=Path(tmp)/'fake';fake.mkdir()
            for path in self.b.iterdir():shutil.copy2(path,fake/path.name)
            glb=fake/self.bm['profiles']['BALANCED']['file']
            glb.write_bytes(glb.read_bytes()+b'wrong bytes')
            output=Path(tmp)/'blocked'
            with self.assertRaisesRegex(ValueError,'SHA-256 mismatch'):
                compose(self.a,fake,output)
            self.assertFalse(output.exists())

    def test_wrong_ownership_is_rejected(self):
        invalid=dict(self.bm)
        invalid['partIds']=self.bm['partIds'][:-1]+['P210_REAR_FAKE_ARM']
        with self.assertRaises(ValueError):owner_partition(self.am,invalid)

    def test_aabb_negative_control_flags_overlap_not_brep_certification(self):
        susp,wheel,_=owner_partition(self.am,self.bm)
        s=load_scene(self.a,self.am,set(self.am['partIds']),'PERFORMANCE')
        w=load_scene(self.b,self.bm,set(self.bm['partIds']),'PERFORMANCE')
        r=aabb_cross_source_audit(s,w,susp,wheel)
        self.assertEqual(r['aabbOverlapCandidates'],35)
        self.assertFalse(r['trueVolumeOverlapMeasured'])
        self.assertEqual(r['exactNativeBRepIntersections'],0)

if __name__=='__main__':unittest.main(verbosity=2)
