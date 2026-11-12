"""P2.34N synthetic source-independent transform/provenance contract tests."""
import copy,math,unittest
from p2_34n_track_candidate import *

def report():
    evidence=[];paths=[]
    for bend in (-10,0,10):
        entries=[]
        for phase in (0,.5,1):
            pose=dict(bendDeg=bend,shaftSpinDeg=phase,cupSpinDeg=phase)
            candidate=dict(classification=dict(exploratoryPass=True),
                cageRotationCorrectionXYZDeg=[0,0,0],cageFrameTranslationMm=[0,0,0])
            evidence.append(dict(pose=pose,qualifyingCandidates=[candidate]))
            entries.append(dict(pose=pose,candidateIndex=0))
        paths.append(dict(bendDeg=bend,sampledPathExists=True,sampledPath=entries))
    return dict(schema=M_SCHEMA,original84StepSHA256=SOURCE_SHA,original84SolidCount=84,
        originalCADModified=False,mechanicalG2Certified=False,allBendTracesFound=True,
        allChosenPathsCrossBendScreen=True,perPose=evidence,perBendSampledPaths=paths)

class TestNativeTrackRecipe(unittest.TestCase):
    def test_nine_proven_samples(self):self.assertEqual(len(validated_paths(report())),9)
    def test_bad_sha(self):
        x=report();x['original84StepSHA256']='tamper'
        with self.assertRaises(ValueError):validated_paths(x)
    def test_false_certificate(self):
        x=report();x['mechanicalG2Certified']=True
        with self.assertRaises(ValueError):validated_paths(x)
    def test_incomplete_cross_bend(self):
        x=report();x['allChosenPathsCrossBendScreen']=False
        with self.assertRaises(ValueError):validated_paths(x)
    def test_rejected_candidate(self):
        x=report();x['perPose'][0]['qualifyingCandidates'][0]['classification']['exploratoryPass']=False
        with self.assertRaises(ValueError):validated_paths(x)
    def test_invalid_candidate_index(self):
        x=report();x['perBendSampledPaths'][0]['sampledPath'][0]['candidateIndex']=5
        with self.assertRaises(ValueError):validated_paths(x)
    def test_missing_pose(self):
        x=report();x['perPose'].pop()
        with self.assertRaises(ValueError):validated_paths(x)
    def test_duplicate_pose(self):
        x=report();x['perBendSampledPaths'][0]['sampledPath'][1]['pose']=x['perBendSampledPaths'][0]['sampledPath'][0]['pose']
        with self.assertRaises(ValueError):validated_paths(x)
    def test_out_of_bounds(self):
        x=report();x['perPose'][0]['qualifyingCandidates'][0]['cageFrameTranslationMm']=[3,0,0]
        with self.assertRaises(ValueError):validated_paths(x)
    def test_neutral_center(self):
        p=dict(bendDeg=0,shaftSpinDeg=0,cupSpinDeg=0)
        self.assertEqual(ball_center((32.2,0,-239.5),p,[0,0,0],[0,0,0]),(32.2,0,-239.5))
    def test_half_bend(self):
        p=dict(bendDeg=10,shaftSpinDeg=0,cupSpinDeg=0)
        x=ball_center((0,32.2,-239.5),p,[0,0,0],[0,0,0])
        self.assertAlmostEqual(x[1],32.2*math.cos(math.radians(5)))
    def test_shaft_inverse(self):
        p=dict(bendDeg=10,shaftSpinDeg=1,cupSpinDeg=.5)
        base=(32.2,0,-239.5);world=around(around(base,'z',1),'x',10)
        for a,b in zip(to_race_local(world,p,'shaft'),base):self.assertAlmostEqual(a,b)
    def test_cup_inverse(self):
        p=dict(bendDeg=10,shaftSpinDeg=1,cupSpinDeg=.5)
        base=(32.2,0,-239.5);world=around(base,'z',-.5)
        for a,b in zip(to_race_local(world,p,'cup'),base):self.assertAlmostEqual(a,b)
    def test_rotation_chain(self):
        p=dict(bendDeg=0,shaftSpinDeg=0,cupSpinDeg=0)
        self.assertAlmostEqual(ball_center((0,32.2,-239.5),p,[0,0,90],[0,0,0])[0],-32.2)
    def test_nan(self):
        x=report();x['perPose'][0]['qualifyingCandidates'][0]['cageRotationCorrectionXYZDeg'][0]=math.nan
        with self.assertRaises(ValueError):validated_paths(x)
if __name__=='__main__':unittest.main(verbosity=2)
