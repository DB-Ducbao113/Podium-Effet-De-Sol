#!/usr/bin/env python3
"""P2.34Q — source-authenticated CV centerline curvature diagnostic; G2 HOLD."""
from __future__ import annotations
import argparse,hashlib,json,math
from pathlib import Path
from p2_34n_track_candidate import validated_paths,ball_center,to_race_local,BALLS,SOURCE_SHA
SCHEMA='peds.cad-first.p234q-native-centerline-curvature-v1'

def finite(x,label):
    if isinstance(x,bool) or not isinstance(x,(int,float)) or not math.isfinite(x):
        raise ValueError(label+' must be a finite number')
    return float(x)

def norm(a):return math.sqrt(sum(x*x for x in a))
def sub(a,b):return tuple(x-y for x,y in zip(a,b))
def dot(a,b):return sum(x*y for x,y in zip(a,b))

def triplet_metrics(a,b,c):
    """Three-point discrete curvature. It is NOT a continuous groove radius."""
    u=sub(b,a);v=sub(c,b)
    lu,lv=norm(u),norm(v)
    if min(lu,lv)<=1e-8:raise ValueError('Coincident centerline sample')
    cosine=max(-1.,min(1.,dot(u,v)/(lu*lv)))
    theta=math.degrees(math.acos(cosine))
    chord=sub(c,a);lc=norm(chord)
    if lc<=1e-8:raise ValueError('Centerline doubles back to starting point')
    cross2=max(0.,lu*lu*lv*lv-dot(u,v)**2)
    kappa=2*math.sqrt(cross2)/(lu*lv*lc)
    return {'incomingChordMm':lu,'outgoingChordMm':lv,
            'turnAngleDeg':theta,'discreteCurvatureInvMm':kappa,
            'threePointRadiusMm':(1/kappa if kappa>1e-12 else None)}

def centerlines(parts,report):
    if len(parts)!=84 or not set(BALLS)<=set(parts):raise ValueError('84 authentic native parts required')
    samples=validated_paths(report)
    grouped={}
    for pose,tilt,offset in samples:
        grouped.setdefault(pose['bendDeg'],[]).append((pose,tilt,offset))
    if len(grouped)<3:raise ValueError('At least three bend traces required')
    lines=[]
    for bend,rows in sorted(grouped.items()):
        rows.sort(key=lambda x:x[0]['shaftSpinDeg'])
        if len(rows)<3:raise ValueError('Need at least three source-measured phase samples')
        for name in BALLS:
            p=parts[name].Center()
            initial=(finite(p.x,'x'),finite(p.y,'y'),finite(p.z,'z'))
            for side in ('shaft','cup'):
                points=[to_race_local(ball_center(initial,pose,tilt,offset),pose,side)
                        for pose,tilt,offset in rows]
                metrics=[triplet_metrics(*points[i-1:i+2]) for i in range(1,len(points)-1)]
                chords=[norm(sub(y,x)) for x,y in zip(points,points[1:])]
                if any(not math.isfinite(x) for x in chords):raise ValueError('Invalid native point spacing')
                lines.append({'bendDeg':bend,'ballSourceID':name,'race':side,
                    'sourceLocalBallCenterPointsMm':[list(p) for p in points],
                    'shaftPhaseSamplesDeg':[row[0]['shaftSpinDeg'] for row in rows],
                    'maxChordMm':max(chords),'maxDiscreteTurnDeg':max(x['turnAngleDeg'] for x in metrics),
                    'maxDiscreteCurvatureInvMm':max(x['discreteCurvatureInvMm'] for x in metrics),
                    'threePointWitnesses':metrics})
    return lines

def assess(lines,chord_limit_mm=2.,turn_limit_deg=20.):
    chord=finite(chord_limit_mm,'chord limit');turn=finite(turn_limit_deg,'turn limit')
    if chord<=0 or turn<=0 or turn>180:raise ValueError('Invalid diagnostic thresholds')
    if not lines or len(lines)%12:raise ValueError('Incomplete six-ball/two-race traces')
    flagged=[{'bendDeg':r['bendDeg'],'ball':r['ballSourceID'],'race':r['race'],
              'maxChordMm':r['maxChordMm'],'maxDiscreteTurnDeg':r['maxDiscreteTurnDeg']}
             for r in lines if r['maxChordMm']>chord or r['maxDiscreteTurnDeg']>turn]
    return {'traceCount':len(lines),'diagnosticFlags':flagged,'sampledCenterlineScreenPass':not flagged,
            'chordLimitMm':chord,'turnLimitDeg':turn,
            'continuousC1C2SmoothnessCertified':False,
            'raceWallThicknessMeasured':False,'manufacturabilityCertified':False,
            'loadedContactAndTorqueCertified':False,'mechanicalG2Certified':False}

def run(source_dir,m_report,out_file):
    out=Path(out_file)
    if out.exists():raise FileExistsError('Refuses to overwrite native review')
    raw=Path(m_report).read_bytes();report=json.loads(raw)
    from p2_34f_repo_native_contact_guard import source,PINS
    originals=source(Path(source_dir))
    traces=centerlines(originals,report)
    qa=assess(traces)
    result={'schema':SCHEMA,'source84SHA256':SOURCE_SHA,'originalSHA256Pins':PINS,
            'parentP234MReportSHA256':hashlib.sha256(raw).hexdigest(),
            'originalNativeSourcePartCount':84,'originalGeometryModified':False,
            'sourceLocalRaceCenterlines':traces,**qa,
            'status':'DISCRETE_CENTERLINE_CURVATURE_SCREEN_ONLY_G2_HOLD'}
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(result,indent=2,allow_nan=False)+'\n',encoding='utf8')
    return result

if __name__=='__main__':
    cli=argparse.ArgumentParser()
    cli.add_argument('--p234e-native',required=True,type=Path)
    cli.add_argument('--p234m-report',required=True,type=Path)
    cli.add_argument('--out',required=True,type=Path)
    a=cli.parse_args()
    r=run(a.p234e_native,a.p234m_report,a.out)
    print(json.dumps({'status':r['status'],'traceCount':r['traceCount'],
                      'sampledCenterlineScreenPass':r['sampledCenterlineScreenPass']}))
