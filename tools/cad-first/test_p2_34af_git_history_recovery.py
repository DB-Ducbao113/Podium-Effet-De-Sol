import hashlib,subprocess,tempfile,unittest
from pathlib import Path
import p2_34af_git_history_recovery as r

def cmd(root,*args):
 p=subprocess.run(['git','-C',str(root),*args],capture_output=True,check=True)
 return p.stdout.decode().strip()
class TestGitRecovery(unittest.TestCase):
 def setUp(self):
  self.t=tempfile.TemporaryDirectory();self.addCleanup(self.t.cleanup)
  self.p=Path(self.t.name);cmd(self.p,'init','-q');cmd(self.p,'config','user.name','Fixture')
  cmd(self.p,'config','user.email','fixture@example.invalid')
  self.raw=[b'real STEP fixture',b'name index fixture',b'audit fixture']
  self.pins={name:hashlib.sha256(data).hexdigest() for name,data in zip(('step','index','audit'),self.raw)}
 def commit(self,files):
  for name,data in files.items():(self.p/name).write_bytes(data)
  cmd(self.p,'add','.');cmd(self.p,'commit','-qm','fixture')
 def test_history_recovery_after_delete(self):
  self.commit({'data1':self.raw[0],'data2':self.raw[1],'data3':self.raw[2]})
  cmd(self.p,'rm','data1','data2','data3');cmd(self.p,'commit','-qm','delete')
  out=r.inspect(self.p,self.pins)
  self.assertTrue(out['allExactSourceBlobsFound'])
  self.assertTrue(all(out['matches'].values()))
 def test_lfs_pointer_not_real_blob(self):
  pointer=f'version https://git-lfs.github.com/spec/v1\noid sha256:{self.pins["step"]}\nsize 12345\n'
  self.commit({'pointer':pointer.encode()})
  out=r.inspect(self.p,self.pins)
  self.assertFalse(out['allExactSourceBlobsFound'])
  self.assertEqual(out['lfsPointers'][0]['originalFile'],'step')
 def test_sha_mismatch_blocks(self):
  self.commit({'a':b'unrelated'})
  self.assertFalse(r.inspect(self.p,self.pins)['allExactSourceBlobsFound'])
 def test_limit_fails_closed(self):
  self.commit({'a':b'x','b':b'y'})
  with self.assertRaises(ValueError):r.inspect(self.p,self.pins,max_objects=1)
 def test_no_mutation(self):
  self.commit({'a':self.raw[0]})
  before=cmd(self.p,'status','--porcelain')
  r.inspect(self.p,self.pins)
  self.assertEqual(cmd(self.p,'status','--porcelain'),before)
 def test_invalid_pins(self):
  with self.assertRaises(ValueError):r.inspect(self.p,{'a':'bad'})
 def test_missing_repo(self):
  with self.assertRaises(ValueError):r.inspect(self.p/'no',self.pins)
 def test_duplicate_contents(self):
  self.commit({'first':self.raw[0],'other':self.raw[0]})
  self.assertEqual(len(r.inspect(self.p,self.pins)['matches']['step']),1)
 def test_nested_branch_history(self):
  self.commit({'a':self.raw[0]});cmd(self.p,'branch','old-release')
  cmd(self.p,'rm','a');cmd(self.p,'commit','-qm','remove')
  self.assertTrue(r.inspect(self.p,self.pins)['matches']['step'])
if __name__=='__main__':unittest.main(verbosity=2)
