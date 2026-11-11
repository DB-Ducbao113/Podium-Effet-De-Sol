"""Native-source 56-part preview: authenticated GLBs, material and VTK guard."""
from __future__ import annotations
import hashlib,json,os,shutil,tempfile,unittest
from pathlib import Path
import trimesh
from p2_29_rear56_review import make_review
from p2_29_caliper_upright_carrier import UPRIGHT,CALIPER,CARRIER,CAL_BOLT,UPR_BOLT

P228=Path(os.environ.get('PEDS_P229_P228_DIR',str(Path(__file__).resolve().parents[2]/'.local-assets/cad-first/p228-review')))
NATIVE=Path(os.environ.get('PEDS_P229_NATIVE_DIR',str(Path(__file__).resolve().parents[2]/'.local-assets/cad-first/p229-native')))

class TestP229Visual(unittest.TestCase):
 def test_source_56_preserves_ids_and_g2_hold(self):
  with tempfile.TemporaryDirectory() as temp:
   root=Path(temp)
   report=make_review(P228,NATIVE,root/'view')
   self.assertEqual(report['partCount'],56)
   self.assertEqual(report['nativeBRepAuditPartCount'],46)
   self.assertEqual(set(report['replacedOriginalPartIds']),{UPRIGHT,CALIPER})
   self.assertEqual(set(report['newOriginalCADPartIds']),{CARRIER,*CAL_BOLT,*UPR_BOLT})
   self.assertFalse(report['mechanicalG2Certified'])
   self.assertFalse(report['modelBOriginalIncluded'])
   tris=[]
   for tier,info in report['profiles'].items():
    f=root/'view'/info['file']
    self.assertEqual(hashlib.sha256(f.read_bytes()).hexdigest(),info['sha256'])
    scene=trimesh.load(f,force='scene')
    self.assertEqual(len(scene.graph.nodes_geometry),56)
    self.assertEqual(set(scene.graph.nodes_geometry),set(report['partIds']))
    self.assertTrue(all(m.is_watertight for m in scene.geometry.values()))
    self.assertEqual({tuple(int(x) for x in m.visual.material.baseColorFactor) for m in scene.geometry.values()},
                     {(135,146,157,255)})
    a=report['sourceNewVersusP210MeshChecks'][tier]
    self.assertEqual(a['allSourceCrossPairs'],70)
    self.assertEqual(a['aabbSeparated'],68)
    self.assertEqual(a['vtkChecked'],2)
    self.assertEqual(a['potentialMeshInterferences'],0)
    tris.append(info['triangles'])
   self.assertGreater(tris[0],tris[1]);self.assertGreater(tris[1],tris[2])
   with self.assertRaises(FileExistsError):make_review(P228,NATIVE,root/'view')

 def test_mutated_original_native_glb_refused(self):
  with tempfile.TemporaryDirectory() as temp:
   root=Path(temp);spoof=root/'native'
   shutil.copytree(NATIVE,spoof)
   record=json.loads((spoof/'P229_caliper_carrier_source_manifest.json').read_text())
   file=spoof/record['profiles']['BALANCED']['file']
   file.write_bytes(file.read_bytes()+b'badSHA')
   with self.assertRaisesRegex(ValueError,'SHA mismatch'):
    make_review(P228,spoof,root/'rejected')
   self.assertFalse((root/'rejected').exists())

if __name__=='__main__':unittest.main(verbosity=2)
