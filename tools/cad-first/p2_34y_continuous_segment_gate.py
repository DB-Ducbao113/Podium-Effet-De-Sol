#!/usr/bin/env python3
"""P2.34Y: certified separated straight translations, blocked/unknown otherwise.

Only a finite, source-authenticated, rigid 3D ball-translation subset is examined.
Never certifies the cage captures a ball, or CV operation under load.
"""
from __future__ import annotations
import argparse, hashlib, json, math
from pathlib import Path

SOURCE_SHA='9bd7ec6a60d5c4c9f1f3e421cb730fc252de026aae21dcf570584e5dda0ec63e'
SCHEMA='peds.cad-first.p234y-conservative-segment-clearance.v1'
X_SCHEMA='peds.cad-first.p234x-sampled-ball-configuration-graph.v1'
SHAFT='P217_REAR_DRIVE_HALF_SHAFT_UNSPLINED'
CUP='P217_REAR_CV_HOUSING_PROTOTYPE'
CAGE='P234C_REAR_CV_BALL_GUIDE_CAGE'
BALLS=tuple(f'P234C_REAR_CV_TORQUE_BALL_{i:02d}' for i in range(1,7))

def finite(value,label):
    if type(value) not in (int,float) or not math.isfinite(value):
        raise ValueError(f'{label}: expected finite numeric value')
    return float(value)

def point(value):
    if not isinstance(value,(list,tuple)) or len(value)!=3:
        raise ValueError('Expected 3D point')
    return tuple(finite(x,'point') for x in value)

def distance(a,b):
    from OCP.BRepExtrema import BRepExtrema_DistShapeShape
    if not a.isValid() or not b.isValid():raise ValueError('Invalid native OCC solid')
    witness=BRepExtrema_DistShapeShape(a.wrapped,b.wrapped)
    witness.Perform()
    if not witness.IsDone() or witness.NbSolution()<1:
        raise ValueError('OCC minimum distance not solved')
    gap=finite(witness.Value(),'minimum OCC gap')
    if gap<0:raise ValueError('Negative OCC distance')
    return gap

def edge_clearance(ball,obstacles,begin,end,margin_mm=.0001,max_depth=8,
                   penetration_mm3=1e-8):
    """1-Lipschitz distance bound: d(mid)>L/2+margin => whole segment separated.

    If contact or penetration is encountered, samples may refute clearance;
    max-depth exhaustion is UNKNOWN, never certified clear.
    """
    a,b=point(begin),point(end)
    margin=finite(margin_mm,'margin')
    tol=finite(penetration_mm3,'penetration tolerance')
    if set(obstacles)!={'shaft','cup','cage'} or not 0<margin<=.05 or not 0<=tol<=.001:
        raise ValueError('Obstacles/thresholds invalid')
    if type(max_depth)!=int or not 0<=max_depth<=12:
        raise ValueError('Depth out of budget')
    if math.dist(a,b)<=1e-10:
        raise ValueError('Cannot certify zero-length edge')
    counters={'distanceQueries':0,'booleanQueries':0,'subsegmentsVisited':0}
    def evaluate(left,right,depth):
        counters['subsegmentsVisited']+=1
        center=tuple((x+y)*.5 for x,y in zip(left,right))
        span=math.dist(left,right)
        moved=ball.translate(center)
        unresolved=[]
        for label in ('shaft','cup','cage'):
            gap=distance(moved,obstacles[label])
            counters['distanceQueries']+=1
            if gap>span/2+margin:
                continue
            counters['booleanQueries']+=1
            overlap=finite(float(moved.intersect(obstacles[label]).Volume()),'OCC intersection')
            if overlap<0:raise ValueError('Negative native intersection volume')
            if overlap>tol:
                return 'BLOCKED',{'reason':'midpoint_penetration','obstacle':label,
                                  'samplePointMm':list(center),'overlapMm3':overlap}
            unresolved.append(label)
        if not unresolved:return 'CLEAR',None
        if depth==max_depth:
            return 'UNKNOWN',{'reason':'max_depth_with_possible_contact',
                              'unresolvedObstacles':unresolved,'samplePointMm':list(center)}
        s0,e0=evaluate(left,center,depth+1)
        if s0=='BLOCKED':return s0,e0
        s1,e1=evaluate(center,right,depth+1)
        if s1=='BLOCKED':return s1,e1
        if s0=='CLEAR' and s1=='CLEAR':return 'CLEAR',None
        return 'UNKNOWN',e0 if s0=='UNKNOWN' else e1
    status,witness=evaluate(a,b,0)
    return {'classification':status,'startMm':list(a),'endMm':list(b),
            'witness':witness,**counters,
            'provenSeparatedAlongThisStraightTranslation':status=='CLEAR',
            'fullCageEscapeCertified':False}

def verify_parent(x,x_bytes,m_bytes,step_bytes,samples):
    if not isinstance(x,dict) or x.get('schema')!=X_SCHEMA:
        raise ValueError('P2.34X evidence missing')
    if x.get('original84SourceSHA256')!=SOURCE_SHA:
        raise ValueError('Original source SHA mismatch')
    if x.get('candidateSTEPsha256')!=hashlib.sha256(step_bytes).hexdigest():
        raise ValueError('Candidate STEP mismatch')
    if x.get('p234mReportSHA256')!=hashlib.sha256(m_bytes).hexdigest():
        raise ValueError('P2.34M evidence mismatch')
    if x.get('mechanicalG2Certified') is not False or x.get('fullCagePocketRetentionCertified') is not False:
        raise ValueError('Unsafe previous mechanical certificate')
    if x.get('poseCount')!=len(samples) or len(samples)<9:
        raise ValueError('Pose count mismatch')
    records=x.get('sampledConfigurationSpaceEvidence')
    if not isinstance(records,list) or len(records)!=len(samples):
        raise ValueError('P2.34X per-pose audit missing')
    step=finite(x.get('stepMm'),'grid step')
    count=x.get('stepsPerAxis')
    if not .1<=step<=1 or type(count)!=int or not 1<=count<=2:
        raise ValueError('Unexpected P2.34X grid')
    for (pose,_,_),record in zip(samples,records):
        if record.get('pose')!=pose or record.get('ballCount')!=6:
            raise ValueError('P2.34X pose or ball-count drift')
        balls=record.get('ballEvidence')
        if not isinstance(balls,list) or [r.get('ballSourceID') for r in balls]!=list(BALLS):
            raise ValueError('P2.34X ball identity drift')
    return hashlib.sha256(x_bytes).hexdigest(),step,count

def verified_path_nodes(path,step,limit):
    if not isinstance(path,list) or len(path)<2 or len(path)>(2*limit+1)**3:
        raise ValueError('No candidate boundary path')
    nodes=[]
    for p in path:
        if not isinstance(p,list) or len(p)!=3 or any(type(v)!=int or abs(v)>limit for v in p):
            raise ValueError('Invalid grid point')
        nodes.append(tuple(p))
    if nodes[0]!=(0,0,0) or not any(abs(v)==limit for v in nodes[-1]):
        raise ValueError('Grid path does not reach boundary from origin')
    if len(set(nodes))!=len(nodes) or any(sum(abs(a-b) for a,b in zip(u,v))!=1 for u,v in zip(nodes,nodes[1:])):
        raise ValueError('Path edges not adjacent')
    return [tuple(v*step for v in node) for node in nodes]

def review_pose(parts,sample,source_record,step,limit,depth):
    from p2_34v_nearest_contact_witness import transform
    pose,correction,offset=sample
    moved=transform(parts,pose,correction,offset)
    obstacles={'shaft':moved[SHAFT],'cup':moved[CUP],'cage':moved[CAGE]}
    rows=[]
    for name,evidence in zip(BALLS,source_record['ballEvidence']):
        path=evidence.get('sampledShortestBoundaryPath')
        if path is None:
            rows.append({'ballSourceID':name,'classification':'NO_GRAPH_PATH',
                         'segmentChecks':[],'fullCageEscapeCertified':False})
            continue
        nodes=verified_path_nodes(path,step,limit)
        segments=[edge_clearance(moved[name],obstacles,a,b,max_depth=depth)
                  for a,b in zip(nodes,nodes[1:])]
        status=('BLOCKED' if any(r['classification']=='BLOCKED' for r in segments)
                else 'UNKNOWN' if any(r['classification']=='UNKNOWN' for r in segments)
                else 'CLEAR_SAMPLED_GRID_ROUTE')
        rows.append({'ballSourceID':name,'classification':status,'segmentChecks':segments,
                     'fullCageEscapeCertified':False})
    return {'pose':pose,'ballEvidence':rows,'ballCount':6,
            'certifiedClearTranslationRoutesOnArtificialGrid':sum(r['classification']=='CLEAR_SAMPLED_GRID_ROUTE' for r in rows),
            'realCageContainmentCertified':False}

def run(source_dir,candidate_dir,m_file,x_file,out_file,max_depth=8):
    output=Path(out_file)
    if output.exists():raise FileExistsError('Refuses to overwrite evidence')
    from p2_34n_track_candidate import validated_paths
    from p2_34f_repo_native_contact_guard import source
    from p2_34o_native_postcut_gate import validate_audit,establish_identity,verify_subtractive_geometry
    import cadquery as cq
    folder=Path(candidate_dir)
    step=(folder/'P234N_source84_track_cut_PROTOTYPE.step').read_bytes()
    audit_raw=(folder/'P234N_prototype_native_audit.json').read_bytes()
    m_bytes,x_bytes=Path(m_file).read_bytes(),Path(x_file).read_bytes()
    samples=validated_paths(json.loads(m_bytes))
    report=json.loads(x_bytes)
    parent_sha,grid_step,grid_limit=verify_parent(report,x_bytes,m_bytes,step,samples)
    audit=json.loads(audit_raw);validate_audit(audit,step,m_bytes)
    original=source(Path(source_dir))
    shapes=cq.importers.importStep(str(folder/'P234N_source84_track_cut_PROTOTYPE.step')).solids().vals()
    mapping=establish_identity(original,shapes,audit)
    parts={name:shapes[index] for name,index in mapping.items()}
    for name in (SHAFT,CUP):verify_subtractive_geometry(original[name],parts[name])
    rows=[review_pose(parts,pose,record,grid_step,grid_limit,max_depth)
          for pose,record in zip(samples,report['sampledConfigurationSpaceEvidence'])]
    result={'schema':SCHEMA,'original84SourceSHA256':SOURCE_SHA,
            'candidateSTEPsha256':hashlib.sha256(step).hexdigest(),
            'p234mReportSHA256':hashlib.sha256(m_bytes).hexdigest(),
            'p234xReportSHA256':parent_sha,'poseCount':len(rows),
            'maxSubdivisionDepth':max_depth,'perPoseNativeSegmentEvidence':rows,
            'fullCagePocketRetentionCertified':False,'actualBallEscapeFromPocketCertified':False,
            'fullArticulationDynamicsCertified':False,'loadedTorqueCertified':False,
            'constantVelocityCertified':False,'mechanicalG2Certified':False,
            'status':'P234Y_CERTIFIED_SEPARATED_SUBSEGMENTS_ONLY_G2_HOLD'}
    output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(json.dumps(result,indent=2,allow_nan=False)+'\n',encoding='utf8')
    return result

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    for key in ('p234e-native','p234n-candidate','p234m-report','p234x-report','out'):
        parser.add_argument('--'+key,required=True,type=Path)
    parser.add_argument('--max-depth',type=int,default=8)
    a=parser.parse_args()
    r=run(a.p234e_native,a.p234n_candidate,a.p234m_report,a.p234x_report,a.out,a.max_depth)
    print(json.dumps({'status':r['status'],'poseCount':r['poseCount']}))
