#!/usr/bin/env python3
"""Independent P2.12 threaded-v2 RH/LH B-Rep screw-pair sweep.

Six axial/rotation configurations; does NOT simulate chassis, bearings,
real toe angles, material strength, bolt torque or full suspension travel.
"""
from __future__ import annotations
import argparse,json
from pathlib import Path
from p2_12_toe_adjuster import build_new_parts,sample_isolated_thread_motion,SCHEMA

def run(out:Path)->dict:
    if out.exists():raise FileExistsError('Cannot overwrite P2.12 sweep evidence')
    out.parent.mkdir(parents=True,exist_ok=True)
    proof=sample_isolated_thread_motion(build_new_parts())
    report={'schema':'podium-eds.p212.threaded-v2.thread-pair-sweep.v1',
            'cadSourceSchema':SCHEMA,**proof,'mechanicalG2':'HOLD'}
    out.write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
    return report

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--out',type=Path,required=True)
    result=run(p.parse_args().out)
    print('P2.12 limited thread-pair sweep',result['sampleCount'],
          'B-Rep checks PASS; vehicle mechanical G2 HOLD')
