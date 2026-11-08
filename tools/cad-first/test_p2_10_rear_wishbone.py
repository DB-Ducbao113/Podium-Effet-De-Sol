"""P2.10 original 10-part wishbone + P2.9 upright CAD regression gates."""
from __future__ import annotations
import tempfile
import unittest
from pathlib import Path
import cadquery as cq
import trimesh
from p2_10_rear_wishbone import (
    ARM_PICKUPS_MM, OUTER_EYE_Z_OFFSET_MM, QUALITY, SCHEMA, RADIUS,
    REAR_UPRIGHT_ID, build, build_parts, build_rear_upright,
    cylinder, exact_static_audit, sha,
)

class RearWishboneCADTest(unittest.TestCase):
    def test_ten_new_original_solids_and_distinct_hardpoints(self):
        parts=build_parts()
        self.assertEqual(len(parts),10)
        self.assertEqual(len([x for x in parts if 'A_ARM_FORGED' in x]),2)
        self.assertEqual(len([x for x in parts if 'CHASSIS_PIVOT_BUSHING' in x]),4)
        self.assertEqual(len([x for x in parts if 'SPHERICAL_BEARING' in x]),2)
        self.assertEqual(len([x for x in parts if 'JOINT_PIN' in x]),2)
        self.assertTrue(all(s.isValid() and len(s.Solids())==1 and s.Volume()>0 for s in parts.values()))
        self.assertNotEqual(ARM_PICKUPS_MM['UPPER']['innerA'], ARM_PICKUPS_MM['LOWER']['innerA'])
        self.assertEqual(OUTER_EYE_Z_OFFSET_MM,-43.)

    def test_real_annular_bores_and_source_wishbone_bearing_gaps(self):
        parts=build_parts()
        for station in ('UPPER','LOWER'):
            body=parts[f'P210_REAR_{station}_A_ARM_FORGED']
            joint=ARM_PICKUPS_MM[station]['outerUprightBore']
            x,y,z=joint
            z+=OUTER_EYE_Z_OFFSET_MM
            pin_void=cylinder(RADIUS['outerPinShank'],z-45,85,x,y)
            self.assertLess(body.intersect(pin_void).Volume(),.05)
            for index in ('A','B'):
                pivot=ARM_PICKUPS_MM[station]['inner'+index]
                eye_void=cylinder(RADIUS['innerBushingOuter']*.9,pivot[2]-25,50,pivot[0],pivot[1])
                self.assertLess(body.intersect(eye_void).Volume(),.05)

    def test_native_all_pair_brep_static_11_solids(self):
        combined={REAR_UPRIGHT_ID:build_rear_upright(),**build_parts()}
        result=exact_static_audit(combined)
        self.assertEqual(result['pairCount'],55)
        self.assertEqual(result['nativeBrepIntersectionsEvaluated']+result['aabbExcluded'],55)
        self.assertFalse(result['unresolvedCollisions'])
        self.assertFalse(result['booleanErrors'])
        self.assertTrue(result['passStatic'])
        self.assertFalse(result['dynamicKinematicsCertified'])
        self.assertFalse(result['jointRetentionCertified'])

    def test_original_step_sha_and_progressive_watertight_source_glbs(self):
        with tempfile.TemporaryDirectory() as temp:
            out=Path(temp)/'new-cad'
            m=build(out)
            self.assertEqual(m['schema'],SCHEMA)
            self.assertEqual(m['totalCadSolids'],11)
            self.assertEqual(m['newSolids'],10)
            self.assertFalse(m['chassisHardpointsMeasured'])
            self.assertFalse(m['mechanicalMateCertified'])
            self.assertFalse(m['dynamicSuspensionCertified'])
            self.assertFalse(m['sourceP28Modified'])
            self.assertFalse(m['modelBSourceModified'])
            step=out/m['masterSTEP']
            self.assertEqual(sha(step),m['masterSTEPsha256'])
            self.assertEqual(len(cq.importers.importStep(str(step)).solids().vals()),11)
            counts=[]
            for tier in QUALITY:
                profile=m['profiles'][tier]
                file=out/profile['file']
                self.assertEqual(sha(file),profile['sha256'])
                self.assertTrue(profile['allNodesWatertight'])
                scene=trimesh.load(file,force='scene')
                self.assertEqual(set(scene.graph.nodes_geometry),set(m['originalP29PlusNewP210PartIds']))
                self.assertEqual(len(scene.graph.nodes_geometry),11)
                self.assertTrue(all(mesh.is_watertight for mesh in scene.geometry.values()))
                self.assertEqual(sum(len(mesh.faces) for mesh in scene.geometry.values()),profile['triangles'])
                counts.append(profile['triangles'])
            self.assertGreater(counts[0],counts[1])
            self.assertGreater(counts[1],counts[2])
            with self.assertRaises(FileExistsError):build(out)

if __name__=='__main__':
    unittest.main(verbosity=2)
