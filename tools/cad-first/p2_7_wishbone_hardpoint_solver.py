#!/usr/bin/env python3
"""P2.7 proposed double-wishbone hardpoint solver — NOT approved source CAD.

Adds 4 PROJECT-AUTHORED chassis-side pivots and a rigid upright constraint
to the existing P2.6 original front-left CAD dimensional frame. Does not
claim that suspension bump is valid in the P2.6 GLB: its original arms have
NOT been replaced by these hardpoint-governed wishbones.

True rigid-body motion, wheel camber, tie rod, link volumes, native B-Rep
collisions and full commercial authenticity remain separate acceptance gates.

Requires numpy and scipy in tools/cad-first authoring environment.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import numpy as np
from scipy.optimize import root

# All mm in the original source. Axle +Z, vertical +Y, left corner.
UPPER_OUTER = np.array([-98.,114.,-170.])
LOWER_OUTER = np.array([-98.,-114.,-170.])
UPPER_INNER_A = np.array([-370.,190.,-285.])
UPPER_INNER_B = np.array([-370.,190.,-235.])
LOWER_INNER_A = np.array([-370.,-190.,-285.])
LOWER_INNER_B = np.array([-370.,-190.,-235.])
SOURCE_STEP_SHA = '6879b9373bdc36f830a2f270859d423e705cd80bd31533b2f1dbcf92a8f9c772'
INNER = (UPPER_INNER_A,UPPER_INNER_B,LOWER_INNER_A,LOWER_INNER_B)
DIST = lambda a,b: float(np.linalg.norm(a-b))
REST_LENGTHS = [
    DIST(UPPER_OUTER,UPPER_INNER_A),
    DIST(UPPER_OUTER,UPPER_INNER_B),
    DIST(LOWER_OUTER,LOWER_INNER_A),
    DIST(LOWER_OUTER,LOWER_INNER_B),
    DIST(UPPER_OUTER,LOWER_OUTER)
]
REST = np.array([*UPPER_OUTER,LOWER_OUTER[0],LOWER_OUTER[2]])

def pose(lower_bump_mm: float, seed: np.ndarray):
    if not -15<=lower_bump_mm<=15:
        raise ValueError('Bump proposal limited to -15..+15 mm')
    def vertices(v):
        return v[:3],np.array([v[3],LOWER_OUTER[1]+lower_bump_mm,v[4]])
    def solve_constraints(v):
        u,l=vertices(v)
        mm2=[
            np.dot(u-UPPER_INNER_A,u-UPPER_INNER_A)-REST_LENGTHS[0]**2,
            np.dot(u-UPPER_INNER_B,u-UPPER_INNER_B)-REST_LENGTHS[1]**2,
            np.dot(l-LOWER_INNER_A,l-LOWER_INNER_A)-REST_LENGTHS[2]**2,
            np.dot(l-LOWER_INNER_B,l-LOWER_INNER_B)-REST_LENGTHS[3]**2,
            np.dot(u-l,u-l)-REST_LENGTHS[4]**2,
        ]
        return np.asarray(mm2)/10000.
    result=root(solve_constraints,seed,method='hybr',tol=1e-10)
    upper,lower=vertices(result.x)
    distances=[
        DIST(upper,UPPER_INNER_A),DIST(upper,UPPER_INNER_B),
        DIST(lower,LOWER_INNER_A),DIST(lower,LOWER_INNER_B),
        DIST(upper,lower)
    ]
    largest=max(abs(value-expected) for value,expected in zip(distances,REST_LENGTHS))
    if not result.success or largest>1e-6:
        raise ValueError(f'Hardpoint constraints do not close at bump={lower_bump_mm}: {largest}')
    kingpin=upper-lower
    kingpin/=np.linalg.norm(kingpin)
    return result.x,{
        'lowerBumpMm':lower_bump_mm,
        'upperOuterMm':upper.tolist(),
        'lowerOuterMm':lower.tolist(),
        'kingpinDirection':kingpin.tolist(),
        'maximumLinkLengthErrorMm':largest,
        'isProductionFitValid':False,
    }

def compute():
    results={}
    for sweep in [range(0,16),range(-1,-16,-1)]:
        seed=REST.copy()
        for travel in sweep:
            seed,record=pose(float(travel),seed)
            results[travel]=record
    return {
        'schema':'podium-eds.p2.cad-first.hardpoint-proposal.v1',
        'source':'Original P2.6 CAD dimensional frame, NEW unmachined project-authored hardpoints',
        'sourceSTEPSha256':SOURCE_STEP_SHA,
        'units':'mm',
        'hardpoints':{
            'upperOuter':UPPER_OUTER.tolist(),
            'lowerOuter':LOWER_OUTER.tolist(),
            'upperChassisA':UPPER_INNER_A.tolist(),
            'upperChassisB':UPPER_INNER_B.tolist(),
            'lowerChassisA':LOWER_INNER_A.tolist(),
            'lowerChassisB':LOWER_INNER_B.tolist(),
        },
        'restLinkLengthsMm':REST_LENGTHS,
        'sampledPoses':[results[i] for i in range(-15,16)],
        'maxSampledLinkLengthErrorMm':max(
            row['maximumLinkLengthErrorMm'] for row in results.values()
        ),
        'physicalSuspensionVerified':False,
        'sourceWishboneBRepBuilt':False,
        'continuousCollisionPassed':False,
        'kingpinSteeringSimultaneouslySolved':False,
        'chassisMountsCertified':False,
        'notActualF1Engineering':True,
    }

if __name__=='__main__':
    cli=argparse.ArgumentParser(description=__doc__)
    cli.add_argument('--out',type=Path,required=True)
    args=cli.parse_args()
    evidence=compute()
    args.out.parent.mkdir(parents=True,exist_ok=True)
    args.out.write_text(json.dumps(evidence,indent=2)+'\n',encoding='utf-8')
    print('P2.7 PROPOSED HARDPOINTS:',
          len(evidence['sampledPoses']),'kinematic poses; max link residual',
          evidence['maxSampledLinkLengthErrorMm'],'mm')
