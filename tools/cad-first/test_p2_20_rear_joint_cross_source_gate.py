"""P2.20 source ownership, negative-control clash, and fail-closed tests.

The independent synthetic test geometry here validates the audit ALGORITHM;
it does not claim to have executed the author's missing P2.12/P2.14 B-Reps.
"""
from __future__ import annotations
import tempfile
from pathlib import Path
import unittest
import cadquery as cq
from p2_20_rear_joint_cross_source_gate import compose_nominal,incremental_brep_audit,authenticate_sources,UPSTREAM_GIT_BLOBS


def native_box(x:float,y:float=0,z:float=0):
    return cq.Workplane('XY').box(1,1,1).val().translate((x,y,z))


def fake_sources():
    base={'P29_CARRIER':native_box(-400)}
    for i in range(10):
        name=('P210_REAR_UPPER_OUTER_SPHERICAL_BEARING_PROPOSAL' if i==1 else
              'P210_REAR_LOWER_OUTER_SPHERICAL_BEARING_PROPOSAL' if i==2 else f'P210_PART_{i:02d}')
        base[name]=native_box(-350+10*i)
    for i in range(32):base[f'P216_P217_P218_PART_{i:02d}']=native_box(-200+3*i)
    # 11 shared source names are deliberately reused with misleading geometry.
    toe={k:native_box(100+i*3) for i,k in enumerate(base) if k.startswith(('P29_','P210_'))}
    toe['P211_REAR_TOE_OUTER_BEARING_PROPOSAL']=native_box(200)
    toe['P211_REAR_TOE_INNER_BEARING_PROPOSAL']=native_box(202)
    toe['P211_REAR_TOE_OUTER_CLEVIS_PIN']=native_box(204)
    for i in range(5):toe[f'P212_PART_{i}']=native_box(207+i*3)
    split={f'P214_PART_{i:02d}':native_box(300+i*3) for i in range(16)}
    replacements={'UPPER':'P210_REAR_UPPER_OUTER_SPHERICAL_BEARING_PROPOSAL',
                  'LOWER':'P210_REAR_LOWER_OUTER_SPHERICAL_BEARING_PROPOSAL',
                  'TOE_OUTER':'P211_REAR_TOE_OUTER_BEARING_PROPOSAL',
                  'TOE_INNER':'P211_REAR_TOE_INNER_BEARING_PROPOSAL'}
    return base,toe,split,replacements


class TestP220SourceOwnership(unittest.TestCase):
    def test_exact_63_unique_parts_and_p219_arm_precedence(self):
        base,toe,split,replacements=fake_sources()
        merged,retained,new,ledger=compose_nominal(base,toe,split,replacements,True)
        self.assertEqual((len(merged),len(retained),len(new)),(63,41,22))
        self.assertEqual(ledger['expectedAllPairs'],1953)
        self.assertEqual(ledger['priorOldOldPairsProvenByP219'],820)
        self.assertEqual(set(ledger['removedOldBearingIds']),set(replacements.values()))
        self.assertIs(merged['P210_PART_00'],base['P210_PART_00'])
        self.assertTrue(all(key in merged for key in split))

    def test_no_duplicate_upstream_overlay_or_uncertified_original(self):
        base,toe,split,replacements=fake_sources()
        with self.assertRaisesRegex(ValueError,'prior 43-body'):
            compose_nominal(base,toe,split,replacements,False)
        with self.assertRaisesRegex(ValueError,'unexpected|Unexpected'):
            compose_nominal(base,{},split,replacements,True)
        toe['P214_PART_00']=native_box(700)
        with self.assertRaisesRegex(ValueError,'count'):
            compose_nominal(base,toe,split,replacements,True)

    def test_native_open_cascade_detects_intentional_collision(self):
        base,toe,split,replacements=fake_sources()
        merged,retained,new,_=compose_nominal(base,toe,split,replacements,True)
        passed=incremental_brep_audit(merged,retained,new)
        self.assertTrue(passed['passNewCrossSourceStatic'])
        self.assertEqual(passed['allPairs'],1953)
        self.assertEqual(passed['previouslyCertifiedOldOldPairs'],820)
        self.assertEqual(passed['previouslyCertifiedOldOldPairs']+
            passed['broadphaseExcluded']+passed['exactOpenCascadeBooleanPairs'],1953)
        # Drive a new split race into an existing P2.19 part by one full unit.
        collided=dict(merged)
        collided['P214_PART_00']=native_box(-400)
        failed=incremental_brep_audit(collided,retained,new)
        self.assertFalse(failed['passNewCrossSourceStatic'])
        self.assertEqual(len(failed['detectedCollisions']),1)
        self.assertGreater(failed['detectedCollisions'][0]['overlapMm3'],.05)

    def test_missing_or_wrong_git_source_blob_rejected_before_native_assembly(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)
            with self.assertRaises(FileNotFoundError):authenticate_sources(root)
            for name in UPSTREAM_GIT_BLOBS:(root/name).write_text('fabricated fixture')
            with self.assertRaisesRegex(ValueError,'Git source blob mismatch'):
                authenticate_sources(root)


if __name__=='__main__':unittest.main(verbosity=2)
