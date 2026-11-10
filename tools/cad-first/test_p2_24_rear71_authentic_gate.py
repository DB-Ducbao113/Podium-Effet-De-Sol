"""P2.24 QA of part ownership and native collision algorithm, using test boxes.

These seven tests do NOT impersonate original missing P2.12/P2.14 CAD.
Authentic 71-body integration is allowed only via the Git-blob-pinned CLI.
"""
from __future__ import annotations

import json
from pathlib import Path
import tempfile
import unittest

import cadquery as cq

from p2_24_rear71_authentic_gate import (
    SCHEMA,VERIFIED_SOURCE_BLOBS,PALETTE_PATH,PALETTE_BLOB,EXPECTED_BEARING_NAMES,compose_intermediate,
    compose_final,static_stage,make_report,authenticate_source_tree,
)
from p2_24_rear71_review_export import export_source,validate_gate,role_of


def _box(i:int):
    return cq.Workplane('XY').box(1,1,1).val().translate((i*4,0,0))


def synthetic():
    """Exactly shaped part NAME lineage, intentionally unrelated geometries."""
    index=0
    def add(target,names):
        nonlocal index
        for name in names:
            target[name]=_box(index)
            index+=1
    rear={}
    add(rear,('P216_REAR_HUB_STUB', 'P218_REAR_MALE_HELICAL_SPINDLE_EXTENSION',
              'P217_REAR_ROTOR_HAT_SPACER'))
    add(rear,[f'P221_REAR_ROTOR_HAT_STUD_UNTHREADED_{i:02d}' for i in range(1,9)])
    add(rear,[f'P216_P217_P218_PART_{i:02d}' for i in range(29)])
    suspension={}
    add(suspension,['P29_REAR_UPRIGHT_BEARING_CARRIER_PROPOSAL',
                     'P210_REAR_UPPER_A_ARM_FORGED','P210_REAR_LOWER_A_ARM_FORGED',
                     EXPECTED_BEARING_NAMES['UPPER'],EXPECTED_BEARING_NAMES['LOWER']])
    add(suspension,[f'P210_REAR_PIVOT_PART_{i:02d}' for i in range(6)])
    toe={}
    # Shared P2.9/P2.10 identities must be ignored, even with bad geometry.
    for name in suspension:toe[name]=_box(300+len(toe))
    add(toe,[EXPECTED_BEARING_NAMES['TOE_OUTER'],EXPECTED_BEARING_NAMES['TOE_INNER'],
             'P211_REAR_TOE_OUTER_CLEVIS_PIN']+[f'P212_TOE_ADJUSTER_{i:02d}' for i in range(5)])
    split={}
    add(split,[f'P214_REAR_SPLIT_RACE_{i:02d}' for i in range(16)])
    assert (len(rear),len(suspension),len(toe),len(split))==(40,11,19,16)
    return rear,suspension,toe,split


class TestP224NativeSourceOwnership(unittest.TestCase):
    def setUp(self):
        self.rear,self.suspension,self.toe,self.split=synthetic()

    def _assembly(self):
        intermediate,older,newer,stage1=compose_intermediate(self.rear,self.suspension,True)
        first=static_stage(intermediate,older,newer)
        final,retained,additions,stage2=compose_final(
            intermediate,self.toe,self.split,EXPECTED_BEARING_NAMES,first['passNewCrossSourceStatic'])
        second=static_stage(final,retained,additions)
        return intermediate,final,first,second,stage1,stage2,retained,additions

    def test_current_40_plus_11_is_51_not_legacy_43(self):
        initial,_,first,_,meta,_,_,_=self._assembly()
        self.assertEqual(len(initial),51)
        self.assertEqual(meta['previouslyAuditedRear40Pairs'],780)
        self.assertEqual(meta['potentialAdditionalPairs'],495)
        self.assertEqual(first['allPairs'],1275)
        self.assertEqual(first['previouslyCertifiedOldOldPairs'],780)
        self.assertTrue(first['passNewCrossSourceStatic'])

    def test_exact71_preserves_p223_and_deduplicates_source_bearings(self):
        _,merged,_,second,_,meta,retained,new=self._assembly()
        self.assertEqual((len(merged),len(retained),len(new)),(71,49,22))
        self.assertEqual(meta['candidateAllPairs'],2485)
        self.assertEqual(meta['previouslyVerifiedOldOldPairs'],1176)
        self.assertEqual(meta['crossSourcePairCandidates'],1309)
        self.assertEqual(second['allPairs'],2485)
        self.assertEqual(second['previouslyCertifiedOldOldPairs'],1176)
        self.assertTrue(second['passNewCrossSourceStatic'])
        self.assertEqual(len(set(merged)),71)
        self.assertIs(merged['P210_REAR_UPPER_A_ARM_FORGED'],self.suspension['P210_REAR_UPPER_A_ARM_FORGED'])
        for name in EXPECTED_BEARING_NAMES.values():self.assertNotIn(name,merged)
        self.assertIn('P218_REAR_MALE_HELICAL_SPINDLE_EXTENSION',merged)

    def test_real_occt_boolean_detects_intentional_new_joint_collision(self):
        _,merged,_,proof,_,_,retained,new=self._assembly()
        self.assertTrue(proof['passNewCrossSourceStatic'])
        updated=dict(merged)
        updated['P214_REAR_SPLIT_RACE_00']=self.rear['P216_REAR_HUB_STUB']
        failed=static_stage(updated,retained,new)
        self.assertFalse(failed['passNewCrossSourceStatic'])
        self.assertEqual(len(failed['detectedCollisions']),1)
        self.assertGreater(failed['detectedCollisions'][0]['overlapMm3'],.05)

    def test_stale63_or_unapproved_bearing_replacement_fails(self):
        with self.assertRaisesRegex(ValueError,'40 and original'):
            compose_intermediate(dict(list(self.rear.items())[:32]),self.suspension,True)
        with self.assertRaisesRegex(ValueError,'40-body'):
            compose_intermediate(self.rear,self.suspension,False)
        middle,_,_,_=compose_intermediate(self.rear,self.suspension,True)
        wrong=dict(EXPECTED_BEARING_NAMES);wrong['UPPER']='P210_REAR_FAKE_BEARING'
        with self.assertRaisesRegex(ValueError,'bearing replacement'):
            compose_final(middle,self.toe,self.split,wrong,True)
        with self.assertRaisesRegex(ValueError,'51-native'):
            compose_final(middle,self.toe,self.split,EXPECTED_BEARING_NAMES,False)

    def test_original_source_sha_missing_and_fixture_tamper_are_fatal(self):
        with tempfile.TemporaryDirectory() as path:
            root=Path(path)
            with self.assertRaises(FileNotFoundError):authenticate_source_tree(root)
            for filename in VERIFIED_SOURCE_BLOBS:
                (root/filename).write_text('NOT THE ORIGINAL CAD SOURCE')
            with self.assertRaisesRegex(ValueError,'Unapproved native CAD Git blob'):
                authenticate_source_tree(root)

    def test_report_never_certifies_full_car_or_mechanical_gate(self):
        _,all_parts,first,second,one,two,_,_=self._assembly()
        report=make_report({**VERIFIED_SOURCE_BLOBS,PALETTE_PATH:PALETTE_BLOB},first,second,one,two,list(all_parts))
        self.assertEqual(report['schema'],SCHEMA)
        self.assertTrue(report['static71SourceCertified'])
        self.assertEqual(report['status'],'STATIC_REAR71_PASS_MECHANICAL_G2_HOLD')
        self.assertFalse(report['mechanicalG2Certified'])
        self.assertFalse(report['fullF1Completed'])
        self.assertFalse(report['actualModelBSourceUsedForMating'])
        self.assertEqual(report['viewerUniformColor'],'#87929d')

    def test_review_export_cannot_bypass_missing_authentic_gate(self):
        _,all_parts,first,second,one,two,_,_=self._assembly()
        report=make_report({},first,second,one,two,list(all_parts))
        with self.assertRaisesRegex(ValueError,'Git blob authenticity'):
            validate_gate(all_parts,report)
        with tempfile.TemporaryDirectory() as path:
            output=Path(path)/'fake_rear'
            with self.assertRaises(ValueError):export_source(all_parts,report,output)
            self.assertFalse(output.exists())
        self.assertEqual(role_of('P216_REAR_TYRE_SLICK'), 'tyre')
        self.assertEqual(role_of('P214_SPLIT_RACE'), 'bearing')


if __name__=='__main__':unittest.main(verbosity=2)
