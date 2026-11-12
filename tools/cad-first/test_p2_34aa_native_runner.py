"""P2.34AA isolated runner tests: no original owner-source and no GitHub Actions."""
from __future__ import annotations
import hashlib,json,tempfile,types,unittest
from pathlib import Path
from unittest.mock import patch
import p2_34aa_native_runner as aa

def sandbox(root):
    s,c,o=(root/'source',root/'poses.json',root/'result')
    s.mkdir();return s,c,o

def synthetic_original(source):
    pins={}
    for name in aa.PINS:
        data=(name+' test only').encode();(source/name).write_bytes(data)
        pins[name]=hashlib.sha256(data).hexdigest()
    return pins

def report(grid,eligible=True):
    return {'schema':aa.M_SCHEMA,'original84StepSHA256':aa.PINS['P234E_source84_revised_six_ball_clearance.step'],
            'manifestSHA256':hashlib.sha256(grid.read_bytes()).hexdigest(),
            'original84SolidCount':84,'originalCADModified':False,'mechanicalG2Certified':False,
            'poseCount':9,'perPose':[{}]*9,'allBendTracesFound':eligible,
            'allChosenPathsCrossBendScreen':eligible}

class RunnerTests(unittest.TestCase):
    def setUp(self):
        # AA runner integration contract; independent real AC byte guards tested separately.
        def checked_m(result,path,grid_sha):
            return {'p234mReview':aa.check_m_report(result,aa.PINS['P234E_source84_revised_six_ball_clearance.step'],grid_sha),
                    'p234mSHA256':aa.hashfile(path)}
        def checked_n(result,path,mfile,pins):
            step=Path(path)/'P234N_source84_track_cut_PROTOTYPE.step'
            return {'p234nCandidateSHA256':aa.hashfile(step),'p234nAuditSHA256':'stubbed_hash'}
        mod=types.SimpleNamespace(check_m=checked_m,check_n=checked_n)
        self._patch=patch.dict('sys.modules',{'p2_34ac_persisted_evidence_gate':mod})
        self._patch.start()
        self.addCleanup(self._patch.stop)
    def test_absent_source_blocked(self):
        with tempfile.TemporaryDirectory() as d:
            src,grid,out=sandbox(Path(d));r=aa.run(src,grid,out)
            self.assertIn('SOURCE84_PINNED_FILE_MISSING_OR_SHA_MISMATCH',r['blockedReasons'])
            self.assertEqual(r['completedStages'],[])
            self.assertFalse(r['mechanicalG2Certified'])
            self.assertTrue((out/'P234AA_execution_manifest.json').is_file())
    def test_wrong_hash_not_accepted(self):
        with tempfile.TemporaryDirectory() as d:
            src,grid,out=sandbox(Path(d));(src/next(iter(aa.PINS))).write_bytes(b'bad')
            self.assertFalse(aa.source_preflight(src)['allPinnedFilesMatch'])
            self.assertEqual(aa.run(src,grid,out)['completedStages'],[])
    def test_no_automatic_native_execution(self):
        with tempfile.TemporaryDirectory() as d:
            src,grid,out=sandbox(Path(d));pins=synthetic_original(src);grid.write_text('{}')
            mock_m=types.SimpleNamespace(pose_grid=lambda d: [(0,0,0)]*9)
            with patch.dict(aa.PINS,pins,clear=True),patch.dict('sys.modules',{'p2_34m_cage_orientation_native':mock_m}):
                r=aa.run(src,grid,out)
            self.assertIn('NATIVE_EXECUTION_NOT_REQUESTED',r['blockedReasons'])
    def test_missing_grid(self):
        with tempfile.TemporaryDirectory() as d:
            src,grid,out=sandbox(Path(d));pins=synthetic_original(src)
            with patch.dict(aa.PINS,pins,clear=True):r=aa.run(src,grid,out)
            self.assertIn('POSE_GRID_MISSING',r['blockedReasons'])
    def test_bad_grid(self):
        with tempfile.TemporaryDirectory() as d:
            src,grid,out=sandbox(Path(d));pins=synthetic_original(src);grid.write_text('not json')
            mock_m=types.SimpleNamespace(pose_grid=lambda d:d)
            with patch.dict(aa.PINS,pins,clear=True),patch.dict('sys.modules',{'p2_34m_cage_orientation_native':mock_m}):r=aa.run(src,grid,out)
            self.assertTrue(any(x.startswith('POSE_GRID_INVALID') for x in r['blockedReasons']))
    def test_execute_n_requires_execute_m(self):
        with self.assertRaises(ValueError):aa.run('a','b','c',execute_n=True)
    def test_no_output_overwrite(self):
        with tempfile.TemporaryDirectory() as d:
            src,grid,out=sandbox(Path(d));out.mkdir();(out/'protect').write_text('KEEP')
            with self.assertRaises(FileExistsError):aa.run(src,grid,out)
            self.assertEqual((out/'protect').read_text(),'KEEP')
    def test_m_stage_eligible_without_n(self):
        with tempfile.TemporaryDirectory() as d:
            src,grid,out=sandbox(Path(d));pins=synthetic_original(src);grid.write_text('{}')
            def mrun(src,manifest,target):
                obj=report(grid);target.write_text(json.dumps(obj));return obj
            mock_m=types.SimpleNamespace(pose_grid=lambda d:[(0,0,0)]*9,run=mrun)
            with patch.dict(aa.PINS,pins,clear=True),patch.dict('sys.modules',{'p2_34m_cage_orientation_native':mock_m}):
                r=aa.run(src,grid,out,execute_m=True)
            self.assertEqual(r['completedStages'],['M'])
            self.assertTrue(r['p234mReview']['trackPrototypeEligible'])
            self.assertTrue(r['nativeExecutionStarted'])
    def test_m_ineligible_prevents_n(self):
        with tempfile.TemporaryDirectory() as d:
            src,grid,out=sandbox(Path(d));pins=synthetic_original(src);grid.write_text('{}')
            def mrun(src,manifest,target):
                obj=report(grid,False);target.write_text(json.dumps(obj));return obj
            mock_m=types.SimpleNamespace(pose_grid=lambda d:[(0,0,0)]*9,run=mrun)
            mock_n=types.SimpleNamespace(build=lambda *args:self.fail('N should not run'))
            with patch.dict(aa.PINS,pins,clear=True),patch.dict('sys.modules',{'p2_34m_cage_orientation_native':mock_m,'p2_34n_track_candidate':mock_n}):
                r=aa.run(src,grid,out,execute_m=True,execute_n=True)
            self.assertEqual(r['completedStages'],['M'])
            self.assertIn('M_NATIVE_PATHS_NOT_ELIGIBLE_FOR_N',r['blockedReasons'])
    def test_eligible_runs_n_only_after_m(self):
        with tempfile.TemporaryDirectory() as d:
            src,grid,out=sandbox(Path(d));pins=synthetic_original(src);grid.write_text('{}')
            def mrun(src,manifest,target):
                obj=report(grid);target.write_text(json.dumps(obj));return obj
            def nbuild(src,mfile,out_dir):
                self.assertTrue(Path(mfile).is_file())
                out_dir.mkdir()
                (out_dir/'P234N_source84_track_cut_PROTOTYPE.step').write_bytes(b'synthetic mock only')
            mock_m=types.SimpleNamespace(pose_grid=lambda d:[(0,0,0)]*9,run=mrun)
            mock_n=types.SimpleNamespace(build=nbuild)
            mock_ab=types.SimpleNamespace(inspect_files=lambda *args:{'downstreamNValidatedPaths':True})
            with patch.dict(aa.PINS,pins,clear=True),patch.dict('sys.modules',{'p2_34m_cage_orientation_native':mock_m,'p2_34n_track_candidate':mock_n,'p2_34ab_m_to_n_handoff':mock_ab}):
                r=aa.run(src,grid,out,execute_m=True,execute_n=True)
            self.assertEqual(r['completedStages'],['M','N'])
            self.assertEqual(r['p234nCandidateSHA256'],hashlib.sha256(b'synthetic mock only').hexdigest())
    def test_unsafe_handoff_prevents_n_cut(self):
        with tempfile.TemporaryDirectory() as d:
            src,grid,out=sandbox(Path(d));pins=synthetic_original(src);grid.write_text('{}')
            def mrun(src,manifest,target):
                obj=report(grid);target.write_text(json.dumps(obj));return obj
            mock_m=types.SimpleNamespace(pose_grid=lambda d:[(0,0,0)]*9,run=mrun)
            def fail_handoff(*args):
                raise ValueError('native selected reference is not measured')
            mock_ab=types.SimpleNamespace(inspect_files=fail_handoff)
            mock_n=types.SimpleNamespace(build=lambda *args:self.fail('unsafe N cut executed'))
            with patch.dict(aa.PINS,pins,clear=True),patch.dict('sys.modules',{
                'p2_34m_cage_orientation_native':mock_m,
                'p2_34ab_m_to_n_handoff':mock_ab,
                'p2_34n_track_candidate':mock_n}):
                r=aa.run(src,grid,out,execute_m=True,execute_n=True)
            self.assertEqual(r['completedStages'],['M'])
            self.assertTrue(any('native selected reference is not measured' in reason
                                for reason in r['blockedReasons']))
    def test_m_wrong_source_sha_blocks_stage(self):
        with self.assertRaises(ValueError):aa.check_m_report({'schema':aa.M_SCHEMA,'original84StepSHA256':'wrong'},'good','grid')
    def test_m_missing_pose_measurements(self):
        d={'schema':aa.M_SCHEMA,'original84StepSHA256':'a','manifestSHA256':'b',
           'original84SolidCount':84,'originalCADModified':False,'mechanicalG2Certified':False,
           'poseCount':9,'perPose':[]}
        with self.assertRaises(ValueError):aa.check_m_report(d,'a','b')
    def test_native_failure_logged(self):
        with tempfile.TemporaryDirectory() as d:
            src,grid,out=sandbox(Path(d));pins=synthetic_original(src);grid.write_text('{}')
            mock_m=types.SimpleNamespace(pose_grid=lambda d:[(0,0,0)]*9,run=lambda *args:(_ for _ in ()).throw(RuntimeError('occ fail')))
            with patch.dict(aa.PINS,pins,clear=True),patch.dict('sys.modules',{'p2_34m_cage_orientation_native':mock_m}):
                r=aa.run(src,grid,out,execute_m=True)
            self.assertTrue(r['nativeExecutionStarted'])
            self.assertIn('NATIVE_EXECUTION_FAILED:RuntimeError:occ fail',r['blockedReasons'])
            self.assertTrue((out/'P234AA_execution_manifest.json').is_file())

if __name__=='__main__':unittest.main(verbosity=2)
