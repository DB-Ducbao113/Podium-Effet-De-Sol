#!/usr/bin/env python3
"""P2.34P: 84-solid source/candidate collision and midpoint review. G2 HOLD."""
from __future__ import annotations
import argparse,hashlib,json,math
from pathlib import Path
from p2_34o_native_postcut_gate import (AUDIT_FILE,SHA_FILE,SOURCE_SHA,establish_identity,
    validate_audit,verify_subtractive_geometry,finite,SHAFT,CUP,BALLS)
from p2_34n_track_candidate import validated_paths
CAGE='P234C_REAR_CV_BALL_GUIDE_CAGE'
SCHEMA='peds.cad-first.p234p-full84-native-boolean-midpose-gate.v1'

def bounds_overlap(a,b):
    x,y=a.BoundingBox(),b.BoundingBox()
    return all(min(getattr(x,k+'max'),getattr(y,k+'max'))>
               max(getattr(x,k+'min'),getattr(y,k+'min')) for k in 'xyz')

def boolean_volume(a,b):
    v=finite(float(a.intersect(b).Volume()),'native pair overlap')
    if v<0:raise ValueError('Negative Boolean intersection')
    return v

def scan_pairs(parts):
    if len(parts)!=84 or len(set(parts))!=84:raise ValueError('Requires exactly 84 named original solids')
    names=sorted(parts);hits={};broad=exact=0
    for i,a in enumerate(names):
        for b in names[i+1:]:
            broad+=1
            if bounds_overlap(parts[a],parts[b]):
                exact+=1
                v=boolean_volume(parts[a],parts[b])
                if v>0:hits[(a,b)]=v
    if broad!=3486:raise AssertionError('84 choose 2 pair accounting failed')
    return hits,{'unorderedPairs':broad,'exactBooleans':exact,'aabbSeparated':broad-exact}

def compare_pairs(original,revised,threshold=.05,delta_limit=.05):
    t,d=finite(threshold,'threshold'),finite(delta_limit,'delta')
    if t<=0 or d<=0:raise ValueError('Invalid pair thresholds')
    pairs=sorted(set(original)|set(revised))
    if any(not isinstance(p,tuple) or len(p)!=2 or not all(isinstance(n,str) for n in p) for p in pairs):
        raise ValueError('Invalid named solid pair evidence')
    changes=[]
    for pair in pairs:
        before=finite(original.get(pair,0.),'before')
        after=finite(revised.get(pair,0.),'after')
        if min(before,after)<0:raise ValueError('Negative overlap evidence')
        if after>t and after-before>d:
            changes.append({'pair':list(pair),'beforeMm3':before,
                            'afterMm3':after,'increaseMm3':after-before})
    return {'newOrIncreasedOverlaps':changes,'newOrIncreasedOverlapCount':len(changes),
            'baselineCanContainExistingInterference':True,'pairwiseScreenPass':not changes}

def pose_transforms(parts,pose,tilt,shift):
    """Move the CV subset in identical source/candidate poses; all other parts static."""
    from p2_34m_cage_orientation_native import native_rotate,orient,translate_in_cage_frame
    b,s,c=(finite(pose[k],k) for k in ('bendDeg','shaftSpinDeg','cupSpinDeg'))
    if len(tilt)!=3 or len(shift)!=3:raise ValueError('Invalid cage pose')
    if abs(b)>15 or max(abs(s),abs(c))>360:raise ValueError('Pose outside diagnostic domain')
    moved=dict(parts)
    moved[SHAFT]=native_rotate(native_rotate(parts[SHAFT],'z',s),'x',b)
    moved[CUP]=native_rotate(parts[CUP],'z',-c)
    displacement=translate_in_cage_frame(shift,b,tilt)
    for name in (*BALLS,CAGE):
        moved[name]=orient(parts[name],b,tilt).translate(displacement)
    return moved

def midpoint(a,b):
    pa,ta,sa=a;pb,tb,sb=b
    if len(ta)!=3 or len(tb)!=3 or len(sa)!=3 or len(sb)!=3:
        raise ValueError('Invalid midpoint vectors')
    delta=[abs(finite(pb[k],k)-finite(pa[k],k)) for k in ('bendDeg','shaftSpinDeg','cupSpinDeg')]
    if max(delta)>15:raise ValueError('Midpoint phase/bend step too large to infer')
    return ({k:(finite(pa[k],k)+finite(pb[k],k))/2 for k in ('bendDeg','shaftSpinDeg','cupSpinDeg')},
            [(finite(x,'orientation')+finite(y,'orientation'))/2 for x,y in zip(ta,tb)],
            [(finite(x,'offset')+finite(y,'offset'))/2 for x,y in zip(sa,sb)])

def scheduled_midpoints(samples):
    if len(samples)<9:raise ValueError('Too few real P2.34M path witnesses')
    grid={}
    for item in samples:
        pose=item[0];key=(pose['bendDeg'],pose['shaftSpinDeg'],pose['cupSpinDeg'])
        if key in grid:raise ValueError('Duplicate native pose')
        grid[key]=item
    bends=sorted(set(k[0] for k in grid))
    pairs={b:sorted((k[1],k[2]) for k in grid if k[0]==b) for b in bends}
    if len(bends)<3 or len({tuple(p) for p in pairs.values()})!=1:
        raise ValueError('Incomplete rectangular bend-phase sampling')
    edges=[]
    for bend in bends:
        for (s0,c0),(s1,c1) in zip(pairs[bend],pairs[bend][1:]):
            edges.append(('phase',grid[(bend,s0,c0)],grid[(bend,s1,c1)]))
    for b0,b1 in zip(bends,bends[1:]):
        for s,c in pairs[b0]:edges.append(('bend',grid[(b0,s,c)],grid[(b1,s,c)]))
    return [{'edgeType':kind,'first':a[0],'last':b[0],
             'midpoint':midpoint(a,b)} for kind,a,b in edges]

def moving_delta(original,revised,sample):
    pose,tilt,shift=sample
    old,oc=scan_pairs(pose_transforms(original,pose,tilt,shift))
    new,nc=scan_pairs(pose_transforms(revised,pose,tilt,shift))
    return {'pose':pose,'orientationCorrectionDeg':list(tilt),'cageTranslationMm':list(shift),
            'originalCounts':oc,'revisedCounts':nc,'delta':compare_pairs(old,new)}

def summarize(rows):
    if not rows:raise ValueError('No full 84-solid native witnesses')
    failures=[];booleans=0
    for i,row in enumerate(rows):
        for side in ('originalCounts','revisedCounts'):
            x=row[side]
            if x['unorderedPairs']!=3486 or x['exactBooleans']+x['aabbSeparated']!=3486:
                raise ValueError('Full 84-solid pair coverage incomplete')
            booleans+=x['exactBooleans']
        if not row['delta']['pairwiseScreenPass']:failures.append(i)
    return {'fullPoseCount':len(rows),'nominalPotentialPairs':3486*2*len(rows),
            'actualNativeBooleanCount':booleans,'failingPoseIndices':failures,
            'sampledNewInterferenceScreenPass':not failures}

def run(original_dir,candidate_dir,m_report,out_path):
    out=Path(out_path)
    if out.exists():raise FileExistsError('No evidence overwrite')
    candidate_dir=Path(candidate_dir)
    step=(candidate_dir/SHA_FILE).read_bytes()
    audit_bytes=(candidate_dir/AUDIT_FILE).read_bytes()
    audit=json.loads(audit_bytes);m_bytes=Path(m_report).read_bytes()
    validate_audit(audit,step,m_bytes)
    samples=validated_paths(json.loads(m_bytes))
    if audit.get('sampledPathPoints')!=len(samples):
        raise ValueError('Parent P2.34N toolpath count mismatch')
    from p2_34f_repo_native_contact_guard import source
    import cadquery as cq
    originals=source(Path(original_dir))
    imported=cq.importers.importStep(str(candidate_dir/SHA_FILE)).solids().vals()
    identity=establish_identity(originals,imported,audit)
    revised={n:imported[i] for n,i in identity.items()}
    subset={n:verify_subtractive_geometry(originals[n],revised[n]) for n in (SHAFT,CUP)}
    middle=scheduled_midpoints(samples)
    old,n0=scan_pairs(originals);new,n1=scan_pairs(revised)
    static=compare_pairs(old,new)
    rows=[moving_delta(originals,revised,s) for s in samples]
    mids=[dict(edgeType=e['edgeType'],first=e['first'],last=e['last'],
               **moving_delta(originals,revised,e['midpoint'])) for e in middle]
    total=summarize([*rows,*mids])
    report={'schema':SCHEMA,'original84SHA256':SOURCE_SHA,
        'candidateSHA256':hashlib.sha256(step).hexdigest(),
        'candidateAuditSHA256':hashlib.sha256(audit_bytes).hexdigest(),
        'parentP234MReportSHA256':hashlib.sha256(m_bytes).hexdigest(),
        'solidCount':84,'unchangedSolidCount':82,'identityMap':identity,
        'raceSubtractiveEvidence':subset,
        'staticCounts':{'original':n0,'candidate':n1},'staticPairDelta':static,
        'sampledPoseRows':rows,'interpolatedMidpointRows':mids,'midpointCount':len(mids),
        **total,'fullScreenExploratoryPass':static['pairwiseScreenPass'] and total['sampledNewInterferenceScreenPass'],
        'originalBaselineCollisionsPreservedNotNecessarilySafe':True,
        'otherPartsHeldStaticInMovingPose':True,
        'interpolationNotIndependentDynamicSolution':True,
        'continuousClearanceCertified':False,'smoothGrooveCertified':False,
        'constantVelocityCertified':False,'torqueCertified':False,
        'mechanicalG2Certified':False,'modelBFullCarIncluded':False,
        'status':'P234P_FULL84_NATIVE_INTERFERENCE_DIAGNOSTIC_G2_HOLD'}
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(report,indent=2,allow_nan=False)+'\n',encoding='utf-8')
    return report

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--p234e-native',type=Path,required=True)
    p.add_argument('--p234n-candidate',type=Path,required=True)
    p.add_argument('--p234m-report',type=Path,required=True)
    p.add_argument('--out',type=Path,required=True)
    a=p.parse_args()
    r=run(a.p234e_native,a.p234n_candidate,a.p234m_report,a.out)
    print(json.dumps({'status':r['status'],'fullScreenExploratoryPass':r['fullScreenExploratoryPass'],
                      'midpointCount':r['midpointCount']}))
