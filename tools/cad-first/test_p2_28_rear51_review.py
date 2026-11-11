"""P2.28 SHA-verified real 51-body GLB and source-to-suspension VTK inspection."""
from __future__ import annotations
import hashlib,json,os,shutil
from pathlib import Path
import tempfile,unittest
import trimesh
from p2_28_halfshaft_hub_connection import HUB,SHAFT
from p2_28_rear51_review import review

OLD=Path(os.environ.get('PEDS_P228_P225_DIR',str(Path(__file__).resolve().parents[2]/'.local-assets/cad-first/p225-review')))
NATIVE=Path(os.environ.get('PEDS_P228_NATIVE_DIR',str(Path(__file__).resolve().parents[2]/'.local-assets/cad-first/p228-native')))

class TestP228Review(unittest.TestCase):
    def test_real_51_part_export_and_sha_tamper(self):
        with tempfile.TemporaryDirectory() as temp:
            output=Path(temp)/'review'
            report=review(OLD,NATIVE,output)
            self.assertEqual(report['partCount'],51)
            self.assertEqual(set(report['replacedPartIds']),{HUB,SHAFT})
            self.assertFalse(report['vehicleOriginalModelBIncluded'])
            self.assertFalse(report['p224Original71BRepGatePassed'])
            self.assertFalse(report['mechanicalG2Certified'])
            triangles=[]
            for quality,info in report['qualityProfiles'].items():
                file=output/info['file']
                self.assertEqual(hashlib.sha256(file.read_bytes()).hexdigest(),info['sha256'])
                scene=trimesh.load(file,force='scene')
                self.assertEqual(len(scene.graph.nodes_geometry),51)
                self.assertEqual(set(scene.graph.nodes_geometry),set(report['partIds']))
                self.assertTrue(all(m.is_watertight for m in scene.geometry.values()))
                colors={tuple(int(c) for c in m.visual.material.baseColorFactor) for m in scene.geometry.values()}
                self.assertEqual(colors,{(135,146,157,255)})
                qa=report['modifiedPartVsSuspensionMeshAudit'][quality]
                self.assertEqual(qa['candidatePairs'],22)
                self.assertEqual(qa['aabbCandidatePairs'],2)
                self.assertEqual(qa['surfaceAndContainmentHits'],0)
                triangles.append(info['triangles'])
            self.assertGreater(triangles[0],triangles[1])
            self.assertGreater(triangles[1],triangles[2])
            with self.assertRaises(FileExistsError):review(OLD,NATIVE,output)
            bad=Path(temp)/'tampered'
            shutil.copytree(NATIVE,bad)
            document=json.loads((bad/'P228_halfshaft_hub_manifest.json').read_text())
            target=bad/document['profiles']['BALANCED']['file']
            target.write_bytes(target.read_bytes()+b'tampered')
            with self.assertRaisesRegex(ValueError,'SHA-256 verified source GLB differs'):
                review(OLD,bad,Path(temp)/'bad_output')
            self.assertFalse((Path(temp)/'bad_output').exists())

if __name__=='__main__':unittest.main(verbosity=2)
