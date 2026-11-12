#!/usr/bin/env python3
"""P2.34W: native face-normal witness diagnostics and directional cage probe; G2 HOLD."""
from __future__ import annotations
import argparse
import hashlib
import json
import math
from pathlib import Path

SOURCE_SHA='9bd7ec6a60d5c4c9f1f3e421cb730fc252de026aae21dcf570584e5dda0ec63e'
V_SCHEMA='peds.cad-first.p234v-nearest-contact-witness.v1'
SCHEMA='peds.cad-first.p234w-face-normal-directional-cage-review.v1'
BALLS=tuple(f'P234C_REAR_CV_TORQUE_BALL_{i:02d}' for i in range(1,7))
SHAFT='P217_REAR_DRIVE_HALF_SHAFT_UNSPLINED'
CUP='P217_REAR_CV_HOUSING_PROTOTYPE'
CAGE='P234C_REAR_CV_BALL_GUIDE_CAGE'

def finite(value,name):
    if type(value) not in (int,float) or not math.isfinite(value):
        raise ValueError(name+': expected finite real number')
    return float(value)

def nearest_face_normals(ball,other,epsilon_mm=1e-6,max_solutions=32):
    """Use OCC face support; no face-normal inference at zero gap or on edges."""
    import cadquery as cq
    from OCP.BRepExtrema import BRepExtrema_DistShapeShape,BRepExtrema_SupportType
    e=finite(epsilon_mm,'epsilon')
    if not 0<e<=1e-3 or type(max_solutions)!=int or not 1<=max_solutions<=64:
        raise ValueError('Invalid witness tolerances')
    if not ball.isValid() or not other.isValid():raise ValueError('Invalid B-Rep shape')
    d=BRepExtrema_DistShapeShape(ball.wrapped,other.wrapped)
    d.Perform()
    if not d.IsDone() or d.NbSolution()<1:raise ValueError('OCC nearest-point failure')
    gap=finite(d.Value(),'native gap')
    if gap<0:raise ValueError('Negative OCC distance')
    entries=[];reason=None
    for i in range(1,min(max_solutions,d.NbSolution())+1):
        p,q=d.PointOnShape1(i),d.PointOnShape2(i)
        start=[finite(z,'ball witness') for z in (p.X(),p.Y(),p.Z())]
        end=[finite(z,'race witness') for z in (q.X(),q.Y(),q.Z())]
        measured=math.dist(start,end)
        if abs(measured-gap)>max(1e-4,gap*1e-5):
            raise ValueError('OCC nearest-point witness inconsistent with gap')
        on_face=d.SupportTypeShape2(i)==BRepExtrema_SupportType.BRepExtrema_IsInFace
        entry={'ballPointMm':start,'otherPointMm':end,
               'supportTypeOther':str(d.SupportTypeShape2(i)),
               'gapMm':measured,'outwardOtherFaceNormal':None,
               'normalFacesBallCosine':None,'geometricallyWellDefined':False}
        if measured<=e:
            reason='touching_or_overlapping_no_unique_gap_direction'
        elif not on_face:
            reason='nearest_point_on_other_edge_or_vertex'
        else:
            face=cq.Face(d.SupportOnShape2(i))
            normal=face.normalAt(cq.Vector(*end))
            vec=[finite(z,'OCC face normal') for z in normal.toTuple()]
            magnitude=math.sqrt(sum(x*x for x in vec))
            if magnitude<=1e-10:raise ValueError('Degenerate OCC face normal')
            vec=[x/magnitude for x in vec]
            # Outward normal from other face should point from other to the ball.
            toward=[(x-y)/measured for x,y in zip(start,end)]
            cosine=sum(x*y for x,y in zip(vec,toward))
            entry.update(outwardOtherFaceNormal=vec,normalFacesBallCosine=cosine,
                         geometricallyWellDefined=True)
        entries.append(entry)
    valid=[r for r in entries if r['geometricallyWellDefined']]
    if valid:
        consistent=all(x['normalFacesBallCosine']>=.95 for x in valid)
        if len(valid)>1:
            for x in valid[1:]:
                if sum(a*b for a,b in zip(valid[0]['outwardOtherFaceNormal'],
                                           x['outwardOtherFaceNormal']))<.95:
                    consistent=False
        return {'minimumGapMm':gap,'solutionCountReported':len(entries),
                'availableFaceNormalWitnesses':len(valid),
                'faceNormalOrientationScreenPass':consistent,
                'witnesses':entries,'unsupportedReason':None if consistent else 'inconsistent_face_normals'}
    return {'minimumGapMm':gap,'solutionCountReported':len(entries),
            'availableFaceNormalWitnesses':0,
            'faceNormalOrientationScreenPass':False,
            'witnesses':entries,'unsupportedReason':reason or 'no_face_supported_witness'}

def cage_directional_probe(ball,cage,distances_mm=(.5,1.,2.)):
    """Six one-sided displacement checks; NOT cage pocket retention proof."""
    distances=tuple(finite(v,'probe distance') for v in distances_mm)
    if not distances or any(not .05<=v<=3 for v in distances):
        raise ValueError('Invalid directional probe distances')
    axes=((1,0,0),(-1,0,0),(0,1,0),(0,-1,0),(0,0,1),(0,0,-1))
    results=[]
    for axis in axes:
        measurements=[]
        for distance in distances:
            moved=ball.translate(tuple(a*distance for a in axis))
            overlap=finite(float(moved.intersect(cage).Volume()),'ball-cage volume')
            if overlap<0:raise ValueError('Negative Boolean result')
            measurements.append({'displacementMm':distance,'overlapMm3':overlap})
        results.append({'directionXYZ':list(axis),'overlapByOffset':measurements,
                        'allTestedOffsetsClear':all(x['overlapMm3']<=1e-8 for x in measurements)})
    return {'directions':results,
            'unobstructedDirectionCount':sum(x['allTestedOffsetsClear'] for x in results),
            'samplingOnly':True,'continuousEscapePathTested':False,
            'pocketContainmentCertified':False}

def inspect_pose(parts,pose,correction,offset):
    from p2_34v_nearest_contact_witness import transform
    moved=transform(parts,pose,correction,offset)
    records=[]
    for name in BALLS:
        ball=moved[name]
        races={}
        for side,other in (('shaft',SHAFT),('cup',CUP)):
            races[side]=nearest_face_normals(ball,moved[other])
        cage=cage_directional_probe(ball,moved[CAGE])
        records.append({'ballSourceID':name,'raceFaceNormalWitnesses':races,
                        'cageDirectionalDisplacementProbe':cage,
                        'sampledFaceOrientationScreenPass':
                          all(x['faceNormalOrientationScreenPass'] for x in races.values())})
    return {'pose':pose,'ballRecords':records,'ballCount':6,
            'allSampledFaceOrientationScreensPass':
            all(r['sampledFaceOrientationScreenPass'] for r in records)}

def verify_parent(report,v_raw,step_raw,m_raw):
    if not isinstance(report,dict) or report.get('schema')!=V_SCHEMA or report.get('original84SourceSHA256')!=SOURCE_SHA:
        raise ValueError('P2.34V source provenance mismatch')
    if report.get('candidateSTEPsha256')!=hashlib.sha256(step_raw).hexdigest():
        raise ValueError('P2.34V candidate STEP mismatch')
    if report.get('p234mReportSHA256')!=hashlib.sha256(m_raw).hexdigest():
        raise ValueError('P2.34V parent P2.34M mismatch')
    if report.get('mechanicalG2Certified') is not False or report.get('surfaceContactNormalsCertified') is not False:
        raise ValueError('Prior unsupported mechanical certification')
    if report.get('allSampledProximityScreensPass') is not True or report.get('poseCount',0)<9:
        raise ValueError('P2.34V native proximity gate incomplete')
    return hashlib.sha256(v_raw).hexdigest()

def run(original_dir,candidate_dir,m_report,v_report,out_path):
    output=Path(out_path)
    if output.exists():raise FileExistsError('No original evidence overwrite')
    from p2_34f_repo_native_contact_guard import source
    from p2_34n_track_candidate import validated_paths
    from p2_34o_native_postcut_gate import validate_audit,establish_identity,verify_subtractive_geometry
    import cadquery as cq
    directory=Path(candidate_dir)
    step=(directory/'P234N_source84_track_cut_PROTOTYPE.step').read_bytes()
    audit_raw=(directory/'P234N_prototype_native_audit.json').read_bytes()
    m_raw,v_raw=Path(m_report).read_bytes(),Path(v_report).read_bytes()
    parent_sha=verify_parent(json.loads(v_raw),v_raw,step,m_raw)
    audit=json.loads(audit_raw)
    validate_audit(audit,step,m_raw)
    samples=validated_paths(json.loads(m_raw))
    original=source(Path(original_dir))
    imported=cq.importers.importStep(str(directory/'P234N_source84_track_cut_PROTOTYPE.step')).solids().vals()
    ids=establish_identity(original,imported,audit)
    parts={name:imported[i] for name,i in ids.items()}
    for name in (SHAFT,CUP):
        verify_subtractive_geometry(original[name],parts[name])
    rows=[inspect_pose(parts,pose,correction,offset) for pose,correction,offset in samples]
    result={'schema':SCHEMA,'original84SourceSHA256':SOURCE_SHA,
            'candidateSTEPsha256':hashlib.sha256(step).hexdigest(),
            'candidateAuditSHA256':hashlib.sha256(audit_raw).hexdigest(),
            'p234mReportSHA256':hashlib.sha256(m_raw).hexdigest(),
            'p234vReportSHA256':parent_sha,
            'poseCount':len(rows),'ballCountPerPose':6,'sampledPoseEvidence':rows,
            'allSampledFaceNormalOrientationScreensPass':
                 all(x['allSampledFaceOrientationScreensPass'] for x in rows),
            'fullCagePocketContainmentCertified':False,
            'contactForceReactionsCertified':False,'realLoadedNormalsCertified':False,
            'constantVelocityCertified':False,'torqueTransferCertified':False,
            'mechanicalG2Certified':False,'sourceModified':False,
            'status':'P234W_FACE_NORMAL_AND_CAGE_DIRECTIONAL_SCREEN_ONLY_G2_HOLD'}
    output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(json.dumps(result,indent=2,allow_nan=False)+'\n',encoding='utf-8')
    return result

if __name__=='__main__':
    p=argparse.ArgumentParser()
    for k in ('p234e-native','p234n-candidate','p234m-report','p234v-report','out'):
        p.add_argument('--'+k,required=True,type=Path)
    a=p.parse_args()
    result=run(a.p234e_native,a.p234n_candidate,a.p234m_report,a.p234v_report,a.out)
    print(json.dumps({'status':result['status'],
                      'allSampledFaceNormalOrientationScreensPass':
                       result['allSampledFaceNormalOrientationScreensPass']}))
