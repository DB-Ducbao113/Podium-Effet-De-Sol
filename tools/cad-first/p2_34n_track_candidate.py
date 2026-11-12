#!/usr/bin/env python3
"""P2.34N original-derived native CV track-cut PROTOTYPE, never certified CV."""
from __future__ import annotations
import argparse,hashlib,json,math
from pathlib import Path
SOURCE_SHA='9bd7ec6a60d5c4c9f1f3e421cb730fc252de026aae21dcf570584e5dda0ec63e'
M_SCHEMA='peds.cad-first.p234m-cage-orientation-native-grid.v1'
SCHEMA='peds.cad-first.p234n-original-derived-track-cutter-prototype.v1'
PIVOT=(0.,0.,-239.5)
SHAFT='P217_REAR_DRIVE_HALF_SHAFT_UNSPLINED'
CUP='P217_REAR_CV_HOUSING_PROTOTYPE'
BALLS=tuple(f'P234C_REAR_CV_TORQUE_BALL_{i:02d}' for i in range(1,7))

def finite(x,what):
    if isinstance(x,bool) or not isinstance(x,(float,int)) or not math.isfinite(x):
        raise ValueError(f'{what}: invalid finite number')
    return float(x)

def rotate(v,axis,degrees):
    x,y,z=v;a=math.radians(finite(degrees,'rotation'));c,s=math.cos(a),math.sin(a)
    if axis=='x':return (x,y*c-z*s,y*s+z*c)
    if axis=='y':return (x*c+z*s,y,-x*s+z*c)
    if axis=='z':return (x*c-y*s,x*s+y*c,z)
    raise ValueError('invalid axis')

def around(point,axis,degrees):
    return tuple(PIVOT[i]+v for i,v in enumerate(rotate(tuple(point[j]-PIVOT[j] for j in range(3)),axis,degrees)))

def ball_center(source_center,pose,correction,offset):
    if len(correction)!=3 or len(offset)!=3:raise ValueError('invalid candidate vectors')
    center=tuple(finite(a,'ball center') for a in source_center)
    bend=finite(pose['bendDeg'],'bend')
    for axis,deg in [('x',bend/2),*zip('xyz',correction)]:
        center=around(center,axis,finite(deg,'tilt'))
    v=tuple(finite(a,'offset') for a in offset)
    for axis,deg in [('x',bend/2),*zip('xyz',correction)]:v=rotate(v,axis,deg)
    return tuple(a+b for a,b in zip(center,v))

def to_race_local(world,pose,side):
    if side=='shaft':
        return around(around(world,'x',-pose['bendDeg']),'z',-pose['shaftSpinDeg'])
    if side=='cup':return around(world,'z',pose['cupSpinDeg'])
    raise ValueError('invalid race')

def validated_paths(report):
    if not isinstance(report,dict) or report.get('schema')!=M_SCHEMA or report.get('original84StepSHA256')!=SOURCE_SHA:
        raise ValueError('Native P2.34M evidence/schema/source mismatch')
    if report.get('original84SolidCount')!=84 or report.get('originalCADModified') is not False:
        raise ValueError('Not the immutable original 84 source')
    if report.get('mechanicalG2Certified') is not False:
        raise ValueError('Unexpected mechanical certificate')
    if report.get('allBendTracesFound') is not True or report.get('allChosenPathsCrossBendScreen') is not True:
        raise ValueError('Native sampled path evidence not sufficient to attempt new tracks')
    paths=report.get('perBendSampledPaths')
    if not isinstance(paths,list) or len(paths)<3:raise ValueError('Need 3+ bend paths')
    witness=report.get('perPose')
    if not isinstance(witness,list):raise ValueError('Original native pose evidence missing')
    evidence={(p['pose']['bendDeg'],p['pose']['shaftSpinDeg'],p['pose']['cupSpinDeg']):p for p in witness}
    samples=[];seen=set()
    for path in paths:
        if path.get('sampledPathExists') is not True:raise ValueError('Unsolved bend path')
        selected=path.get('sampledPath')
        if not isinstance(selected,list) or len(selected)<3:raise ValueError('Need 3+ poses per bend')
        for sample in selected:
            pose=sample['pose']
            key=tuple(finite(pose[k],k) for k in ('bendDeg','shaftSpinDeg','cupSpinDeg'))
            if key in seen or key not in evidence:raise ValueError('Duplicate or unproven selected pose')
            seen.add(key)
            index=sample.get('candidateIndex')
            candidates=evidence[key]['qualifyingCandidates']
            if type(index) is not int or index<0 or index>=len(candidates):raise ValueError('Bad native candidate index')
            source=candidates[index]
            if source['classification'].get('exploratoryPass') is not True:
                raise ValueError('Selected candidate failed native screen')
            correction=source['cageRotationCorrectionXYZDeg']
            offset=source['cageFrameTranslationMm']
            if len(correction)!=3 or len(offset)!=3:raise ValueError('Invalid cage transform')
            if any(abs(finite(x,'correction'))>1.5 for x in correction) or any(abs(finite(x,'offset'))>2 for x in offset):
                raise ValueError('Cage trial outside bounded search')
            samples.append((dict(zip(('bendDeg','shaftSpinDeg','cupSpinDeg'),key)),correction,offset))
    if len(samples)!=len(witness):raise ValueError('Incomplete original native pose coverage')
    return samples

def build(source_dir,m_report,out_dir,extra_clearance_mm=.05,max_removed_fraction=.30):
    from p2_34f_repo_native_contact_guard import source,PINS
    import cadquery as cq
    out=Path(out_dir)
    if out.exists():raise FileExistsError('Never overwrite CAD output')
    raw=Path(m_report).read_bytes();report=json.loads(raw)
    samples=validated_paths(report)
    extra=finite(extra_clearance_mm,'clearance')
    limit=finite(max_removed_fraction,'volume fraction')
    if not 0<=extra<=.15 or not 0<limit<=.3:raise ValueError('Unsafe cutting envelope')
    originals=source(Path(source_dir))
    if len(originals)!=84 or any(n not in originals for n in (SHAFT,CUP,*BALLS)):
        raise ValueError('Original source84 ID mismatch')
    ball_centers={n:tuple(float(v) for v in (originals[n].Center().x,originals[n].Center().y,originals[n].Center().z)) for n in BALLS}
    radii={}
    for name in BALLS:
        ball=originals[name];radius=(ball.Volume()*3/(4*math.pi))**(1/3)
        box=ball.BoundingBox()
        if not 3.5<radius<4.0 or max(abs(d-2*radius) for d in (box.xlen,box.ylen,box.zlen))>.025:
            raise ValueError('Original native CV ball not an intact sphere')
        radii[name]=radius
    updated=dict(originals);stats={}
    for part,side in ((SHAFT,'shaft'),(CUP,'cup')):
        cutters=[]
        for pose,correction,offset in samples:
            for name in BALLS:
                center=ball_center(ball_centers[name],pose,correction,offset)
                local=to_race_local(center,pose,side)
                cutters.append(cq.Solid.makeSphere(radii[name]+extra,cq.Vector(*local),angleDegrees1=-90,angleDegrees2=90))
        if len(cutters)!=6*len(samples):raise AssertionError('Missing toolpath centers')
        tool=cq.Compound.makeCompound(cutters)
        new=originals[part].cut(tool).clean()
        original_volume=float(originals[part].Volume());after=float(new.Volume())
        removed=(original_volume-after)/original_volume
        if not new.isValid() or len(new.Solids())!=1 or not 0<removed<=limit:
            raise ValueError(f'{side} native track cut invalid or removes unsafe volume: {removed:.6f}')
        updated[part]=new
        stats[side]={'toolBallCount':len(cutters),'initialVolumeMm3':original_volume,
                     'prototypeVolumeMm3':after,'removedVolumeFraction':removed}
    out.mkdir(parents=True)
    dest=out/'P234N_source84_track_cut_PROTOTYPE.step'
    cq.exporters.export(cq.Compound.makeCompound(list(updated.values())),str(dest))
    reloaded=cq.importers.importStep(str(dest)).solids().vals()
    if len(reloaded)!=84 or any(not x.isValid() for x in reloaded):
        dest.unlink(missing_ok=True)
        raise ValueError('Native STEP export/reload failed 84 solid integrity')
    audit={'schema':SCHEMA,'nativeSourceSHA256':PINS,
           'parentP234MReportSHA256':hashlib.sha256(raw).hexdigest(),
           'outputCandidateSHA256':hashlib.sha256(dest.read_bytes()).hexdigest(),
           'original84Retained':True,'changedParts':[SHAFT,CUP],'sourcePartCount':84,
           'sampledPathPoints':len(samples),'cutStatistics':stats,
           'cutterIsDiscreteSphereUnionNotMachinedSmoothGroove':True,
           'sourceGeometryUnchanged':True,'cagePocketsRedesigned':False,
           'postCutNativeCollisionScreenCompleted':False,
           'constantVelocityCertified':False,'loadedTorqueCertified':False,
           'mechanicalG2Certified':False,'status':'TRACK_CUT_STEP_PROTOTYPE_NOT_ACCEPTED_G2_HOLD'}
    (out/'P234N_prototype_native_audit.json').write_text(json.dumps(audit,indent=2)+'\n')
    return audit

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--p234e-native',required=True,type=Path)
    p.add_argument('--p234m-report',required=True,type=Path)
    p.add_argument('--out',required=True,type=Path)
    p.add_argument('--clearance-mm',type=float,default=.05)
    a=p.parse_args()
    print(json.dumps(build(a.p234e_native,a.p234m_report,a.out,a.clearance_mm),indent=2))
