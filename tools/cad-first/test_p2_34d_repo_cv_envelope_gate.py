"""Original source-pinned P2.34D repo gate regression (no synthetic 84-body pass)."""
import os,shutil,tempfile,unittest
from pathlib import Path
from p2_34d_repo_cv_envelope_gate import original,revised,audit,poses,run

SOURCE=Path(os.environ.get('PEDS_P234D_P234C_NATIVE',
    str(Path(__file__).resolve().parents[2]/'.local-assets/cad-first/p234c-native')))

class TestP234DRepo(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not (SOURCE/'P234C_original_source84_six_ball_proto_static.step').is_file():
            raise unittest.SkipTest('Original P2.34C native STEP missing; no made-up CAD PASS')

    def test_authentic_84_source_165_pairs_and_11_angles(self):
        with tempfile.TemporaryDirectory() as d:
            out=Path(d)/'out';r=run(SOURCE,out)
            self.assertEqual(r['solids'],84)
            self.assertEqual((r['static']['allPairs'],r['static']['affectedPairs']),(3486,165))
            self.assertEqual((r['static']['AABBExcluded'],r['static']['exactOpenCascadePairs']),(149,16))
            self.assertTrue(r['static']['passStatic'])
            self.assertEqual(len(r['sampledMotionAndEnvelope']['angles']),11)
            for deg in (-10,10):
                pose=next(x for x in r['sampledMotionAndEnvelope']['angles'] if x['angleDeg']==deg)
                self.assertEqual(pose['oldCupProtrudingBalls'],4)
                self.assertEqual(pose['newCupProtrudingBalls'],0)
                self.assertGreater(pose['minCageAxialMarginMm'],.46)
            self.assertFalse(r['functionalCVVerified'])
            self.assertFalse(r['mechanicalG2Certified'])
            with self.assertRaises(FileExistsError):run(SOURCE,out)

    def test_original_source_mutation_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            source=Path(d)/'tamper';source.mkdir()
            for f in SOURCE.iterdir():shutil.copy2(f,source/f.name)
            file=source/'P234C_source84_step_name_map.json'
            file.write_bytes(file.read_bytes()+b'bad')
            with self.assertRaisesRegex(ValueError,'source SHA mismatch'):
                run(source,Path(d)/'blocked')
            self.assertFalse((Path(d)/'blocked').exists())

if __name__=='__main__':unittest.main(verbosity=2)
