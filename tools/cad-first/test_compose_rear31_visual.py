"""Synthetic negative-control tests for exact real rear GLB 19-4+16 composition.

SYNTHETIC test spheres are never Model B assets or manufacturer CAD. In real
builds, source manifests and the original watertight GLBs are mandatory.
"""
from __future__ import annotations
import hashlib,json,tempfile,unittest
from pathlib import Path
import trimesh
from compose_rear31_visual import compose

OLD=(
 'P210_REAR_UPPER_OUTER_SPHERICAL_BEARING_PROPOSAL',
 'P210_REAR_LOWER_OUTER_SPHERICAL_BEARING_PROPOSAL',
 'P211_REAR_TOE_OUTER_BEARING_PROPOSAL',
 'P211_REAR_TOE_INNER_BEARING_PROPOSAL',
)
class Rear31OriginalSourceGlbTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
  root=Path(self.tmp.name);self.p212=root/'p212';self.p214=root/'p214';self.out=root/'out'
  self.p212.mkdir();self.p214.mkdir()
  self.seed(self.p212,'P212_rear_toe_adjuster_manifest.json',
            [*OLD,*('P212_TEST_SOURCE_'+str(i) for i in range(15))],False)
  self.seed(self.p214,'P214_split_race_manifest.json',
            ['P214_TEST_SPLIT_BEARING_'+str(i) for i in range(16)],True)
 def seed(self,folder,filename,names,split):
  scene=trimesh.Scene()
  for i,name in enumerate(names):
   mesh=trimesh.creation.icosphere(subdivisions=1,radius=.004)
   mesh.apply_translation([.03*(i%8),.02*(i//8),0])
   scene.add_geometry(mesh,geom_name=name,node_name=name)
  original=folder/'synthetic_source_balanced.glb'
  original.write_bytes(scene.export(file_type='glb'))
  profiles={'BALANCED':{'file':original.name,'bytes':original.stat().st_size,
            'sha256':hashlib.sha256(original.read_bytes()).hexdigest()}}
  if split:
   row={'schema':'podium-eds.p214.split-race-radial-assembly.v1',
        'newPartNames':names,'profiles':profiles,'newNativeSolidCount':16,
        'candidateCombinedSourceSolids':31,'axialRetentionCertified':False,
        'mechanicalG2':'HOLD','nominalStaticAudit':{'pairCount':465,'passStatic':True},
        'discreteAssemblyPathAudit':{'finiteInsertionPairChecks':144},
        'replacesSourceBearingProxies':dict(zip(
          ('UPPER','LOWER','TOE_OUTER','TOE_INNER'),OLD))}
  else:
   row={'schema':'podium-eds.p2.cad-first.rear-toe-adjuster-threaded.v3',
        'partIds':names,'profiles':profiles,
        'threadGeometryRevision':'P2.12-R3-BREP-LOCKNUT-ENGAGEMENT',
        'nativeStaticAudit':{'pairCount':171,'passStatic':True},
        'mechanicalMateCertified':False}
  (folder/filename).write_text(json.dumps(row),encoding='utf8')
 def test_exact_native_31_name_roundtrip(self):
  row=compose(self.p212,self.p214,self.out)
  self.assertEqual(row['nativeVisualSourceCount'],31)
  self.assertEqual(set(row['sourceRemovedAnnularBearingNames']),set(OLD))
  self.assertTrue(set(OLD).isdisjoint(row['sourcePartIds']))
  self.assertFalse(row['ownerModelBOriginalShellIncluded'])
  self.assertFalse(row['dynamic31BodyNativeBrepCollisionCertified'])
  self.assertEqual(row['mechanicalG2'],'HOLD')
  asset=self.out/row['glbFile']
  self.assertEqual(hashlib.sha256(asset.read_bytes()).hexdigest(),row['glbSHA256'])
  scene=trimesh.load(asset,force='scene')
  self.assertEqual(set(scene.graph.nodes_geometry),set(row['sourcePartIds']))
  self.assertTrue(all(m.is_watertight for m in scene.geometry.values()))
 def test_refuse_wrong_source_glb_sha(self):
  asset=self.p212/'synthetic_source_balanced.glb'
  asset.write_bytes(asset.read_bytes()+b'modified')
  with self.assertRaisesRegex(RuntimeError,'SHA mismatch'):
   compose(self.p212,self.p214,self.out)
  self.assertFalse(self.out.exists())
 def test_refuse_missing_original_proxy_and_false_g2_pass(self):
  file=self.p214/'P214_split_race_manifest.json'
  row=json.loads(file.read_text())
  row['replacesSourceBearingProxies']['UPPER']='FAKE_REAR_BEARING'
  file.write_text(json.dumps(row))
  with self.assertRaisesRegex(RuntimeError,'four original'):
   compose(self.p212,self.p214,self.out)
  row['replacesSourceBearingProxies']['UPPER']=OLD[0]
  row['mechanicalG2']='PASS';file.write_text(json.dumps(row))
  with self.assertRaisesRegex(RuntimeError,'G2 mechanical'):
   compose(self.p212,self.p214,self.out)
 def test_refuse_overwriting_verified_prior_review(self):
  compose(self.p212,self.p214,self.out)
  with self.assertRaises(FileExistsError):
   compose(self.p212,self.p214,self.out)

if __name__=='__main__':unittest.main(verbosity=2)
