"""Unit tests for Model B original binary Git-object provenance preflight.

Uses synthetic GLB fixture ONLY to exercise file and SHA checks; does not
replace original showroom GLB in the vehicle/website.
"""
from __future__ import annotations
import json
import struct
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import verify_original_model_b_asset as preflight

def fake_glb()->bytes:
    obj={'asset':{'version':'2.0'},
         'nodes':[{'name':'synthetic-only-glb-node','mesh':0}],
         'meshes':[{'primitives':[{'attributes':{}}]}]}
    content=json.dumps(obj,separators=(',',':')).encode('utf8')
    content+=b' '*(-len(content)%4)
    return struct.pack('<IIIII',
         0x46546c67,2,20+len(content),len(content),0x4e4f534a)+content

class OriginalModelBGitObjectTests(unittest.TestCase):
    def test_git_blob_digest_independently_matches_git_reference(self):
        self.assertEqual(preflight.git_blob_sha1(b'hello world'),
                         '95d09f2b10159347eece71399a7e2e907ea3df4f')
    def test_exact_fixture_pass_requires_size_sha_and_glb_scene(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'synthetic-only.glb'
            content=fake_glb();path.write_bytes(content)
            with patch.object(preflight,'EXPECTED_SIZE',len(content)),\
                 patch.object(preflight,'EXPECTED_GIT_BLOB_SHA1',
                              preflight.git_blob_sha1(content)):
                report=preflight.verify(path)
                self.assertTrue(report['gitBlobIdentityValid'])
                self.assertFalse(report['rendererDecoded'])
                self.assertFalse(report['fourWheelCadMated'])
                self.assertEqual(report['mechanicalG2'],'HOLD')
    def test_same_size_tamper_must_fail_sha(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'changed.glb'
            original=fake_glb()
            changed=bytearray(original)
            changed[-1]^=1
            path.write_bytes(changed)
            with patch.object(preflight,'EXPECTED_SIZE',len(original)),\
                 patch.object(preflight,'EXPECTED_GIT_BLOB_SHA1',
                              preflight.git_blob_sha1(original)):
                with self.assertRaisesRegex(RuntimeError,'Git object SHA'):
                    preflight.verify(path)
    def test_missing_file_or_truncated_invalid_binary_cannot_pass(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'invalid.glb'
            path.write_bytes(b'wrong-file')
            with self.assertRaisesRegex(RuntimeError,'byte size'):
                preflight.verify(path)
            with patch.object(preflight,'EXPECTED_SIZE',len(b'wrong-file')),\
                 patch.object(preflight,'EXPECTED_GIT_BLOB_SHA1',
                              preflight.git_blob_sha1(b'wrong-file')):
                with self.assertRaisesRegex(RuntimeError,'GLB header'):
                    preflight.verify(path)

if __name__=='__main__':unittest.main(verbosity=2)
