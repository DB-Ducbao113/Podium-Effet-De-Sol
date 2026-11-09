"""Local-only Model B CAD stager failure-preservation tests.

Fixtures are SYNTHETIC bytes for testing source validation and filesystem
atomicity. They never establish real STEP/BRep or manufacturer provenance.
"""
from __future__ import annotations
import hashlib,json,struct,tempfile,unittest
from pathlib import Path
from unittest.mock import patch

import stage_model_b_scroll_assets as staging

def sha(data:bytes)->str:return hashlib.sha256(data).hexdigest()

class ModelBOriginalCadStagingTests(unittest.TestCase):
 @staticmethod
 def synthetic_glb(names:list[str])->bytes:
  # glTF 2.0 JSON header and distinct named mesh nodes; these empty synthetic
  # primitives are deliberately NOT a rendered real CAD vehicle.
  model={
   'asset':{'version':'2.0'},
   'nodes':[{'name':name,'mesh':i} for i,name in enumerate(names)],
   'meshes':[{'name':name,'primitives':[]} for name in names],
  }
  jsonbytes=json.dumps(model,separators=(',',':')).encode('utf8')
  jsonbytes+=b' '*((-len(jsonbytes))%4)
  return struct.pack('<IIIII',0x46546c67,2,20+len(jsonbytes),
                     len(jsonbytes),0x4e4f534a)+jsonbytes

 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory()
  self.addCleanup(self.tmp.cleanup)
  self.root=Path(self.tmp.name)
  self.local=self.root/'.local-assets';self.local.mkdir()
  self.stage=self.local/'model-b-scroll-preview'
  self.tools=self.root/'tools/cad-first';self.tools.mkdir(parents=True)
  self.patch_root=patch.object(staging,'ROOT',self.root);self.patch_root.start()
  self.addCleanup(self.patch_root.stop)
  self.patch_local=patch.object(staging,'LOCAL',self.local);self.patch_local.start()
  self.addCleanup(self.patch_local.stop)
  self.dirs={name:self.root/name for name in ('p28','p212','p214')}
  for folder in self.dirs.values():folder.mkdir()
  self.make_source('p28','P28_remate_manifest.json',b'not-a-real-glb-p28')
  self.make_source('p212','P212_rear_toe_adjuster_manifest.json',b'not-a-real-glb-p212')
  self.make_source('p214','P214_split_race_manifest.json',b'not-a-real-glb-p214')
 def upstream_sha(self):
  hashes={}
  for key in ('p2_9_rear_upright.py','p2_10_rear_wishbone.py',
     'p2_11_rear_toe_link.py','p2_12_toe_adjuster.py',
     'p2_12_constrained_kinematics.py','p2_13_rear_joint_prototype.py'):
   p=self.tools/key
   if not p.is_file():p.write_text('test synthetic upstream source '+key)
   hashes[key]=hashlib.sha256(p.read_bytes()).hexdigest()
  own=self.tools/'p2_14_split_spherical_race.py'
  if not own.is_file():own.write_text('test synthetic P2.14 builder')
  return hashes,hashlib.sha256(own.read_bytes()).hexdigest()
 def make_source(self,name,filename,data):
  file=self.dirs[name]/(name+'_balanced.glb')
  row={'file':file.name,'bytes':0,'sha256':''}
  if name=='p28':
   manifest={
    'schema':'podium-eds.p2.cad-first.full-corner.remate.v1',
    'source':'Project-authored P2.6/P2.7 original B-Rep',
    'partIds':['TEST_P28_'+str(x) for x in range(59)],
    'totalCadSolids':59,'allRoundtripValid':True,
    'masterSTEPsha256':'e'*64,
    'staticFit':{'totalPairs':1711,'singleStaticPosePass':True},
    'profiles':{'BALANCED':row},
   }
  elif name=='p212':
   manifest={
    'schema':'podium-eds.p2.cad-first.rear-toe-adjuster-threaded.v3',
    'sourcePartCount':19,'partIds':['TEST_P212_'+str(x) for x in range(19)],
    'threadGeometryRevision':'P2.12-R3-BREP-LOCKNUT-ENGAGEMENT',
    'mechanicalMateCertified':False,'actualChassisToeHardpointMeasured':False,
    'nativeStaticAudit':{'pairCount':171,'passStatic':True,
      'unresolvedCollisions':[],'booleanErrors':[],
      'dynamicKinematicsCertified':False},
    'profiles':{'BALANCED':row},
   }
  else:
   upstream,own=self.upstream_sha()
   manifest={
    'schema':'podium-eds.p214.split-race-radial-assembly.v1',
    'newNativeSolidCount':16,'newPartNames':['TEST_P214_'+str(x) for x in range(16)],
    'candidateCombinedSourceSolids':31,'stepRoundtripSolids':16,
    'ownCadSourceSha256':own,'upstreamCadSourceSha256':upstream,
    'nominalStaticAudit':{'pairCount':465,'passStatic':True,
       'unresolvedCollisions':[],'booleanErrors':[]},
    'discreteAssemblyPathAudit':{'finiteInsertionPairChecks':144,
       'positiveControlCount':4},
    'axialRetentionCertified':False,'chassisHardpointsMeasured':False,
    'mechanicalG2':'HOLD','profiles':{'BALANCED':row},
   }
  data=self.synthetic_glb(
    manifest['partIds'] if name in ('p28','p212') else manifest['newPartNames'])
  file.write_bytes(data)
  row.update({'bytes':len(data),'sha256':sha(data)})
  (self.dirs[name]/filename).write_text(json.dumps(manifest))
 def run_stage(self,all_sources=True):
  return staging.run(self.dirs['p28'],self.stage,'BALANCED',
    self.dirs['p212'] if all_sources else None,
    self.dirs['p214'] if all_sources else None)
 def test_three_source_atomic_staging_and_sha_index(self):
  result=self.run_stage()
  self.assertEqual(set(result['sources']),{'p28','p212','p214'})
  self.assertTrue(result['localOnlyNotDeployed'])
  self.assertTrue(result['noFabricatedGeometry'])
  self.assertEqual(result['mechanicalG2'],'HOLD')
  for name in ('p28','p212','p214'):
   self.assertEqual(staging.checked_sha(self.stage/name/'source.glb'),
                    result['sources'][name]['sha256'])
  self.assertTrue((self.stage/'.peds-model-b-cad-staged').is_file())
 def test_wrong_new_source_sha_never_erases_good_bundle(self):
  self.run_stage()
  old_index=(self.stage/'index.json').read_bytes()
  old_source=(self.stage/'p214/source.glb').read_bytes()
  (self.dirs['p214']/'p214_balanced.glb').write_bytes(b'corrupted-user-CAD')
  with self.assertRaisesRegex(RuntimeError,'size mismatch|byte length|SHA|modified'):
   self.run_stage()
  self.assertEqual((self.stage/'index.json').read_bytes(),old_index)
  self.assertEqual((self.stage/'p214/source.glb').read_bytes(),old_source)
 def test_invalid_original_p28_step_evidence_preserves_bundle(self):
  self.run_stage()
  old_index=(self.stage/'index.json').read_bytes()
  file=self.dirs['p28']/'P28_remate_manifest.json'
  data=json.loads(file.read_text())
  data['staticFit']['totalPairs']=17
  file.write_text(json.dumps(data))
  with self.assertRaisesRegex(RuntimeError,'1711-pair'):
   self.run_stage()
  self.assertEqual((self.stage/'index.json').read_bytes(),old_index)
 def test_p214_upstream_provenance_failure_keeps_last_good_assets(self):
  self.run_stage()
  old_hash=staging.checked_sha(self.stage/'p214/source.glb')
  (self.tools/'p2_13_rear_joint_prototype.py').write_text('changed CAD source')
  with self.assertRaisesRegex(RuntimeError,'upstream sources'):
   self.run_stage()
  self.assertEqual(staging.checked_sha(self.stage/'p214/source.glb'),old_hash)
 def test_read_only_output_boundary_and_unmarked_folder(self):
  with self.assertRaisesRegex(ValueError,'MUST stay'):
   staging.run(self.dirs['p28'],self.root/'outside','BALANCED')
  self.stage.mkdir()
  (self.stage/'do-not-delete.txt').write_text('original private notes')
  with self.assertRaises(FileExistsError):
   self.run_stage()
  self.assertTrue((self.stage/'do-not-delete.txt').is_file())
 def test_wrong_glb_named_meshes_preserve_previous_good_bundle(self):
  self.run_stage()
  old_index=(self.stage/'index.json').read_bytes()
  manifest=self.dirs['p212']/'P212_rear_toe_adjuster_manifest.json'
  record=json.loads(manifest.read_text())
  names=[name for name in record['partIds']]
  names[-1]='INJECTED_FAKE_CAR_MESH'
  glb=self.synthetic_glb(names)
  source=self.dirs['p212']/'p212_balanced.glb'
  source.write_bytes(glb)
  record['profiles']['BALANCED']['bytes']=len(glb)
  record['profiles']['BALANCED']['sha256']=sha(glb)
  manifest.write_text(json.dumps(record))
  with self.assertRaisesRegex(RuntimeError,'node identities mismatch'):
   self.run_stage()
  self.assertEqual((self.stage/'index.json').read_bytes(),old_index)

 def test_truncated_binary_header_preserves_previous_good_bundle(self):
  self.run_stage()
  old_source=(self.stage/'p214/source.glb').read_bytes()
  source=self.dirs['p214']/'p214_balanced.glb'
  source.write_bytes(b'not a real GLB')
  manifest=self.dirs['p214']/'P214_split_race_manifest.json'
  record=json.loads(manifest.read_text())
  record['profiles']['BALANCED']['bytes']=source.stat().st_size
  record['profiles']['BALANCED']['sha256']=staging.checked_sha(source)
  manifest.write_text(json.dumps(record))
  with self.assertRaisesRegex(RuntimeError,'GLB bounds|GLB 2.0 header'):
   self.run_stage()
  self.assertEqual((self.stage/'p214/source.glb').read_bytes(),old_source)

 def test_p28_only_remains_allowed_without_fake_rear_source(self):
  x=self.run_stage(all_sources=False)
  self.assertEqual(set(x['sources']),{'p28'})
  self.assertFalse((self.stage/'p212').exists())
  self.assertFalse((self.stage/'p214').exists())

if __name__=='__main__':unittest.main(verbosity=2)
