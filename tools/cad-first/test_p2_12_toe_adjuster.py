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
    THREAD_PITCH_MM,MALE_THREAD_HEIGHT_MM,THREAD_RUNOUT_RADIUS_MM,
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
        self.assertGreater(removed,1100)
        self.assertLess(removed,1450)
        self.assertGreater(THREAD_RUNOUT_RADIUS_MM,FEMALE_GROOVE_MAJOR_R_MM)
        self.assertGreater(len(p[PARTS['sleeve']].Faces()),30)
        self.assertGreater(len(p[PARTS['outerNut']].Faces()),12)
        self.assertGreater(len(p[PARTS['innerNut']].Faces()),12)
        self.assertLess(p[PARTS['outer']].intersect(p[PARTS['sleeve']]).Volume(),.05)
        self.assertLess(p[PARTS['inner']].intersect(p[PARTS['sleeve']]).Volume(),.05)
        # Critical v3 regression: v2 GitHub's longer crest collided with the
        # outer jamnut at 0.11787 mm^3 (> 0.05 mm^3 source threshold).
        self.assertEqual(OUTER_NUT_RANGE_MM,(47.5,53.5))
        self.assertEqual(INNER_NUT_RANGE_MM,(114.5,120.5))
        self.assertEqual(MALE_THREAD_HEIGHT_MM,24)
        self.assertLess(p[PARTS['outer']].intersect(p[PARTS['outerNut']]).Volume(),.05)
        self.assertLess(p[PARTS['inner']].intersect(p[PARTS['innerNut']]).Volume(),.05)

    def test_threaded_faces_and_mechanical_holds_are_explicit(self):
        p=build_new_parts()
        self.assertGreater(len(p[PARTS['outer']].Faces()),12)
        self.assertGreater(len(p[PARTS['inner']].Faces()),12)
        self.assertGreater(len(p[PARTS['outerNut']].Faces()),12)
        self.assertGreater(len(p[PARTS['innerNut']].Faces()),12)
        # A non-collision at 180 degrees is NOT proof of thread flank load
        # transfer: load-bearing engagement and manufacturing remain HOLD.
        self.assertEqual(MALE_THREAD_HEIGHT_MM,24)

    def test_screw_pitch_and_locknut_gap_contract(self):
        self.assertEqual(THREAD_PITCH_MM,2.0)
        for angle in (-90,0,90):
            shift=THREAD_PITCH_MM*angle/360
            outer_gap=SLEEVE_START_MM-(OUTER_NUT_RANGE_MM[1]-shift)
            inner_gap=(INNER_NUT_RANGE_MM[0]+shift)-SLEEVE_END_MM
            self.assertGreaterEqual(outer_gap,2.0)
            self.assertGreaterEqual(inner_gap,2.0)
        # The actual six B-Rep pair tests run as separate child processes
        # via p2_12_thread_sweep.py and fail closed for timeouts/crashes.

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

    def test_sleeve_native_step_and_three_mesh_tessellations(self):
        # Full 19-solid STEP + 3-LOD export runs in the SEPARATE local
        # build gate, not again within a long-lived OCCT unit-test process.
        # Repeated full exports in a single process can hang after a valid STEP.
        import numpy as np
        with tempfile.TemporaryDirectory() as tmp:
            source=build_new_parts()
            sleeve=source[PARTS['sleeve']]
            filepath=Path(tmp)/'p212_v3_sleeve.step'
            cq.exporters.export(sleeve,str(filepath))
            roundtrip=cq.importers.importStep(str(filepath)).solids().vals()
            self.assertEqual(len(roundtrip),1)
            self.assertTrue(roundtrip[0].isValid())
            self.assertAlmostEqual(roundtrip[0].Volume(),sleeve.Volume(),places=2)
            counts=[]
            for quality in ('HIGH','BALANCED','PERFORMANCE'):
                from p2_10_rear_wishbone import QUALITY
                linear,angular=QUALITY[quality]
                vertices,faces=sleeve.tessellate(linear,angular)
                mesh=trimesh.Trimesh(
                    vertices=np.array([[v.x,v.y,v.z] for v in vertices])/1000,
                    faces=np.array(faces,dtype=np.int32),process=False)
                mesh.merge_vertices(digits_vertex=7)
                self.assertTrue(mesh.is_watertight)
                self.assertTrue(mesh.is_winding_consistent)
                counts.append(len(mesh.faces))
            self.assertGreater(counts[0],counts[1])
            self.assertGreater(counts[1],counts[2])
        # No G2 approval implied: the actual P2.12 export/STEP hashes and
        # 19-node geometry must pass the full local runner's separate gate.

if __name__=='__main__':
    unittest.main(verbosity=2)
