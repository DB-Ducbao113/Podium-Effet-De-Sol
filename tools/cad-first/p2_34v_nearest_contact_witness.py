#!/usr/bin/env python3
"""P2.34V nearest BRep witness audit; cannot certify contact normals or retention."""
from __future__ import annotations
import argparse,hashlib,json,math
from pathlib import Path
SHA='9bd7ec6a60d5c4c9f1f3e421cb730fc252de026aae21dcf570584e5dda0ec63e'
SCHEMA='peds.cad-first.p234v-nearest-contact-witness.v1'
U_SCHEMA='peds.cad-first.p234u-native-exact-radial-ray.v1'
BALLS=tuple(f'P234C_REAR_CV_TORQUE_BALL_{i:02d}' for i in range(1,7))
SHAFT='P217_REAR_DRIVE_HALF_SHAFT_UNSPLINED'
CUP='P217_REAR_CV_HOUSING_PROTOTYPE'
CAGE='P234C_REAR_CV_BALL_GUIDE_CAGE'

def finite(x,label):
    if type(x) not in (int,float) or not math.isfinite(x):raise ValueError(label+': finite numeric required')
    return float(x)

def closest(a,b):
    from OCP.BRepExtrema import BRepExtrema_DistShapeShape
    if not a.isValid() or not b.isValid():raise ValueError('Invalid native BRep')
    test=BRepExtrema_DistShapeShape(a.wrapped,b.wrapped);test.Perform()
    if not test.IsDone() or test.NbSolution()<1:raise ValueError('Native nearest-point algorithm failed')
    gap=finite(test.Value(),'minimum distance')
    if gap<0:raise ValueError('Negative BRep distance')
    records=[]
    for i in range(1,min(test.NbSolution(),16)+1):
        pa,pb=test.PointOnShape1(i),test.PointOnShape2(i)
        x=[finite(v,'native witness') for v in (pa.X(),pa.Y(),pa.Z())]
        y=[finite(v,'native witness') for v in (pb.X(),pb.Y(),pb.Z())]
        d=math.dist(x,y)
        if abs(d-gap)>max(1e-4,gap*1e-5):raise ValueError('Witness inconsistent with OCC minimum')
        unit=[(v-u)/d for u,v in zip(x,y)] if d>1e-8 else None
        records.append({'ballPointMm':x,'otherPointMm':y,'witnessDistanceMm':d,
                        'unitBallToOtherIfSeparated':unit})
    return {'minimumDistanceMm':gap,'sampledNearestSolutionCount':len(records),
            'nearestWitnesses':records,'distanceDirectionIsSurfaceNormalCertified':False,
            'zeroDistanceHasUniqueNormal':False}

def classify(witnesses,overlaps,proximity=.05,overlap_tol=1e-8):
    if set(witnesses)!={'shaft','cup','cage'} or set(overlaps)!=set(witnesses):
        raise ValueError('Three native counterpart witnesses required')
    p=finite(proximity,'proximity threshold');t=finite(overlap_tol,'overlap threshold')
    if p<=0 or t<0:raise ValueError('Invalid thresholds')
    collisions=[];far=[];ambiguities=[]
    for name in ('shaft','cup','cage'):
        gap=finite(witnesses[name]['minimumDistanceMm'],'gap')
        vol=finite(overlaps[name],'native overlap')
        if gap<0 or vol<0:raise ValueError('Negative native geometry measure')
        if vol>t:collisions.append(name)
        if gap>p and name!='cage':far.append(name)
        if gap<=1e-8:ambiguities.append(name)
    return {'counterpartIntersections':collisions,'raceContactsBeyondProximity':far,
            'zeroDistanceNormalAmbiguities':ambiguities,
            'exploratoryNoPenetrationAndRaceProximity':not collisions and not far,
            'cageBallCapturedByClosedPocketCertified':False,
            'loadedContactNormalCertified':False}

def transform(parts,pose,correction,offset):
    from p2_34m_cage_orientation_native import native_rotate,orient,translate_in_cage_frame
    b,s,c=[finite(pose[key],key) for key in ('bendDeg','shaftSpinDeg','cupSpinDeg')]
    if abs(b)>15 or abs(s)>360 or abs(c)>360 or len(correction)!=3 or len(offset)!=3:
        raise ValueError('Pose outside source diagnostic domain')
    tr=translate_in_cage_frame(offset,b,correction)
    return {SHAFT:native_rotate(native_rotate(parts[SHAFT],'z',s),'x',b),
            CUP:native_rotate(parts[CUP],'z',-c),
            CAGE:orient(parts[CAGE],b,correction).translate(tr),
            **{name:orient(parts[name],b,correction).translate(tr) for name in BALLS}}

def inspect_pose(parts,pose,correction,offset):
    moved=transform(parts,pose,correction,offset)
    entries=[]
    for name in BALLS:
        ball=moved[name];w={};vol={}
        for other in (SHAFT,CUP,CAGE):
            key={SHAFT:'shaft',CUP:'cup',CAGE:'cage'}[other]
            w[key]=closest(ball,moved[other])
            volume=finite(float(ball.intersect(moved[other]).Volume()),'overlap volume')
            if volume<0:raise ValueError('Negative BRep overlap')
            vol[key]=volume
        entries.append({'ballSourceID':name,'nearestCounterparts':w,
                        'overlapVolumeMm3':vol,'classification':classify(w,vol)})
    return {'pose':pose,'ballRecords':entries,'ballCount':6,
            'nativeMinimumDistanceQueries':18,'nativeBooleanQueries':18,
            'exploratoryAllBallsPass':all(x['classification']['exploratoryNoPenetrationAndRaceProximity'] for x in entries)}

def validate_parent(report,raw,step_raw):
    if not isinstance(report,dict) or report.get('schema')!=U_SCHEMA or report.get('sourceSTEPsha256')!=SHA:
        raise ValueError('P2.34U original source/schema mismatch')
    if report.get('candidateSTEPsha256')!=hashlib.sha256(step_raw).hexdigest() or report.get('mechanicalG2Certified') is not False:
        raise ValueError('P2.34U native candidate hash or G2 flag invalid')
    if report.get('allSampledNativeRayScreensPass') is not True:
        raise ValueError('Native prior sampled ray screen failed')
    return hashlib.sha256(raw).hexdigest()

def run(source_dir,candidate_dir,m_report,u_report,out_file):
    out=Path(out_file)
    if out.exists():raise FileExistsError('Refusing existing audit overwrite')
    from p2_34n_track_candidate import validated_paths
    from p2_34f_repo_native_contact_guard import source
    from p2_34o_native_postcut_gate import validate_audit,establish_identity,verify_subtractive_geometry
    import cadquery as cq
    candidate_dir=Path(candidate_dir)
    step_raw=(candidate_dir/'P234N_source84_track_cut_PROTOTYPE.step').read_bytes()
    audit_raw=(candidate_dir/'P234N_prototype_native_audit.json').read_bytes()
    m_raw=Path(m_report).read_bytes();u_raw=Path(u_report).read_bytes()
    u_hash=validate_parent(json.loads(u_raw),u_raw,step_raw)
    audit=json.loads(audit_raw);validate_audit(audit,step_raw,m_raw)
    samples=validated_paths(json.loads(m_raw))
    originals=source(Path(source_dir))
    solids=cq.importers.importStep(str(candidate_dir/'P234N_source84_track_cut_PROTOTYPE.step')).solids().vals()
    mapping=establish_identity(originals,solids,audit)
    parts={name:solids[i] for name,i in mapping.items()}
    for n in (SHAFT,CUP):verify_subtractive_geometry(originals[n],parts[n])
    results=[inspect_pose(parts,pose,corr,off) for pose,corr,off in samples]
    data={'schema':SCHEMA,'original84SourceSHA256':SHA,
          'candidateSTEPsha256':hashlib.sha256(step_raw).hexdigest(),
          'p234mReportSHA256':hashlib.sha256(m_raw).hexdigest(),
          'p234uReportSHA256':u_hash,
          'poseCount':len(results),'nativeMinimumDistanceQueries':18*len(results),
          'nativeBooleanQueries':18*len(results),'sampledPoseEvidence':results,
          'allSampledProximityScreensPass':all(r['exploratoryAllBallsPass'] for r in results),
          'surfaceContactNormalsCertified':False,'cagePocketRetentionCertified':False,
          'constantVelocityCertified':False,'loadedTorqueCertified':False,
          'mechanicalG2Certified':False,
          'status':'P234V_NEAREST_BREP_WITNESSES_DIAGNOSTIC_ONLY_G2_HOLD'}
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(data,indent=2,allow_nan=False)+'\n',encoding='utf-8')
    return data

if __name__=='__main__':
    p=argparse.ArgumentParser()
    for arg in ('p234e-native','p234n-candidate','p234m-report','p234u-report','out'):
        p.add_argument('--'+arg,required=True,type=Path)
    x=p.parse_args()
    r=run(x.p234e_native,x.p234n_candidate,x.p234m_report,x.p234u_report,x.out)
    print(json.dumps({'status':r['status'],'allSampledProximityScreensPass':r['allSampledProximityScreensPass']}))
