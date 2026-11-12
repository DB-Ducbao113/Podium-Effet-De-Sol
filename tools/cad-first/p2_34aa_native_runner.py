#!/usr/bin/env python3
"""P2.34AA: deterministic local M->N source-authenticated runner, G2 HOLD.

No GitHub Actions. No synthetic owner geometry and no automatic downstream acceptance.
"""
from __future__ import annotations
import argparse, hashlib, json, sys
from pathlib import Path

PINS = {
 'P234E_source84_revised_six_ball_clearance.step': '9bd7ec6a60d5c4c9f1f3e421cb730fc252de026aae21dcf570584e5dda0ec63e',
 'P234E_source84_name_index.json': '57afa74054ca892d2cb5633fb1c03a3c906fc2a928adf45f4674aa008952a62a',
 'P234E_source84_ball_contact_audit.json': 'b2eb8da1720cd5bf206e716e24ad8ebdde28d620bf31aaea456edb1b05e4b894',
}
M_SCHEMA='peds.cad-first.p234m-cage-orientation-native-grid.v1'
SCHEMA='peds.cad-first.p234aa-native-staged-runner.v1'
M_NAME='P234M_native_audit.json'
N_DIR='P234N_native_prototype'

def hashfile(path):
    h=hashlib.sha256()
    with Path(path).open('rb') as f:
        for block in iter(lambda:f.read(1<<20),b''):h.update(block)
    return h.hexdigest()

def source_preflight(folder):
    folder=Path(folder)
    results={}
    for name,pin in PINS.items():
        p=folder/name
        actual=hashfile(p) if p.is_file() else None
        results[name]={'expectedSHA256':pin,'actualSHA256':actual,
                       'status':'PASS' if actual==pin else 'MISSING' if actual is None else 'SHA_MISMATCH'}
    return {'allPinnedFilesMatch':all(x['status']=='PASS' for x in results.values()),'files':results}

def check_m_report(report, source_sha, grid_sha):
    if not isinstance(report,dict) or report.get('schema')!=M_SCHEMA:
        raise ValueError('P2.34M schema mismatch')
    if report.get('original84StepSHA256')!=source_sha or report.get('manifestSHA256')!=grid_sha:
        raise ValueError('P2.34M source/pose SHA mismatch')
    if report.get('original84SolidCount')!=84 or report.get('originalCADModified') is not False:
        raise ValueError('P2.34M geometry invariants invalid')
    if report.get('mechanicalG2Certified') is not False:
        raise ValueError('P2.34M false mechanical certificate')
    if report.get('poseCount',0)<9 or not isinstance(report.get('perPose'),list) or len(report['perPose'])!=report['poseCount']:
        raise ValueError('P2.34M incomplete native measurement grid')
    return {'sourceAndManifestVerified':True,
            'trackPrototypeEligible':report.get('allBendTracesFound') is True
                and report.get('allChosenPathsCrossBendScreen') is True,
            'poseCount':report['poseCount']}

def run(source,grid,out_dir,execute_m=False,execute_n=False):
    source,grid,out_dir=Path(source),Path(grid),Path(out_dir)
    if execute_n and not execute_m:raise ValueError('P2.34N requires explicit P2.34M execution')
    if out_dir.exists():raise FileExistsError('Output directory already exists; no overwrite')
    preflight=source_preflight(source)
    report={'schema':SCHEMA,'sourcePreflight':preflight,'executionRequested':{'M':bool(execute_m),'N':bool(execute_n)},
            'nativeExecutionStarted':False,'completedStages':[],'blockedReasons':[],
            'mechanicalG2Certified':False,'modelBFullCarIntegrated':False}
    if not preflight['allPinnedFilesMatch']:
        report['blockedReasons'].append('SOURCE84_PINNED_FILE_MISSING_OR_SHA_MISMATCH')
    elif not grid.is_file():
        report['blockedReasons'].append('POSE_GRID_MISSING')
    else:
        raw=grid.read_bytes()
        report['poseGridSHA256']=hashlib.sha256(raw).hexdigest()
        try:
            from p2_34m_cage_orientation_native import pose_grid
            poses=pose_grid(json.loads(raw))
            report['validatedPoseCount']=len(poses)
        except (ImportError,ValueError,KeyError,TypeError) as e:
            report['blockedReasons'].append('POSE_GRID_INVALID:'+str(e))
    if not report['blockedReasons'] and not execute_m:
        report['blockedReasons'].append('NATIVE_EXECUTION_NOT_REQUESTED')
    if not report['blockedReasons'] and execute_m:
        from p2_34m_cage_orientation_native import run as m_run
        m_file=out_dir/M_NAME
        try:
            out_dir.mkdir(parents=True,exist_ok=False)
            report['nativeExecutionStarted']=True
            result=m_run(source,grid,m_file)
            from p2_34ac_persisted_evidence_gate import check_m,check_n
            verified_m=check_m(result,m_file,report['poseGridSHA256'])
            report.update(verified_m)
            quality=verified_m['p234mReview']
            report['completedStages'].append('M')
            if execute_n:
                if not quality['trackPrototypeEligible']:
                    report['blockedReasons'].append('M_NATIVE_PATHS_NOT_ELIGIBLE_FOR_N')
                else:
                    from p2_34ab_m_to_n_handoff import inspect_files
                    handoff=inspect_files(m_file,grid)
                    report['p234abHandoff']=handoff
                    from p2_34n_track_candidate import build as n_build
                    audit=n_build(source,m_file,out_dir/N_DIR)
                    report.update(check_n(audit,out_dir/N_DIR,m_file,PINS))
                    report['completedStages'].append('N')
        except Exception as e:
            report['blockedReasons'].append('NATIVE_EXECUTION_FAILED:'+type(e).__name__+':'+str(e))
    report['status']='NATIVE_STAGED_SOURCE_RUN_G2_HOLD' if report['completedStages'] else 'BLOCKED_SOURCE_OR_EXECUTION_G2_HOLD'
    if not out_dir.exists():out_dir.mkdir(parents=True,exist_ok=False)
    audit=out_dir/'P234AA_execution_manifest.json'
    if audit.exists():raise FileExistsError('Runner audit already present')
    audit.write_text(json.dumps(report,indent=2,allow_nan=False)+'\n',encoding='utf8')
    return report

if __name__=='__main__':
    cli=argparse.ArgumentParser()
    cli.add_argument('--p234e-native',type=Path,required=True)
    cli.add_argument('--pose-grid',type=Path,required=True)
    cli.add_argument('--out-dir',type=Path,required=True)
    cli.add_argument('--execute-m',action='store_true')
    cli.add_argument('--execute-n',action='store_true')
    a=cli.parse_args()
    result=run(a.p234e_native,a.pose_grid,a.out_dir,a.execute_m,a.execute_n)
    print(json.dumps({'status':result['status'],'completedStages':result['completedStages'],
                      'blockedReasons':result['blockedReasons']}))
    sys.exit(2 if result['blockedReasons'] else 0)
