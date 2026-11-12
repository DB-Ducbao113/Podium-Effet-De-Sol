#!/usr/bin/env python3
"""P2.34O: original-native postcut STEP identity, material-loss and CV witness gate.

Mechanical G2 remains HOLD. No machining, torque or constant speed certificate.
"""
from __future__ import annotations
import argparse,hashlib,json,math
from pathlib import Path
N_SCHEMA='peds.cad-first.p234n-original-derived-track-cutter-prototype.v1'
SOURCE_SHA='9bd7ec6a60d5c4c9f1f3e421cb730fc252de026aae21dcf570584e5dda0ec63e'
SHAFT='P217_REAR_DRIVE_HALF_SHAFT_UNSPLINED'
CUP='P217_REAR_CV_HOUSING_PROTOTYPE'
BALLS=tuple(f'P234C_REAR_CV_TORQUE_BALL_{i:02d}' for i in range(1,7))
SCHEMA='peds.cad-first.p234o-postcut-native-integrity-and-pose.v1'
SHA_FILE='P234N_source84_track_cut_PROTOTYPE.step'
AUDIT_FILE='P234N_prototype_native_audit.json'

def finite(x,label):
    if isinstance(x,bool) or not isinstance(x,(int,float)) or not math.isfinite(x):
        raise ValueError(f'{label} must be finite')
    return float(x)

def signature(shape):
    box=shape.BoundingBox();ctr=shape.Center()
    values=(shape.Volume(),ctr.x,ctr.y,ctr.z,
            box.xmin,box.xmax,box.ymin,box.ymax,box.zmin,box.zmax)
    return tuple(finite(v,'native signature') for v in values)

def matches(a,b,volume_rtol=1e-7,length_atol=.001):
    if len(a)!=10 or len(b)!=10:raise ValueError('Invalid signature')
    if not math.isclose(a[0],b[0],rel_tol=volume_rtol,abs_tol=1e-7):return False
    return all(abs(x-y)<=length_atol for x,y in zip(a[1:],b[1:]))

def establish_identity(original,imported,audit):
    """Match all 82 unchanged bodies and independently identify two revised races."""
    if len(original)!=84 or len(imported)!=84 or set(original)&{SHAFT,CUP}!={SHAFT,CUP}:
        raise ValueError('Expected 84 original/candidate solids')
    if any(not s.isValid() or len(s.Solids())!=1 for s in imported):
        raise ValueError('Invalid or disconnected candidate')
    originals={n:signature(v) for n,v in original.items()}
    candidate=[signature(v) for v in imported]
    chosen={};used=set()
    for name in sorted(set(original)-{SHAFT,CUP}):
        found=[i for i,c in enumerate(candidate) if i not in used and matches(originals[name],c)]
        if len(found)!=1:raise ValueError('Unchanged body cannot be uniquely matched: '+name)
        chosen[name]=found[0];used.add(found[0])
    remaining=[i for i in range(84) if i not in used]
    if len(remaining)!=2:raise AssertionError('Expected two changed races')
    for side,name in (('shaft',SHAFT),('cup',CUP)):
        record=audit['cutStatistics'][side]
        desired=finite(record['prototypeVolumeMm3'],'prototype volume')
        initial=finite(record['initialVolumeMm3'],'original volume')
        if abs(initial-originals[name][0])>max(1e-5,initial*1e-7):
            raise ValueError('Original race volume mismatch')
        found=[i for i in remaining if math.isclose(candidate[i][0],desired,rel_tol=1e-7,abs_tol=1e-5)]
        if len(found)!=1:raise ValueError('Changed race cannot be uniquely matched: '+side)
        idx=found[0];old=originals[name];new=candidate[idx]
        if any(abs(x-y)>2 for x,y in zip(old[1:4],new[1:4])):
            raise ValueError('Revised race centroid shifted')
        if any(new[4+j]<old[4+j]-.001 for j in (0,2,4)) or any(new[5+j]>old[5+j]+.001 for j in (0,2,4)):
            raise ValueError('Revised race extends outside original bounds')
        loss=(old[0]-new[0])/old[0]
        if loss<=0 or not math.isclose(loss,finite(record['removedVolumeFraction'],'cut fraction'),
                                       rel_tol=1e-5,abs_tol=1e-7):
            raise ValueError('Material removal audit mismatch')
        chosen[name]=idx;remaining.remove(idx)
    if remaining or len(set(chosen.values()))!=84:raise ValueError('Incomplete source identity mapping')
    return chosen

def verify_subtractive_geometry(original,revised,max_added_mm3=1e-5):
    """Independent OCC Boolean ensures the revised race is a source material subset."""
    if not original.isValid() or not revised.isValid():raise ValueError('Invalid native race')
    added=finite(float(revised.cut(original).Volume()),'added material')
    removed=finite(float(original.cut(revised).Volume()),'removed material')
    expected=finite(float(original.Volume()),'source volume')-finite(float(revised.Volume()),'candidate volume')
    if added<0 or removed<0 or added>max_added_mm3 or not math.isclose(
            removed-added,expected,rel_tol=1e-5,abs_tol=1e-5):
        raise ValueError('Postcut race is not a strictly subtractive native shape')
    return {'addedMaterialMm3':added,'removedMaterialMm3':removed,'netMaterialLossMm3':expected}

def validate_audit(audit,step_bytes,m_bytes):
    if not isinstance(audit,dict) or audit.get('schema')!=N_SCHEMA:
        raise ValueError('Wrong P2.34N prototype audit')
    if audit.get('nativeSourceSHA256',{}).get('P234E_source84_revised_six_ball_clearance.step')!=SOURCE_SHA:
        raise ValueError('Native source SHA pin mismatch')
    if audit.get('outputCandidateSHA256')!=hashlib.sha256(step_bytes).hexdigest():
        raise ValueError('Candidate STEP SHA-256 mismatch')
    if audit.get('parentP234MReportSHA256')!=hashlib.sha256(m_bytes).hexdigest():
        raise ValueError('Native path report SHA-256 mismatch')
    if audit.get('changedParts')!=[SHAFT,CUP] or audit.get('sourcePartCount')!=84:
        raise ValueError('Only two changed native race bodies allowed')
    for key in ('sourceGeometryUnchanged','original84Retained','cutterIsDiscreteSphereUnionNotMachinedSmoothGroove'):
        if audit.get(key) is not True:raise ValueError('Unverified: '+key)
    for key in ('mechanicalG2Certified','constantVelocityCertified','loadedTorqueCertified',
                'postCutNativeCollisionScreenCompleted'):
        if audit.get(key) is not False:raise ValueError('Unsafe previous certification claim: '+key)
    return True

def postcut_pose(parts,pose,correction,offset):
    from p2_34m_cage_orientation_native import measure_group,validate_contact
    race,pairs,cage=measure_group(parts,pose['bendDeg'],pose['shaftSpinDeg'],
                                  pose['cupSpinDeg'],correction,offset)
    label=validate_contact(race,pairs,cage)
    return {'pose':pose,'cageRotationCorrectionXYZDeg':list(correction),
            'cageFrameTranslationMm':list(offset),'classification':label,
            'perBallNative':race,'ballBallNativeOverlapMm3':pairs,
            'ballCageNativeOverlapMm3':cage,'nativeBooleanCalls':33,'nativeDistanceCalls':12}

def select_postcut_poses(m_report):
    from p2_34n_track_candidate import validated_paths
    samples=validated_paths(m_report)
    if len(samples)<9:raise ValueError('Native path coverage incomplete')
    return samples

def evaluate_rows(rows):
    if not rows:raise ValueError('No native postcut evidence')
    for r in rows:
        if r.get('nativeBooleanCalls')!=33 or r.get('nativeDistanceCalls')!=12:
            raise ValueError('Incomplete native postcut measurement accounting')
        if not isinstance(r.get('classification'),dict) or type(r['classification'].get('exploratoryPass')) is not bool:
            raise ValueError('Missing native postcut classification')
    return {'allSampledPoseScreensPass':all(r['classification']['exploratoryPass'] for r in rows),
            'poseCount':len(rows),'nativeBooleanCalls':33*len(rows),
            'nativeDistanceCalls':12*len(rows)}

def run(source_dir,candidate_dir,m_report_file,out_file):
    out=Path(out_file)
    if out.exists():raise FileExistsError('Refusing overwrite of native audit')
    candidate_dir=Path(candidate_dir)
    step_bytes=(candidate_dir/SHA_FILE).read_bytes()
    audit_raw=(candidate_dir/AUDIT_FILE).read_bytes()
    audit=json.loads(audit_raw)
    m_bytes=Path(m_report_file).read_bytes()
    validate_audit(audit,step_bytes,m_bytes)
    samples=select_postcut_poses(json.loads(m_bytes))
    if audit.get('sampledPathPoints')!=len(samples):
        raise ValueError('Path count does not match original candidate cutter evidence')
    from p2_34f_repo_native_contact_guard import source
    import cadquery as cq
    original=source(Path(source_dir))
    imported=cq.importers.importStep(str(candidate_dir/SHA_FILE)).solids().vals()
    mapping=establish_identity(original,imported,audit)
    parts={name:imported[index] for name,index in mapping.items()}
    subtraction={side:verify_subtractive_geometry(original[name],parts[name])
                 for side,name in (('shaft',SHAFT),('cup',CUP))}
    rows=[postcut_pose(parts,p,c,o) for p,c,o in samples]
    totals=evaluate_rows(rows)
    result={'schema':SCHEMA,'original84SourceSHA256':SOURCE_SHA,
            'candidateSTEPsha256':audit['outputCandidateSHA256'],
            'candidateAuditSHA256':hashlib.sha256(audit_raw).hexdigest(),
            'parentP234MReportSHA256':hashlib.sha256(m_bytes).hexdigest(),
            'identityMapFromGeometricMatchingNotStableSTEPLabels':mapping,
            'mappedSourceSolidCount':len(mapping),'unalteredSolidMatches':82,
            'changedRaceIdentitiesResolved':[SHAFT,CUP],
            'independentNativeSubtractionChecks':subtraction,
            'sampledNativePostcutEvidence':rows,**totals,
            'continuousContactCertified':False,'machinableSmoothGroovesCertified':False,
            'constantVelocityCertified':False,'loadedTorqueCertified':False,
            'mechanicalG2Certified':False,
            'status':'SOURCE84_POSTCUT_SAMPLED_NATIVE_GATE_G2_HOLD'}
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(result,indent=2,allow_nan=False)+'\n',encoding='utf-8')
    return result

if __name__=='__main__':
    cli=argparse.ArgumentParser()
    cli.add_argument('--p234e-native',type=Path,required=True)
    cli.add_argument('--p234n-candidate',type=Path,required=True)
    cli.add_argument('--p234m-report',type=Path,required=True)
    cli.add_argument('--out',type=Path,required=True)
    a=cli.parse_args()
    report=run(a.p234e_native,a.p234n_candidate,a.p234m_report,a.out)
    print(json.dumps({'status':report['status'],'poseCount':report['poseCount'],
                      'allSampledPoseScreensPass':report['allSampledPoseScreensPass']}))
