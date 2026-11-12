"""P2.34AH local LFS object tests; all source bytes are synthetic fixtures."""
import hashlib,subprocess,tempfile,unittest
from pathlib import Path
import p2_34ah_lfs_source_restore as ah
from p2_34af_git_history_recovery import inspect

def git(root,*args):
    return subprocess.run(['git','-C',str(root),*args],check=True,
                          capture_output=True).stdout.decode().strip()
class Tests(unittest.TestCase):
    def setUp(self):
        self.t=tempfile.TemporaryDirectory();self.addCleanup(self.t.cleanup)
        self.root=Path(self.t.name);self.repo=self.root/'repo';self.repo.mkdir()
        git(self.repo,'init','-q');git(self.repo,'config','user.name','Fixture')
        git(self.repo,'config','user.email','fixture@example.invalid')
        self.contents={'STEP':b'STEP source fixture 12345','INDEX':b'index mock original',
                       'AUDIT':b'audit mock original'}
        self.pins={n:hashlib.sha256(v).hexdigest() for n,v in self.contents.items()}
        self.lfs=self.root/'lfs'
        for n,body in self.contents.items():
            oid=self.pins[n]
            (self.repo/n).write_text(f'version https://git-lfs.github.com/spec/v1\noid sha256:{oid}\nsize {len(body)}\n')
            location=self.lfs/oid[:2]/oid[2:4];location.mkdir(parents=True)
            (location/oid).write_bytes(body)
        git(self.repo,'add','.');git(self.repo,'commit','-qm','pointer fixtures')
        self.inventory=inspect(self.repo,self.pins)
    def test_restores_three_real_lfs_objects(self):
        r=ah.restore(self.repo,self.root/'out',self.pins,self.inventory,self.lfs)
        self.assertFalse(r['mechanicalG2Certified'])
        for n,content in self.contents.items():
            self.assertEqual((self.root/'out'/n).read_bytes(),content)
    def test_report_pointer_not_payload(self):
        r=ah.locate(self.repo,self.pins,self.inventory,self.lfs)
        self.assertTrue(r['allThreePointersVerified'])
        self.assertFalse(r['nativeGeometryValidated'])
    def test_missing_payload_fails_closed(self):
        oid=self.pins['STEP'];(self.lfs/oid[:2]/oid[2:4]/oid).unlink()
        with self.assertRaises(ValueError):ah.restore(self.repo,self.root/'out',self.pins,self.inventory,self.lfs)
        self.assertFalse((self.root/'out').exists())
    def test_corrupt_payload_rejected(self):
        oid=self.pins['STEP'];(self.lfs/oid[:2]/oid[2:4]/oid).write_bytes(b'wrong payload same size!')
        with self.assertRaises(ValueError):ah.restore(self.repo,self.root/'out',self.pins,self.inventory,self.lfs)
        self.assertFalse((self.root/'out').exists())
    def test_symlink_object_rejected(self):
        oid=self.pins['STEP'];p=self.lfs/oid[:2]/oid[2:4]/oid
        p.rename(p.with_suffix('.real'));p.symlink_to(p.with_suffix('.real'))
        with self.assertRaises(ValueError):ah.restore(self.repo,self.root/'out',self.pins,self.inventory,self.lfs)
    def test_tampered_inventory_pointer_sha_rejected(self):
        self.inventory['lfsPointers'][0]['lfsPointerBlobSHA']='0'*40
        with self.assertRaises(ValueError):ah.restore(self.repo,self.root/'out',self.pins,self.inventory,self.lfs)
    def test_wrong_pointer_size_rejected(self):
        n='STEP';oid=self.pins[n]
        (self.repo/n).write_text(f'version https://git-lfs.github.com/spec/v1\noid sha256:{oid}\nsize 333\n')
        git(self.repo,'add','.');git(self.repo,'commit','-qm','wrong size')
        inv=inspect(self.repo,self.pins)
        latest=git(self.repo,'rev-parse','HEAD:STEP')
        inv['lfsPointers']=[i for i in inv['lfsPointers'] if i['originalFile']!='STEP']+[
            {'originalFile':'STEP','lfsPointerBlobSHA':latest}]
        with self.assertRaises(ValueError):
            ah.restore(self.repo,self.root/'out',self.pins,inv,self.lfs)
    def test_existing_destination_untouched(self):
        out=self.root/'out';out.mkdir();(out/'keep').write_text('KEEP')
        with self.assertRaises(FileExistsError):ah.restore(self.repo,out,self.pins,self.inventory,self.lfs)
        self.assertEqual((out/'keep').read_text(),'KEEP')
    def test_no_worktree_mutation(self):
        before=git(self.repo,'status','--porcelain')
        ah.restore(self.repo,self.root/'out',self.pins,self.inventory,self.lfs)
        self.assertEqual(git(self.repo,'status','--porcelain'),before)
    def test_bad_inventory_schema(self):
        self.inventory['schema']='wrong'
        with self.assertRaises(ValueError):ah.locate(self.repo,self.pins,self.inventory,self.lfs)
    def test_pointer_parser_rejects_invalid(self):
        with self.assertRaises(ValueError):
            ah.parse_pointer(b'version https://git-lfs.github.com/spec/v1\noid sha256:bad\nsize 4\n')
if __name__=='__main__':unittest.main(verbosity=2)
