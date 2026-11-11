"""P2.34b connected-GitHub repo CLI regression against real source P2.34 STEP."""
from __future__ import annotations
import json,os,shutil,tempfile,unittest
from pathlib import Path
from p2_34b_repo_native_retainer import verified_input,edit,audit,run,RING,SHAFT,HOUSING

SOURCE=Path(os.environ.get('PEDS_P234B_REPO_SOURCE',str(Path(__file__).resolve().parent.parent/'source/native')))
class TestP234BRepoNative(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not (SOURCE/'P234_original_rear76_inboard_keyed_static.step').is_file():
            raise unittest.SkipTest('Authentic original P2.34 source STEP missing; no fabricated stand-in')

    def test_direct_real_original_source_brep_77_gate(self):
        src,digests=verified_input(SOURCE)
        self.assertEqual(len(src),76)
        shaft,ring=edit(src[SHAFT]);updated={**src,SHAFT:shaft,RING:ring}
        proof=audit(src,updated)
        self.assertEqual((proof['allPairs'],proof['newAffectedPairs']),(2926,151))
        self.assertEqual((proof['aabbExcluded'],proof['exactOpenCascadeBooleanPairs']),(142,9))
        self.assertEqual(proof['significantClashes'],[])
        self.assertTrue(proof['passNominalStatic'])

    def test_real_step_export_77_source_name_index_and_articulation_failure(self):
        with tempfile.TemporaryDirectory() as temp:
            output=Path(temp)/'out'
            result=run(SOURCE,output)
            self.assertEqual(result['nativeSTEP']['validSolids'],77)
            self.assertEqual(result['nativeSTEP']['namedSolids'],77)
            index=json.loads((output/'P234B_rear77_source_name_map.json').read_text())
            self.assertEqual(set(index['nameToZeroBasedSolidIndex'].values()),set(range(77)))
            self.assertGreater(result['oneDegreeCvTiltCollisionMm3'],50)
            self.assertFalse(result['realArticulatingCvCertified'])
            self.assertFalse(result['mechanicalG2Certified'])
            with self.assertRaises(FileExistsError):run(SOURCE,output)

    def test_tampered_original_cad_rejected_before_export(self):
        with tempfile.TemporaryDirectory() as temp:
            d=Path(temp)/'source';shutil.copytree(SOURCE,d)
            p=d/'P234_original_rear76_inboard_keyed_static.step'
            p.write_bytes(p.read_bytes()+b'bad')
            with self.assertRaisesRegex(ValueError,'source SHA-256 mismatch'):
                run(d,Path(temp)/'blocked')
            self.assertFalse((Path(temp)/'blocked').exists())

if __name__=='__main__':unittest.main(verbosity=2)
