"""P2.12 static native CAD review; does NOT certify a working adjustable joint."""
from __future__ import annotations
import math,tempfile,unittest
from pathlib import Path
import cadquery as cq
import trimesh
from p2_12_toe_adjuster import (
    A,B,D,PARTS,LINK_LENGTH_MM,SLEEVE_START_MM,SLEEVE_END_MM,
    OUTER_NUT_RANGE_MM,INNER_NUT_RANGE_MM,SLEEVE_BORE_R_MM,THREAD_CREST_R_MM,
    FEMALE_GROOVE_MAJOR_R_MM,ROD_R_MM,cylinder_segment,
    TOE_211_IDS,QUALITY,SCHEMA,all_parts,build_new_parts,build,sha,exact_static_audit
)

class RearToeAdjusterCADTest(unittest.TestCase):
    def test_five_new_solids_replace_not_duplicate_old_link(self):
        new=build_new_parts()
        combined=all_parts()
        self.assertEqual(set(new),set(PARTS.values()))
        self.assertEqual(len(new),5)
        self.assertEqual(len(combined),19)
        self.assertNotIn(TOE_211_IDS['link'],combined)
        self.assertTrue(all(p.isValid() and len(p.Solids())==1 and p.Volume()>0 for p in combined.values()))
        self.assertGreater(LINK_LENGTH_MM,165)
        self.assertLess(LINK_LENGTH_MM,170)

    def test_real_rod_helix_and_separate_axial_sleeve_nuts(self):
        p=build_new_parts()
        self.assertAlmostEqual(SLEEVE_BORE_R_MM-ROD_R_MM,.2,places=6)
        self.assertAlmostEqual(FEMALE_GROOVE_MAJOR_R_MM-THREAD_CREST_R_MM,.46,places=6)
        self.assertGreater(SLEEVE_START_MM,OUTER_NUT_RANGE_MM[1])
        self.assertLess(SLEEVE_END_MM,INNER_NUT_RANGE_MM[0])
        self.assertAlmostEqual(math.dist(A,B),LINK_LENGTH_MM,places=8)
        for key in ('outer','inner'):
            self.assertGreater(len(p[PARTS[key]].Faces()),12)
        self.assertGreater(p[PARTS['sleeve']].Volume(),10000)
        blank=cylinder_segment(SLEEVE_START_MM,SLEEVE_END_MM,15.2).cut(
            cylinder_segment(SLEEVE_START_MM-.5,SLEEVE_END_MM+.5,SLEEVE_BORE_R_MM))
        removed=blank.Volume()-p[PARTS['sleeve']].Volume()
        self.assertGreater(removed,500)
        self.assertLess(removed,900)
        self.assertGreater(len(p[PARTS['sleeve']].Faces()),30)
        self.assertGreater(len(p[PARTS['outerNut']].Faces()),12)
        self.assertGreater(len(p[PARTS['innerNut']].Faces()),12)
        self.assertLess(p[PARTS['outer']].intersect(p[PARTS['sleeve']]).Volume(),.05)
        self.assertLess(p[PARTS['inner']].intersect(p[PARTS['sleeve']]).Volume(),.05)

    def test_helical_phase_is_geometry_not_shader(self):
        parts=build_new_parts()
        sleeve=parts[PARTS['sleeve']]
        male=parts[PARTS['outer']]
        # Without screw-pitch translation, rotating a rod half a turn
        # forces the real teeth into solid lands.
        mistimed=male.rotate(tuple(A),tuple(A+D),180)
        self.assertGreater(sleeve.intersect(mistimed).Volume(),20)
        # A pitch/2=1mm translation re-aligns this right-hand helix.
        corrected=mistimed.translate(tuple(D*1.0))
        self.assertLess(sleeve.intersect(corrected).Volume(),.05)

    def test_static_171_pairs_and_collision_guard(self):
        audit=exact_static_audit(all_parts())
        self.assertEqual(audit['pairCount'],171)
        self.assertEqual(audit['aabbExcluded']+audit['nativeBrepIntersectionsEvaluated'],171)
        self.assertTrue(audit['passStatic'])
        self.assertFalse(audit['unresolvedCollisions'])
        self.assertFalse(audit['booleanErrors'])
        self.assertFalse(audit['dynamicKinematicsCertified'])
        duplicated=cq.Solid.makeCylinder(5,12)
        failure=exact_static_audit({'A':duplicated,'B':duplicated})
        self.assertFalse(failure['passStatic'])
        self.assertEqual(len(failure['unresolvedCollisions']),1)

    def test_step_glb_roundtrip_hashes_and_mechanical_hold(self):
        with tempfile.TemporaryDirectory() as tmp:
            out=Path(tmp)/'p212'
            manifest=build(out)
            self.assertEqual(manifest['schema'],SCHEMA)
            self.assertEqual(manifest['sourcePartCount'],19)
            self.assertEqual(manifest['newParts'],5)
            self.assertEqual(manifest['replacedPriorPartId'],TOE_211_IDS['link'])
            for key in ('actualChassisToeHardpointMeasured',
                        'mechanicalThreadEngagementCertified',
                        'toeAdjustmentTravelCertified','locknutTorqueCertified',
                        'dynamicToeKinematicsCertified','mechanicalMateCertified',
                        'modelBSourceModified','sourceP28Modified'):
                self.assertIs(manifest[key],False)
            for key in ('fullFemaleThreadProfileModelled',
                        'sleeveOppositeHandGroovesModelled',
                        'bothLocknutFemaleGroovesModelled','nominalThreadPhaseMatched'):
                self.assertIs(manifest[key],True)
            self.assertEqual(manifest['threadGeometryRevision'],'P2.12-R2-BREP-GROOVED')
            self.assertAlmostEqual(manifest['rodRootRadialClearanceMm'],.2,places=6)
            self.assertAlmostEqual(manifest['threadCrestRadialClearanceMm'],.46,places=6)
            step=out/manifest['masterSTEP']
            self.assertEqual(sha(step),manifest['masterSTEPsha256'])
            self.assertEqual(len(cq.importers.importStep(str(step)).solids().vals()),19)
            counts=[]
            for tier in QUALITY:
                row=manifest['profiles'][tier]
                glb=out/row['file']
                self.assertEqual(sha(glb),row['sha256'])
                scene=trimesh.load(glb,force='scene')
                self.assertEqual(set(scene.graph.nodes_geometry),set(manifest['partIds']))
                self.assertEqual(len(scene.graph.nodes_geometry),19)
                self.assertTrue(all(mesh.is_watertight and mesh.is_winding_consistent
                                    for mesh in scene.geometry.values()))
                self.assertEqual(sum(len(mesh.faces) for mesh in scene.geometry.values()),row['triangles'])
                counts.append(row['triangles'])
            self.assertGreater(counts[0],counts[1])
            self.assertGreater(counts[1],counts[2])
            with self.assertRaises(FileExistsError):build(out)

if __name__=='__main__':
    unittest.main(verbosity=2)
