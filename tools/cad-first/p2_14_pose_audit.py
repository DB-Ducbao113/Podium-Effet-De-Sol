#!/usr/bin/env python3
"""Independent P2.14 B-Rep race/ball/sleeve review at seven ideal source poses.
The 140 pair screen is NOT a continuous 31-solid dynamic suspension study.
"""
from __future__ import annotations
import argparse,hashlib,json
from pathlib import Path
from p2_14_split_spherical_race import pose_articulation_audit

def run(out:Path)->dict:
    if out.exists():raise FileExistsError('Refuse to overwrite previous P2.14 pose evidence')
    out.parent.mkdir(parents=True,exist_ok=True)
    source=Path(__file__).with_name('p2_14_split_spherical_race.py')
    proof=pose_articulation_audit()
    if proof['nativePairChecks']!=140 or proof['jointPoseCount']!=28 or proof['mechanicalG2']!='HOLD':
        raise RuntimeError('P2.14 seven-pose source geometry incomplete')
    proof={**proof,'schema':'podium-eds.p214.seven-pose-bearing-native-audit.v1',
           'p214SourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),
           'complete':True}
    out.write_text(json.dumps(proof,indent=2)+'\n',encoding='utf8')
    return proof

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--out',type=Path,required=True)
    r=run(p.parse_args().out)
    print('P2.14 independently sampled',r['nativePairChecks'],'spherical B-Rep pairs / G2 HOLD')
