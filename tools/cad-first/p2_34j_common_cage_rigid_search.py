#!/usr/bin/env python3
"""P2.34J six-ball common cage rigid translation screening, source84 unchanged."""
from __future__ import annotations
import argparse,json,math
from pathlib import Path
from p2_34i_native_ball_center_search import BALLS,CAGE,CUP,SHAFT,PIN,finite,offsets
SCHEMA='peds.cad-first.p234j-original84-common-cage-translation.v1'

def verify_pose(bend,shaft_phase,cup_phase):
    b=finite(bend,'bend');s=finite(shaft_phase,'shaft phase');c=finite(cup_phase,'cup phase')
    if abs(b)>15 or abs(s)>360 or abs(c)>360:raise ValueError('Outside bounded diagnostic pose domain')
    return b,s,c

def classification(per_ball,ball_ball_overlaps,cage_ball_overlaps,volume_limit=.05,gap_limit=1e-5):
    if len(per_ball)!=6 or len(ball_ball_overlaps)!=15 or len(cage_ball_overlaps)!=6:
        raise ValueError('Require 6 balls, 15 ball pairs and 6 cage contacts')
    vals=[*ball_ball_overlaps,*cage_ball_overlaps]
    for row in per_ball:
        vals.extend(row[k] for k in ('shaftGapMm','cupGapMm','shaftOverlapMm3','cupOverlapMm3'))
    if any(finite(v,'measurement')<0 for v in vals):raise ValueError('Invalid negative geometry measurement')
    gaps=sum(row['shaftGapMm']>gap_limit or row['cupGapMm']>gap_limit for row in per_ball)
    large=sum(row['shaftOverlapMm3']>volume_limit or row['cupOverlapMm3']>volume_limit for row in per_ball)
    collision_pairs=sum(v>volume_limit for v in ball_ball_overlaps)
    cage_collisions=sum(v>volume_limit for v in cage_ball_overlaps)
    any_cage_overlap=any(v>0 for v in cage_ball_overlaps)
    return {'ballsWithMissingRaceProximity':gaps,'ballsWithSignificantRaceOverlap':large,
            'significantBallBallPairs':collision_pairs,'significantCageBallPairs':cage_collisions,
            'anyCageBallIntersection':any_cage_overlap,
            'exploratoryCandidate':gaps==0 and large==0 and collision_pairs==0 and not any_cage_overlap}

def score(label,offset):
    return (not label['exploratoryCandidate'],
            label['significantBallBallPairs']+label['significantCageBallPairs']+label['ballsWithSignificantRaceOverlap'],
            label['ballsWithMissingRaceProximity'],int(label['anyCageBallIntersection']),
            round(sum(x*x for x in offset),12),tuple(offset))

def native_measure(parts,bend,shaft_phase,cup_phase,grid_step=.2,grid_radius=.4):
    from p2_34f_repo_native_contact_guard import rot
    from p2_34g_coupled_phase_gate import exact_minimum
    bend,shaft_phase,cup_phase=verify_pose(bend,shaft_phase,cup_phase)
    if len(parts)!=84 or not {SHAFT,CUP,CAGE,*BALLS}<=set(parts):
        raise ValueError('Exact named original source84 is required')
    original_balls=[rot(parts[name],'x',bend/2) for name in BALLS]
    original_cage=rot(parts[CAGE],'x',bend/2)
    shaft=rot(rot(parts[SHAFT],'z',shaft_phase),'x',bend)
    cup=rot(parts[CUP],'z',-cup_phase)
    results=[]
    for offset in offsets(grid_step,grid_radius):
        a=math.radians(bend/2)
        move=(offset[0],offset[1]*math.cos(a)-offset[2]*math.sin(a),
              offset[1]*math.sin(a)+offset[2]*math.cos(a))
        balls=[shape.translate(move) for shape in original_balls]
        cage=original_cage.translate(move)
        measurements=[]
        for ball in balls:
            measurements.append({
                'shaftGapMm':float(exact_minimum(ball,shaft)),
                'cupGapMm':float(exact_minimum(ball,cup)),
                'shaftOverlapMm3':float(ball.intersect(shaft).Volume()),
                'cupOverlapMm3':float(ball.intersect(cup).Volume())})
        pairs=[float(balls[i].intersect(balls[j]).Volume()) for i in range(6) for j in range(i+1,6)]
        cage_pairs=[float(b.intersect(cage).Volume()) for b in balls]
        label=classification(measurements,pairs,cage_pairs)
        results.append({'sharedCageLocalTranslationMm':list(offset),
                        'classification':label,'ballRaceMeasurements':measurements,
                        'ballBallPairOverlapMm3':pairs,'cageBallOverlapMm3':cage_pairs})
    winner=min(results,key=lambda r:score(r['classification'],r['sharedCageLocalTranslationMm']))
    return {'schema':SCHEMA,'sourceSTEPsha256':PIN,'partCount':84,
            'pose':{'bendDeg':bend,'shaftSpinDeg':shaft_phase,'cupSpinDeg':cup_phase},
            'search':{'gridStepMm':grid_step,'gridRadiusMm':grid_radius,
                      'candidateSharedTranslations':len(results),
                      'nativeBooleanEvaluations':len(results)*33,
                      'nativeDistanceEvaluations':len(results)*12},
            'candidateCountMeetingExploratoryScreen':sum(r['classification']['exploratoryCandidate'] for r in results),
            'bestCandidate':winner,'baselineCandidate':results[0],
            'originalCADModified':False,'cageRotationSolved':False,
            'jointBallTrajectoryAcrossBendAndPhaseSolved':False,
            'constantVelocityOrTorqueCertified':False,'mechanicalG2Certified':False,
            'status':'SAMPLED_COMMON_CAGE_TRANSLATION_DIAGNOSTIC_ONLY_G2_HOLD'}

def run(source_dir,out_file,bend=10,shaft_phase=.6241,cup_phase=1.0254,step=.2,radius=.4):
    from p2_34f_repo_native_contact_guard import source
    out_file=Path(out_file)
    if out_file.exists():raise FileExistsError('P2.34J will not overwrite evidence')
    parts=source(Path(source_dir))
    report=native_measure(parts,bend,shaft_phase,cup_phase,step,radius)
    out_file.parent.mkdir(parents=True,exist_ok=True)
    out_file.write_text(json.dumps(report,indent=2,allow_nan=False)+'\n',encoding='utf-8')
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
    x=p.parse_args()
    r=run(x.p234e_native,x.out,x.bend,x.shaft_phase,x.cup_phase,x.step_mm,x.radius_mm)
    print(json.dumps({'status':r['status'],'candidateCountMeetingExploratoryScreen':r['candidateCountMeetingExploratoryScreen']}))
