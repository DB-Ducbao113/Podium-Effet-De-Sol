"""P2.30 source-authenticated actual 48-BRep export and collision-gate tests.

Heavy source authoring runs once via CLI in a fresh process; these tests read
its SHA-256-attested STEP/JSON. Synthetic blocks only test the gate's negative
control, and never impersonate original 48 native mechanical parts.
"""
from __future__ import annotations
import hashlib
import json
import os
from pathlib import Path
import tempfile
import unittest

import cadquery as cq

from p2_30_rear48_brep_gate import (
    SCHEMA, SOURCE_P229_GIT_BLOB, SOURCE_P219_STEP_SHA, UPPER, LOWER,
    exact_arm_step, incremental_audit, git_blob, run, sha,
)

OUT=Path(os.environ.get('PEDS_P230_NATIVE48_DIR',str(Path(__file__).resolve().parents[2]/'.local-assets/cad-first/p230-native48')))
P219=Path(os.environ.get('PEDS_P219_NATIVE_DIR',str(Path(__file__).resolve().parents[2]/'.local-assets/cad-first/p219-native')))

class TestP230Native48(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        manifest=OUT/'P230_rear48_native_source_audit.json'
        if not manifest.exists():
            raise unittest.SkipTest('Authentic P2.30 48-body native CLI evidence absent')
        cls.record=json.loads(manifest.read_text())

    def test_verified_source_bytes_and_name_partition(self):
        from p2_29_caliper_upright_carrier import __file__ as path
        self.assertEqual(git_blob(Path(path)),SOURCE_P229_GIT_BLOB)
        record=self.record
        self.assertEqual(record['schema'],SCHEMA)
        self.assertEqual(record['p229SourceGitBlob'],SOURCE_P229_GIT_BLOB)
        self.assertEqual(record['p219ArmSource']['P219OriginalStepSha256'],SOURCE_P219_STEP_SHA)
        self.assertEqual(record['partCount'],48)
        self.assertEqual(len(set(record['sourceIds'])),48)
        self.assertIn(UPPER,record['sourceIds'])
        self.assertIn(LOWER,record['sourceIds'])
        self.assertTrue(record['notIncluded8P210NativeBodies'])
        self.assertFalse(record['mechanicalG2Certified'])

    def test_true_pair_accounting_and_source_gate(self):
        a=self.record['source48NativeAudit']
        self.assertEqual(self.record['status'],'SOURCE48_STATIC_PASS_MECHANICAL_G2_HOLD')
        self.assertEqual(a['allNativeSourceBodies'],48)
        self.assertEqual(a['allUnorderedPairs'],1128)
        self.assertEqual(a['inheritedP229NativeOldOldPairs'],1035)
        self.assertEqual(a['newOrChangedPairs'],93)
        self.assertEqual(a['newCrossPairsAabbExcluded'],89)
        self.assertEqual(a['newCrossPairsOpenCascadeExact'],4)
        self.assertEqual(a['interferences'],[])
        self.assertEqual(a['kernelFailures'],[])
        self.assertTrue(a['passNominal48SourceStatic'])
        self.assertFalse(a['allP210P212P214Checked'])

    def test_original_48body_STEP_is_real_valid_and_integrity_bound(self):
        native=self.record['source48NativeSTEP']
        self.assertEqual(native['roundtripSolids'],48)
        step=OUT/native['file']
        self.assertEqual(sha(step),native['sha256'])
        solids=cq.importers.importStep(str(step)).solids().vals()
        self.assertEqual(len(solids),48)
        self.assertTrue(all(body.isValid() and body.Volume()>0 for body in solids))
        self.assertFalse(native['manufacturingOrG2Certified'])

    def test_true_p219_2solid_source_PIN_and_tamper(self):
        arms,manifest=exact_arm_step(P219)
        self.assertEqual(set(arms),{UPPER,LOWER})
        self.assertEqual(manifest['P219OriginalStepSha256'],SOURCE_P219_STEP_SHA)
        with tempfile.TemporaryDirectory() as tmp:
            folder=Path(tmp)
            base=P219/'P219_rear_wishbone_manifest.json'
            (folder/base.name).write_bytes(base.read_bytes())
            meta=json.loads(base.read_text())
            filename=meta['nativeStep']['file']
            (folder/filename).write_bytes((P219/filename).read_bytes()+b'altered')
            with self.assertRaisesRegex(ValueError,'SHA-256 authenticity'):
                exact_arm_step(folder)

    def test_overlap_negative_control_using_actual_occt_BRep(self):
        old={'P229_TEST_BODY':cq.Workplane('XY').box(10,10,10).val()}
        new={'P219_TEST_ARM':cq.Workplane('XY').box(10,10,10).val().translate((5,0,0))}
        self.assertFalse(incremental_audit(old,new,True)['passNominal48SourceStatic'])
        self.assertGreater(incremental_audit(old,new,True)['interferences'][0]['overlapMm3'],0.05)
        with self.assertRaisesRegex(ValueError,'not passed'):
            incremental_audit(old,new,False)
        new['P219_TEST_ARM']=new['P219_TEST_ARM'].translate((100,0,0))
        self.assertTrue(incremental_audit(old,new,True)['passNominal48SourceStatic'])

    def test_no_overwrite_and_no_71_original_claim(self):
        with self.assertRaises(FileExistsError):
            run(P219,OUT,True)
        self.assertFalse(self.record['p212P214NativeSourcesNotIncluded'] is False)
        self.assertFalse(self.record['originalModelBIncluded'])
        self.assertEqual(self.record['expectedLatestRear56SourceMeshCount'],56)

if __name__=='__main__':unittest.main(verbosity=2)
