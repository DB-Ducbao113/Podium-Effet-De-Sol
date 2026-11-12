#!/usr/bin/env python3
"""P2.34Z: fail-closed native source and M-Y evidence preflight; NO CAD acceptance."""
from __future__ import annotations
import argparse,hashlib,json,sys
from pathlib import Path

SCHEMA='peds.cad-first.p234z-native-pipeline-preflight.v1'
PINS={
 'P234E_source84_revised_six_ball_clearance.step':'9bd7ec6a60d5c4c9f1f3e421cb730fc252de026aae21dcf570584e5dda0ec63e',
 'P234E_source84_name_index.json':'57afa74054ca892d2cb5633fb1c03a3c906fc2a928adf45f4674aa008952a62a',
 'P234E_source84_ball_contact_audit.json':'b2eb8da1720cd5bf206e716e24ad8ebdde28d620bf31aaea456edb1b05e4b894'}
STEPS={
 'M':('peds.cad-first.p234m-cage-orientation-native-grid.v1','original84StepSHA256'),
 'N':('peds.cad-first.p234n-original-derived-track-cutter-prototype.v1',None),
 'O':('peds.cad-first.p234o-postcut-native-integrity-and-pose.v1','original84SourceSHA256'),
 'P':('peds.cad-first.p234p-full84-native-boolean-midpose-gate.v1','original84SHA256'),
 'Q':('peds.cad-first.p234q-native-centerline-curvature-v1','source84SHA256'),
 'R':('peds.cad-first.p234r-c1-centerline-interpolation-review.v1','source84SHA256'),
 'S':('peds.cad-first.p234s-native-protected-material-review.v1','original84SourceSHA256'),
 'T':('peds.cad-first.p234t-native-radial-section-review.v1','source84SHA256'),
 'U':('peds.cad-first.p234u-native-exact-radial-ray.v1','sourceSTEPsha256'),
 'V':('peds.cad-first.p234v-nearest-contact-witness.v1','original84SourceSHA256'),
 'W':('peds.cad-first.p234w-face-normal-directional-cage-review.v1','original84SourceSHA256'),
 'X':('peds.cad-first.p234x-sampled-ball-configuration-graph.v1','original84SourceSHA256'),
 'Y':('peds.cad-first.p234y-conservative-segment-clearance.v1','original84SourceSHA256')}
REPORTS={
 'M':'P234M_native_audit.json','N':'P234N_prototype_native_audit.json',
 'O':'P234O_postcut_native_review.json','P':'P234P_full84_native_report.json',
 'Q':'P234Q_centerline_diagnostic.json','R':'P234R_spline_diagnostic.json',
 'S':'P234S_material_review.json','T':'P234T_radial_review.json',
 'U':'P234U_exact_intersection_review.json','V':'P234V_native_nearest_contact.json',
 'W':'P234W_face_normal_and_cage_probe.json','X':'P234X_sampled_configuration_graph.json',
 'Y':'P234Y_continuous_segment_review.json'}
CHAIN={
 'M':{'original84StepSHA256':('source','step')},
 'N':{'parentP234MReportSHA256':('report','M'),'outputCandidateSHA256':('candidate','step')},
 'O':{'parentP234MReportSHA256':('report','M'),'candidateSTEPsha256':('candidate','step'),'candidateAuditSHA256':('report','N')},
 'P':{'parentP234MReportSHA256':('report','M'),'candidateSHA256':('candidate','step'),'candidateAuditSHA256':('report','N')},
 'Q':{'parentP234MReportSHA256':('report','M')},
 'R':{'parentP234MReportSHA256':('report','M'),'inputP234QReportSHA256':('report','Q')},
 'S':{'parentP234MReportSHA256':('report','M'),'candidateSTEPsha256':('candidate','step'),'candidateAuditSHA256':('report','N'),'p234oReportSHA256':('report','O'),'p234pReportSHA256':('report','P')},
 'T':{'p234mReportSHA256':('report','M'),'p234sReportSHA256':('report','S'),'candidateSTEPsha256':('candidate','step'),'candidateAuditSHA256':('report','N')},
 'U':{'parentP234MReportSHA256':('report','M'),'parentP234SReportSHA256':('report','S'),'parentP234TReportSHA256':('report','T'),'candidateSTEPsha256':('candidate','step'),'candidateAuditSHA256':('report','N')},
 'V':{'p234mReportSHA256':('report','M'),'p234uReportSHA256':('report','U'),'candidateSTEPsha256':('candidate','step')},
 'W':{'p234mReportSHA256':('report','M'),'p234vReportSHA256':('report','V'),'candidateSTEPsha256':('candidate','step'),'candidateAuditSHA256':('report','N')},
 'X':{'p234mReportSHA256':('report','M'),'p234wReportSHA256':('report','W'),'candidateSTEPsha256':('candidate','step'),'candidateAuditSHA256':('report','N')},
 'Y':{'p234mReportSHA256':('report','M'),'p234xReportSHA256':('report','X'),'candidateSTEPsha256':('candidate','step')}}
SOURCE='9bd7ec6a60d5c4c9f1f3e421cb730fc252de026aae21dcf570584e5dda0ec63e'

def digest(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        for block in iter(lambda:f.read(1024*1024),b''):h.update(block)
    return h.hexdigest()

def check_files(source_dir,candidate_dir,report_dir):
    result={};hashes={}
    for name,pin in PINS.items():
        path=source_dir/name
        actual=digest(path) if path.is_file() else None
        result['source:'+name]={'status':'PASS' if actual==pin else 'MISSING' if actual is None else 'SHA_MISMATCH',
                                'expectedSHA256':pin,'actualSHA256':actual}
        if actual is not None:hashes[('source',name)]=actual
    candidate=candidate_dir/'P234N_source84_track_cut_PROTOTYPE.step'
    hashes[('candidate','step')]=digest(candidate) if candidate.is_file() else None
    result['candidate:step']={'status':'PRESENT_UNTRUSTED' if hashes[('candidate','step')] else 'MISSING',
                               'actualSHA256':hashes[('candidate','step')]}
    for stage,name in REPORTS.items():
        path=report_dir/name
        if stage=='N':path=candidate_dir/name
        hashes[('report',stage)]=digest(path) if path.is_file() else None
        result['report:'+stage]={'status':'PRESENT_UNTRUSTED' if path.is_file() else 'MISSING',
                                'actualSHA256':hashes[('report',stage)]}
    hashes[('source','step')]=hashes.get(('source','P234E_source84_revised_six_ball_clearance.step'))
    return result,hashes

def evaluate(source_dir,candidate_dir,report_dir):
    source_dir,candidate_dir,report_dir=map(Path,(source_dir,candidate_dir,report_dir))
    files,hashes=check_files(source_dir,candidate_dir,report_dir)
    stages={}
    earlier_ok=True
    for stage,(schema,sha_field) in STEPS.items():
        report_path=(candidate_dir if stage=='N' else report_dir)/REPORTS[stage]
        reasons=[];doc=None
        if not report_path.is_file():reasons.append('REPORT_MISSING')
        else:
            try:
                doc=json.loads(report_path.read_text(encoding='utf-8'))
                if not isinstance(doc,dict):raise ValueError('not an object')
            except (ValueError,UnicodeError):reasons.append('REPORT_INVALID_JSON')
        if doc is not None:
            if doc.get('schema')!=schema:reasons.append('REPORT_SCHEMA_MISMATCH')
            if doc.get('mechanicalG2Certified') is not False:reasons.append('UNSAFE_OR_MISSING_G2_HOLD')
            if sha_field is not None and doc.get(sha_field)!=SOURCE:reasons.append('SOURCE_SHA_MISMATCH')
            if stage=='N' and doc.get('nativeSourceSHA256',{}).get('P234E_source84_revised_six_ball_clearance.step')!=SOURCE:
                reasons.append('SOURCE_SHA_MISMATCH')
            for key,locator in CHAIN.get(stage,{}).items():
                expected=hashes.get(locator)
                if not expected:reasons.append('PARENT_INPUT_MISSING:'+key)
                elif doc.get(key)!=expected:reasons.append('SHA_LINK_MISMATCH:'+key)
            if stage=='M' and (doc.get('original84SolidCount')!=84 or doc.get('originalCADModified') is not False):
                reasons.append('SOURCE_PART_COUNT_OR_MUTATION')
        if stage=='M' and any(files['source:'+n]['status']!='PASS' for n in PINS):
            reasons.append('AUTHENTIC_SOURCE_MISSING_OR_MISMATCH')
        if stage=='N' and hashes.get(('candidate','step')) is None:
            reasons.append('CANDIDATE_STEP_MISSING')
        if not earlier_ok:reasons.append('UPSTREAM_NOT_VERIFIED')
        stage_ok=not reasons
        stages[stage]={'status':'VERIFIED_METADATA' if stage_ok else 'BLOCKED', 'reasons':sorted(set(reasons)),
                       'reportPath':str(report_path)}
        earlier_ok=earlier_ok and stage_ok
    return {'schema':SCHEMA,'sourcePin':SOURCE,'fileInventory':files,'stagePreflight':stages,
            'allMThroughYMetadataVerified':earlier_ok,
            'authenticNativeCADExecutionPerformedByPreflight':False,
            'original84SourceGeometryValidatedByPreflight':False,
            'originalGeometryModified':False,'mechanicalG2Certified':False,
            'status':'METADATA_PREFLIGHT_ONLY_G2_HOLD'}

def run(source_dir,candidate_dir,report_dir,out):
    path=Path(out)
    if path.exists():raise FileExistsError('Refusing to overwrite audit output')
    data=evaluate(source_dir,candidate_dir,report_dir)
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(data,indent=2,allow_nan=False)+'
',encoding='utf-8')
    return data

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--p234e-native',type=Path,required=True)
    parser.add_argument('--p234n-candidate',type=Path,required=True)
    parser.add_argument('--reports',type=Path,required=True)
    parser.add_argument('--out',type=Path,required=True)
    args=parser.parse_args()
    data=run(args.p234e_native,args.p234n_candidate,args.reports,args.out)
    print(json.dumps({'status':data['status'],'allMThroughYMetadataVerified':data['allMThroughYMetadataVerified'],
                     'blockedStages':[x for x,s in data['stagePreflight'].items() if s['status']=='BLOCKED']}))
    sys.exit(0 if data['allMThroughYMetadataVerified'] else 2)
