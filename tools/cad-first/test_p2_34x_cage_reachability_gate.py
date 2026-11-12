"""Source-independent P2.34X tests; CadQuery examples are generic CAD, not source84."""
import hashlib
import json
import math
import tempfile
import unittest
from pathlib import Path

import cadquery as cq
import p2_34x_cage_reachability_gate as x


def ball(point=(0, 0, 0), radius=0.4):
    return cq.Solid.makeSphere(radius, cq.Vector(*point), angleDegrees1=-90, angleDegrees2=90)


class ReachabilityTests(unittest.TestCase):
    def test_grid_27_nodes(self):
        self.assertEqual(len(x.grid()), 27)

    def test_bad_step(self):
        with self.assertRaises(ValueError): x.grid(0)

    def test_nonfinite(self):
        with self.assertRaises(ValueError): x.finite(math.nan, 'bad')

    def test_neighbors_have_six_axes(self):
        self.assertEqual(len(list(x.neighbors((0, 0, 0), set(x.grid())))), 6)

    def test_all_connected_to_boundary(self):
        nodes=set(x.grid())
        edges={frozenset((a,b)) for a in nodes for b in x.neighbors(a,nodes)}
        r=x.reachable_nodes(nodes,edges,1)
        self.assertTrue(r['sampledBoundaryReachable'])
        self.assertEqual(len(r['sampledShortestBoundaryPath']),2)

    def test_no_origin_not_reachable(self):
        r=x.reachable_nodes({(1, 0, 0)},set(),1)
        self.assertFalse(r['initialConfigurationClear'])

    def test_disconnected_boundary(self):
        r=x.reachable_nodes(set(x.grid()),set(),1)
        self.assertFalse(r['sampledBoundaryReachable'])

    def test_fake_clear_native_solids(self):
        obstacles={n:ball((10, 0, 0)) for n in ('shaft','cup','cage')}
        r=x.scan_ball(ball(),obstacles)
        self.assertEqual(r['sampledClearNodeCount'],27)
        self.assertEqual(r['actualNativeBooleanCalls'],3*(27+54))
        self.assertTrue(r['sampledBoundaryReachable'])
        self.assertFalse(r['actualBallEscapeFromPocketCertified'])

    def test_origin_collision(self):
        obstacles={n:ball((10, 0, 0)) for n in ('shaft','cup','cage')}
        obstacles['cage']=ball((0, 0, 0),radius=.3)
        r=x.scan_ball(ball(),obstacles)
        self.assertFalse(r['initialConfigurationClear'])
        self.assertFalse(r['sampledBoundaryReachable'])

    def test_midpoint_collision_blocks_edge(self):
        obstacles={n:ball((10,0,0)) for n in ('shaft','cup','cage')}
        obstacles['cage']=ball((.375,0,0),radius=.1)
        measured,clear=x.collision_vector(ball(), obstacles, (.375,0,0))
        self.assertFalse(clear)
        self.assertGreater(measured['cage'],0)

    def test_obstacle_names_required(self):
        with self.assertRaises(ValueError): x.collision_vector(ball(), {'cage':ball()},(0,0,0))

    def test_parent_sha(self):
        m=b'm';w=b'w';step=b'step'
        report={'schema':x.W_SCHEMA,'original84SourceSHA256':x.SOURCE_SHA,
                'candidateSTEPsha256':hashlib.sha256(step).hexdigest(),
                'p234mReportSHA256':hashlib.sha256(m).hexdigest(),
                'poseCount':9,'sampledPoseEvidence':[{} for _ in range(9)],
                'mechanicalG2Certified':False,'sourceModified':False}
        self.assertEqual(x.verify_w_parent(report,w,m,step,9),hashlib.sha256(w).hexdigest())
        with self.assertRaises(ValueError):x.verify_w_parent(report,w,m,b'changed',9)

    def test_false_certification(self):
        m=b'm';w=b'w';step=b'step'
        report={'schema':x.W_SCHEMA,'original84SourceSHA256':x.SOURCE_SHA,
                'candidateSTEPsha256':hashlib.sha256(step).hexdigest(),
                'p234mReportSHA256':hashlib.sha256(m).hexdigest(),
                'poseCount':9,'sampledPoseEvidence':[{} for _ in range(9)],
                'mechanicalG2Certified':True,'sourceModified':False}
        with self.assertRaises(ValueError):x.verify_w_parent(report,w,m,step,9)

    def test_overwrite_guard(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'review.json';path.write_text('KEEP')
            with self.assertRaises(FileExistsError):x.run(folder,folder,folder,folder,path)
            self.assertEqual(path.read_text(),'KEEP')


if __name__ == '__main__':
    unittest.main(verbosity=2)
