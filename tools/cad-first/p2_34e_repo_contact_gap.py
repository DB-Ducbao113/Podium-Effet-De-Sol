#!/usr/bin/env python3
"""P2.34E GitHub portable 84-source CV ball clearance gate; mechanical G2 HOLD.

No stand-in F1 car. Requires original P2.34D SHA-256-pinned 84-body STEP,
name-index and native QA. Six existing balls resized, 78 source owners retained.
Checks 483 new static pairs, 11 sampled local angular poses by native BRep
minimum separation; contact onset is one-sided geometry, NOT loaded CV torque.
"""
from __future__ import annotations
import argparse,hashlib,json,math
from pathlib import Path
import cadquery as cq
from OCP.BRepExtrema import BRepExtrema_DistShapeShape
PINS={'P234D_rear84_integral_ball_end_lips_native.step':'f59c2691a8bdba9b7d711eaaf8bebe8b6daac625b2783119abc3972d27cf7f83',
'P234D_rear84_source_index.json':'e40905a74332b6e51af19e86750cfae3b6af21e6c45bd0310c4c6773ca42b3fa',
'P234D_native84_axial_capture_audit.json':'2efac02d9748ba184a4ad15229ace419b56a204947d2d962484f2aff5ea375e4'}
SHAFT='P217_REAR_DRIVE_HALF_SHAFT_UNSPLINED';CUP='P217_REAR_CV_HOUSING_PROTOTYPE';CAGE='P234C_REAR_CV_BALL_GUIDE_CAGE'
BALLS=tuple(f'P234C_REAR_CV_TORQUE_BALL_{i:02d}' for i in range(1,7));ANGLES=(-10,-7,-5,-3,-1,0,1,3,5,7,10)
Z=-239.5

def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def minimum(a,b):
 k=BRepExtrema_DistShapeShape(a.wrapped,b.wrapped);k.Perform()
 if not k.IsDone():raise ValueError('Failed native OCCT minimum distance')
 return float(k.Value())
def turn(p,a,axis='x'):
 return p.rotate((0,0,Z),(1,0,Z) if axis=='x' else (0,0,Z+1),a)
def near(a,b):
 x,y=a.BoundingBox(),b.BoundingBox()
 return all(min(getattr(x,q+'max'),getattr(y,q+'max'))-max(getattr(x,q+'min'),getattr(y,q+'min'))>1e-6 for q in 'xyz')
def source(root):
 for name,expected in PINS.items():
  if not (root/name).is_file() or sha(root/name)!=expected:raise ValueError('P2.34D source SHA mismatch '+name)
 m=json.loads((root/'P234D_rear84_source_index.json').read_text());a=json.loads((root/'P234D_native84_axial_capture_audit.json').read_text())
 ids=m['nameToZeroBasedSolidIndex']
 if m['partCount']!=84 or set(ids.values())!=set(range(84)) or not a['nativeStaticAudit']['nominalStaticPASS'] or not a['angularAndAxialEnvelopeQA']['geometricAxialEnvelopeAndSampledPosePASS']:
  raise ValueError('P2.34D source-name/native gate invalid')
 all=cq.importers.importStep(str(root/'P234D_rear84_integral_ball_end_lips_native.step')).solids().vals()
 if len(all)!=84 or any(not b.isValid() for b in all):raise ValueError('Original native source STEP invalid')
 return {name:all[i] for name,i in ids.items()}
def resize(original):
 result=original.copy()
 for n in BALLS:
  if abs(original[n].Volume()-4*math.pi*3.6**3/3)>.01:raise ValueError('Original source ball radius mutated')
  result[n]=cq.Solid.makeSphere(3.72,original[n].Center(),angleDegrees1=-90,angleDegrees2=90)
 return result
def first_touch(ball,shape):
 if minimum(ball,turn(shape,2,'z'))>1e-5:raise ValueError('No contact bracket')
 lo,hi=0.,2.
 for _ in range(14):
  mid=(lo+hi)/2
  if minimum(ball,turn(shape,mid,'z'))<=1e-5:hi=mid
  else:lo=mid
 return round(hi,6)
def check(root,out):
 if out.exists():raise FileExistsError('Source QA evidence must not be overwritten')
 prior=source(root);current=resize(prior);stable=set(prior)-set(BALLS)
 if len(stable)!=78:raise ValueError('Expected exactly 78 original unchanged CAD bodies')
 aabb=exact=0;clashes=[]
 ids=sorted(current)
 for i,n in enumerate(ids):
  for m in ids[i+1:]:
   if n in stable and m in stable:continue
   if not near(current[n],current[m]):aabb+=1;continue
   exact+=1;overlap=float(current[n].intersect(current[m]).Volume())
   if not math.isfinite(overlap):raise ValueError('Invalid native Boolean')
   if overlap>.05:clashes.append([n,m,round(overlap,6)])
 if (aabb,exact)!=(465,18) or clashes:raise ValueError('P2.34E 483 static CAD pair gate FAIL')
 rows=[]
 for bend in ANGLES:
  shaft=turn(current[SHAFT],bend);cage=turn(current[CAGE],bend/2);cup=current[CUP]
  balls=[turn(current[n],bend/2) for n in BALLS]
  if any(near(a,b) for i,a in enumerate(balls) for b in balls[i+1:]):raise ValueError('Ball-ball possible overlap')
  ds=[minimum(ball,shaft) for ball in balls]
  dc=[minimum(ball,cup) for ball in balls]
  dg=[minimum(ball,cage) for ball in balls]
  if min(ds+dc+dg)<=1e-5:raise ValueError('CV sampled ball no longer separated from track')
  rows.append({'angleDeg':bend,'minShaftGapMm':round(min(ds),6),'minCupGapMm':round(min(dc),6),'minCageGapMm':round(min(dg),6)})
 contacts={key:{'shaftDeg':first_touch(state[BALLS[0]],state[SHAFT]),
                   'cupDeg':first_touch(state[BALLS[0]],state[CUP])} for key,state in [('before',prior),('after',current)]}
 if not (contacts['after']['shaftDeg']<contacts['before']['shaftDeg'] and contacts['after']['cupDeg']<contacts['before']['cupDeg']):
  raise ValueError('No measured change in geometric first-contact rotation')
 doc={'schema':'peds.cad-first.p234e-repo-source84-cv-clearance-gate.v1','patch':'P2.34/54',
  'status':'STATIC84_AND_11_PRESCRIBED_POSES_PASS_FUNCTIONAL_CV_G2_HOLD',
  'verifiedInputSHA256':PINS,'sourceBodies':84,'inheritedNativePairs':3003,
  'changedNativePairs':483,'aabbSeparated':aabb,'exactNativeBooleans':exact,'interferences':clashes,
  'newBallRadiusMm':3.72,'oldBallRadiusMm':3.60,'poses':rows,
  'ballTrackMinimumDistanceChecks':198,'firstContactGeometryDeg':contacts,
  'outputConstantVelocityRatioMeasured':False,'loadedTorquePathCertified':False,
  'modelBFullCarIncluded':False,'mechanicalG2Certified':False}
 out.mkdir(parents=True);(out/'P234E_repo_native_clearance_gate.json').write_text(json.dumps(doc,indent=2)+'\n')
 return doc
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--p234d-native',type=Path,required=True);p.add_argument('--out',type=Path,required=True)
 a=p.parse_args();r=check(a.p234d_native,a.out)
 print(json.dumps({'status':r['status'],'pairCount':r['changedNativePairs'],'minPoseGapMm':min(x['minShaftGapMm'] for x in r['poses']),'firstContact':r['firstContactGeometryDeg']},indent=2))
