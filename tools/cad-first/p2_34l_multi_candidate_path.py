#!/usr/bin/env python3
"""P2.34L complete-candidate sampled CV cage path; never G2 certification."""
from __future__ import annotations
import argparse,hashlib,json,math
from pathlib import Path
from p2_34k_common_cage_trajectory_gate import SOURCE_SHA,J_SCHEMA,finite,phase_delta,transformed_translation
SCHEMA='peds.cad-first.p234l-complete-candidate-path.v1'

def parse(data):
    if not isinstance(data,dict) or data.get('schema')!=J_SCHEMA or data.get('sourceSTEPsha256')!=SOURCE_SHA:
        raise ValueError('P2.34J schema or original source SHA mismatch')
    if type(data.get('partCount')) is not int or data['partCount']!=84 or data.get('originalCADModified') is not False or data.get('mechanicalG2Certified') is not False:
        raise ValueError('84-native provenance or mechanical HOLD invalid')
    p=data.get('pose')
    if not isinstance(p,dict):raise ValueError('Missing native pose')
    bend,shaft,cup=(finite(p.get(k),k) for k in ('bendDeg','shaftSpinDeg','cupSpinDeg'))
    if abs(bend)>15 or abs(shaft)>360 or abs(cup)>360:raise ValueError('Pose outside domain')
    cs=data.get('screenPassingCandidates')
    if not isinstance(cs,list):raise ValueError('Complete native candidate set required; legacy best-only report rejected')
    count=data.get('candidateCountMeetingExploratoryScreen')
    if type(count) is not int or count!=len(cs):raise ValueError('Incomplete candidate list')
    audit=data.get('search')
    if not isinstance(audit,dict) or type(audit.get('candidateSharedTranslations')) is not int or audit['candidateSharedTranslations']<count:
        raise ValueError('Missing grid search accounting')
    converted=[];seen=set()
    for c in cs:
        if not isinstance(c,dict) or not isinstance(c.get('classification'),dict) or c['classification'].get('exploratoryCandidate') is not True:
            raise ValueError('Candidate lacks native screen PASS')
        xyz=c.get('sharedCageLocalTranslationMm')
        if not isinstance(xyz,list) or len(xyz)!=3:raise ValueError('3D cage translation required')
        xyz=tuple(finite(x,'offset') for x in xyz)
        if xyz in seen or any(abs(x)>2 for x in xyz):raise ValueError('Duplicate/out-of-bounds candidate')
        seen.add(xyz)
        converted.append({'local':xyz,'world':transformed_translation({'bendDeg':bend,'offsetLocalMm':xyz})})
    return {'bendDeg':bend,'shaftSpinDeg':shaft,'cupSpinDeg':cup,'candidates':converted}

def solve(reports,max_phase_step_deg=5.,max_translation_step_mm=.25,max_speed_ratio_error=.01):
    if not isinstance(reports,list) or len(reports)<3:raise ValueError('Need 3 or more J native reports')
    phase=finite(max_phase_step_deg,'phase limit')
    shift=finite(max_translation_step_mm,'translation limit')
    ratio=finite(max_speed_ratio_error,'ratio limit')
    if phase<=0 or shift<=0 or not 0<=ratio<1:raise ValueError('Invalid limits')
    layers=[parse(p) for p in reports]
    if any(abs(x['bendDeg']-layers[0]['bendDeg'])>1e-8 for x in layers):raise ValueError('Mixed bends')
    if len(set((x['shaftSpinDeg'],x['cupSpinDeg']) for x in layers))!=len(layers):raise ValueError('Duplicate phases')
    segments=[]
    for a,b in zip(layers,layers[1:]):
        ds=phase_delta(a['shaftSpinDeg'],b['shaftSpinDeg'])
        dc=phase_delta(a['cupSpinDeg'],b['cupSpinDeg'])
        if ds<=0 or dc<=0:raise ValueError('Non-increasing phase magnitudes')
        segments.append({'inputStepDeg':ds,'cupStepDeg':dc,'incrementRatio':dc/ds,
                         'phaseGate':max(ds,dc)<=phase and abs(dc/ds-1)<=ratio})
    # Global dynamic programming, not greedy single-pose selection.
    previous={i:(0.,[i]) for i in range(len(layers[0]['candidates']))}
    reachable=[len(previous)];edges=[]
    for step,t in enumerate(segments,1):
        next_layer={};edge_count=0
        if t['phaseGate']:
            for b,cb in enumerate(layers[step]['candidates']):
                paths=[]
                for a,(cost,indices) in previous.items():
                    travel=math.dist(layers[step-1]['candidates'][a]['world'],cb['world'])
                    if travel<=shift+1e-12:
                        edge_count+=1;paths.append((cost+travel,indices+[b]))
                if paths:next_layer[b]=min(paths,key=lambda x:(round(x[0],12),x[1]))
        previous=next_layer;edges.append(edge_count);reachable.append(len(previous))
    winner=min(previous.values(),key=lambda x:(round(x[0],12),x[1])) if previous else None
    path=[]
    if winner:
        for i,index in enumerate(winner[1]):
            c=layers[i]['candidates'][index]
            path.append({'poseIndex':i,'candidateIndex':index,'offsetLocalMm':list(c['local']),
                         'offsetWorldMm':list(c['world'])})
    return {'schema':SCHEMA,'sourceSTEPsha256':SOURCE_SHA,'source84Modified':False,
            'inputPoseCount':len(layers),'screenedCandidateCounts':[len(x['candidates']) for x in layers],
            'reachableCandidateCounts':reachable,'allowedTransitionEdgeCounts':edges,'phaseTransitions':segments,
            'sampledConnectedPathFound':winner is not None,
            'minimalCumulativeTranslationMm':winner[0] if winner else None,'sampledPath':path,
            'allScreenPassingJCandidatesConsidered':True,'cageOrientationSearched':False,
            'nativeInterSampleBRepVerified':False,'newConjugateRaceGeometryCertified':False,
            'angularVelocityOrLoadedTorqueCertified':False,'mechanicalG2Certified':False,
            'status':'FULL_CANDIDATE_SAMPLED_PATH_REVIEW_ONLY_G2_HOLD'}

def run(inputs,out):
    out=Path(out)
    if out.exists():raise FileExistsError('Refuses evidence overwrite')
    paths=[Path(p) for p in inputs]
    if len({p.resolve() for p in paths})!=len(paths):raise ValueError('Duplicate reports')
    records=[];pins=[]
    for p in paths:
        raw=p.read_bytes();records.append(json.loads(raw))
        pins.append({'file':p.name,'sha256':hashlib.sha256(raw).hexdigest()})
    result=solve(records);result['inputReportSHA256']=pins
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(result,indent=2,allow_nan=False)+'\n',encoding='utf8')
    return result
if __name__=='__main__':
    a=argparse.ArgumentParser()
    a.add_argument('--j-report',nargs='+',required=True,type=Path)
    a.add_argument('--out',required=True,type=Path)
    x=a.parse_args();r=run(x.j_report,x.out)
    print(json.dumps({'status':r['status'],'sampledConnectedPathFound':r['sampledConnectedPathFound']}))
