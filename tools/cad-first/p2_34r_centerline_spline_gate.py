#!/usr/bin/env python3
"""P2.34R: reviewed Q centerlines -> sampled C1 Hermite diagnostics; G2 HOLD.

This DOES NOT create manufacturable races or measure material thickness.
"""
from __future__ import annotations
import argparse,hashlib,json,math
from pathlib import Path
SCHEMA='peds.cad-first.p234r-c1-centerline-interpolation-review.v1'
Q_SCHEMA='peds.cad-first.p234q-native-centerline-curvature-v1'
SOURCE_SHA='9bd7ec6a60d5c4c9f1f3e421cb730fc252de026aae21dcf570584e5dda0ec63e'
BALLS=tuple(f'P234C_REAR_CV_TORQUE_BALL_{i:02d}' for i in range(1,7))

def finite(value,label):
    if isinstance(value,bool) or not isinstance(value,(int,float)) or not math.isfinite(value):
        raise ValueError(f'{label}: finite number required')
    return float(value)

def vector(value):
    if not isinstance(value,(list,tuple)) or len(value)!=3:raise ValueError('Expected 3D source-local point')
    return tuple(finite(x,'coordinate') for x in value)

def length(value):return math.sqrt(sum(x*x for x in value))
def subtract(a,b):return tuple(x-y for x,y in zip(a,b))

def phase_delta(previous,current):
    a,b=finite(previous,'previous phase'),finite(current,'current phase')
    d=(b-a+180)%360-180
    if abs(abs(d)-180)<1e-8 or d<=1e-9:
        raise ValueError('Source phase sequence must strictly advance without ambiguous wraps')
    return d

def validate_source(document):
    if not isinstance(document,dict) or document.get('schema')!=Q_SCHEMA:
        raise ValueError('Exact P2.34Q source report required')
    if document.get('source84SHA256')!=SOURCE_SHA or document.get('originalNativeSourcePartCount')!=84:
        raise ValueError('Source 84 SHA/count mismatch')
    if document.get('originalGeometryModified') is not False or document.get('mechanicalG2Certified') is not False:
        raise ValueError('Native source or HOLD claim invalid')
    parent=document.get('parentP234MReportSHA256')
    if not isinstance(parent,str) or len(parent)!=64 or any(c not in '0123456789abcdef' for c in parent):
        raise ValueError('Missing original P2.34M report SHA-256')
    lines=document.get('sourceLocalRaceCenterlines')
    if not isinstance(lines,list) or len(lines)<36 or len(lines)%12:
        raise ValueError('Incomplete six-ball/two-race/multi-bend traces')
    by_bend={}
    for line in lines:
        if not isinstance(line,dict):raise ValueError('Malformed native trace')
        bend=finite(line.get('bendDeg'),'bend')
        if abs(bend)>15:raise ValueError('Bend beyond P2.34M domain')
        ball,race=line.get('ballSourceID'),line.get('race')
        if ball not in BALLS or race not in ('shaft','cup'):
            raise ValueError('Unknown original ball/race identity')
        samples=line.get('shaftPhaseSamplesDeg')
        points=line.get('sourceLocalBallCenterPointsMm')
        if not isinstance(samples,list) or not isinstance(points,list) or len(samples)!=len(points) or len(points)<3:
            raise ValueError('Incomplete source-local point sequence')
        phases=tuple(finite(v,'phase') for v in samples)
        if any(phase_delta(a,b)>5 for a,b in zip(phases,phases[1:])):
            raise ValueError('Phase sampling too coarse')
        p=[vector(x) for x in points]
        if any(length(subtract(x,y))<=1e-8 for x,y in zip(p,p[1:])):
            raise ValueError('Coincident race-center samples')
        record=by_bend.setdefault(bend,{})
        if (ball,race) in record:raise ValueError('Duplicate source-local ball/race trace')
        record[(ball,race)]=(phases,p)
    required={(ball,side) for ball in BALLS for side in ('shaft','cup')}
    if len(by_bend)<3 or any(set(traces)!=required for traces in by_bend.values()):
        raise ValueError('Incomplete authentic bend coverage')
    phase_ref=None
    for traces in by_bend.values():
        for phases,_ in traces.values():
            if phase_ref is None:phase_ref=phases
            elif phases!=phase_ref:raise ValueError('Race traces must share one source phase schedule')
    return by_bend

def tangents(points,phases):
    """Chord-time weighted shared Hermite derivatives (mm/degree)."""
    steps=[phase_delta(a,b) for a,b in zip(phases,phases[1:])]
    secants=[tuple((b-a)/h for a,b in zip(points[i],points[i+1])) for i,h in enumerate(steps)]
    result=[secants[0]]
    for i in range(1,len(points)-1):
        before,after=steps[i-1],steps[i]
        result.append(tuple((secants[i-1][k]*after+secants[i][k]*before)/(before+after) for k in range(3)))
    result.append(secants[-1])
    return result,steps

def hermite(p0,p1,m0,m1,h,t):
    t2,t3=t*t,t*t*t
    a,b,c,d=2*t3-3*t2+1,t3-2*t2+t,-2*t3+3*t2,t3-t2
    v=tuple(a*p0[k]+b*h*m0[k]+c*p1[k]+d*h*m1[k] for k in range(3))
    da,db,dc,dd=6*t2-6*t,3*t2-4*t+1,-6*t2+6*t,3*t2-2*t
    d1=tuple(da*p0[k]+db*h*m0[k]+dc*p1[k]+dd*h*m1[k] for k in range(3))
    dda,ddb,ddc,ddd=12*t-6,6*t-4,-12*t+6,6*t-2
    d2=tuple(dda*p0[k]+ddb*h*m0[k]+ddc*p1[k]+ddd*h*m1[k] for k in range(3))
    return v,d1,d2

def curvature(d1,d2):
    speed=length(d1)
    if speed<=1e-10:raise ValueError('Curve derivative degenerates: unsafe cusp')
    cross=(d1[1]*d2[2]-d1[2]*d2[1],d1[2]*d2[0]-d1[0]*d2[2],d1[0]*d2[1]-d1[1]*d2[0])
    return length(cross)/speed**3

def analyze_trace(phases,points,samples_per_segment=16):
    if type(samples_per_segment) is not int or not 4<=samples_per_segment<=256:
        raise ValueError('Sampling resolution outside review limits')
    slopes,steps=tangents(points,phases)
    witnesses=[]
    for i,h in enumerate(steps):
        p0,p1=points[i],points[i+1]
        maximum_kappa=maximum_deviation=0.
        for j in range(samples_per_segment+1):
            t=j/samples_per_segment
            position,d1,d2=hermite(p0,p1,slopes[i],slopes[i+1],h,t)
            maximum_kappa=max(maximum_kappa,curvature(d1,d2))
            chord_position=tuple(a+(b-a)*t for a,b in zip(p0,p1))
            maximum_deviation=max(maximum_deviation,length(subtract(position,chord_position)))
        witnesses.append({'segmentIndex':i,'phaseStepDeg':h,'chordMm':length(subtract(p1,p0)),
            'maxSampledCurvatureInvMm':maximum_kappa,
            'maxSampledDeviationFromChordMm':maximum_deviation})
    return {'segments':witnesses,
        'maximumSampledCurvatureInvMm':max(x['maxSampledCurvatureInvMm'] for x in witnesses),
        'maximumSampledChordDeviationMm':max(x['maxSampledDeviationFromChordMm'] for x in witnesses),
        'sharesOneTangentAtEveryInteriorKnot':True,'analyticallyC1ForThisPiecewiseCurve':True,
        'continuousC2OrRaceSurfaceSmoothnessProven':False}

def analyze(report,samples_per_segment=16,maximum_review_curvature=1.,maximum_review_deviation=.25):
    kmax=finite(maximum_review_curvature,'curvature review threshold')
    dmax=finite(maximum_review_deviation,'chord deviation review threshold')
    if kmax<=0 or dmax<=0:raise ValueError('Invalid exploratory thresholds')
    traces=validate_source(report);rows=[]
    for bend,items in sorted(traces.items()):
        for (ball,race),(phases,points) in sorted(items.items()):
            result=analyze_trace(phases,points,samples_per_segment)
            rows.append({'bendDeg':bend,'ballSourceID':ball,'race':race,**result,
                'exploratorySamplingFlag':result['maximumSampledCurvatureInvMm']>kmax or
                    result['maximumSampledChordDeviationMm']>dmax})
    return {'schema':SCHEMA,'source84SHA256':SOURCE_SHA,
        'parentP234MReportSHA256':report['parentP234MReportSHA256'],
        'sourceTraceCount':len(rows),'samplesPerSegment':samples_per_segment,
        'reviewCurvatureInvMmThreshold':kmax,'reviewDeviationMmThreshold':dmax,
        'diagnosticFlagCount':sum(r['exploratorySamplingFlag'] for r in rows),
        'sourceLocalSplineTraces':rows,'C1InterpolationConstructed':True,
        'C2ContinuousRaceSurfaceCertified':False,'postCutWallThicknessMeasured':False,
        'manufacturingToolAccessibilityCertified':False,'postCutNativeBRepCollisionValidated':False,
        'constantVelocityCertified':False,'loadedTorqueCertified':False,
        'mechanicalG2Certified':False,
        'status':'SAMPLED_SOURCE_CENTERLINE_C1_INTERPOLATION_ONLY_G2_HOLD'}

def run(report_file,output_file):
    output=Path(output_file)
    if output.exists():raise FileExistsError('Refuses original/native diagnostic overwrite')
    raw=Path(report_file).read_bytes()
    data=analyze(json.loads(raw))
    data['inputP234QReportSHA256']=hashlib.sha256(raw).hexdigest()
    output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(json.dumps(data,indent=2,allow_nan=False)+'\n',encoding='utf-8')
    return data

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--p234q-report',type=Path,required=True)
    p.add_argument('--out',type=Path,required=True)
    a=p.parse_args()
    result=run(a.p234q_report,a.out)
    print(json.dumps({'status':result['status'],'diagnosticFlagCount':result['diagnosticFlagCount']}))
