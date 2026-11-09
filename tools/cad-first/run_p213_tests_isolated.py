#!/usr/bin/env python3
"""Run P2.13 heavy source CAD tests in isolated OpenCascade processes.

Full 23-body Booleans and a complete 8-solid STEP/three GLB export should
not reuse the same OCCT interpreter caches. Fail closed, never treat timeouts
as PASS; store source-linked per-case JSON evidence without overwriting.
"""
from __future__ import annotations
import argparse,hashlib,json,subprocess,sys,time
from pathlib import Path

HERE=Path(__file__).resolve().parent
CASES=(
 "test_eight_real_independent_brep_solids_replace_four_prior_bearing_proxies",
 "test_genuine_spherical_cavity_and_drilled_ball",
 "test_seven_ideal_solved_joints_28_ball_race_volume_reviews",
 "test_all_23_source_parts_253_nominal_brep_pair_screen",
 "test_eight_body_step_roundtrip_and_source_provenance",
)

def run(out:Path,timeout_per_case:int=100)->dict:
    if out.exists():raise FileExistsError('Refuse to overwrite source QA evidence')
    out.parent.mkdir(parents=True,exist_ok=True)
    sha=hashlib.sha256((HERE/'p2_13_rear_joint_prototype.py').read_bytes()).hexdigest()
    records=[]
    for name in CASES:
        t=time.monotonic()
        name_path='test_p2_13_rear_joint_prototype.P213NativeJointTests.'+name
        worker=('import os,sys,unittest;'
                'suite=unittest.defaultTestLoader.loadTestsFromName('+repr(name_path)+');'
                'result=unittest.TextTestRunner(verbosity=2).run(suite);'
                'sys.stdout.flush();sys.stderr.flush();'
                'os._exit(0 if result.wasSuccessful() else 1)')
        args=[sys.executable,'-c',worker]
        try:
            result=subprocess.run(args,cwd=HERE,capture_output=True,text=True,
                                  timeout=timeout_per_case,check=False)
            row={'case':name,'elapsedSeconds':round(time.monotonic()-t,3),
                 'exitCode':result.returncode,'stderr':result.stderr[-3000:],
                 'passed':result.returncode==0}
        except subprocess.TimeoutExpired as exc:
            row={'case':name,'elapsedSeconds':round(time.monotonic()-t,3),
                 'error':str(exc),'passed':False}
        records.append(row)
        complete=len(records)==len(CASES) and all(x['passed'] for x in records)
        report={'schema':'podium-eds.p213.occt-isolated-cad-qa.v1',
                'cadSourceSha256':sha,'cases':records,
                'tested':len(records),'total':len(CASES),
                'complete':complete,'passed':sum(x['passed'] for x in records),
                'mechanicalG2':'HOLD'}
        out.write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
        print(name,'PASS' if row['passed'] else 'FAIL',flush=True)
        if not row['passed']:
            raise RuntimeError('P2.13 original native source CAD test failed: '+name)
    return report

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--out',type=Path,required=True)
    p.add_argument('--per-case-timeout',type=int,default=100)
    a=p.parse_args()
    report=run(a.out,a.per_case_timeout)
    print('P2.13 ISOLATED NATIVE CAD',report['passed'],'/',report['total'],'PASS')
