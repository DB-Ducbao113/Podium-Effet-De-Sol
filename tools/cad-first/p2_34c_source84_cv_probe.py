#!/usr/bin/env python3
"""P2.34C — SHA-pinned native six-ball CV-like geometric source probe.

Uses ACTUAL P2.34B 77-part STEP and bijective index. Changes the real
halfshaft and source CV housing, adds 6 separate torque balls and 1 cage;
screen 711 affected B-Rep pairs and 11 prescribed ±10° LOCAL poses.
Neither speed equality, torque rating, cage/ball retention, original Model B
chassis mating nor mechanical G2 is proven. The old P2.34B circlip no longer
retains the revised outer housing: treated as a source-history leftover.
"""
from __future__ import annotations
import argparse, hashlib, json, math
from pathlib import Path
import cadquery as cq

PINS={
 'P234B_rear77_split_retaining_ring_native_static.step':'c4308df769268f4d9ca3996742dec214148ee088dbe4eb33dfdf2c22db005767',
 'P234B_rear77_source_name_map.json':'d4824a82eb7651f58de65090de1998e6f86b4c2a5ca29c08f2b4852dedc3b3f6',
 'P234B_rear77_native_static_audit.json':'313ff0ca120e1b4eb0171708c0472c7f1dca087485fc7e980bd9d4b842f30054',
}
SHAFT='P217_REAR_DRIVE_HALF_SHAFT_UNSPLINED'
CUP='P217_REAR_CV_HOUSING_PROTOTYPE'
OLD_CLIP='P234B_REAR_CV_SHAFT_SPLIT_RETENTION_RING'
CAGE='P234C_REAR_CV_BALL_GUIDE_CAGE'
BALLS=tuple(f'P234C_REAR_CV_TORQUE_BALL_{k:02d}' for k in range(1,7))
Z=-239.5;PITCH=32.2;TOLERANCE=.05
ANGLES=(-10,-7,-5,-3,-1,0,1,3,5,7,10)

def sha(path):
 return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def actual_source(root):
 for name,expected in PINS.items():
  if not (root/name).is_file() or sha(root/name)!=expected:
   raise ValueError('Original source SHA mismatch: '+name)
 idx=json.loads((root/'P234B_rear77_source_name_map.json').read_text())
 previous=json.loads((root/'P234B_rear77_native_static_audit.json').read_text())
 mapping=idx['nameToZeroBasedSolidIndex']
 if (idx['partCount']!=77 or set(mapping.values())!=set(range(77))
     or not previous['nativeCollisionAudit']['passNominalStatic']):
  raise ValueError('P2.34B authentic original 77-solid source not verified')
 bodies=cq.importers.importStep(str(root/'P234B_rear77_split_retaining_ring_native_static.step')).solids().vals()
 if len(bodies)!=77 or any(not s.isValid() or len(s.Solids())!=1 for s in bodies):
  raise ValueError('Original native STEP is not 77 valid connected bodies')
 return {name:bodies[k] for name,k in mapping.items()}

def cylinder(r,h,z):
 return cq.Solid.makeCylinder(r,h,cq.Vector(0,0,z))

def new_parts(old):
 shaft=old[SHAFT].fuse(cylinder(29,11,-245)).clean()
 b=old[CUP].BoundingBox()
 if max(abs(a-v) for a,v in zip((b.xmin,b.xmax,b.ymin,b.ymax,b.zmin,b.zmax),
                               (-40,40,-40,40,-245,-234)))>.02:
  raise ValueError('Original source housing 40mm datum mismatch')
 cup=cylinder(40,11,-245).cut(cylinder(35.5,11.4,-245.2)).clean()
 balls={}
 for k,name in enumerate(BALLS):
  a=2*math.pi*k/6
  x,y=PITCH*math.cos(a),PITCH*math.sin(a)
  groove=cq.Solid.makeCylinder(3.9,15,cq.Vector(x,y,-247),cq.Vector(0,0,1))
  shaft=shaft.cut(groove).clean()
  cup=cup.cut(groove).clean()
  balls[name]=cq.Solid.makeSphere(3.6,cq.Vector(x,y,Z),angleDegrees1=-90,angleDegrees2=90)
 cage=cylinder(35,11,-245).cut(cylinder(29.8,11.4,-245.2)).clean()
 for name in BALLS:
  center=balls[name].Center()
  cage=cage.cut(cq.Solid.makeSphere(3.86,center,angleDegrees1=-90,angleDegrees2=90)).clean()
 updated={SHAFT:shaft,CUP:cup,CAGE:cage,**balls}
 if any(not part.isValid() or len(part.Solids())!=1 or part.Volume()<=0 for part in updated.values()):
  raise ValueError('Original-derived CV native part malformed')
 return updated

def touch(a,b):
 x,y=a.BoundingBox(),b.BoundingBox()
 return all(min(getattr(x,k+'max'),getattr(y,k+'max'))-max(getattr(x,k+'min'),getattr(y,k+'min'))>1e-6 for k in 'xyz')

def audit_pairs(before,updated):
 if len(before)!=77 or len(updated)!=84 or set(updated)!=(set(before)|{CAGE,*BALLS}):
  raise ValueError('84 original owner IDs required; no duplicates or proxies')
 inherited=set(before)-{SHAFT,CUP}
 skipped=exact=0;errors=[];clashes=[]
 names=sorted(updated)
 for i,a in enumerate(names):
  for b in names[i+1:]:
   if a in inherited and b in inherited:continue
   if not touch(updated[a],updated[b]):skipped+=1;continue
   exact+=1
   try:
    volume=updated[a].intersect(updated[b]).Volume()
    if not math.isfinite(volume) or volume<0:raise ValueError('Invalid Boolean result')
    if volume>TOLERANCE:clashes.append([a,b,round(volume,6)])
   except Exception as exc:errors.append([a,b,str(exc)])
 if skipped+exact!=711:raise AssertionError('711 original newly affected pair checks missing')
 return {'sourceSolids':84,'allUnorderedPairs':3486,
  'inheritedUnmodifiedPairs':2775,'newAffectedPairs':711,
  'aabbSeparated':skipped,'exactOpenCascadeBooleanPairs':exact,
  'significantClashes':clashes,'booleanErrors':errors,
  'staticPASS':not clashes and not errors}

def local_angles(new):
 angles=[];total_exact=0
 for theta in ANGLES:
  def rotate(p,degrees):return p.rotate((0,0,Z),(1,0,Z),degrees)
  pose={SHAFT:rotate(new[SHAFT],theta),CUP:new[CUP],
        CAGE:rotate(new[CAGE],theta/2)}
  pose.update({name:rotate(new[name],theta/2) for name in BALLS})
  ids=sorted(pose);clashes=[];errors=[];exact=0;skip=0
  for i,a in enumerate(ids):
   for b in ids[i+1:]:
    if not touch(pose[a],pose[b]):skip+=1;continue
    exact+=1
    try:
     vol=pose[a].intersect(pose[b]).Volume()
     if not math.isfinite(vol) or vol<0:raise ValueError('Invalid pose Boolean')
     if vol>TOLERANCE:clashes.append([a,b,round(vol,6)])
    except Exception as exc:errors.append([a,b,str(exc)])
  if exact+skip!=36:raise AssertionError('Missing 9-part local angular pair')
  total_exact+=exact
  angles.append({'bendDeg':theta,'cageDeg':theta/2,'pairs':36,
       'exactBooleans':exact,'significantClashes':clashes,'errors':errors})
 ball=new[BALLS[0]];pivot=(0,0,Z);axis=(0,0,Z+1)
 shaft_twist=ball.intersect(new[SHAFT].rotate(pivot,axis,2)).Volume()
 cup_twist=ball.intersect(new[CUP].rotate(pivot,axis,2)).Volume()
 if shaft_twist<=TOLERANCE or cup_twist<=TOLERANCE:
  raise ValueError('Positive geometric torque-ball interference control failed')
 return {'poseCount':len(angles),'posePairs':36*len(angles),
  'exactOpenCascadeBooleans':total_exact,'angles':angles,
  'shaftTwoDegreeBallObstructionMm3':round(shaft_twist,6),
  'housingTwoDegreeBallObstructionMm3':round(cup_twist,6),
  'sampledLocalPass':all(not p['significantClashes'] and not p['errors'] for p in angles),
  'constantVelocityRatioCertified':False,
  'continuousMotionCertified':False,'ratedTorqueCertified':False}

def run(root,out):
 if out.exists():raise FileExistsError('Refusing to overwrite source evidence')
 source=actual_source(root);changed=new_parts(source)
 allparts={**source,**changed}
 static=audit_pairs(source,allparts)
 sampled=local_angles(changed)
 legacy=changed[CUP].translate((0,0,.5)).intersect(source[OLD_CLIP]).Volume()
 if not static['staticPASS'] or not sampled['sampledLocalPass'] or legacy>TOLERANCE:
  raise ValueError('P2.34C nominal/pose/obsolete-ring negative gate FAIL')
 payload={'schema':'peds.cad-first.p234c-repository-source84-probe.v1',
  'patch':'P2.34/54','status':'STATIC_SOURCE84_AND_LOCAL_11POSE_PASS_FUNCTIONAL_CV_HOLD',
  'original77SHA256':PINS,'partCount':84,'unchangedOriginalBodies':75,
  'changedOriginalNames':[SHAFT,CUP],'addedNativeParts':[CAGE,*BALLS],
  'nominalStatic':static,'sampledAngularPose':sampled,
  'legacyCclipHousingOutward05mmCollisionMm3':round(legacy,6),
  'legacyCclipNoLongerRetainsHousing':True,
  'realCvAngularVelocityTransmissionCertified':False,
  'physicalCageAxialRetentionCertified':False,
  'fullSuspensionSweepsCertified':False,
  'originalModelBFullCarIncluded':False,'mechanicalG2Certified':False}
 out.mkdir(parents=True)
 (out/'P234C_source84_repo_probe.json').write_text(json.dumps(payload,indent=2)+'\n')
 return payload

if __name__=='__main__':
 p=argparse.ArgumentParser()
 p.add_argument('--source-p234b-native',type=Path,required=True)
 p.add_argument('--out',type=Path,required=True)
 a=p.parse_args();doc=run(a.source_p234b_native,a.out)
 print(json.dumps({'status':doc['status'],'nominal':doc['nominalStatic'],
                   'poses':doc['sampledAngularPose']['poseCount']},indent=2))
