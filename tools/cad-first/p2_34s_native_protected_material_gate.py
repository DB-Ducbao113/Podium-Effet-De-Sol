#!/usr/bin/env python3
"""P2.34S native protected-material diagnostic, NOT a wall-thickness certification."""
from __future__ import annotations
import argparse,hashlib,json,math
from pathlib import Path
SOURCE_SHA='9bd7ec6a60d5c4c9f1f3e421cb730fc252de026aae21dcf570584e5dda0ec63e'
SCHEMA='peds.cad-first.p234s-native-protected-material-review.v1'
O_SCHEMA='peds.cad-first.p234o-postcut-native-integrity-and-pose.v1'
P_SCHEMA='peds.cad-first.p234p-full84-native-boolean-midpose-gate.v1'
SHAFT='P217_REAR_DRIVE_HALF_SHAFT_UNSPLINED'
CUP='P217_REAR_CV_HOUSING_PROTOTYPE'
def finite(value,label):
    if isinstance(value,bool) or not isinstance(value,(float,int)) or not math.isfinite(value):
        raise ValueError(f'{label}: finite numeric value required')
    return float(value)
def sha(data):return hashlib.sha256(data).hexdigest()
def verify_reports(o,p,source_step,candidate_step,m_bytes,audit_bytes,o_bytes):
    for report,name,schema in ((o,'O',O_SCHEMA),(p,'P',P_SCHEMA)):
        if not isinstance(report,dict) or report.get('schema')!=schema:
            raise ValueError(f'P2.34{name} schema mismatch')
        if report.get('mechanicalG2Certified') is not False:
            raise ValueError(f'P2.34{name} falsely claims G2')
        if report.get('parentP234MReportSHA256')!=sha(m_bytes):
            raise ValueError(f'P2.34{name} P2.34M parent mismatch')
        if report.get('candidateAuditSHA256')!=sha(audit_bytes):
            raise ValueError(f'P2.34{name} candidate audit mismatch')
    if o.get('original84SourceSHA256')!=SOURCE_SHA or p.get('original84SHA256')!=SOURCE_SHA:
        raise ValueError('Original 84-source SHA mismatch')
    if o.get('candidateSTEPsha256')!=sha(candidate_step) or p.get('candidateSHA256')!=sha(candidate_step):
        raise ValueError('Candidate STEP hash mismatch')
    if sha(source_step)!=SOURCE_SHA:raise ValueError('Original STEP bytes do not match SHA pin')
    if o.get('mappedSourceSolidCount')!=84 or o.get('unalteredSolidMatches')!=82:
        raise ValueError('P2.34O original solid identity audit incomplete')
    if p.get('solidCount')!=84 or p.get('unchangedSolidCount')!=82:
        raise ValueError('P2.34P full-84 report incomplete')
    if p.get('identityMap')!=o.get('identityMapFromGeometricMatchingNotStableSTEPLabels'):
        raise ValueError('Independent original solid mappings disagree')
    if p.get('originalBaselineCollisionsPreservedNotNecessarilySafe') is not True:
        raise ValueError('Full-84 baseline collision caveat missing')
    if p.get('midpointCount',0)<1 or p.get('fullPoseCount',0)<1:
        raise ValueError('No sampled full-84 and midpoint evidence')
    return {'oSampledPoseScreenPass':o.get('allSampledPoseScreensPass') is True,
            'pFull84RegressionScreenPass':p.get('fullScreenExploratoryPass') is True}
def protective_zones(cq,shaft_core_radius_mm=24.,cup_outer_start_radius_mm=38.5):
    core=finite(shaft_core_radius_mm,'shaft core radius')
    outer=finite(cup_outer_start_radius_mm,'cup wall start radius')
    if not 20<=core<=26 or not 37<=outer<=39.5:
        raise ValueError('Invalid experimentally protected envelope')
    base=cq.Vector(0,0,-245)
    return {'shaft':cq.Solid.makeCylinder(core,11.,base),
            'cup':cq.Solid.makeCylinder(41.,11.,base).cut(cq.Solid.makeCylinder(outer,11.,base))}
def protected_material(original,candidate,envelope,tolerance_mm3=.001,min_occupied_mm3=1.):
    tolerance=finite(tolerance_mm3,'protected loss tolerance')
    occupied=finite(min_occupied_mm3,'minimum occupied source volume')
    if tolerance<0 or occupied<=0:raise ValueError('Invalid protective zone thresholds')
    if not original.isValid() or not candidate.isValid() or not envelope.isValid():
        raise ValueError('Invalid original, candidate or protected native solid')
    reference=original.intersect(envelope)
    baseline=finite(float(reference.Volume()),'original protected volume')
    if baseline<occupied:raise ValueError('Protective envelope has insufficient actual original material')
    removed=finite(float(reference.cut(candidate).Volume()),'removed protected material')
    added=finite(float(candidate.cut(original).Volume()),'candidate added material')
    if min(removed,added)<0:raise ValueError('Invalid negative native Boolean result')
    if added>tolerance:raise ValueError('Candidate is not strictly subtractive')
    return {'sourceOccupiedProtectedVolumeMm3':baseline,
            'removedProtectedVolumeMm3':removed,'candidateAddedMaterialMm3':added,
            'protectiveEnvelopePass':removed<=tolerance and added<=tolerance}
def summarize(reports,prior):
    if set(reports)!={'shaft','cup'}:raise ValueError('Both source races must have native protective measurements')
    if any('protectiveEnvelopePass' not in r or type(r['protectiveEnvelopePass']) is not bool
           for r in reports.values()):raise ValueError('Malformed native protected evidence')
    protection=all(r['protectiveEnvelopePass'] for r in reports.values())
    upstream=all(prior.values())
    return {'protectedEnvelopeScreenPass':protection,'upstreamSampledScreensPass':upstream,
            'exploratoryReviewAllGatesPass':protection and upstream,
            'actualLocalWallThicknessFieldMeasured':False,
            'fullSmoothGrooveC2SurfaceCertified':False,
            'cagePocketRetentionCertified':False,'loadedContactStressCertified':False,
            'constantVelocityCertified':False,'transmittedTorqueCertified':False,
            'mechanicalG2Certified':False}
def run(original_dir,candidate_dir,m_report,o_report,p_report,out_file):
    from p2_34o_native_postcut_gate import (AUDIT_FILE,SHA_FILE,validate_audit,
                                             establish_identity,verify_subtractive_geometry)
    from p2_34f_repo_native_contact_guard import source
    import cadquery as cq
    out=Path(out_file)
    if out.exists():raise FileExistsError('Refuses overwrite of native evidence')
    candidate_dir=Path(candidate_dir)
    audit_bytes=(candidate_dir/AUDIT_FILE).read_bytes()
    candidate_bytes=(candidate_dir/SHA_FILE).read_bytes()
    m_bytes=Path(m_report).read_bytes()
    o_bytes=Path(o_report).read_bytes()
    p_bytes=Path(p_report).read_bytes()
    audit=json.loads(audit_bytes)
    validate_audit(audit,candidate_bytes,m_bytes)
    originals=source(Path(original_dir))
    original_bytes=(Path(original_dir)/'P234E_source84_revised_six_ball_clearance.step').read_bytes()
    prior=verify_reports(json.loads(o_bytes),json.loads(p_bytes),original_bytes,
                         candidate_bytes,m_bytes,audit_bytes,o_bytes)
    imported=cq.importers.importStep(str(candidate_dir/SHA_FILE)).solids().vals()
    mapping=establish_identity(originals,imported,audit)
    candidates={name:imported[index] for name,index in mapping.items()}
    for name in (SHAFT,CUP):verify_subtractive_geometry(originals[name],candidates[name])
    zones=protective_zones(cq)
    measurements={'shaft':protected_material(originals[SHAFT],candidates[SHAFT],zones['shaft']),
                  'cup':protected_material(originals[CUP],candidates[CUP],zones['cup'])}
    checks=summarize(measurements,prior)
    result={'schema':SCHEMA,'original84SourceSHA256':SOURCE_SHA,
            'parentP234MReportSHA256':sha(m_bytes),
            'candidateSTEPsha256':sha(candidate_bytes),
            'candidateAuditSHA256':sha(audit_bytes),
            'p234oReportSHA256':sha(o_bytes),'p234pReportSHA256':sha(p_bytes),
            'sourceSolidCount':84,'sourceIdentityMappingRetained':mapping,
            'originalGeometryModified':False,
            'protectionDefinition':{'shaftCoreRadiusMm':24.,
                'cupOuterShellRadialStartMm':38.5,'zMinMm':-245.,'zMaxMm':-234.,
                'numericLostVolumeToleranceMm3':.001,
                'scope':'Fixed cylindrical subsets of original B-Rep; not global wall thickness'},
            'protectedRaceEvidence':measurements,**checks,
            'status':'P234S_PROTECTED_SOURCE_MATERIAL_NATIVE_DIAGNOSTIC_G2_HOLD'}
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(result,indent=2,allow_nan=False)+'\n',encoding='utf-8')
    return result
if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--p234e-native',type=Path,required=True)
    p.add_argument('--p234n-candidate',type=Path,required=True)
    p.add_argument('--p234m-report',type=Path,required=True)
    p.add_argument('--p234o-report',type=Path,required=True)
    p.add_argument('--p234p-report',type=Path,required=True)
    p.add_argument('--out',type=Path,required=True)
    a=p.parse_args()
    r=run(a.p234e_native,a.p234n_candidate,a.p234m_report,a.p234o_report,a.p234p_report,a.out)
    print(json.dumps({'status':r['status'],'exploratoryReviewAllGatesPass':r['exploratoryReviewAllGatesPass']}))
