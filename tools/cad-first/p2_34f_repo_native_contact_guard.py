#!/usr/bin/env python3
"""P2.34F GitHub-side independently reproducible original 84-BRep contact guard.

Only original P2.34E SHA-pinned STEP/index/audit. Samples safe independent
race-angle contact brackets and intentional near-point position shifts.
This does NOT solve CV dynamics, continuous torque transfer or Model B G2.
"""
from __future__ import annotations
import argparse,hashlib,json,math
from pathlib import Path
import cadquery as cq
from OCP.BRepExtrema import BRepExtrema_DistShapeShape
PINS={'P234E_source84_revised_six_ball_clearance.step':'9bd7ec6a60d5c4c9f1f3e421cb730fc252de026aae21dcf570584e5dda0ec63e',
'P234E_source84_name_index.json':'57afa74054ca892d2cb5633fb1c03a3c906fc2a928adf45f4674aa008952a62a',
'P234E_source84_ball_contact_audit.json':'b2eb8da1720cd5bf206e716e24ad8ebdde28d620bf31aaea456edb1b05e4b894'}
SHAFT='P217_REAR_DRIVE_HALF_SHAFT_UNSPLINED';CUP='P217_REAR_CV_HOUSING_PROTOTYPE';BALL='P234C_REAR_CV_TORQUE_BALL_02';Z=-239.5

def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def source(folder):
 for name,pin in PINS.items():
  if not (folder/name).is_file() or sha(folder/name)!=pin:raise ValueError('original SHA-256 mismatch '+name)
 doc=json.loads((folder/'P234E_source84_name_index.json').read_text())
 m=doc['nameToZeroBasedSolidIndex']
 if doc['partCount']!=84 or set(m.values())!=set(range(84)) or doc['sourceStepSHA256']!=PINS['P234E_source84_revised_six_ball_clearance.step']:
  raise ValueError('original P2.34E native source name mapping invalid')
 imported=cq.importers.importStep(str(folder/'P234E_source84_revised_six_ball_clearance.step')).solids().vals()
 if len(imported)!=84 or any(not p.isValid() for p in imported):raise ValueError('source84 STEP invalid')
 return {name:imported[i] for name,i in m.items()}
def rot(p,axis,deg):return p.rotate((0,0,Z),((1,0,Z) if axis=='x' else (0,0,Z+1)),deg)
def nearest(a,b):
 q=BRepExtrema_DistShapeShape(a.wrapped,b.wrapped);q.Perform()
 if not q.IsDone():raise ValueError('Native OCC distance failed')
 return float(q.Value()),q

def probe(folder,out):
 if out.exists():raise FileExistsError('P2.34F refuses overwrite')
 p=source(folder);ball=rot(p[BALL],'x',5)
 shaft=lambda deg:rot(rot(p[SHAFT],'z',deg),'x',10)
 cup=lambda deg:rot(p[CUP],'z',-deg)
 brackets={}
 for name,shape,lo,hi in [('shaft',shaft,.2,.3),('cup',cup,.9,1.1)]:
  left=nearest(ball,shape(lo))[0];right=nearest(ball,shape(hi))[0]
  if not left>.005 or not right<1e-5:raise ValueError('Real BRep first-contact bracket did not hold')
  brackets[name]={'disjointAngleDeg':lo,'disjointGapMm':round(left,6),'contactAngleDeg':hi,'contactGapMm':round(right,6)}
 shaft10=rot(p[SHAFT],'x',10)
 gap,kernel=nearest(ball,shaft10)
 a=kernel.PointOnShape1(1);b=kernel.PointOnShape2(1)
 delta=(b.X()-a.X(),b.Y()-a.Y(),b.Z()-a.Z());length=math.sqrt(sum(x*x for x in delta))
 if abs(gap-length)>1e-4 or not .073<gap<.075:raise ValueError('Nearest BRep witness invalid')
 unit=[x/length for x in delta];shifts={}
 for offset in (.1,.12):
  moved=ball.translate(tuple(offset*x for x in unit))
  volume=float(moved.intersect(shaft10).Volume())
  shifts[str(offset)]=round(volume,8)
 if shifts['0.1']<=0 or shifts['0.12']<=.05:raise ValueError('BRep interference negative control failed')
 report={'schema':'peds.cad-first.p234f-original84-repo-contact-guard.v1',
  'realBRepCount':84,'sourceSHA256':PINS,'bendDeg':10,'ballSourceId':BALL,
  'twoIndependentRaceContactBrackets':brackets,'originalShaftBallGapMm':round(gap,6),
  'offsetMmToBooleanOverlapMm3':shifts,'actualTransmissionSpeedRatioMeasured':False,
  'source84Rebuilt':False,'fullOriginalModelBIncluded':False,'mechanicalG2Certified':False,
  'status':'GEOMETRIC_CONTACT_AND_TOLERANCE_SENSITIVITY_DETECTED_CV_G2_HOLD'}
 out.mkdir(parents=True)
 (out/'P234F_repo_native_contact_guard.json').write_text(json.dumps(report,indent=2)+'\n')
 return report
if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('--original-p234e-native',type=Path,required=True);a.add_argument('--out',type=Path,required=True)
 x=a.parse_args();r=probe(x.original_p234e_native,x.out);print(json.dumps(r,indent=2))
