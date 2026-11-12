"""P2.34AJ unit tests, real local Git objects with synthetic source bytes."""
import hashlib,subprocess,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
import types
import p2_34aj_unreachable_git_source as aj

def git(root,*args,stdin=None):
    return subprocess.run(['git','-C',str(root),*args],input=stdin,check=True,
                          stdout=subprocess.PIPE,stderr=subprocess.PIPE).stdout.decode().strip()

class UnreachableTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.repo=Path(self.temp.name)
        git(self.repo,'init','-q')
        git(self.repo,'config','user.name','Synthetic Test')
        git(self.repo,'config','user.email','test@example.invalid')
        self.data={'step':b'STEP fixture\n','index':b'index fixture\n','audit':b'audit fixture\n'}
        self.pins={name:hashlib.sha256(data).hexdigest() for name,data in self.data.items()}
    def add_unreachable(self,data):
        return git(self.repo,'hash-object','-w','--stdin',stdin=data)
    def test_recover_three_dangling_blobs(self):
        for content in self.data.values():self.add_unreachable(content)
        r=aj.inspect(self.repo,self.pins)
        self.assertTrue(r['allExactSourceBlobsFound'])
        self.assertEqual(r['unreachableBlobsInspected'],3)
        self.assertFalse(r['mechanicalG2Certified'])
    def test_does_not_falsely_report_reachable_blob(self):
        for name,content in self.data.items():(self.repo/name).write_bytes(content)
        git(self.repo,'add','.')
        git(self.repo,'commit','-qm','make reachable')
        self.assertFalse(aj.inspect(self.repo,self.pins)['allExactSourceBlobsFound'])
    def test_lfs_pointer_is_not_step(self):
        pointer=f'version https://git-lfs.github.com/spec/v1\noid sha256:{self.pins["step"]}\nsize 2048\n'.encode()
        self.add_unreachable(pointer)
        r=aj.inspect(self.repo,self.pins)
        self.assertFalse(r['allExactSourceBlobsFound'])
        self.assertEqual(r['lfsPointers'][0]['originalFile'],'step')
    def test_restoration_rechecks_exact_dangling_blobs(self):
        for content in self.data.values():self.add_unreachable(content)
        r=aj.inspect(self.repo,self.pins)
        def fake_ag_restore(repo,dest,inventory,pins):
            for name,matches in inventory['matches'].items():
                data=subprocess.run(['git','-C',str(repo),'cat-file','blob',matches[0]['blobSHA']],
                                    capture_output=True,check=True).stdout
                if hashlib.sha256(data).hexdigest()!=pins[name]:raise ValueError('SHA mismatch')
            return {'validated':True}
        with patch.dict('sys.modules',{'p2_34ag_git_blob_restore':types.SimpleNamespace(restore=fake_ag_restore)}):
            self.assertTrue(aj.restore_exact_blobs(self.repo,self.repo/'new',r,self.pins)['validated'])
    def test_invalid_aj_evidence_rejected(self):
        with self.assertRaisesRegex(ValueError,'schema'):
            aj.restore_exact_blobs(self.repo,self.repo/'new',{'schema':'tampered'},self.pins)
    def test_invalid_source_sha(self):
        with self.assertRaises(ValueError):aj.inspect(self.repo,{'step':'bad'})
    def test_object_budget(self):
        self.add_unreachable(b'first');self.add_unreachable(b'second')
        with self.assertRaisesRegex(ValueError,'budget'):
            aj.inspect(self.repo,self.pins,max_objects=1)
    def test_no_git_worktree_mutation(self):
        self.add_unreachable(b'unchanged')
        before=git(self.repo,'status','--porcelain')
        aj.inspect(self.repo,self.pins)
        self.assertEqual(before,git(self.repo,'status','--porcelain'))
    def test_missing_repository_rejected(self):
        with self.assertRaises(ValueError):aj.inspect(self.repo/'missing',self.pins)
    def test_duplicate_sha_rejected(self):
        with self.assertRaises(ValueError):
            aj.inspect(self.repo,{'one':'a'*64,'two':'a'*64,'three':'b'*64})
    def test_unrelated_dangling_blob(self):
        self.add_unreachable(b'unrelated')
        r=aj.inspect(self.repo,self.pins)
        self.assertEqual(r['unreachableBlobsInspected'],1)
        self.assertEqual(r['matches']['step'],[])
    def test_oversize_blob_skipped(self):
        self.add_unreachable(b'x'*1100)
        r=aj.inspect(self.repo,self.pins,max_bytes=1024)
        self.assertEqual(r['oversizeBlobsSkipped'],1)

if __name__=='__main__':unittest.main(verbosity=2)
