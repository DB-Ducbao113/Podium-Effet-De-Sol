#!/usr/bin/env python3
"""Repo-side P2.34b 77-source retention gate, using authenticated P2.34 native STEP.

Fuses no fake car part. A single real shaft is grooved and a single separate
C-ring is added; all other 75 original source solids are retained. The ring
is an unqualified geometric proposal. Articulating CV joint: FAIL at 1 degree.
"""
from __future__ import annotations
import argparse,hashlib,json,math
from pathlib import Path
import cadquery as cq
from p2_34_inboard_cv_keyed_coupling import SHAFT, HOUSING

RING='P234B_REAR_CV_SHAFT_SPLIT_RETENTION_RING'
SCHEMA='peds.cad-first.p234b-native77-retaining-ring-gate.v1'
PINNED={'step':'e44f34413a13d28d7c045e58a80f40460cb2c4b72a558e0c04db9f2c4ce64145',
 'map':'4c01066620f2fa31b84ba847612f50749eca3d07a774f392d9767290950455d0',
 'audit':'1af15f1d5c42fe8cb23c28808cc7210e3da879d689293e55a77b9ffe354fd4f6'}

def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def cylinder(radius,height,z):return cq.Solid.makeCylinder(radius,height,cq.Vector(0,0,z))

def verified_input(folder):
    files={'step':folder/'P234_original_rear76_inboard_keyed_static.step',
      'map':folder/'P234_rear76_source_name_map.json',
      'audit':folder/'P234_rear76_static_coupler_audit.json'}
    for key,path in files.items():
        if not path.is_file() or sha(path)!=PINNED[key]:
            raise ValueError('Original P2.34 source SHA-256 mismatch: '+key)
    manifest=json.loads(files['map'].read_text());prior=json.loads(files['audit'].read_text())
    ids=manifest['nameToZeroBasedSolidIndex']
    if manifest['partCount']!=76 or set(ids.values())!=set(range(76)) or not prior['staticNativeAudit']['nominalStaticPass']:
        raise ValueError('Original P2.34 native source identity/gate mismatch')
    solids=cq.importers.importStep(str(files['step'])).solids().vals()
    if len(solids)!=76 or any(not b.isValid() for b in solids):
        raise ValueError('Original 76 source BReps invalid')
    return {k:solids[i] for k,i in ids.items()},PINNED

def edit(shaft):
    tool=cylinder(26.,1.3,-233.85).cut(cylinder(17.8,1.5,-233.95))
    grooved=shaft.cut(tool).clean()
    ring=cylinder(23.5,1.,-233.7).cut(cylinder(17.95,1.2,-233.8))
    ring=ring.cut(cq.Workplane('XY').box(15.,3.,1.6).val().translate((23.5,0,-233.2))).clean()
    if any(not x.isValid() or len(x.Solids())!=1 or x.Volume()<=0 for x in (grooved,ring)):
        raise ValueError('P2.34b grooved real shaft or C-type ring invalid')
    return grooved,ring

def audit(before,source):
    old=set(before)-{SHAFT}
    if len(before)!=76 or len(source)!=77 or len(old)!=75 or set(source)!=set(before)|{RING}:
        raise ValueError('Exactly 75 unchanged original solids, one changed shaft and one C-ring required')
    skip=exact=0;bad=[];errors=[]
    ids=sorted(source)
    for i,a in enumerate(ids):
        for b in ids[i+1:]:
            if a in old and b in old:continue
            x,y=source[a].BoundingBox(),source[b].BoundingBox()
            if any(min(getattr(x,q+'max'),getattr(y,q+'max'))-max(getattr(x,q+'min'),getattr(y,q+'min'))<=1e-6 for q in 'xyz'):
                skip+=1;continue
            exact+=1
            try:
                v=float(source[a].intersect(source[b]).Volume())
                if not math.isfinite(v) or v<0:raise ValueError('Invalid OpenCascade Boolean')
                if v>.05:bad.append((a,b,round(v,6)))
            except Exception as error:errors.append((a,b,str(error)))
    if skip+exact!=151 or skip+exact+2775!=2926:raise AssertionError('Source77 pair accounting incomplete')
    return {'allPairs':2926,'priorUnchangedPairs':2775,'newAffectedPairs':151,
      'aabbExcluded':skip,'exactOpenCascadeBooleanPairs':exact,'significantClashes':bad,
      'kernelErrors':errors,'passNominalStatic':not bad and not errors}

def export(source,out):
    assembly=cq.Assembly(name='P234B_ORIGINAL_REAR77_CIRCLIP_PREVIEW_G2_HOLD')
    for name,body in sorted(source.items()):assembly.add(body,name=name)
    file=out/'P234B_original_rear77_native_static.step'
    assembly.save(str(file),exportType='STEP')
    objects=cq.importers.importStep(str(file)).solids().vals()
    if len(objects)!=77 or any(not s.isValid() or len(s.Solids())!=1 for s in objects):
        raise ValueError('77-body STEP roundtrip failed')
    dims=('xmin','xmax','ymin','ymax','zmin','zmax')
    dest=[(s.Volume(),tuple(getattr(s.BoundingBox(),q) for q in dims)) for s in objects]
    available=set(range(77));part_map={}
    for name,s in sorted(source.items()):
        vol=s.Volume();bb=tuple(getattr(s.BoundingBox(),q) for q in dims)
        matches=[i for i in available if abs(dest[i][0]-vol)<=max(.1,vol*1e-5)
            and max(abs(a-b) for a,b in zip(dest[i][1],bb))<.02]
        if len(matches)!=1:raise ValueError('STEP source name ambiguity '+name)
        part_map[name]=matches[0];available.remove(matches[0])
    (out/'P234B_rear77_source_name_map.json').write_text(json.dumps({
        'partCount':77,'sourceStepSHA256':sha(file),'nameToZeroBasedSolidIndex':part_map,
        'mechanicalG2Certified':False},indent=2)+'\n')
    return {'file':file.name,'sha256':sha(file),'validSolids':77,'namedSolids':len(part_map)}

def run(native,out):
    if out.exists():raise FileExistsError('Refuse overwrite of P2.34b source evidence')
    prior,hashes=verified_input(native)
    shaft,ring=edit(prior[SHAFT]);updated={**prior,SHAFT:shaft,RING:ring}
    static=audit(prior,updated)
    housing=updated[HOUSING]
    outward=housing.translate((0,0,.5)).intersect(ring).Volume()
    inward=housing.translate((0,0,-.5)).intersect(shaft).Volume()
    tilt=housing.rotate((0,0,-239.5),(1,0,-239.5),1).intersect(shaft).Volume()
    if not static['passNominalStatic'] or not outward>40 or not inward>200 or not tilt>50:
        raise RuntimeError('C-ring static and CV articulation negative controls did not pass')
    report={'schema':SCHEMA,'patch':'P2.34/54','sourceOriginalP234SHA256':hashes,
        'nativeStatic':static,'originalSourceOwnersPreserved':76,'newIndependentRing':RING,
        'housingOutward05mmCollisionMm3':round(outward,6),
        'housingInward05mmCollisionMm3':round(inward,6),
        'oneDegreeCvTiltCollisionMm3':round(tilt,6),
        'realArticulatingCvCertified':False,'springSteelRetentionCertified':False,
        'originalModelBIncluded':False,'mechanicalG2Certified':False}
    out.mkdir(parents=True)
    report['nativeSTEP']=export(updated,out)
    (out/'P234B_rear77_native_audit.json').write_text(json.dumps(report,indent=2)+'\n')
    return report

if __name__=='__main__':
    a=argparse.ArgumentParser()
    a.add_argument('--p234-native-dir',type=Path,required=True)
    a.add_argument('--out',type=Path,required=True)
    p=a.parse_args()
    result=run(p.p234_native_dir,p.out)
    print(json.dumps({'step':result['nativeSTEP'],'audit':result['nativeStatic'],
      'oneDegreeTiltCollisionMm3':result['oneDegreeCvTiltCollisionMm3']},indent=2))
