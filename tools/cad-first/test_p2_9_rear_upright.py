"""Native CAD source-only review tests for P2.9 concept rear upright."""
import tempfile
import unittest
from pathlib import Path

import cadquery as cq
import trimesh
from p2_9_rear_upright import (
    BORE_RADIUS_MM, DATUMS_MM, PART_ID, PROFILES, SCHEMA, build, build_rear_upright, cyl, hash_file
)

class RearUprightNativeCADTest(unittest.TestCase):
    def test_independent_single_connected_brep(self):
        part=build_rear_upright()
        self.assertTrue(part.isValid())
        self.assertEqual(1,len(part.Solids()))
        self.assertGreater(part.Volume(),100_000)
        self.assertLess(part.Volume(),5_000_000)
        b=part.BoundingBox()
        self.assertLess(b.zmax,0)
        self.assertGreater(b.xmax,120)
        self.assertLess(b.ymin,-130)
        self.assertGreater(b.ymax,130)

    def test_open_bearing_bore_and_real_mounting_bores(self):
        part=build_rear_upright()
        self.assertLess(part.intersect(cyl(65,-151,78)).Volume(),.02)
        for key in ('upper','lower','toe'):
            x,y,z=DATUMS_MM[key+'ClevisBore']
            self.assertLess(part.intersect(cyl(BORE_RADIUS_MM[key]*.65,z-26,52,x,y)).Volume(),.02)

    def test_nominal_front_source_bearing_and_brake_envelopes_do_not_overlap(self):
        # Early CAD-only envelope screening. These are dimensions from the
        # original P2.4 source, NOT the complete 59-solid P2.8 B-Rep audit.
        part=build_rear_upright()
        bearing=cyl(69,-126,38).cut(cyl(56,-127,40))
        rotor=cyl(183,-79,15).cut(cyl(104,-80,17))
        self.assertLess(part.intersect(bearing).Volume(),.05)
        self.assertLess(part.intersect(rotor).Volume(),.05)

    def test_step_glb_roundtrip_and_sha_guards(self):
        with tempfile.TemporaryDirectory() as directory:
            out=Path(directory)/'p29'
            manifest=build(out)
            self.assertEqual(manifest['schema'],SCHEMA)
            self.assertEqual(manifest['roundtripSolids'],1)
            self.assertFalse(manifest['mechanicalMatingCertified'])
            self.assertFalse(manifest['actualRearChassisHardpointsMeasured'])
            self.assertFalse(manifest['sourceP28WheelGeometryModified'])
            step=out/manifest['masterSTEP']
            self.assertEqual(hash_file(step),manifest['masterSTEPsha256'])
            roundtrip=cq.importers.importStep(str(step)).solids().vals()
            self.assertEqual(len(roundtrip),1)
            faces=[]
            for quality in PROFILES:
                item=manifest['profiles'][quality]
                file=out/item['file']
                self.assertEqual(hash_file(file),item['sha256'])
                scene=trimesh.load(file,force='scene')
                self.assertEqual(set(scene.graph.nodes_geometry),{PART_ID})
                mesh=next(iter(scene.geometry.values()))
                self.assertTrue(mesh.is_watertight)
                self.assertTrue(mesh.is_winding_consistent)
                self.assertEqual(len(mesh.faces),item['triangles'])
                faces.append(len(mesh.faces))
            self.assertGreater(faces[0],faces[1])
            self.assertGreater(faces[1],faces[2])
            with self.assertRaises(FileExistsError):
                build(out)

if __name__=='__main__':
    unittest.main()
