"""P2.23 SHA-verified 40-body authentic neutral source composite tests."""
from __future__ import annotations
import json
import os
from pathlib import Path
import tempfile
import unittest
import trimesh
from p2_18_center_lock import SPINDLE
from p2_22_keyed_hub_rotor import HUB
from p2_23_composite_review import compose

class TestP223Composite(unittest.TestCase):
    def test_same_40_names_neutral_rgb_and_fail_closed_source_integrity(self):
        base=Path(os.environ.get('PEDS_P222_REAR40_DIR', str(
            Path(__file__).resolve().parents[2]/'.local-assets/cad-first/p222-rear40-review')))
        native=Path(os.environ.get('PEDS_P223_NATIVE_DIR', str(
            Path(__file__).resolve().parents[2]/'.local-assets/cad-first/p223-native')))
        if not (base/'P222_rear40_keyed_neutral_manifest.json').is_file() or \
           not (native/'P223_rear_keyed_spindle_hub_manifest.json').is_file():
            self.skipTest('Author P2.22/P2.23 original GLB bundles absent; no fake source substituted')
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            result=compose(base,native,root/'review')
            self.assertEqual(result['partCount'],40)
            self.assertEqual(set(result['replaceOnly']),{HUB,SPINDLE})
            self.assertEqual(result['uniformColor'],'#87929d')
            self.assertFalse(result['originalModelBIncluded'])
            self.assertFalse(result['mechanicalG2Certified'])
            triangle_counts=[]
            for profile in result['profiles'].values():
                scene=trimesh.load(root/'review'/profile['file'],force='scene')
                self.assertEqual(set(scene.graph.nodes_geometry),set(result['partIds']))
                self.assertEqual(len(scene.geometry),40)
                self.assertTrue(all(g.is_watertight for g in scene.geometry.values()))
                colors={tuple(int(x) for x in g.visual.material.baseColorFactor)
                        for g in scene.geometry.values()}
                self.assertEqual(colors,{(135,146,157,255)})
                triangle_counts.append(profile['triangles'])
            self.assertGreater(triangle_counts[0],triangle_counts[1])
            self.assertGreater(triangle_counts[1],triangle_counts[2])
            with self.assertRaises(FileExistsError):compose(base,native,root/'review')
            # Copy the real native bundle then mutate only BALANCED GLB bytes.
            import shutil
            tampered=root/'tampered_native'
            shutil.copytree(native,tampered)
            document=json.loads((tampered/'P223_rear_keyed_spindle_hub_manifest.json').read_text())
            mesh=tampered/document['profiles']['BALANCED']['file']
            mesh.write_bytes(mesh.read_bytes()+b'tampered source')
            with self.assertRaisesRegex(ValueError,'SHA-256 mismatch'):
                compose(base,tampered,root/'tampered_output')

if __name__=='__main__':unittest.main(verbosity=2)
