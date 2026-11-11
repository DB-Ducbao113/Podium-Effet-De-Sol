"""P2.34L synthetic-only contract tests. No original STEP means no mechanical PASS."""
import math,tempfile,unittest
from pathlib import Path
from p2_34l_multi_candidate_path import J_SCHEMA,SOURCE_SHA,parse,solve,run

def report(s,c,offsets,bend=10):
    cs=[{'sharedCageLocalTranslationMm':list(x),'classification':{'exploratoryCandidate':True}} for x in offsets]
    return {'schema':J_SCHEMA,'sourceSTEPsha256':SOURCE_SHA,'partCount':84,
        'originalCADModified':False,'mechanicalG2Certified':False,
        'pose':{'bendDeg':bend,'shaftSpinDeg':s,'cupSpinDeg':c},
        'search':{'candidateSharedTranslations':max(3,len(cs))},
        'candidateCountMeetingExploratoryScreen':len(cs),'screenPassingCandidates':cs}

class TestPath(unittest.TestCase):
    def test_global_path_not_greedy(self):
        r=solve([report(0,0,[(0,0,0),(.4,0,0)]),report(2,2,[(.4,0,0)]),report(4,4,[(.4,0,0)])])
        self.assertTrue(r['sampledConnectedPathFound']);self.assertEqual(r['sampledPath'][0]['candidateIndex'],1)
        self.assertFalse(r['mechanicalG2Certified'])
    def test_unconnected(self):
        self.assertFalse(solve([report(0,0,[(0,0,0)]),report(2,2,[(.4,0,0)]),report(4,4,[(0,0,0)])])['sampledConnectedPathFound'])
    def test_no_candidates(self):
        self.assertFalse(solve([report(0,0,[(0,0,0)]),report(2,2,[]),report(4,4,[(0,0,0)])])['sampledConnectedPathFound'])
    def test_legacy_rejected(self):
        a=report(0,0,[(0,0,0)]);del a['screenPassingCandidates']
        with self.assertRaises(ValueError):parse(a)
    def test_truncated(self):
        a=report(0,0,[(0,0,0)]);a['candidateCountMeetingExploratoryScreen']=2
        with self.assertRaises(ValueError):parse(a)
    def test_failed_candidate(self):
        a=report(0,0,[(0,0,0)]);a['screenPassingCandidates'][0]['classification']['exploratoryCandidate']=False
        with self.assertRaises(ValueError):parse(a)
    def test_duplicates(self):
        with self.assertRaises(ValueError):parse(report(0,0,[(0,0,0),(0,0,0)]))
    def test_bend(self):
        with self.assertRaises(ValueError):solve([report(0,0,[(0,0,0)]),report(2,2,[(0,0,0)],0),report(4,4,[(0,0,0)])])
    def test_phase_gap(self):
        self.assertFalse(solve([report(0,0,[(0,0,0)]),report(7,7,[(0,0,0)]),report(14,14,[(0,0,0)])])['sampledConnectedPathFound'])
    def test_speed_ratio(self):
        self.assertFalse(solve([report(0,0,[(0,0,0)]),report(2,1,[(0,0,0)]),report(4,2,[(0,0,0)])])['sampledConnectedPathFound'])
    def test_wrap(self):
        self.assertTrue(solve([report(357,357,[(0,0,0)]),report(359,359,[(0,0,0)]),report(1,1,[(0,0,0)])])['sampledConnectedPathFound'])
    def test_reverse(self):
        with self.assertRaises(ValueError):solve([report(4,4,[(0,0,0)]),report(2,2,[(0,0,0)]),report(0,0,[(0,0,0)])])
    def test_nan(self):
        a=report(0,0,[(math.nan,0,0)])
        with self.assertRaises(ValueError):parse(a)
    def test_source_pin(self):
        a=report(0,0,[(0,0,0)]);a['sourceSTEPsha256']='bad'
        with self.assertRaises(ValueError):parse(a)
    def test_no_overwrite(self):
        with tempfile.TemporaryDirectory() as d:
            f=Path(d)/'evidence';f.write_text('intact')
            with self.assertRaises(FileExistsError):run([],f)
            self.assertEqual(f.read_text(),'intact')
    def test_missing_input(self):
        with self.assertRaises(ValueError):solve([])
if __name__=='__main__':unittest.main(verbosity=2)
