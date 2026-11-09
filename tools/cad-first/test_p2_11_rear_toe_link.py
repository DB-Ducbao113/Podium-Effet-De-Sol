"""P2.11 native CAD, 105-pair source and SHA-GLB regression tests."""
from __future__ import annotations
import tempfile
import unittest
from pathlib import Path
import cadquery as cq
import trimesh

from p2_11_rear_toe_link import (
    IDS, RADIUS_MM, OUTER_UPRIGHT_DATUM_MM, TOE_OUTER_EYE_MM,
    TOE_INNER_EYE_MM, QUALITY, SCHEMA, all_parts, build, build_parts,
    cylinder, exact_static_audit, sha,
)

class RearToeCADSourceTest(unittest.TestCase):
    def test_four_new_source_parts_and_existing_toe_datum(self):
        parts=build_parts()
        self.assertEqual(set(parts),set(IDS.values()))
        self.assertEqual(OUTER_UPRIGHT_DATUM_MM,[139,-24,-156])
        self.assertEqual(TOE_OUTER_EYE_MM,[139,-24,-199])
        self.assertNotEqual(TOE_INNER_EYE_MM,TOE_OUTER_EYE_MM)
        for shape in parts.values():
            self.assertEqual(len(shape.Solids()),1)
            self.assertTrue(shape.isValid())
            self.assertGreater(shape.Volume(),0)

    def test_source_toe_link_holes_eyes_and_pin_clearance(self):
        parts=build_parts()
        link=parts[IDS['link']]
        for x,y,z in (TOE_OUTER_EYE_MM,TOE_INNER_EYE_MM):
            bore=cylinder(RADIUS_MM['bearingOuter']*.96,z-25,50,x,y)
            self.assertLess(link.intersect(bore).Volume(),.05)
        pin=parts[IDS['pin']]
        outer=parts[IDS['outerBearing']]
        self.assertLess(pin.intersect(outer).Volume(),.05)
        self.assertLess(pin.intersect(link).Volume(),.05)

    def test_complete_native_static_15_solids_105_pairs(self):
        all_source=all_parts()
        self.assertEqual(len(all_source),15)
        report=exact_static_audit(all_source)
        self.assertEqual(report['pairCount'],105)
        self.assertEqual(report['aabbExcluded']+report['nativeBrepIntersectionsEvaluated'],105)
        self.assertTrue(report['passStatic'])
        self.assertFalse(report['unresolvedCollisions'])
        self.assertFalse(report['booleanErrors'])
        self.assertFalse(report['dynamicKinematicsCertified'])
        self.assertFalse(report['jointRetentionCertified'])

    def test_export_step_glb_source_hash_and_no_overwrite(self):
        with tempfile.TemporaryDirectory() as tmp:
            out=Path(tmp)/'source'
            record=build(out)
            self.assertEqual(record['schema'],SCHEMA)
            self.assertEqual(record['newSolids'],4)
            self.assertEqual(record['totalCadSolids'],15)
            self.assertFalse(record['actualChassisToeHardpointMeasured'])
            self.assertFalse(record['mechanicalMateCertified'])
            self.assertFalse(record['dynamicToeKinematicsCertified'])
            self.assertFalse(record['modelBSourceModified'])
            self.assertFalse(record['rootP28SourceModified'])
            master=out/record['masterSTEP']
            self.assertEqual(sha(master),record['masterSTEPsha256'])
            self.assertEqual(len(cq.importers.importStep(str(master)).solids().vals()),15)
            counts=[]
            for tier in QUALITY:
                row=record['profiles'][tier]
                path=out/row['file']
                self.assertEqual(sha(path),row['sha256'])
                self.assertTrue(row['allNodesWatertight'])
                scene=trimesh.load(path,force='scene')
                self.assertEqual(len(scene.graph.nodes_geometry),15)
                self.assertEqual(set(scene.graph.nodes_geometry),set(record['sourceP29P210P211PartIds']))
                self.assertTrue(all(mesh.is_watertight for mesh in scene.geometry.values()))
                self.assertEqual(sum(len(mesh.faces) for mesh in scene.geometry.values()),row['triangles'])
                counts.append(row['triangles'])
            self.assertGreater(counts[0],counts[1])
            self.assertGreater(counts[1],counts[2])
            with self.assertRaises(FileExistsError):build(out)

if __name__=='__main__':
    unittest.main(verbosity=2)
