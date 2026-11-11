"""P2.34 authentic native 76 STEP vs original source and geometric controls."""
from __future__ import annotations
import json,os,hashlib,unittest,tempfile
from pathlib import Path
import cadquery as cq
from p2_34_inboard_cv_keyed_coupling import (
    get_source,keyed_inboard_mate,native_min_distance,recheck_modified,
    prove_engagement,run,sha,SHAFT,HOUSING,BOOT,SOURCE_STEP_SHA)

BASE=Path(os.environ.get('PEDS_P234_PACKAGE_ROOT',str(Path(__file__).resolve().parents[1])))
P233=BASE/'source'
NEW=BASE/'native'

class TestP234ActualNative(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.prior,_=get_source(P233/'P233_original_rear76_native_static.step',
            P233/'P233_rear76_step_source_name_index.json',
            P233/'P233_original_rear76_native_audit.json')
        cls.report=json.loads((NEW/'P234_rear76_static_coupler_audit.json').read_text())
        cls.mapping=json.loads((NEW/'P234_rear76_source_name_map.json').read_text())
        step=NEW/cls.report['nativeSTEP']['file']
        cls.bodies=cq.importers.importStep(str(step)).solids().vals()
        cls.updated={name:cls.bodies[idx] for name,idx in cls.mapping['nameToZeroBasedSolidIndex'].items()}

    def test_real_source_sha_and_exact_one_to_one_76_names(self):
        self.assertEqual(sha(P233/'P233_original_rear76_native_static.step'),SOURCE_STEP_SHA)
        self.assertEqual(set(self.updated),set(self.prior))
        self.assertEqual(len(self.updated),76)
        self.assertEqual(set(self.mapping['nameToZeroBasedSolidIndex'].values()),set(range(76)))
        self.assertEqual(sha(NEW/self.report['nativeSTEP']['file']),self.report['nativeSTEP']['sha256'])
        self.assertTrue(all(s.isValid() and len(s.Solids())==1 and s.Volume()>0 for s in self.updated.values()))

    def test_only_original_two_bodies_changed(self):
        changed={SHAFT,HOUSING}
        for name,solid in self.prior.items():
            actual=self.updated[name]
            if name not in changed:
                self.assertLess(abs(solid.Volume()-actual.Volume()),max(.01,solid.Volume()*1e-5),msg=name)
                b0,b1=solid.BoundingBox(),actual.BoundingBox()
                self.assertLess(max(abs(getattr(b0,k)-getattr(b1,k)) for k in
                    ('xmin','xmax','ymin','ymax','zmin','zmax')),.02,msg=name)
            else:
                self.assertNotAlmostEqual(solid.Volume(),actual.Volume(),places=0,msg=name)

    def test_real_native_old_gap_and_nominal_axial_seat(self):
        self.assertAlmostEqual(native_min_distance(self.prior[SHAFT],self.prior[HOUSING]),2.6,places=4)
        self.assertLess(native_min_distance(self.updated[SHAFT],self.updated[HOUSING]),.0001)
        self.assertLess(self.updated[SHAFT].intersect(self.updated[HOUSING]).Volume(),.05)
        self.assertGreater(native_min_distance(self.updated[SHAFT],self.updated[BOOT]),3.)
        self.assertFalse(self.report['nominalMateEvidence']['oppositeAxialRetentionCertified'])

    def test_actual_76_static_pair_recheck_with_inherited_prior_gate(self):
        proof=self.report['staticNativeAudit']
        self.assertEqual((proof['allSourcePairs'],proof['inheritedAuthenticP233UnaffectedPairs'],proof['newOrChangedAffectedPairs']),
                         (2850,2701,149))
        self.assertEqual((proof['aabbExcludedAffectedPairs'],proof['exactNativeOpenCascadeBooleanPairs']),(141,8))
        self.assertEqual(proof['significantInterferences'],[])
        self.assertEqual(proof['nativeKernelErrors'],[])
        self.assertTrue(proof['nominalStaticPass'])
        self.assertFalse(proof['mechanicalG2Certified'])
        self.assertEqual(self.report['status'],'RIGID_SHAFT_CV_HOUSING_NATIVE_STATIC_PASS_G2_HOLD')

    def test_relative_rotation_positive_collision_control(self):
        self.assertGreater(self.updated[SHAFT].rotate((0,0,0),(0,0,1),2).intersect(self.updated[HOUSING]).Volume(),5)
        self.assertGreater(self.updated[SHAFT].rotate((0,0,0),(0,0,1),-2).intersect(self.updated[HOUSING]).Volume(),5)
        self.assertTrue(self.report['nominalMateEvidence']['jointIsRigidNotArticulating'])
        self.assertFalse(self.report['actualArticulatingCvJointDesigned'])

    def test_sha_tamper_rejection_before_any_output(self):
        with tempfile.TemporaryDirectory() as tmp:
            bad=Path(tmp)/'bad.step'
            bad.write_bytes((P233/'P233_original_rear76_native_static.step').read_bytes()+b'TAMPER')
            with self.assertRaisesRegex(ValueError,'SHA-256 mismatch'):
                run(bad,P233/'P233_rear76_step_source_name_index.json',
                    P233/'P233_original_rear76_native_audit.json',Path(tmp)/'blocked')
            self.assertFalse((Path(tmp)/'blocked').exists())
            with self.assertRaises(FileExistsError):
                run(P233/'P233_original_rear76_native_static.step',
                    P233/'P233_rear76_step_source_name_index.json',
                    P233/'P233_original_rear76_native_audit.json',NEW)

if __name__=='__main__':unittest.main(verbosity=2)
