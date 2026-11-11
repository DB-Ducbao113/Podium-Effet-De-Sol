"""P2.33 original rear76 owner gate and native OCC negative controls.

The synthetic boxes in these tests exercise pairing logic; they are NEVER
substituted for real P2.12/P2.14 geometry to certify rear76 G2 readiness.
"""
import os
import tempfile
import unittest
from pathlib import Path
import cadquery as cq

from p2_33_real_rear76_gate import authenticate,incremental,union_sources,import_p231

class TestP233SourceGate(unittest.TestCase):
    def test_missing_or_modified_original_authoring_source_fails_closed(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder)
            with self.assertRaises(FileNotFoundError):authenticate(root)
            (root/'p2_9_rear_upright.py').write_text('NOT THE ORIGINAL')
            with self.assertRaisesRegex(ValueError,'Git blob mismatch'):authenticate(root)

    def test_exact_1419_pair_count_and_real_brep_collision_detection(self):
        # Draw distinct non-overlapping native CadQuery BRep blocks at spaced
        # positions, explicitly to test the algorithm, not CAD source quality.
        solids={f'SOURCE_OLD_{i:02d}':cq.Workplane('XY').box(1,1,1).val().translate((i*3,0,0)) for i in range(54)}
        solids.update({f'SOURCE_NEW_{i:02d}':cq.Workplane('XY').box(1,1,1).val().translate((200+i*3,0,0)) for i in range(22)})
        old={f'SOURCE_OLD_{i:02d}' for i in range(54)}
        new=set(solids)-old
        proof=incremental(solids,old,new)
        self.assertEqual((proof['allPairs'],proof['inheritedOldPairs'],proof['newAffectedPairs']),(2850,1431,1419))
        self.assertEqual(proof['aabbExcluded'],1419)
        self.assertEqual(proof['exactNativeBrepPairs'],0)
        self.assertTrue(proof['nominalStaticPASS'])
        self.assertFalse(proof['mechanicalG2Certified'])
        solids['SOURCE_NEW_00']=solids['SOURCE_OLD_00']
        bad=incremental(solids,old,new)
        self.assertFalse(bad['nominalStaticPASS'])
        self.assertGreater(bad['confirmedCollisions'][0]['volumeMm3'],.05)
        self.assertEqual(bad['exactNativeBrepPairs'],1)

    def test_incorrect_part_ownership_cannot_pass(self):
        old={f'old_{i}':cq.Workplane('XY').box(1,1,1).val() for i in range(54)}
        with self.assertRaisesRegex(ValueError,'Expected 54 inherited'):
            incremental(old,set(old),set())

    def test_real_p231_step_sha_and_name_map_if_present(self):
        step=os.environ.get('PEDS_P231_STEP')
        names=os.environ.get('PEDS_P231_NAMES')
        if not step or not names:
            self.skipTest('Original owner P2.31 native STEP and name map not connected to checkout')
        original=import_p231(Path(step),Path(names))
        self.assertEqual(len(original),56)
        self.assertIn('P210_REAR_UPPER_A_ARM_FORGED',original)
        self.assertIn('P29_REAR_UPRIGHT_BEARING_CARRIER_PROPOSAL',original)

if __name__=='__main__':unittest.main(verbosity=2)
