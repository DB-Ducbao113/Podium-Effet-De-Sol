#!/usr/bin/env python3
"""P2.34D real P2.34C source84 geometric ball/cage capture gate.

The full native STEP/GLB exporters and stronger 9-test suite are bundled in
PEDS_P234D handoff. This repository-side gate can run directly against the
original pinned P2.34C STEP/index/audit. G2 remains HOLD.
"""
from __future__ import annotations
import argparse,hashlib,json,math
from pathlib import Path
import cadquery as cq
from OCP.BRepExtrema import BRepExtrema_DistShapeShape

PINS={
 'P234C_original_source84_six_ball_proto_static.step':'a5f961b580dbb142c63c9790840131cc181a739104653089cba5a80a65f53f46',
 'P234C_source84_step_name_map.json':'c91381e22c67274a2655d4b63c04bec3250229c94127866146848ef8e02095f4',
 'P234C_source84_native_audit.json':'3dc4226561212625c14234645af090bc76758a5d5f2baa67637cb473be3b23ef',
}
CUP='P217_REAR_CV_HOUSING_PROTOTYPE';SHAFT='P217_REAR_DRIVE_HALF_SHAFT_UNSPLINED'
CAGE='P234C_REAR_CV_BALL_GUIDE_CAGE';BALLS=[f'P234C_REAR_CV_TORQUE_BALL_{n:02d}' for n in range(1,7)]
RING='P234B_REAR_CV_SHAFT_SPLIT_RETENTION_RING';Z=-239.5
ANGLES=(-10,-7,-5,-3,-1,0,1,3,5,7,10)

def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def cyl(r,h,z):return cq.Solid.makeCylinder(r,h,cq.Vector(0,0,z))
def ann(outer,inner,h,z):return cyl(outer,h,z).cut(cyl(inner,h+.2,z-.1))
def bbox(a,b):
 x,y=a.BoundingBox(),b.BoundingBox()
 return all(min(getattr(x,k+'max'),getattr(y,k+'max'))-max(getattr(x,k+'min'),getattr(y,k+'min'))>1e-6 for k in 'xyz')

def original(folder):
 for n,expected in PINS.items():
  p=folder/n
  if not p.is_file() or sha(p)!=expected:raise ValueError('P2.34C source SHA mismatch: '+n)
 idx=json.loads((folder/'P234C_source84_step_name_map.json').read_text())
 report=json.loads((folder/'P234C_source84_native_audit.json').read_text())
 ids=idx['nameToZeroBasedSolidIndex']
 if len(ids)!=84 or set(ids.values())!=set(range(84)) or not report['full84SourceStaticAudit']['passNominalStatic'] or not report['sampledNineBodyBendAudit']['sampledLocalGeometricPass']:
  raise ValueError('Real 84 native P2.34C source not PASS')
 solids=cq.importers.importStep(str(folder/'P234C_original_source84_six_ball_proto_static.step')).solids().vals()
 if len(solids)!=84 or not all(s.isValid() and len(s.Solids())==1 for s in solids):
  raise ValueError('84 real native original STEP source missing')
 return {n:solids[k] for n,k in ids.items()}

def revised(old):
 cup=old[CUP]
 if abs(cup.BoundingBox().zmin+245)>.02 or abs(cup.BoundingBox().zmax+234)>.02:
  raise ValueError('Unapproved owner CV cup datum')
 for solid in [ann(40,35.5,1.5,-246.5),ann(40,35.5,1.5,-234),ann(35.55,31.5,.30,-246.5),ann(35.55,31.5,.30,-232.8)]:
  cup=cup.fuse(solid).clean()
 cage=old[CAGE].intersect(cq.Workplane('XY').box(90,90,7).val().translate((0,0,Z))).clean()
 if any(not s.isValid() or len(s.Solids())!=1 for s in (cup,cage)):
  raise ValueError('Native housing/cage retainer geometry failed')
 return {**old,CUP:cup,CAGE:cage}

def audit(old,new):
 unchanged=set(old)-{CUP,CAGE};names=sorted(new)
 if len(old)!=84 or set(new)!=set(old) or len(unchanged)!=82:raise ValueError('Owner part IDs changed')
 excluded=exact=0;collisions=[];errors=[]
 for i,a in enumerate(names):
  for b in names[i+1:]:
   if a in unchanged and b in unchanged:continue
   if not bbox(new[a],new[b]):excluded+=1;continue
   exact+=1
   try:
    v=float(new[a].intersect(new[b]).Volume())
    if not math.isfinite(v) or v<0:raise ValueError('Bad OCC volume')
    if v>.05:collisions.append((a,b,round(v,6)))
   except Exception as error:errors.append((a,b,str(error)))
 if (excluded,exact)!=(149,16):raise AssertionError('165 affected source84 pairs not checked')
 return {'allPairs':3486,'inheritedUnchangedPairs':3321,'affectedPairs':165,
   'AABBExcluded':excluded,'exactOpenCascadePairs':exact,'collisions':collisions,
   'kernelErrors':errors,'passStatic':not collisions and not errors}

def poses(old,new):
 checked=0;rows=[]
 for deg in ANGLES:
  def rot(shape,angle):return shape.rotate((0,0,Z),(1,0,Z),angle)
  shapes={CUP:new[CUP],SHAFT:rot(new[SHAFT],deg),CAGE:rot(new[CAGE],deg/2)}
  shapes.update({n:rot(new[n],deg/2) for n in BALLS})
  candidates=clashes=0
  names=sorted(shapes)
  for i,a in enumerate(names):
   for b in names[i+1:]:
    if not bbox(shapes[a],shapes[b]):continue
    candidates+=1
    v=shapes[a].intersect(shapes[b]).Volume()
    if v>.05:clashes+=1
  checked+=candidates
  housing_box=new[CUP].BoundingBox();old_box=old[CUP].BoundingBox()
  margins=[min(shapes[n].BoundingBox().zmin-housing_box.zmin,
               housing_box.zmax-shapes[n].BoundingBox().zmax) for n in BALLS]
  previous=[min(shapes[n].BoundingBox().zmin-old_box.zmin,
                old_box.zmax-shapes[n].BoundingBox().zmax) for n in BALLS]
  cage=shapes[CAGE].BoundingBox()
  cage_margin=min(cage.zmin-housing_box.zmin,housing_box.zmax-cage.zmax)
  rows.append({'angleDeg':deg,'nativeExactPairs':candidates,'clashes':clashes,
    'oldCupProtrudingBalls':sum(x<0 for x in previous),
    'newCupProtrudingBalls':sum(x<0 for x in margins),
    'minBallAxialMarginMm':round(min(margins),6),
    'minCageAxialMarginMm':round(cage_margin,6)})
 if checked!=231 or any(r['clashes'] or r['newCupProtrudingBalls'] or
      r['minBallAxialMarginMm']<=0 or r['minCageAxialMarginMm']<=0 for r in rows):
  raise ValueError('Local 11-pose ball/cage envelope HOLD')
 forces={}
 for label,body in [('ball',new[BALLS[1]]),('cage',new[CAGE])]:
  for direction in (-4,4):
   forces[f'{label}_{direction:+d}mm']=round(float(body.translate((0,0,direction)).intersect(new[CUP]).Volume()),6)
 if min(forces.values())<1:raise ValueError('Integral cup lip axial interference control failed')
 oldclip=new[CUP].translate((0,0,.5)).intersect(new[RING]).Volume()
 if oldclip>.05:raise ValueError('Legacy clip expected unretained new cup')
 return {'angles':rows,'totalPosePairs':396,'actualNativeBooleanPairs':checked,
   'forcedAxialLipInterferenceMm3':forces,'legacyRingHousing05mmCollisionMm3':round(oldclip,6),
   'sampledLocalAndAxialEnvelopePASS':True,'functionalCVSpeedRatioCertified':False,
   'cupToGearboxRetentionCertified':False,'mechanicalG2Certified':False}

def run(root,out):
 if out.exists():raise FileExistsError('Cannot overwrite source evidence')
 before=original(root);after=revised(before)
 static=audit(before,after);motion=poses(before,after)
 if not static['passStatic']:raise ValueError('Original 84 BRep nominal collision FAIL')
 result={'schema':'peds.cad-first.p234d-source84-repo-native-gate.v1','patch':'P2.34/54',
  'originalP234CSHA256':PINS,'changedOriginalParts':[CUP,CAGE],'solids':84,
  'static':static,'sampledMotionAndEnvelope':motion,
  'wholeModelBIncluded':False,'functionalCVVerified':False,'mechanicalG2Certified':False}
 out.mkdir(parents=True);(out/'P234D_repo_gate.json').write_text(json.dumps(result,indent=2)+'\n')
 return result
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--p234c-native',required=True,type=Path)
 p.add_argument('--out',required=True,type=Path);a=p.parse_args()
 doc=run(a.p234c_native,a.out)
 print(json.dumps({'solids':84,'static':doc['static'],'poses':len(doc['sampledMotionAndEnvelope']['angles'])},indent=2))
