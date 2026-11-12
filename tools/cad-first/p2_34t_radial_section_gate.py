#!/usr/bin/env python3
"""P2.34T: sampled radial B-Rep material spans, not certified minimum wall thickness."""
from __future__ import annotations
import argparse,hashlib,json,math
from pathlib import Path
SCHEMA='peds.cad-first.p234t-native-radial-section-review.v1'
SOURCE_SHA='9bd7ec6a60d5c4c9f1f3e421cb730fc252de026aae21dcf570584e5dda0ec63e'
S_SCHEMA='peds.cad-first.p234s-native-protected-material-review.v1'
SHAFT='P217_REAR_DRIVE_HALF_SHAFT_UNSPLINED'
CUP='P217_REAR_CV_HOUSING_PROTOTYPE'
STEP_NAME='P234N_source84_track_cut_PROTOTYPE.step'
AUDIT_NAME='P234N_prototype_native_audit.json'
def finite(x,label):
    if isinstance(x,bool) or not isinstance(x,(int,float)) or not math.isfinite(x):
        raise ValueError(label+': finite number required')
    return float(x)
def sha256(raw):return hashlib.sha256(raw).hexdigest()
def occupied(shape,r,a,z):
    import cadquery as cq
    return bool(shape.isInside(cq.Vector(r*math.cos(a),r*math.sin(a),z),1e-7))
def radial_spans(shape,angle_deg,z_mm,r_min,r_max,step_mm=.1):
    """Ray point-classification with transition bisection. Thin gaps may be missed."""
    angle=math.radians(finite(angle_deg,'angle'))
    z=finite(z_mm,'z');lo=finite(r_min,'min radius');hi=finite(r_max,'max radius')
    step=finite(step_mm,'step')
    if not 0<=lo<hi<=100 or not .01<=step<=.5:raise ValueError('Invalid radial probe')
    if not shape.isValid() or len(shape.Solids())!=1:raise ValueError('One valid B-Rep solid required')
    n=math.ceil((hi-lo)/step)
    if n>10000:raise ValueError('Probe budget exceeded')
    radii=[lo+(hi-lo)*i/n for i in range(n+1)]
    states=[occupied(shape,r,angle,z) for r in radii]
    def boundary(a,b,state):
        for _ in range(25):
            mid=(a+b)/2
            if occupied(shape,mid,angle,z)==state:a=mid
            else:b=mid
        return (a+b)/2
    segments=[];start=lo if states[0] else None
    for i in range(1,len(states)):
        if states[i]==states[i-1]:continue
        point=boundary(radii[i-1],radii[i],states[i-1])
        if states[i]:start=point
        else:
            if start is None:raise AssertionError('Unpaired radial interval')
            segments.append((start,point));start=None
    if start is not None:segments.append((start,hi))
    return [{'radialStartMm':a,'radialEndMm':b,'sampledSpanMm':b-a} for a,b in segments]
def inspect_race(original,candidate,side,angles=(0,60,120,180,240,300),
                 planes=(-242.,-239.5,-237.),step=.1,min_span_mm=1.):
    if side not in ('shaft','cup'):raise ValueError('Unknown CV race')
    minimum=finite(min_span_mm,'span screen')
    if not .1<=minimum<=10:raise ValueError('Invalid exploratory span')
    lo,hi=(20.,30.) if side=='shaft' else (34.5,41.)
    if len(angles)<4 or len(set(angles))!=len(angles) or len(planes)<2 or len(set(planes))!=len(planes):
        raise ValueError('Missing independent rays')
    checks=[]
    for z in planes:
        if not -245<finite(z,'plane')<-234:raise ValueError('Plane outside source axial datum')
        for deg in angles:
            deg=finite(deg,'angle')
            if not 0<=deg<360:raise ValueError('Angle outside sector')
            before=radial_spans(original,deg,z,lo,hi,step)
            after=radial_spans(candidate,deg,z,lo,hi,step)
            observed=min((v['sampledSpanMm'] for v in after),default=0.)
            checks.append({'angleDeg':deg,'zMm':z,'originalSampledRadialMaterialIntervals':before,
                'candidateSampledRadialMaterialIntervals':after,
                'candidateSmallestApparentSpanMm':observed,
                'disjointCandidateMaterialIntervals':len(after),
                'exploratorySectionPass':bool(before) and len(after)==1 and observed>=minimum})
    return {'side':side,'sampledRayCount':len(checks),
        'allRaysPassExploratoryScreen':all(v['exploratorySectionPass'] for v in checks),
        'minimumObservedApparentSpanMm':min(v['candidateSmallestApparentSpanMm'] for v in checks),
        'sampledCrossSections':checks,'radialSampleSpacingMm':step,
        'method':'BRep point classification and radial transition bisection',
        'exactMinimumWallThicknessCertified':False}
def validate_lineage(s,m_bytes,candidate_bytes,audit_bytes,s_bytes):
    if not isinstance(s,dict) or s.get('schema')!=S_SCHEMA:raise ValueError('Native P2.34S missing')
    if s.get('original84SourceSHA256')!=SOURCE_SHA or s.get('sourceSolidCount')!=84:
        raise ValueError('Original 84 solid mismatch')
    if s.get('parentP234MReportSHA256')!=sha256(m_bytes):raise ValueError('P2.34M report mismatch')
    if s.get('candidateSTEPsha256')!=sha256(candidate_bytes) or s.get('candidateAuditSHA256')!=sha256(audit_bytes):
        raise ValueError('Candidate STEP/audit mismatch')
    if s.get('mechanicalG2Certified') is not False or s.get('originalGeometryModified') is not False:
        raise ValueError('Unsafe mechanical claim')
    if s.get('protectedEnvelopeScreenPass') is not True or s.get('upstreamSampledScreensPass') is not True:
        raise ValueError('Upstream native reviews have not passed')
    mapping=s.get('sourceIdentityMappingRetained')
    if not isinstance(mapping,dict) or len(mapping)!=84 or len(set(mapping.values()))!=84:
        raise ValueError('Missing original identity mapping')
    return {'p234sReportSHA256':sha256(s_bytes),'identity':mapping}
def run(original_dir,candidate_dir,m_report,s_report,out_file,step=.1):
    out=Path(out_file)
    if out.exists():raise FileExistsError('No evidence overwrite')
    candidate_dir=Path(candidate_dir)
    m_bytes=Path(m_report).read_bytes();s_bytes=Path(s_report).read_bytes()
    step_bytes=(candidate_dir/STEP_NAME).read_bytes()
    audit_bytes=(candidate_dir/AUDIT_NAME).read_bytes()
    provenance=validate_lineage(json.loads(s_bytes),m_bytes,step_bytes,audit_bytes,s_bytes)
    from p2_34o_native_postcut_gate import validate_audit,establish_identity,verify_subtractive_geometry
    from p2_34f_repo_native_contact_guard import source
    import cadquery as cq
    audit=json.loads(audit_bytes);validate_audit(audit,step_bytes,m_bytes)
    original=source(Path(original_dir))
    imported=cq.importers.importStep(str(candidate_dir/STEP_NAME)).solids().vals()
    mapping=establish_identity(original,imported,audit)
    if mapping!=provenance['identity']:raise ValueError('Source identity mapping changed')
    candidate={n:imported[i] for n,i in mapping.items()}
    for name in (SHAFT,CUP):verify_subtractive_geometry(original[name],candidate[name])
    measurements={side:inspect_race(original[n],candidate[n],side,step=step)
                  for side,n in (('shaft',SHAFT),('cup',CUP))}
    result={'schema':SCHEMA,'source84SHA256':SOURCE_SHA,
        'p234mReportSHA256':sha256(m_bytes),'p234sReportSHA256':sha256(s_bytes),
        'candidateSTEPsha256':sha256(step_bytes),'candidateAuditSHA256':sha256(audit_bytes),
        'sampledRadialSectionEvidence':measurements,
        'allLocalSectionScreensPass':all(x['allRaysPassExploratoryScreen'] for x in measurements.values()),
        'radialSectionGlobalMinimumThicknessCertified':False,'continuousC2GrooveCertified':False,
        'ballCageRetentionCertified':False,'loadedStressCertified':False,
        'constantVelocityCertified':False,'torqueTransmissionCertified':False,
        'mechanicalG2Certified':False,'originalSourceModified':False,
        'status':'P234T_SAMPLED_RADIAL_BREP_SECTION_REVIEW_ONLY_G2_HOLD'}
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(result,indent=2,allow_nan=False)+'\n',encoding='utf8')
    return result
if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--p234e-native',required=True,type=Path)
    p.add_argument('--p234n-candidate',required=True,type=Path)
    p.add_argument('--p234m-report',required=True,type=Path)
    p.add_argument('--p234s-report',required=True,type=Path)
    p.add_argument('--out',required=True,type=Path)
    p.add_argument('--step-mm',type=float,default=.1)
    a=p.parse_args()
    r=run(a.p234e_native,a.p234n_candidate,a.p234m_report,a.p234s_report,a.out,a.step_mm)
    print(json.dumps({'status':r['status'],'allLocalSectionScreensPass':r['allLocalSectionScreensPass']}))
