"""P2.34O synthetic contracts only; not authentic native STEP geometry QA."""
import copy,hashlib,tempfile,unittest
from pathlib import Path
from p2_34o_native_postcut_gate import (
    SHAFT,CUP,SOURCE_SHA,N_SCHEMA,signature,matches,establish_identity,
    verify_subtractive_geometry,validate_audit,evaluate_rows,run)

class V:
    def __init__(self,x):self.x=x;self.y=0;self.z=0
class Box:
    def __init__(self,x):
        self.xmin=x-1;self.xmax=x+1;self.ymin=-1;self.ymax=1;self.zmin=-1;self.zmax=1
class Shape:
    def __init__(self,x,v=None,valid=True):
        self.x=x;self.v=v if v is not None else 100+x;self.valid=valid
    def Volume(self):return self.v
    def Center(self):return V(self.x)
    def BoundingBox(self):return Box(self.x)
    def isValid(self):return self.valid
    def Solids(self):return [self]
def objects():
    src={f'ORIGINAL_{i:02d}':Shape(i) for i in range(82)}
    src[SHAFT]=Shape(200,10000);src[CUP]=Shape(300,20000)
    dst=list(reversed([Shape(i) for i in range(82)]+[Shape(300,19000),Shape(200,9000)]))
    audit={'cutStatistics':{
        'shaft':{'initialVolumeMm3':10000,'prototypeVolumeMm3':9000,'removedVolumeFraction':.1},
        'cup':{'initialVolumeMm3':20000,'prototypeVolumeMm3':19000,'removedVolumeFraction':.05}}}
    return src,dst,audit
def record(step=b'step',parent=b'm'):
    return {'schema':N_SCHEMA,'nativeSourceSHA256':{'P234E_source84_revised_six_ball_clearance.step':SOURCE_SHA},
    'outputCandidateSHA256':hashlib.sha256(step).hexdigest(),
    'parentP234MReportSHA256':hashlib.sha256(parent).hexdigest(),
    'changedParts':[SHAFT,CUP],'sourcePartCount':84,
    'original84Retained':True,'sourceGeometryUnchanged':True,
    'cutterIsDiscreteSphereUnionNotMachinedSmoothGroove':True,
    'postCutNativeCollisionScreenCompleted':False,'mechanicalG2Certified':False,
    'constantVelocityCertified':False,'loadedTorqueCertified':False}

class TestP234OPostcut(unittest.TestCase):
    def test_reordered_source_identity(self):
        a,b,c=objects();m=establish_identity(a,b,c)
        self.assertEqual(len(m),84);self.assertEqual((m[SHAFT],m[CUP]),(0,1))
    def test_missing_solid(self):
        a,b,c=objects()
        with self.assertRaises(ValueError):establish_identity(a,b[:-1],c)
    def test_mutated_unchanged_body(self):
        a,b,c=objects();b[4].v+=1
        with self.assertRaises(ValueError):establish_identity(a,b,c)
    def test_ambiguous_duplicate(self):
        a,b,c=objects();b[4]=copy.copy(b[3])
        with self.assertRaises(ValueError):establish_identity(a,b,c)
    def test_wrong_race_volume(self):
        a,b,c=objects();c['cutStatistics']['shaft']['prototypeVolumeMm3']=8999
        with self.assertRaises(ValueError):establish_identity(a,b,c)
    def test_wrong_material_fraction(self):
        a,b,c=objects();c['cutStatistics']['cup']['removedVolumeFraction']=.08
        with self.assertRaises(ValueError):establish_identity(a,b,c)
    def test_invalid_solid(self):
        a,b,c=objects();b[0].valid=False
        with self.assertRaises(ValueError):establish_identity(a,b,c)
    def test_geometric_signature(self):
        self.assertTrue(matches(signature(Shape(2)),signature(Shape(2))))
        self.assertFalse(matches(signature(Shape(2)),signature(Shape(3))))
    def test_sha_contract_pass(self):self.assertTrue(validate_audit(record(),b'step',b'm'))
    def test_sha_step_tamper(self):
        with self.assertRaises(ValueError):validate_audit(record(),b'wrong',b'm')
    def test_sha_report_tamper(self):
        with self.assertRaises(ValueError):validate_audit(record(),b'step',b'wrong')
    def test_unapproved_changes(self):
        r=record();r['changedParts']=[SHAFT]
        with self.assertRaises(ValueError):validate_audit(r,b'step',b'm')
    def test_false_prior_native_review(self):
        r=record();r['postCutNativeCollisionScreenCompleted']=True
        with self.assertRaises(ValueError):validate_audit(r,b'step',b'm')
    def test_false_mechanical_claim(self):
        r=record();r['mechanicalG2Certified']=True
        with self.assertRaises(ValueError):validate_audit(r,b'step',b'm')
    def test_schema_rejected(self):
        r=record();r['schema']='invalid'
        with self.assertRaises(ValueError):validate_audit(r,b'step',b'm')
    def test_native_accounting(self):
        row={'nativeBooleanCalls':33,'nativeDistanceCalls':12,'classification':{'exploratoryPass':True}}
        x=evaluate_rows([row]*9)
        self.assertEqual((x['nativeBooleanCalls'],x['nativeDistanceCalls']),(297,108))
    def test_failed_pose_not_suppressed(self):
        self.assertFalse(evaluate_rows([{'nativeBooleanCalls':33,'nativeDistanceCalls':12,
            'classification':{'exploratoryPass':False}}])['allSampledPoseScreensPass'])
    def test_missing_boolean(self):
        with self.assertRaises(ValueError):evaluate_rows([{'nativeBooleanCalls':12,
            'nativeDistanceCalls':12,'classification':{'exploratoryPass':True}}])
    def test_added_material_native_boolean_guard(self):
        class Cut:
            def __init__(self,v,added):self.v=v;self.added=added
            def isValid(self):return True
            def Volume(self):return self.v
            def cut(self,other):return type('Result',(),{'Volume':lambda s: 1 if self.v<other.v and self.added else 0 if self.v<other.v else 10})()
        with self.assertRaisesRegex(ValueError,'subtractive'):
            verify_subtractive_geometry(Cut(100,False),Cut(90,True))
    def test_expected_subtraction(self):
        class Cut:
            def __init__(self,v):self.v=v
            def isValid(self):return True
            def Volume(self):return self.v
            def cut(self,other):return type('Result',(),{'Volume':lambda s:0 if self.v<other.v else 10})()
        self.assertEqual(verify_subtractive_geometry(Cut(100),Cut(90))['removedMaterialMm3'],10)
    def test_no_evidence_overwrite(self):
        with tempfile.TemporaryDirectory() as d:
            f=Path(d)/'existing';f.write_text('KEEP')
            with self.assertRaises(FileExistsError):run(d,d,d,f)
            self.assertEqual(f.read_text(),'KEEP')
if __name__=='__main__':unittest.main(verbosity=2)
