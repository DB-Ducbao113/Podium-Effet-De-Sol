"""P2.34AG real local Git-object tests; synthetic bytes are never owner STEP."""
from __future__ import annotations
import hashlib
import json
import subprocess
import tempfile
import unittest
from pathlib import Path

import p2_34ag_git_blob_restore as ag


def git(folder,*args):
    result=subprocess.run(['git','-C',str(folder),*args],check=True,
                          stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    return result.stdout.decode().strip()


class RestoreTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root=Path(self.tmp.name)
        self.repo=self.root/'repo'
        self.repo.mkdir()
        git(self.repo,'init','-q')
        git(self.repo,'config','user.name','Test Only')
        git(self.repo,'config','user.email','test@example.invalid')
        self.data={'step':b'generated STEP fixture, NOT mechanical original',
                   'index':b'generated map fixture',
                   'audit':b'generated audit fixture'}
        self.pins={name:hashlib.sha256(data).hexdigest() for name,data in self.data.items()}
        for name,content in self.data.items():
            (self.repo/name).write_bytes(content)
        git(self.repo,'add','.')
        git(self.repo,'commit','-qm','initial')
        git(self.repo,'rm',*self.data)
        git(self.repo,'commit','-qm','remove original names')

    def test_restores_deleted_blobs(self):
        target=self.root/'recovered'
        result=ag.restore(self.repo,target,pins=self.pins)
        self.assertEqual(result['sourceFileCount'],3)
        for name,content in self.data.items():
            self.assertEqual((target/name).read_bytes(),content)
        self.assertFalse(result['mechanicalG2Certified'])

    def test_refuses_existing_destination(self):
        target=self.root/'existing'
        target.mkdir()
        (target/'KEEP').write_bytes(b'original')
        with self.assertRaises(FileExistsError):
            ag.restore(self.repo,target,pins=self.pins)
        self.assertEqual((target/'KEEP').read_bytes(),b'original')

    def test_read_only_worktree(self):
        before=git(self.repo,'status','--porcelain')
        ag.restore(self.repo,self.root/'out',pins=self.pins)
        self.assertEqual(git(self.repo,'status','--porcelain'),before)

    def test_missing_blob_blocks_without_output(self):
        pins=dict(self.pins)
        pins['audit']='f'*64
        target=self.root/'out'
        with self.assertRaises(ValueError):
            ag.restore(self.repo,target,pins=pins)
        self.assertFalse(target.exists())

    def test_tampered_inventory_oid_rejected(self):
        from p2_34af_git_history_recovery import inspect
        report=inspect(self.repo,self.pins)
        report['matches']['step'][0]['blobSHA']=report['matches']['audit'][0]['blobSHA']
        target=self.root/'out'
        with self.assertRaisesRegex(ValueError,'SHA mismatch'):
            ag.restore(self.repo,target,inventory=report,pins=self.pins)
        self.assertFalse(target.exists())

    def test_invalid_oid_syntax_rejected(self):
        from p2_34af_git_history_recovery import inspect
        report=inspect(self.repo,self.pins)
        report['matches']['step'][0]['blobSHA']='--upload-pack=evil'
        with self.assertRaisesRegex(ValueError,'Untrusted Git blob'):
            ag.restore(self.repo,self.root/'out',inventory=report,pins=self.pins)

    def test_lfs_pointer_not_accepted_as_original(self):
        from p2_34af_git_history_recovery import inspect
        report=inspect(self.repo,self.pins)
        pointer=self.repo/'pointer'
        pointer.write_text('version https://git-lfs.github.com/spec/v1\n'
                           +'oid sha256:'+self.pins['step']+'\nsize 1000\n')
        git(self.repo,'add','pointer')
        git(self.repo,'commit','-qm','lfs pointer')
        pointer_sha=git(self.repo,'rev-parse','HEAD:pointer')
        report['matches']['step'][0]['blobSHA']=pointer_sha
        with self.assertRaisesRegex(ValueError,'SHA mismatch'):
            ag.restore(self.repo,self.root/'out',inventory=report,pins=self.pins)

    def test_symlink_parent_rejected(self):
        real=self.root/'real'
        real.mkdir()
        link=self.root/'link'
        link.symlink_to(real,target_is_directory=True)
        with self.assertRaisesRegex(ValueError,'symlinked output parent'):
            ag.restore(self.repo,link/'output',pins=self.pins)

    def test_schema_tamper_rejected(self):
        from p2_34af_git_history_recovery import inspect
        report=inspect(self.repo,self.pins)
        report['schema']='wrong'
        with self.assertRaisesRegex(ValueError,'schema'):
            ag.restore(self.repo,self.root/'out',inventory=report,pins=self.pins)

    def test_no_source_file_mutation(self):
        before=git(self.repo,'log','-1','--format=%H')
        ag.restore(self.repo,self.root/'out',pins=self.pins)
        self.assertEqual(git(self.repo,'log','-1','--format=%H'),before)
        self.assertFalse((self.repo/'step').exists())

    def test_unsafe_target_names_rejected(self):
        from p2_34af_git_history_recovery import inspect
        report=inspect(self.repo,self.pins)
        pins={'../outside':self.pins['step'],'index':self.pins['index'],
              'audit':self.pins['audit']}
        report['matches']['../outside']=report['matches'].pop('step')
        with self.assertRaisesRegex(ValueError,'Unsafe source'):
            ag.restore(self.repo,self.root/'out',inventory=report,pins=pins)

if __name__=='__main__':
    unittest.main(verbosity=2)
