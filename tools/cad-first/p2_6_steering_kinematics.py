#!/usr/bin/env python3
"""P2.6: source-specific idealized steering mate, NOT a manufactured F1 mechanism.

Coordinates are original P2.4 CAD millimetres. A rigid upright pivots about
the upper/lower authored outer-joint centers; a single rack endpoint travels
on Z such that the unscaled tie-rod length is mathematically conserved.
Bump/rebound, Ackermann, forces, link articulation and continuous motion
are deliberately NOT asserted.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import numpy as np

KINGPIN=np.array([-98.,0.,-170.])
TIE_OUTER=np.array([114.,0.,-170.])
RACK_REST=np.array([-260.,-49.,-290.])
UPPER_OUTER=np.array([-98.,114.,-170.])
LOWER_OUTER=np.array([-98.,-114.,-170.])
UPPER_CHASSIS=np.array([-355.,225.,-280.])
LOWER_CHASSIS=np.array([-360.,-216.,-285.])
TIE_LENGTH=float(np.linalg.norm(TIE_OUTER-RACK_REST))

def pose(degrees):
    if not math.isfinite(degrees) or abs(degrees)>8:
        raise ValueError('Steering study limited to +/-8 degrees')
    a=math.radians(degrees)
    c,s=math.cos(a),math.sin(a)
    matrix=np.array([[c,0,s],[0,1,0],[-s,0,c]])
    new_outer=KINGPIN+matrix@(TIE_OUTER-KINGPIN)
    dx,dy=(new_outer-RACK_REST)[:2]
    radicand=TIE_LENGTH**2-dx**2-dy**2
    if radicand<0:raise ValueError('Rod/rack closure impossible')
    new_rack=RACK_REST.copy()
    new_rack[2]=new_outer[2]-math.sqrt(radicand)
    upper=KINGPIN+matrix@(UPPER_OUTER-KINGPIN)
    lower=KINGPIN+matrix@(LOWER_OUTER-KINGPIN)
    errors=[
        float(np.linalg.norm(new_outer-new_rack)-TIE_LENGTH),
        float(np.linalg.norm(upper-UPPER_OUTER)),
        float(np.linalg.norm(lower-LOWER_OUTER)),
        float(np.linalg.norm(upper-UPPER_CHASSIS)-np.linalg.norm(UPPER_OUTER-UPPER_CHASSIS)),
        float(np.linalg.norm(lower-LOWER_CHASSIS)-np.linalg.norm(LOWER_OUTER-LOWER_CHASSIS)),
    ]
    if max(abs(e) for e in errors)>1e-8:
        raise AssertionError('Constraint length residual')
    return {
        'steerDeg':degrees,'tieOuterWorldMm':new_outer.tolist(),
        'rackAnchorMm':new_rack.tolist(),
        'rackTravelZmm':float(new_rack[2]-RACK_REST[2]),
        'tieRodLengthMm':TIE_LENGTH,
        'maximumAbsoluteLinkResidualMm':max(abs(e) for e in errors),
    }

def report(manifest,audit):
    m=json.loads(Path(manifest).read_text())
    a=json.loads(Path(audit).read_text())
    if m['staticCollisionAudit']['sha256']!=hashlib.sha256(Path(audit).read_bytes()).hexdigest():
        raise ValueError('Static source checksum mismatch')
    if m['masterSTEPsha256']!=a['sourceSTEPsha256'] or not a['allStaticPairsPass']:
        raise ValueError('P2.4 baseline invalid')
    poses=[pose(angle) for angle in range(-8,9)]
    return {
        'schema':'podium-eds.p2.cad-first.steering-kinematics.v1',
        'sourceSTEPsha256':m['masterSTEPsha256'],
        'sourceManifestSha256':hashlib.sha256(Path(manifest).read_bytes()).hexdigest(),
        'staticAuditSha256':hashlib.sha256(Path(audit).read_bytes()).hexdigest(),
        'poses':poses,
        'worstLinkResidualMm':max(p['maximumAbsoluteLinkResidualMm'] for p in poses),
        'physicalKinematicCertified':False,
        'suspensionBumpSolved':False,
        'continuousCollisionTested':False,
    }

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--folder',type=Path,required=True)
    p.add_argument('--out',type=Path,required=True)
    args=p.parse_args()
    result=report(args.folder/'P2_4_fit_manifest.json',args.folder/'P2_4_static_fit_audit.json')
    args.out.parent.mkdir(parents=True,exist_ok=True)
    args.out.write_text(json.dumps(result,indent=2)+'\n')
    print('MATE LENGTH: PASS',len(result['poses']),'sampled poses')
