"""P2.31 compact GitHub gate regression; genuine P2.30 + original P2.10 CAD."""
from __future__ import annotations
import json,os,shutil,tempfile,unittest
from pathlib import Path
import cadquery as cq
from p2_31_rear56_native_crosscheck import run,collision_check,P210_SHA,P230_STEP_SHA

SOURCE=Path(os.environ.get('PEDS_P231_P230_DIR',str(Path(__file__).resolve().parents[2]/'.local-assets/cad-first/p231/sources/p230')))

class TestP231Compact(unittest.TestCase):
    def test_actual_upstream_56_native_collision_scope(self):
        with tempfile.TemporaryDirectory() as d:
            result=run(SOURCE,Path(d)/'new')
            a=result['nativeAudit']
            self.assertEqual(result['status'],'P231_NATIVE_56_CROSS_STATIC_PASS_G2_HOLD')
            self.assertEqual((a['nativeParts'],a['totalUnorderedPairs'],a['newAffectedPairs']),(56,1540,412))
            self.assertEqual((a['newPairsAabbSeparated'],a['exactNativeBooleanPairs']),(392,20))
            self.assertEqual(a['positiveInterferences'],[])
            self.assertEqual(a['kernelErrors'],[])
            self.assertEqual(result['originalP210SourceGitBlob'],P210_SHA)
            self.assertFalse(result['originalModelBIncluded'])
            self.assertFalse(result['mechanicalG2Certified'])
            with self.assertRaises(FileExistsError):run(SOURCE,Path(d)/'new')

    def test_intentional_native_BRep_collision_detected(self):
        old={f'o{i}':cq.Workplane('XY').box(1,1,1).val().translate((i*3,0,0)) for i in range(48)}
        new={f'n{i}':cq.Workplane('XY').box(1,1,1).val().translate((200+i*3,0,0)) for i in range(8)}
        self.assertTrue(collision_check(old,new,True)['passStatic'])
        new['n0']=old['o0']
        bad=collision_check(old,new,True)
        self.assertFalse(bad['passStatic'])
        self.assertGreater(bad['positiveInterferences'][0]['intersectionMm3'],.05)
        with self.assertRaisesRegex(ValueError,'Exactly 48 original'):
            collision_check(old,new,False)

    def test_changed_original_STEP_refused_before_export(self):
        with tempfile.TemporaryDirectory() as d:
            original=Path(d)/'prior';original.mkdir()
            for n in ['P230_rear48_native_source_audit.json','P230_rear48_original_static.step']:
                shutil.copy2(SOURCE/n,original/n)
            step=original/'P230_rear48_original_static.step'
            step.write_bytes(step.read_bytes()+b'TAMPER')
            with self.assertRaisesRegex(ValueError,'evidence invalid'):
                run(original,Path(d)/'not-created')
            self.assertFalse((Path(d)/'not-created').exists())

if __name__=='__main__':unittest.main(verbosity=2)
