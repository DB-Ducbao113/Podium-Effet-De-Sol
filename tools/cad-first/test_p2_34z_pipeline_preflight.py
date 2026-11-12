"""P2.34Z source-independent preflight tests; no owner native 84-solid validation."""
import hashlib,json,tempfile,unittest
from pathlib import Path
import p2_34z_pipeline_preflight as z

class PreflightTests(unittest.TestCase):
    def setup_dirs(self,root):
        source=root/'source';candidate=root/'candidate';reports=root/'reports'
        for p in (source,candidate,reports):p.mkdir()
        return source,candidate,reports
    def test_all_missing_fail_closed(self):
        with tempfile.TemporaryDirectory() as d:
            src,cand,rep=self.setup_dirs(Path(d))
            r=z.evaluate(src,cand,rep)
            self.assertFalse(r['allMThroughYMetadataVerified'])
            self.assertEqual(len(r['stagePreflight']),13)
            self.assertIn('AUTHENTIC_SOURCE_MISSING_OR_MISMATCH',r['stagePreflight']['M']['reasons'])
            self.assertIn('UPSTREAM_NOT_VERIFIED',r['stagePreflight']['Y']['reasons'])
            self.assertFalse(r['mechanicalG2Certified'])
    def test_invalid_schema_and_sha(self):
        with tempfile.TemporaryDirectory() as d:
            src,cand,rep=self.setup_dirs(Path(d))
            (rep/z.REPORTS['M']).write_text(json.dumps({'schema':'WRONG','mechanicalG2Certified':False,'original84StepSHA256':'wrong'}))
            reasons=z.evaluate(src,cand,rep)['stagePreflight']['M']['reasons']
            self.assertIn('REPORT_SCHEMA_MISMATCH',reasons)
            self.assertIn('SOURCE_SHA_MISMATCH',reasons)
    def test_corrupted_json(self):
        with tempfile.TemporaryDirectory() as d:
            src,cand,rep=self.setup_dirs(Path(d))
            (rep/z.REPORTS['M']).write_text('{invalid')
            self.assertIn('REPORT_INVALID_JSON',z.evaluate(src,cand,rep)['stagePreflight']['M']['reasons'])
    def test_source_hash_changed(self):
        with tempfile.TemporaryDirectory() as d:
            src,cand,rep=self.setup_dirs(Path(d))
            name=next(iter(z.PINS));(src/name).write_bytes(b'tamper')
            self.assertEqual(z.evaluate(src,cand,rep)['fileInventory']['source:'+name]['status'],'SHA_MISMATCH')
    def test_parent_link_mismatch(self):
        with tempfile.TemporaryDirectory() as d:
            src,cand,rep=self.setup_dirs(Path(d))
            (rep/z.REPORTS['M']).write_bytes(b'input')
            (cand/z.REPORTS['N']).write_text(json.dumps({'schema':z.STEPS['N'][0],
                 'mechanicalG2Certified':False,'nativeSourceSHA256':{'P234E_source84_revised_six_ball_clearance.step':z.SOURCE},
                 'parentP234MReportSHA256':'bad'}))
            self.assertIn('SHA_LINK_MISMATCH:parentP234MReportSHA256',z.evaluate(src,cand,rep)['stagePreflight']['N']['reasons'])
    def test_correct_parent_sha_with_missing_source_still_blocked(self):
        with tempfile.TemporaryDirectory() as d:
            src,cand,rep=self.setup_dirs(Path(d))
            raw=b'input';(rep/z.REPORTS['M']).write_bytes(raw)
            (cand/z.REPORTS['N']).write_text(json.dumps({'schema':z.STEPS['N'][0],
                'mechanicalG2Certified':False,'nativeSourceSHA256':{'P234E_source84_revised_six_ball_clearance.step':z.SOURCE},
                'parentP234MReportSHA256':hashlib.sha256(raw).hexdigest()}))
            self.assertIn('UPSTREAM_NOT_VERIFIED',z.evaluate(src,cand,rep)['stagePreflight']['N']['reasons'])
    def test_unsafe_certificate(self):
        with tempfile.TemporaryDirectory() as d:
            src,cand,rep=self.setup_dirs(Path(d))
            (rep/z.REPORTS['M']).write_text(json.dumps({'schema':z.STEPS['M'][0],
                'mechanicalG2Certified':True,'original84StepSHA256':z.SOURCE}))
            self.assertIn('UNSAFE_OR_MISSING_G2_HOLD',z.evaluate(src,cand,rep)['stagePreflight']['M']['reasons'])
    def test_nonobject_native_source_sha_map_fails_closed(self):
        with tempfile.TemporaryDirectory() as d:
            src,cand,rep=self.setup_dirs(Path(d))
            (cand/z.REPORTS['N']).write_text(json.dumps({'schema':z.STEPS['N'][0],
                'mechanicalG2Certified':False,'nativeSourceSHA256':'WRONG'}))
            r=z.evaluate(src,cand,rep)
            self.assertIn('SOURCE_SHA_MISMATCH',r['stagePreflight']['N']['reasons'])
    def test_no_overwrite(self):
        with tempfile.TemporaryDirectory() as d:
            src,cand,rep=self.setup_dirs(Path(d));p=Path(d)/'out.json';p.write_text('KEEP')
            with self.assertRaises(FileExistsError):z.run(src,cand,rep,p)
            self.assertEqual(p.read_text(),'KEEP')
    def test_writes_blocked_report(self):
        with tempfile.TemporaryDirectory() as d:
            src,cand,rep=self.setup_dirs(Path(d));p=Path(d)/'new.json'
            r=z.run(src,cand,rep,p)
            self.assertEqual(r,json.loads(p.read_text()))
            self.assertFalse(r['original84SourceGeometryValidatedByPreflight'])
    def test_schema_inventory_coverage(self):
        self.assertEqual(set(z.STEPS),set(z.REPORTS))
        self.assertEqual(len(z.STEPS),13)
        self.assertTrue(all(k in z.STEPS for k in z.CHAIN))
    def test_g2_not_even_if_all_statuses_present(self):
        with tempfile.TemporaryDirectory() as d:
            src,cand,rep=self.setup_dirs(Path(d))
            for stage,(schema,_) in z.STEPS.items():
                directory=cand if stage=='N' else rep
                (directory/z.REPORTS[stage]).write_text(json.dumps({'schema':schema,'mechanicalG2Certified':False}))
            r=z.evaluate(src,cand,rep)
            self.assertFalse(r['allMThroughYMetadataVerified'])
            self.assertFalse(r['mechanicalG2Certified'])

if __name__=='__main__':unittest.main(verbosity=2)
