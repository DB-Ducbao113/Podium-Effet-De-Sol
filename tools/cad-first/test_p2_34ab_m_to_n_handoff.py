"""P2.34AB strict native-report-to-N handoff; synthetic JSON, no owner STEP."""
import copy,json,tempfile,unittest
from pathlib import Path
import p2_34ab_m_to_n_handoff as ab
from p2_34m_cage_orientation_native import GRID_SCHEMA,SCHEMA as M_SCHEMA
from p2_34n_track_candidate import SOURCE_SHA

def fixture():
    poses=[]
    for bend in (-10,0,10):
        for phase in (0,1,2):
            poses.append({'bendDeg':bend,'shaftSpinDeg':phase,'cupSpinDeg':phase})
    grid={'schema':GRID_SCHEMA,'poses':poses}
    rows=[]
    for pose in poses:
        rows.append({'pose':pose,'qualifyingCandidates':[{
            'classification':{'exploratoryPass':True},
            'cageRotationCorrectionXYZDeg':[0,0,0],
            'cageFrameTranslationMm':[0,0,0]}],
            'qualificationCount':1,'testedCandidates':7})
    paths=[{'bendDeg':bend,'sampledPathExists':True,
        'sampledPath':[{'pose':pose,'candidateIndex':0}
                       for pose in poses if pose['bendDeg']==bend]}
        for bend in (-10,0,10)]
    m={'schema':M_SCHEMA,'original84StepSHA256':SOURCE_SHA,'original84SolidCount':84,
       'originalCADModified':False,'mechanicalG2Certified':False,
       'allBendTracesFound':True,'allChosenPathsCrossBendScreen':True,
       'poseCount':len(rows),'perPose':rows,'perBendSampledPaths':paths}
    return m,grid

class HandoffTests(unittest.TestCase):
    def test_valid_selected_paths(self):
        m,g=fixture();r=ab.inspect(m,g)
        self.assertEqual(r['checkedSelectedCandidateCount'],9)
        self.assertTrue(r['downstreamNValidatedPaths'])
        self.assertFalse(r['mechanicalG2Certified'])
    def test_bad_schema(self):
        m,g=fixture();m['schema']='fake'
        with self.assertRaises(ValueError):ab.inspect(m,g)
    def test_missing_per_pose(self):
        m,g=fixture();m['perPose'].pop()
        with self.assertRaises(ValueError):ab.inspect(m,g)
    def test_pose_reordered(self):
        m,g=fixture();m['perPose'][0],m['perPose'][1]=m['perPose'][1],m['perPose'][0]
        with self.assertRaises(ValueError):ab.inspect(m,g)
    def test_unproven_candidate_ref(self):
        m,g=fixture();m['perBendSampledPaths'][0]['sampledPath'][0]['candidateIndex']=1
        with self.assertRaises(ValueError):ab.inspect(m,g)
    def test_false_path_pass(self):
        m,g=fixture();m['allChosenPathsCrossBendScreen']=False
        with self.assertRaises(ValueError):ab.inspect(m,g)
    def test_bad_candidate_accounting(self):
        m,g=fixture();m['perPose'][0]['qualificationCount']=2
        with self.assertRaises(ValueError):ab.inspect(m,g)
    def test_duplicate_selected_sample(self):
        m,g=fixture();p=m['perBendSampledPaths'][0]['sampledPath']
        p[1]=copy.deepcopy(p[0])
        with self.assertRaises(ValueError):ab.inspect(m,g)
    def test_original_sha_changed(self):
        m,g=fixture();m['original84StepSHA256']='tampered'
        with self.assertRaises(ValueError):ab.inspect(m,g)
    def test_file_input_hash(self):
        m,g=fixture()
        with tempfile.TemporaryDirectory() as folder:
            source=Path(folder)/'m.json';grid=Path(folder)/'grid.json'
            source.write_text(json.dumps(m));grid.write_text(json.dumps(g))
            r=ab.inspect_files(source,grid)
            self.assertEqual(len(r['p234mReportSHA256']),64)
            self.assertEqual(len(r['poseGridSHA256']),64)
if __name__=='__main__':unittest.main(verbosity=2)
