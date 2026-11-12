#!/usr/bin/env python3
"""P2.34AB — strict pre-N handoff: verify authored M evidence, not PASS flags.

No geometry reconstruction, native execution, or mechanical certification.
"""
from __future__ import annotations
import argparse, hashlib, json
from pathlib import Path

SCHEMA='peds.cad-first.p234ab-m-to-n-handoff.v1'

def inspect(m_document,pose_grid_document):
    from p2_34m_cage_orientation_native import pose_grid
    from p2_34n_track_candidate import validated_paths
    if not isinstance(m_document,dict):
        raise ValueError('Native M report must be object')
    expected=pose_grid(pose_grid_document)
    if m_document.get('poseCount')!=len(expected):
        raise ValueError('Native measured pose count does not match prescribed grid')
    rows=m_document.get('perPose')
    if not isinstance(rows,list) or len(rows)!=len(expected):
        raise ValueError('Native M pose rows are incomplete')
    for index,(actual,reference) in enumerate(zip(rows,expected)):
        if not isinstance(actual,dict) or not isinstance(actual.get('pose'),dict):
            raise ValueError('Missing measured native pose')
        measured=tuple(actual['pose'].get(k) for k in ('bendDeg','shaftSpinDeg','cupSpinDeg'))
        if measured!=reference:
            raise ValueError('Native measured poses differ from original manifest at '+str(index))
        candidates=actual.get('qualifyingCandidates')
        if not isinstance(candidates,list) or actual.get('qualificationCount')!=len(candidates):
            raise ValueError('Native candidate accounting incomplete')
        if not isinstance(actual.get('testedCandidates'),int) or actual['testedCandidates']<len(candidates):
            raise ValueError('Native trial accounting incomplete')
    # Reuse the exact downstream P2.34N validator. It rejects unproven selected
    # candidates, invalid pose refs, incomplete tracks and missing cross-bend data.
    selected=validated_paths(m_document)
    if len(selected)!=len(expected):
        raise ValueError('Native selected path does not cover all prescribed poses')
    selected_positions=[tuple(p[k] for k in ('bendDeg','shaftSpinDeg','cupSpinDeg'))
                        for p,_,_ in selected]
    if selected_positions!=expected:
        raise ValueError('Native selected path ordering differs from manifest')
    return {'schema':SCHEMA,'checkedPoseCount':len(expected),
            'checkedSelectedCandidateCount':len(selected),
            'downstreamNValidatedPaths':True,
            'nativeGeometryMeasuredHere':False,
            'mechanicalG2Certified':False,
            'status':'M_TO_N_SOURCE_EVIDENCE_HANDOFF_ONLY_G2_HOLD'}

def inspect_files(m_path,grid_path):
    m_raw=Path(m_path).read_bytes()
    grid_raw=Path(grid_path).read_bytes()
    result=inspect(json.loads(m_raw),json.loads(grid_raw))
    result['p234mReportSHA256']=hashlib.sha256(m_raw).hexdigest()
    result['poseGridSHA256']=hashlib.sha256(grid_raw).hexdigest()
    return result

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--p234m-report',required=True,type=Path)
    p.add_argument('--pose-grid',required=True,type=Path)
    a=p.parse_args()
    print(json.dumps(inspect_files(a.p234m_report,a.pose_grid),indent=2))
