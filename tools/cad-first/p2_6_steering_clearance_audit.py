#!/usr/bin/env python3
"""P2.6 nine-pose native CAD source-clearance audit; NOT continuous certification.

Checks real volume overlap between two fixed wishbone rods + one idealized,
length-preserving tie rod and all 50 steered corner parts at -8..+8 by 2°.
All source geometry is project-authored B-Rep. Same-rigid-group pairs inherit
the SHA-matched P2.4 neutral static audit and cannot gain interference under
their shared rigid transform; only cross-group pairs change relative pose.
"""
import argparse,hashlib,json,math
from pathlib import Path
import numpy as np
import cadquery as cq
from p2_6_steering_relief import make_steering_parts,move_tie,LINKS
from p2_6_steering_kinematics import pose as steer_pose,KINGPIN

THRESH=0.05

def intersect_boxes(a,b):
    x,y=a.BoundingBox(),b.BoundingBox()
    return all(
        min(getattr(x,d+'max'),getattr(y,d+'max'))-
        max(getattr(x,d+'min'),getattr(y,d+'min'))>0.00001
        for d in 'xyz'
    )

def check(folder):
    m=json.loads((folder/'P2_6_steering_manifest.json').read_text())
    source=folder/m['sourceSTEP']
    if hashlib.sha256(source.read_bytes()).hexdigest()!=m['sourceSTEPsha256']:
        raise ValueError('P2.6 STEP sha mismatch')
    roundtrip=cq.importers.importStep(str(source)).solids().vals()
    if len(roundtrip)!=53 or not all(s.isValid() and s.Volume()>0 for s in roundtrip):
        raise ValueError('P2.6 STEP geometry invalid on reimport')
    parts,_=make_steering_parts()
    if set(parts)!=set(m['parts']):raise ValueError('CAD semantic source mismatch')
    reports=[]
    for degrees in (-8,-6,-4,-2,0,2,4,6,8):
        pose=steer_pose(degrees)
        changed={
            n:s.rotate(tuple(KINGPIN),tuple(KINGPIN+np.array([0.,1.,0.])),float(degrees))
            for n,s in parts.items() if n not in LINKS
        }
        collisions=[];errors=[];checks=0
        rod_shapes={
            n:(move_tie(parts[n],pose) if n=='P2_TIE_ROD' else parts[n])
            for n in LINKS
        }
        for name,rod in rod_shapes.items():
            for other,solid in changed.items():
                if not intersect_boxes(rod,solid):continue
                checks+=1
                try:
                    v=rod.intersect(solid).Volume()
                    if not math.isfinite(v):raise ValueError('Nonfinite overlap')
                    if v>THRESH:collisions.append({'a':name,'b':other,'mm3':round(v,6)})
                except Exception as error:
                    errors.append({'a':name,'b':other,'reason':str(error)})
        # Even though P2.4 static passed, the tie rod is moving relative to
        # both fixed wishbone rods and needs a separate check at every pose.
        for name in ('P2_UPPER_WISHBONE_LINK','P2_LOWER_WISHBONE_LINK'):
            tie=rod_shapes['P2_TIE_ROD']
            rod=rod_shapes[name]
            if not intersect_boxes(tie,rod):continue
            checks+=1
            v=tie.intersect(rod).Volume()
            if v>THRESH:collisions.append({'a':'P2_TIE_ROD','b':name,'mm3':round(v,6)})
        reports.append({'steerDeg':degrees,'exactBrepPairs':checks,
                        'collisions':collisions,'booleanErrors':errors,
                        'linkLengthResidualMm':pose['maximumAbsoluteLinkResidualMm']})
    return {
        'schema':'podium-eds.p2.cad-first.steering-audit.v1',
        'sourceSTEPsha256':m['sourceSTEPsha256'],
        'sourceManifestSha256':hashlib.sha256((folder/'P2_6_steering_manifest.json').read_bytes()).hexdigest(),
        'validCadSolids':len(roundtrip),
        'cadFaces':sum(len(s.Faces()) for s in roundtrip),
        'poses':reports,
        'exactPairs':sum(r['exactBrepPairs'] for r in reports),
        'sampledSteeringPass':all(not r['collisions'] and not r['booleanErrors'] for r in reports),
        'thresholdMm3':THRESH,
        'notCertified':['unsampled angles','bump/rebound','suspension hardpoints',
                        'loads','steering rack fabrication','F1 manufacturer geometry']
    }

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--folder',type=Path,required=True)
    p.add_argument('--report',type=Path,required=True)
    a=p.parse_args()
    outcome=check(a.folder)
    a.report.write_text(json.dumps(outcome,indent=2)+'\n')
    print('P2.6 SAMPLED STEERING', 'PASS' if outcome['sampledSteeringPass'] else 'FAIL')
