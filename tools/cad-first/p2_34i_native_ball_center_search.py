#!/usr/bin/env python3
"""P2.34I: original 84-native-CAD bounded six-ball center screen; G2 HOLD."""
from __future__ import annotations
import argparse,itertools,json,math
from pathlib import Path
CAGE='P234C_REAR_CV_BALL_GUIDE_CAGE'
BALLS=tuple(f'P234C_REAR_CV_TORQUE_BALL_{i:02d}' for i in range(1,7))
SHAFT='P217_REAR_DRIVE_HALF_SHAFT_UNSPLINED'
CUP='P217_REAR_CV_HOUSING_PROTOTYPE'
PIN='9bd7ec6a60d5c4c9f1f3e421cb730fc252de026aae21dcf570584e5dda0ec63e'
SCHEMA='peds.cad-first.p234i-original84-ball-center-feasibility.v1'

def finite(v,label):
    if isinstance(v,bool) or not isinstance(v,(int,float)) or not math.isfinite(v):
        raise ValueError(label+' must be finite numeric')
    return float(v)

def offsets(step_mm=.2,radius_mm=.4):
    step=finite(step_mm,'step');radius=finite(radius_mm,'radius')
    if step<=0 or radius<0 or step>2 or radius>2:raise ValueError('Invalid search bounds')
    n=math.floor(radius/step+1e-10)
    if n>6:raise ValueError('Native candidate budget exceeded')
    v=[i*step for i in range(-n,n+1)]
    return sorted([tuple(float(x) for x in p) for p in itertools.product(v,repeat=3)
                   if math.dist((0,0,0),p)<=radius+1e-9],
                  key=lambda p:(round(sum(x*x for x in p),12),p))

def convert_offset(p,frame):
    return tuple(sum(p[k]*frame[k][j] for k in range(3)) for j in range(3))

def radial_frame(ball):
    c=ball.Center();r=math.hypot(c.x,c.y)
    if r<1e-8:raise ValueError('Undefined radial frame on CV axis')
    return ((c.x/r,c.y/r,0),(-c.y/r,c.x/r,0),(0,0,1))

def classify(m):
    contact=m['shaftGapMm']<=1e-5 and m['cupGapMm']<=1e-5
    overlap=any(m[k]>.05 for k in ('shaftOverlapMm3','cupOverlapMm3','cageOverlapMm3'))
    cage=m['cageOverlapMm3']>0
    return dict(bothRaceNearContact=contact,significantOverlap=overlap,
                anyCageIntersection=cage,screenCandidate=contact and not overlap and not cage,
                unloadedNativeContactOnly=True)

def rank(m,p):
    return (round(sum(max(0,m[k]-.05) for k in
              ('shaftOverlapMm3','cupOverlapMm3','cageOverlapMm3')),12),
            round(m['cageOverlapMm3'],12),
            round(sum(max(0,m[k]-1e-5) for k in ('shaftGapMm','cupGapMm')),12),
            round(sum(x*x for x in p),12))

def measure(ball,shaft,cup,cage):
    from p2_34g_coupled_phase_gate import exact_minimum
    result={}
    for label,shape in (('shaft',shaft),('cup',cup),('cage',cage)):
        v=finite(float(ball.intersect(shape).Volume()),label+' overlap')
        d=finite(float(exact_minimum(ball,shape)),label+' gap')
        if min(v,d)<0:raise ValueError('Negative native B-Rep evidence')
        result[label+'OverlapMm3']=v
        result[label+'GapMm']=d
    return result

def search_pose(parts,bend_deg,shaft_phase_deg,cup_phase_deg,step_mm=.2,radius_mm=.4):
    from p2_34f_repo_native_contact_guard import rot
    bend=finite(bend_deg,'bend');sp=finite(shaft_phase_deg,'shaft');cp=finite(cup_phase_deg,'cup')
    if abs(bend)>15 or abs(sp)>360 or abs(cp)>360:raise ValueError('Pose outside search domain')
    if len(parts)!=84 or not {SHAFT,CUP,CAGE,*BALLS}<=set(parts):
        raise ValueError('All original 84 native CAD IDs are required')
    samples=offsets(step_mm,radius_mm)
    shaft=rot(rot(parts[SHAFT],'z',sp),'x',bend)
    cup=rot(parts[CUP],'z',-cp)
    cage=rot(parts[CAGE],'x',bend/2)
    rows=[]
    for index,name in enumerate(BALLS,1):
        ball0=rot(parts[name],'x',bend/2)
        frame=radial_frame(ball0)
        best=None;baseline=None;qualified=0
        for offset in samples:
            ball=ball0.translate(convert_offset(offset,frame))
            m=measure(ball,shaft,cup,cage)
            result=classify(m);qualified+=int(result['screenCandidate'])
            evidence={'radialTangentialAxialOffsetMm':list(offset),
                      'measurements':{k:round(v,9) for k,v in m.items()},
                      'classification':result}
            if offset==(0.,0.,0.):baseline=evidence
            key=(not result['screenCandidate'],rank(m,offset))
            if best is None or key<best[0]:best=(key,evidence)
        if baseline is None:raise AssertionError('Missing original zero-offset position')
        rows.append({'ball':index,'sourceName':name,'nativeCandidatesMeasured':len(samples),
                     'candidateCountPassingExploratoryScreen':qualified,
                     'baselineNative':baseline,'bestExploratoryCandidate':best[1]})
    return {'schema':SCHEMA,'originalSourceSHA256':PIN,'originalPartCount':84,
            'bendDeg':bend,'shaftSpinDeg':sp,'cupSpinDeg':cp,
            'gridStepMm':step_mm,'gridRadiusMm':radius_mm,
            'totalCandidatesMeasured':6*len(samples),
            'exactNativeBooleanCount':18*len(samples),
            'exactNativeDistanceCount':18*len(samples),'ballResults':rows,
            'allSixHaveScreenCandidate':all(r['candidateCountPassingExploratoryScreen']>0 for r in rows),
            'jointCageKinematicsSolved':False,'crossBallTrajectoryContinuityProven':False,
            'tracksRedesigned':False,'source84Modified':False,
            'mechanicalG2Certified':False,
            'status':'NATIVE_LOCAL_CENTER_SEARCH_ONLY_CV_G2_HOLD'}

def run(native,out,bend=10,shaft_phase=.6241,cup_phase=1.0254,step=.2,radius=.4):
    from p2_34f_repo_native_contact_guard import source
    native=Path(native);out=Path(out)
    if out.exists():raise FileExistsError('Refuses to overwrite CAD evidence')
    parts=source(native) # Checks SHA pins for STEP, name index and audit.
    report=search_pose(parts,bend,shaft_phase,cup_phase,step,radius)
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(report,indent=2,allow_nan=False)+'\n',encoding='utf-8')
    return report

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--p234e-native',type=Path,required=True)
    p.add_argument('--out',type=Path,required=True)
    p.add_argument('--bend',type=float,default=10)
    p.add_argument('--shaft-phase',type=float,default=.6241)
    p.add_argument('--cup-phase',type=float,default=1.0254)
    p.add_argument('--step-mm',type=float,default=.2)
    p.add_argument('--radius-mm',type=float,default=.4)
    a=p.parse_args()
    r=run(a.p234e_native,a.out,a.bend,a.shaft_phase,a.cup_phase,a.step_mm,a.radius_mm)
    print(json.dumps({'status':r['status'],'allSixHaveScreenCandidate':r['allSixHaveScreenCandidate'],
                      'totalCandidatesMeasured':r['totalCandidatesMeasured']}))
