"""P2.20 preview export cannot fabricate 63 parts or bypass native B-Rep QA."""
from pathlib import Path
import json
import tempfile
import unittest

import cadquery as cq
import trimesh
from p2_20_rear_joint_cross_source_gate import compose_nominal,incremental_brep_audit
from p2_20_native_review_export import source_preview
from test_p2_20_rear_joint_cross_source_gate import fake_sources


class TestP220SourcePreview(unittest.TestCase):
    def test_neutral_glb_only_after_actual_pair_gate(self):
        base,toe,split,replacements=fake_sources()
        all_parts,old,new,_=compose_nominal(base,toe,split,replacements,True)
        audit=incremental_brep_audit(all_parts,old,new)
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)
            palette=root/'palette.json'
            palette.write_text(json.dumps({'schema':'peds.engineering.neutral-materials.v1',
                'uniformColor':'#87929d','presets':{
                    role:{'metalness':0.5,'roughness':0.5} for role in (
                    'tyre','rim','carbon-brake','friction-pad','caliper','bearing',
                    'rear-joint','hardware','suspension','upright','hub','other')}}))
            with self.assertRaisesRegex(ValueError,'must PASS'):
                source_preview(all_parts,{'passNewCrossSourceStatic':False},root/'rejected',palette)
            self.assertFalse((root/'rejected').exists())
            result=source_preview(all_parts,audit,root/'ready',palette)
            self.assertEqual(result['partCount'],63)
            self.assertFalse(result['originalModelBIncluded'])
            self.assertFalse(result['mechanicalG2Certified'])
            glb=trimesh.load(root/'ready'/result['filename'],force='scene')
            self.assertEqual(set(glb.graph.nodes_geometry),set(all_parts))
            self.assertEqual(len(glb.geometry),63)
            self.assertEqual({tuple(int(i) for i in mesh.visual.material.baseColorFactor)
                              for mesh in glb.geometry.values()}, {(135,146,157,255)})
            with self.assertRaises(FileExistsError):source_preview(all_parts,audit,root/'ready',palette)
            # New collision must prevent rendering the apparently completed rear assembly.
            collided=dict(all_parts)
            collided['P214_PART_00']=cq.Workplane('XY').box(1,1,1).val().translate((-400,0,0))
            fail=incremental_brep_audit(collided,old,new)
            self.assertFalse(fail['passNewCrossSourceStatic'])
            with self.assertRaisesRegex(ValueError,'must PASS'):
                source_preview(collided,fail,root/'collision',palette)
            self.assertFalse((root/'collision').exists())


if __name__=='__main__':unittest.main(verbosity=2)
