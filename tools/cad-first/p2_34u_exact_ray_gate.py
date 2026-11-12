#!/usr/bin/env python3
"""P2.34U: OCC face/radial-line intersections; finite-ray diagnostic, G2 HOLD."""
from __future__ import annotations
import argparse,hashlib,json,math
from pathlib import Path
SOURCE_SHA='9bd7ec6a60d5c4c9f1f3e421cb730fc252de026aae21dcf570584e5dda0ec63e'
SCHEMA='peds.cad-first.p234u-native-exact-radial-ray.v1'
T_SCHEMA='peds.cad-first.p234t-native-radial-section-review.v1'
SHAFT='P217_REAR_DRIVE_HALF_SHAFT_UNSPLINED'
CUP='P217_REAR_CV_HOUSING_PROTOTYPE'
STEP='P234N_source84_track_cut_PROTOTYPE.step'
AUDIT='P234N_prototype_native_audit.json'
def finite(x,label):
    if type(x) not in (float,int) or not math.isfinite(x):raise ValueError(label+': nonfinite numeric')
    return float(x)
def sha(raw):return hashlib.sha256(raw).hexdigest()

def exact_intervals(shape,angle_deg,z_mm,rmin,rmax,tol=1e-7):
    """OCC ray/surface breakpoints followed by in-solid interval classification.

    Coincident faces and tangent degeneracies remain uncertified.
    """
    import cadquery as cq
    from OCP.BRepIntCurveSurface import BRepIntCurveSurface_Inter
    from OCP.gp import gp_Dir,gp_Lin,gp_Pnt
    deg,z,lo,hi=[finite(x,k) for k,x in [('angle',angle_deg),('z',z_mm),('rmin',rmin),('rmax',rmax)]]
    if not 0<=deg<360 or not 0<=lo<hi<=100 or not -245<z<-234:raise ValueError('Outside native review domain')
    if not shape.isValid() or len(shape.Solids())!=1:raise ValueError('Invalid native BRep solid')
    a=math.radians(deg);co,si=math.cos(a),math.sin(a)
    inter=BRepIntCurveSurface_Inter()
    inter.Init(shape.wrapped,gp_Lin(gp_Pnt(0,0,z),gp_Dir(co,si,0)),tol)
    roots=[]
    while inter.More():
        w=finite(inter.W(),'OCC intersection parameter')
        if lo-tol<=w<=hi+tol:roots.append(max(lo,min(hi,w)))
        if len(roots)>256:raise ValueError('Too many OCC face intersections')
        inter.Next()
    roots.sort();unique=[]
    for value in roots:
        if not unique or value-unique[-1]>1e-6:unique.append(value)
    cuts=[lo]+[v for v in unique if lo+1e-6<v<hi-1e-6]+[hi]
    spans=[]
    for start,end in zip(cuts,cuts[1:]):
        if end-start<=1e-6:continue
        mid=(start+end)/2
        if shape.isInside(cq.Vector(mid*co,mid*si,z),tol):
            spans.append({'radialStartMm':start,'radialEndMm':end,'materialSpanMm':end-start})
    return {'faceIntersectionRadiiMm':unique,'materialIntervals':spans,
            'smallestMaterialSpanMm':min((x['materialSpanMm'] for x in spans),default=0.),
            'isFiniteRayOnly':True,'tangentialOrCoincidentDegeneracyExcluded':False}

def inspect(original,candidate,side,step_reconciliation=.1,min_span=1.):
    from p2_34t_radial_section_gate import radial_spans
    if side not in ('shaft','cup'):raise ValueError('Invalid CV race')
    lo,hi=(20.,30.) if side=='shaft' else (34.5,41.)
    step=finite(step_reconciliation,'T sample step')
    threshold=finite(min_span,'review span')
    if not .01<=step<=.5 or not .1<=threshold<=10:raise ValueError('Invalid exploratory thresholds')
    rows=[]
    for z in (-242.,-239.5,-237.):
        for angle in (0.,60.,120.,180.,240.,300.):
            base=exact_intervals(original,angle,z,lo,hi)
            revised=exact_intervals(candidate,angle,z,lo,hi)
            sampled=radial_spans(candidate,angle,z,lo,hi,step)
            native_spans=revised['materialIntervals']
            hidden=(len(sampled)!=len(native_spans) or
                    any(abs(a['sampledSpanMm']-b['materialSpanMm'])>step*2
                        for a,b in zip(sampled,native_spans)))
            rows.append({'angleDeg':angle,'zMm':z,'source':base,'candidate':revised,
                'previousP234TSampledMaterialIntervals':sampled,
                'sampledTDisagreesWithOCCIntersections':hidden,
                'exploratoryNativeRayPass':bool(base['materialIntervals']) and
                    len(native_spans)==1 and revised['smallestMaterialSpanMm']>=threshold})
    return {'race':side,'rayCount':len(rows),'rays':rows,
        'TtoOCCDisagreementCount':sum(x['sampledTDisagreesWithOCCIntersections'] for x in rows),
        'exactIntersectionSampledRayScreenPass':all(x['exploratoryNativeRayPass'] for x in rows),
        'globalMinimumWallThicknessCertified':False}

def verify_parent(t,m_bytes,s_bytes,candidate_bytes,t_bytes):
    if not isinstance(t,dict) or t.get('schema')!=T_SCHEMA or t.get('source84SHA256')!=SOURCE_SHA:
        raise ValueError('P2.34T source report missing')
    if t.get('p234mReportSHA256')!=sha(m_bytes) or t.get('p234sReportSHA256')!=sha(s_bytes):
        raise ValueError('Native parent report SHA mismatch')
    if t.get('candidateSTEPsha256')!=sha(candidate_bytes):raise ValueError('Candidate STEP SHA mismatch')
    if t.get('mechanicalG2Certified') is not False or t.get('originalSourceModified') is not False:
        raise ValueError('Unsafe prior mechanical acceptance')
    if t.get('allLocalSectionScreensPass') is not True:raise ValueError('Failed upstream radial screen')
    return {'parentP234TReportSHA256':sha(t_bytes)}

def run(original_dir,candidate_dir,m_file,s_file,t_file,out_file):
    out=Path(out_file)
    if out.exists():raise FileExistsError('Refuses native evidence overwrite')
    candidate_dir=Path(candidate_dir)
    m,s,t=[Path(f).read_bytes() for f in (m_file,s_file,t_file)]
    step=(candidate_dir/STEP).read_bytes()
    audit_bytes=(candidate_dir/AUDIT).read_bytes()
    lineage=verify_parent(json.loads(t),m,s,step,t)
    from p2_34f_repo_native_contact_guard import source
    from p2_34o_native_postcut_gate import validate_audit,establish_identity,verify_subtractive_geometry
    import cadquery as cq
    audit=json.loads(audit_bytes);validate_audit(audit,step,m)
    originals=source(Path(original_dir))
    imported=cq.importers.importStep(str(candidate_dir/STEP)).solids().vals()
    mapping=establish_identity(originals,imported,audit)
    revised={name:imported[index] for name,index in mapping.items()}
    for name in (SHAFT,CUP):verify_subtractive_geometry(originals[name],revised[name])
    evidence={side:inspect(originals[name],revised[name],side)
              for side,name in (('shaft',SHAFT),('cup',CUP))}
    result={'schema':SCHEMA,'sourceSTEPsha256':SOURCE_SHA,
        'candidateSTEPsha256':sha(step),'candidateAuditSHA256':sha(audit_bytes),
        'parentP234MReportSHA256':sha(m),'parentP234SReportSHA256':sha(s),**lineage,
        'nativeExactRadialIntersections':evidence,
        'allSampledNativeRayScreensPass':all(v['exactIntersectionSampledRayScreenPass'] for v in evidence.values()),
        'allDisagreementsResolved':all(v['TtoOCCDisagreementCount']==0 for v in evidence.values()),
        'exactGlobalMinimumWallThicknessCertified':False,
        'tangentialDegeneraciesFullyResolved':False,'cageRetentionCertified':False,
        'constantVelocityCertified':False,'torqueCertified':False,
        'mechanicalG2Certified':False,
        'status':'P234U_EXACT_INTERSECTION_FINITE_RAY_DIAGNOSTIC_G2_HOLD'}
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(result,indent=2,allow_nan=False)+'\n',encoding='utf-8')
    return result
if __name__=='__main__':
    cli=argparse.ArgumentParser()
    cli.add_argument('--p234e-native',type=Path,required=True)
    cli.add_argument('--p234n-candidate',type=Path,required=True)
    cli.add_argument('--p234m-report',type=Path,required=True)
    cli.add_argument('--p234s-report',type=Path,required=True)
    cli.add_argument('--p234t-report',type=Path,required=True)
    cli.add_argument('--out',type=Path,required=True)
    a=cli.parse_args()
    r=run(a.p234e_native,a.p234n_candidate,a.p234m_report,a.p234s_report,a.p234t_report,a.out)
    print(json.dumps({'status':r['status'],'allSampledNativeRayScreensPass':r['allSampledNativeRayScreensPass']}))
