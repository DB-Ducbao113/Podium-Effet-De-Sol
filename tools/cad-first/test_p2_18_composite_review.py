"""Fail-closed source identity and visual review QA for 32-part rear assembly."""
from __future__ import annotations

import json
from pathlib import Path
import tempfile
import unittest

import trimesh

from p2_16_rear_wheel_end import build as build_p216
from p2_17_rear_brake_drive import build as build_p217
from p2_17_composite_review import composite as composite31
from p2_18_center_lock import build as build_p218, OLD_NUT, SPINDLE, NUT
from p2_18_composite_review import composite as composite32


class TestP218CompositeReview(unittest.TestCase):
    def test_sha_source_and_exact_32_native_mesh_names(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)
            p216,p217,p218=root/'p216',root/'p217',root/'p218'
            stage31,stage32=root/'rear31',root/'rear32'
            build_p216(p216)
            build_p217(p217)
            composite31(p216,p217,stage31)
            build_p218(p218)
            result=composite32(stage31,p218,stage32)
            self.assertEqual(result['partCount'],32)
            self.assertEqual(result['removedPrototype'],OLD_NUT)
            self.assertNotIn(OLD_NUT,result['rearPartIds'])
            self.assertIn(SPINDLE,result['rearPartIds'])
            self.assertIn(NUT,result['rearPartIds'])
            self.assertFalse(result['modelBIncluded'])
            self.assertFalse(result['mechanicalG2Certified'])
            triangles=[]
            for label,item in result['profiles'].items():
                path=stage32/item['file']
                parsed=trimesh.load(path,force='scene')
                self.assertEqual(set(parsed.graph.nodes_geometry),set(result['rearPartIds']),label)
                self.assertEqual(len(parsed.geometry),32)
                self.assertTrue(all(mesh.is_watertight for mesh in parsed.geometry.values()))
                material_colors={tuple(int(x) for x in mesh.visual.material.baseColorFactor)
                                 for mesh in parsed.geometry.values()}
                self.assertEqual(material_colors,{(135,146,157,255)})
                triangles.append(item['triangles'])
            self.assertGreater(triangles[0],triangles[1])
            self.assertGreater(triangles[1],triangles[2])
            with self.assertRaises(FileExistsError):
                composite32(stage31,p218,stage32)
            source=json.loads((p218/'P218_threaded_center_lock_manifest.json').read_text())
            corrupt=p218/source['profiles']['BALANCED']['file']
            corrupt.write_bytes(corrupt.read_bytes()+b'corruption')
            with self.assertRaisesRegex(ValueError,'SHA-256 mismatch'):
                composite32(stage31,p218,root/'tampered')


if __name__=='__main__':
    unittest.main(verbosity=2)
