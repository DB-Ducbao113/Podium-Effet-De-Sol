"""No external CAD needed: verify recovery guard cannot overwrite owner packs."""
import hashlib
import json
from pathlib import Path
import tempfile
import unittest

from rebuild_owner_p28 import rebuild, complete

class RecoveryProtectionTests(unittest.TestCase):
    def test_nonempty_unverified_folder_refused(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder=Path(tmp)/"owner"
            folder.mkdir()
            (folder/"P28_integrated_59_solid_master.step").write_bytes(b"preserve owner CAD")
            with self.assertRaises(SystemExit):
                rebuild(folder)
            self.assertEqual((folder/"P28_integrated_59_solid_master.step").read_bytes(),b"preserve owner CAD")

    def test_hash_complete_short_circuits_without_regeneration(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder=Path(tmp)/"owner"
            folder.mkdir()
            step=folder/"original.step";step.write_bytes(b"owner-step")
            tiers={}
            for name in ("HIGH","BALANCED","PERFORMANCE"):
                file=folder/f"owner_{name}.glb"
                file.write_bytes(name.encode())
                tiers[name]={"file":file.name,"sha256":hashlib.sha256(file.read_bytes()).hexdigest()}
            m={"schema":"podium-eds.p2.cad-first.full-corner.remate.v1",
               "partIds":[f"P2_{i}" for i in range(59)],
               "allRoundtripValid":True,
               "masterSTEP":step.name,
               "masterSTEPsha256":hashlib.sha256(step.read_bytes()).hexdigest(),
               "profiles":tiers}
            (folder/"P28_remate_manifest.json").write_text(json.dumps(m))
            self.assertTrue(complete(folder))
            rebuild(folder)
            self.assertEqual(step.read_bytes(),b"owner-step")

    def test_manifest_hash_tampering_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder=Path(tmp)
            (folder/"P28_remate_manifest.json").write_text(json.dumps({
                "schema":"podium-eds.p2.cad-first.full-corner.remate.v1",
                "partIds":[f"P2_{i}" for i in range(59)],"allRoundtripValid":True,
                "profiles":{"HIGH":{"file":"missing.glb","sha256":"a"*64},
                    "BALANCED":{"file":"missing.glb","sha256":"a"*64},
                    "PERFORMANCE":{"file":"missing.glb","sha256":"a"*64}},
                "masterSTEP":"missing.step","masterSTEPsha256":"a"*64}))
            self.assertFalse(complete(folder))
if __name__=="__main__":unittest.main()
