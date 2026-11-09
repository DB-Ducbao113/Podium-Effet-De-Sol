"""P2.14 native concept QC, four-way split race radial path. G2 HOLD."""
import unittest
from p2_14_split_spherical_race import (
    STATIONS,source_parts,local_parts,opening_check,assembly_path_audit,
    combined_nominal,pose_articulation_audit
)

class P214SplitRaceNativeTests(unittest.TestCase):
    def test_previous_unassemblable_one_piece_and_feasible_split_clearance(self):
        a=opening_check()
        self.assertFalse(a['originalOnePieceAxialInsertionPossible'])
        self.assertLess(a['originalOnePieceAxialInsertionRadiusMm'],
                        a['rigidBallMaximumRadiusMm'])
        self.assertAlmostEqual(a['radialBallToSphericalCavityClearanceMm'],.3)
        self.assertAlmostEqual(a['raceToSleeveRadialGapMm'],.1)
        self.assertAlmostEqual(a['sleeveToOriginalEyeRadialGapMm'],.12)
        self.assertFalse(a['axialSleeveRetentionCertified'])
    def test_sixteen_connected_independent_native_solids(self):
        parts=source_parts()
        self.assertEqual(len(parts),16)
        self.assertEqual(len(set(parts)),16)
        for name,obj in parts.items():
            self.assertTrue(obj.isValid(),name)
            self.assertEqual(len(obj.Solids()),1,name)
            self.assertGreater(obj.Volume(),200,name)
        for station in STATIONS:
            parts=local_parts(station)
            self.assertEqual(len(parts),4)
            self.assertTrue(any('SPHERE' in f.geomType().upper()
                         for f in parts[f'P214_{station}_SPLIT_RACE_POSITIVE_X'].Faces()))
    def test_path_sampled_clearance_and_intentional_collisions(self):
        path=assembly_path_audit()
        self.assertEqual(path['finiteInsertionPairChecks'],144)
        self.assertEqual(path['positiveControlCount'],4)
        self.assertAlmostEqual(path['maxObservedIntersectionMm3'],0)
        self.assertTrue(path['discreteRadialAssemblyPathPass'])
        self.assertTrue(path['discreteAxialSleevePlacementPass'])
        self.assertTrue(all(x['intersectionMm3']>100 for x in path['intentionallyCollidingSphereControls']))
        self.assertFalse(path['continuousInsertionCertified'])
        self.assertFalse(path['axialSleeveRetentionCertified'])
        self.assertEqual(path['mechanicalG2'],'HOLD')
    def test_seven_ideal_poses_140_native_bearing_subassembly_pairs(self):
        report=pose_articulation_audit()
        self.assertEqual(report['poseCount'],7)
        self.assertEqual(report['jointPoseCount'],28)
        self.assertEqual(report['nativePairChecks'],140)
        self.assertLessEqual(report['maxPositiveOverlapMm3'],.01)
        self.assertFalse(report['continuousSweptCollisionCertified'])
        self.assertFalse(report['whole31BodyDynamicCollisionCertified'])
        self.assertFalse(report['nativeBearingRetentionCertified'])
        self.assertEqual(report['mechanicalG2'],'HOLD')
    def test_all_31_native_source_static_pairs(self):
        from p2_10_rear_wishbone import exact_static_audit
        parts=combined_nominal()
        self.assertEqual(len(parts),31)
        audit=exact_static_audit(parts)
        self.assertEqual(audit['pairCount'],465)
        self.assertEqual(audit['aabbExcluded']+audit['nativeBrepIntersectionsEvaluated'],465)
        self.assertEqual(audit['booleanErrors'],[])
        self.assertEqual(audit['unresolvedCollisions'],[])
        self.assertTrue(audit['passStatic'])
        self.assertFalse(audit['jointRetentionCertified'])
        self.assertFalse(audit['dynamicKinematicsCertified'])

if __name__=='__main__':unittest.main(verbosity=2)
