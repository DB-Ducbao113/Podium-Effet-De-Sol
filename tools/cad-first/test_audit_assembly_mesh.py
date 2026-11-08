#!/usr/bin/env python3
"""Synthetic testing only; NOT mechanical acceptance for the original F1 model."""
from __future__ import annotations
import hashlib
import json
from pathlib import Path
import tempfile
import unittest

import numpy as np
import trimesh
from audit_assembly_mesh import inspect, rigid_transform, mesh_boxes, intersection_candidates

class SourceMeshGateTests(unittest.TestCase):
    def test_identity_and_translation(self):
        matrix=rigid_transform({'scale':1,'translationM':[1,0,0],'rotationQuaternion':[0,0,0,1]})
        np.testing.assert_allclose(matrix[:3,3],[1,0,0])
    def test_scale_rejected(self):
        with self.assertRaises(ValueError):
            rigid_transform({'scale':2,'translationM':[0,0,0],'rotationQuaternion':[0,0,0,1]})
    def test_aabb_pairs(self):
        scene=trimesh.Scene()
        scene.add_geometry(trimesh.creation.box(extents=[1,1,1]),node_name='A')
        scene.add_geometry(trimesh.creation.box(extents=[1,1,1]),
            node_name='B',transform=trimesh.transformations.translation_matrix([2,0,0]))
        box=mesh_boxes(scene)
        hits=intersection_candidates({'A':box['A']},{'C':box['A'],'B':box['B']})
        self.assertEqual(len(hits),1)
    def test_original_id_and_sha_enforcement(self):
        with tempfile.TemporaryDirectory() as root:
            work=Path(root);folder=work/'p28';folder.mkdir()
            body=trimesh.Scene()
            body.add_geometry(trimesh.creation.box(extents=[3,1,1]),node_name='BODY')
            shell=work/'shell.glb';shell.write_bytes(body.export(file_type='glb'))
            scene=trimesh.Scene()
            ids=[f'P2_ORIGINAL_{i:02}' for i in range(59)]
            for i,name in enumerate(ids):
                scene.add_geometry(trimesh.creation.box(extents=[.01,.01,.01]),
                    node_name=name,
                    transform=trimesh.transformations.translation_matrix([.05*i,0,0]))
            glb=folder/'original.glb';glb.write_bytes(scene.export(file_type='glb'))
            step=folder/'original.step';step.write_text('synthetic-only; not real CAD')
            sha=lambda f:hashlib.sha256(f.read_bytes()).hexdigest()
            manifest={'schema':'podium-eds.p2.cad-first.full-corner.remate.v1',
                'partIds':ids,'totalCadSolids':59,'allRoundtripValid':True,
                'profiles':{'BALANCED':{'file':glb.name,'bytes':glb.stat().st_size,
                  'sha256':sha(glb)}},
                'masterSTEP':step.name,'masterSTEPsha256':sha(step)}
            (folder/'P28_remate_manifest.json').write_text(json.dumps(manifest))
            record={'schema':'podium-eds.assembly-preview.placement.v1',
                'cornerSha256':sha(glb),'p28PartCount':59,
                'resolvedOriginalRootTransform':{'scale':1,'translationM':[0,0,0],
                    'rotationQuaternion':[0,0,0,1]}}
            placement=work/'placement.json';placement.write_text(json.dumps(record))
            result=inspect(shell,folder,placement)
            self.assertEqual(result['p28_mesh_nodes'],59)
            self.assertGreater(result['candidate_aabb_pairs'],0)
            self.assertFalse(result['mechanical_mate_validated'])
            record['cornerSha256']='0'*64
            placement.write_text(json.dumps(record))
            with self.assertRaisesRegex(ValueError,'Placement does not match'):
                inspect(shell,folder,placement)

if __name__=='__main__':unittest.main()
