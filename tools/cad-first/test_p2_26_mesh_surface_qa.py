"""P2.26 actual P2.25 SHA-pinned source GLB and independent VTK negative controls."""
from __future__ import annotations

import json
import os
from pathlib import Path
import shutil
import tempfile
import unittest

import trimesh
from p2_26_mesh_surface_qa import mesh_pair_probe, run, load_meshes

DATA=Path(os.environ.get('PEDS_P226_SOURCE_DIR', str(
    Path(__file__).resolve().parents[1]/'source/review')))

class TestP226SurfaceQA(unittest.TestCase):
    def test_triangle_crossing_positive_control(self):
        a=trimesh.creation.box(extents=(.02,.02,.02))
        b=trimesh.creation.box(extents=(.02,.02,.02));b.apply_translation([.01,0,0])
        result=mesh_pair_probe(a,b)
        self.assertGreater(result['surfaceTriangleContacts'],0)
        self.assertTrue(result['potentialMeshInterference'])

    def test_complete_containment_positive_control(self):
        big=trimesh.creation.box(extents=(.04,.04,.04))
        small=trimesh.creation.box(extents=(.01,.01,.01))
        result=mesh_pair_probe(big,small)
        self.assertEqual(result['surfaceTriangleContacts'],0)
        self.assertEqual(result['firstVerticesInsideSecond'],0)
        self.assertGreater(result['secondVerticesInsideFirst'],0)

    def test_separated_pair_negative_control(self):
        a=trimesh.creation.box(extents=(.01,.01,.01))
        b=trimesh.creation.box(extents=(.01,.01,.01));b.apply_translation([.03,0,0])
        result=mesh_pair_probe(a,b)
        self.assertEqual(result['surfaceTriangleContacts'],0)
        self.assertFalse(result['potentialMeshInterference'])

    def test_all_three_original_lod_glbs_stand_up_to_vtk(self):
        with tempfile.TemporaryDirectory() as temp:
            manifest=run(DATA,Path(temp)/'report')
            self.assertEqual(manifest['partCount'],51)
            self.assertEqual(manifest['uniformColor'],'#87929d')
            self.assertFalse(manifest['actualOriginalCADBRep71CheckPerformed'])
            self.assertFalse(manifest['mechanicalG2Certified'])
            for tier, row in manifest['sourceLodEvidence'].items():
                self.assertEqual(row['allIndependentSuspensionWheelPairs'],440,tier)
                self.assertEqual(row['aabbSeparatedPairs'],405,tier)
                self.assertEqual(row['aabbCandidatePairsTested'],35,tier)
                self.assertEqual(row['triangleContactPairs'],0,tier)
                self.assertEqual(row['containedVertexPairs'],0,tier)
                self.assertEqual(row['possibleInterferencePairs'],0,tier)
                self.assertEqual(len(row['candidateResults']),35,tier)
            self.assertEqual(manifest['status'],'THREE_LOD_MESH_SURFACE_SCREEN_PASS_G2_HOLD')
            with self.assertRaises(FileExistsError):run(DATA,Path(temp)/'report')

    def test_tampered_glb_is_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            copy=Path(temp)/'source'
            shutil.copytree(DATA,copy)
            manifest=json.loads((copy/'P225_rear51_source_manifest.json').read_text())
            target=copy/manifest['profiles']['BALANCED']['file']
            target.write_bytes(target.read_bytes()+b'tampered')
            with self.assertRaisesRegex(ValueError,'SHA-256 invalid'):
                run(copy,Path(temp)/'blocked')
            self.assertFalse((Path(temp)/'blocked').exists())

    def test_wrong_partition_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            copy=Path(temp)/'source';shutil.copytree(DATA,copy)
            path=copy/'P225_rear51_source_manifest.json'
            manifest=json.loads(path.read_text())
            manifest['sourceOwnership']['latestRearPartIds'].pop()
            path.write_text(json.dumps(manifest))
            with self.assertRaisesRegex(ValueError,'source manifest SHA-256 snapshot mismatch'):
                run(copy,Path(temp)/'blocked')

if __name__=='__main__':unittest.main(verbosity=2)
