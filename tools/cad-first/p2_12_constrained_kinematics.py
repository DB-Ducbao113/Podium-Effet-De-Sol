#!/usr/bin/env python3
"""P2.12 constrained rear toe PROPOSAL kinematics, not mechanical approval.

Solve six geometric constraints on the source rear upright: four rigid-leg
lengths from upper/lower A-arms, fixed chassis-to-outer toe eye length after
thread adjustment, and fixed nominal wheel centre ride height. Report both
ideal A-arm hinge rotations and the UNVALIDATED pin-to-bearing-axis angles.

P2.9–P2.12 hardpoints are project-authored; NOT verified chassis measurements.
This solver never modifies the source 19 CAD solids or certifies a physical mate.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import numpy as np
from scipy.optimize import least_squares
from scipy.spatial.transform import Rotation
from p2_10_rear_wishbone import ARM_PICKUPS_MM,OUTER_EYE_Z_OFFSET_MM
from p2_11_rear_toe_link import TOE_OUTER_EYE_MM,TOE_INNER_EYE_MM
from p2_12_toe_adjuster import THREAD_PITCH_MM,SCHEMA as P212_SCHEMA

SCHEMA='podium-eds.p212.v3.constrained-six-dof-ideal-joints.v1'
ANGLES=(-180,-90,-45,0,45,90,180)
MAX_TURN_DEG=180.0
LENGTH_TOLERANCE_MM=.001
PIVOT_TOLERANCE_MM=.001
MAX_TRANSLATION_MM=10.
MAX_ROTATION_RAD=float(np.deg2rad(3.))

def immutable_source()->dict:
    """Copy the actual source CAD datums, never mutate module/global geometry."""
    arms=[]
    for station in ('UPPER','LOWER'):
        raw=ARM_PICKUPS_MM[station]
        end=np.asarray(raw['outerUprightBore'],dtype=float).copy()
        end[2]+=OUTER_EYE_Z_OFFSET_MM
        a=np.asarray(raw['innerA'],dtype=float).copy()
        b=np.asarray(raw['innerB'],dtype=float).copy()
        arms.append((station,end,a,b))
    outer=np.asarray(TOE_OUTER_EYE_MM,dtype=float).copy()
    inner=np.asarray(TOE_INNER_EYE_MM,dtype=float).copy()
    for p in [outer,inner]+[p for _,end,a,b in arms for p in (end,a,b)]:
        if p.shape!=(3,) or not np.all(np.isfinite(p)):
            raise ValueError('Invalid original source pickup point')
    for name,_,a,b in arms:
        if np.linalg.norm(b-a)<1:
            raise ValueError('Degenerate rear wishbone chassis pivot axis: '+name)
    return {'arms':arms,'toeOuter':outer,'toeInner':inner}

def rot_about_axis(point,origin,axis,angle_rad):
    return origin+Rotation.from_rotvec(axis*angle_rad).apply(point-origin)

def signed_hinge_angle(start,end,a,b):
    axis=b-a
    axis/=np.linalg.norm(axis)
    initial=start-a
    target=end-a
    initial-=axis*np.dot(initial,axis)
    target-=axis*np.dot(target,axis)
    if min(np.linalg.norm(initial),np.linalg.norm(target))<.01:
        raise RuntimeError('Unobservable ideal wishbone hinge')
    radians=float(np.arctan2(np.dot(axis,np.cross(initial,target)),
                            np.dot(initial,target)))
    reconstruction=rot_about_axis(start,a,axis,radians)
    return radians,float(np.linalg.norm(reconstruction-end))

def solve_angle(turn_deg:float,source:dict|None=None)->dict:
    if not np.isfinite(turn_deg) or abs(turn_deg)>MAX_TURN_DEG:
        raise ValueError('Outside P2.12 preliminary angle domain [-180,180]')
    geometry=source if source is not None else immutable_source()
    arms=geometry['arms']
    toe_outer,toe_inner=geometry['toeOuter'],geometry['toeInner']
    legs=[(name+'-A',end,a) for name,end,a,b in arms]
    legs +=[(name+'-B',end,b) for name,end,a,b in arms]
    lengths=np.asarray([np.linalg.norm(end-pick) for _,end,pick in legs])
    nominal=float(np.linalg.norm(toe_outer-toe_inner))
    extension=2*THREAD_PITCH_MM*turn_deg/360.
    target=nominal+extension
    if not np.isfinite(target) or target<=0 or not np.all(np.isfinite(lengths)):
        raise ValueError('Invalid P2.12 linkage distance/geometry')

    def residual(x):
        translation=x[:3]
        rotation=Rotation.from_rotvec(x[3:])
        r=[np.linalg.norm(rotation.apply(end)+translation-pick)-lengths[i]
           for i,(_,end,pick) in enumerate(legs)]
        moved=rotation.apply(toe_outer)+translation
        return np.asarray([*r,np.linalg.norm(toe_inner-moved)-target,
                           translation[1]],dtype=float)

    lo=np.asarray([-MAX_TRANSLATION_MM]*3+[-MAX_ROTATION_RAD]*3)
    fit=least_squares(residual,np.zeros(6),bounds=(lo,-lo),x_scale='jac',
                      xtol=1e-13,ftol=1e-13,gtol=1e-13,
                      method='trf',max_nfev=600)
    if (not fit.success or not np.all(np.isfinite(fit.x)) or
        not np.all(np.isfinite(fit.fun)) or
        np.max(np.abs(fit.fun))>LENGTH_TOLERANCE_MM):
        raise RuntimeError('No closed six-constraint source-proposal solution')
    singular=np.linalg.svd(fit.jac,compute_uv=False)
    if len(singular)!=6 or singular[-1]<1e-8 or singular[0]/singular[-1]>1e8:
        raise RuntimeError('Degenerate/poorly observable P2.12 source solution')
    translation=fit.x[:3]
    rotation=Rotation.from_rotvec(fit.x[3:])
    moved_toe=rotation.apply(toe_outer)+translation
    new_axis=(toe_inner-moved_toe)/np.linalg.norm(toe_inner-moved_toe)
    old_axis=(toe_inner-toe_outer)/nominal
    align=Rotation.align_vectors([new_axis],[old_axis])[0]
    original_bore_axis=np.asarray([0.,0.,1.])
    upright_bore_axis=rotation.apply(original_bore_axis)
    toe_bore_axis=align.apply(original_bore_axis)
    def axis_mismatch(first,second):
        return float(np.rad2deg(np.arccos(np.clip(abs(np.dot(first,second)),-1.,1.))))
    wishbones=[]
    for name,end,a,b in arms:
        new_end=rotation.apply(end)+translation
        hinge,closure=signed_hinge_angle(end,new_end,a,b)
        local_axis=(b-a)/np.linalg.norm(b-a)
        arm_bore_axis=Rotation.from_rotvec(local_axis*hinge).apply(original_bore_axis)
        if closure>PIVOT_TOLERANCE_MM:
            raise RuntimeError('Wishbone hinge cannot close on its two inner chassis pivots')
        wishbones.append({
          'station':name,
          'chassisInnerPivotAmm':a.tolist(),
          'chassisInnerPivotBmm':b.tolist(),
          'movedOuterBallCentreMm':new_end.tolist(),
          'idealInnerHingeRotationDeg':float(np.rad2deg(hinge)),
          'rigidArmOuterPivotClosureResidualMm':closure,
          'bearingBoreToUprightPinAxisMismatchDeg':axis_mismatch(arm_bore_axis,upright_bore_axis),
          'actualSphericalBearingArticulationCertified':False,
        })
    return {
      'sleeveTurnDeg':float(turn_deg),
      'nominalToeLengthMm':nominal,'targetToeLengthMm':target,
      'toeLengthChangeMm':extension,
      'uprightTranslationMm':translation.tolist(),
      'uprightRotationVectorRad':fit.x[3:].tolist(),
      'uprightEulerXYZDeg':rotation.as_euler('xyz',degrees=True).tolist(),
      'movedOuterToeJointCentreMm':moved_toe.tolist(),
      'fixedInnerToeJointCentreMm':toe_inner.tolist(),
      'toeLinkDirectionUnitVector':new_axis.tolist(),
      'toeLengthResidualMm':float(fit.fun[4]),
      'maximumIdealLinkageConstraintResidualMm':float(np.max(np.abs(fit.fun))),
      'idealWishboneHingeSolutions':wishbones,
      'toeBearingAxisMismatchDeg':axis_mismatch(toe_bore_axis,upright_bore_axis),
      'constraintJacobianConditionNumber':float(singular[0]/singular[-1]),
      'freeScrewRodEyeOffsetNotUsed':True,
      'sourceChassisHardpointsMeasured':False,
      'nativeBallJointArticulationValidated':False,
      'allNineteenSolidsDynamicallyChecked':False,
      'realVehicleKinematicsCertified':False,
      'mechanicalG2':'HOLD',
    }

def run_report(out:Path,angles:tuple[float,...]=ANGLES)->dict:
    if out.exists():
        raise FileExistsError('Refusing to overwrite previous kinematic source evidence')
    out.parent.mkdir(parents=True,exist_ok=True)
    sha=hashlib.sha256(Path(__file__).with_name('p2_12_toe_adjuster.py').read_bytes()).hexdigest()
    input_hashes={name:hashlib.sha256(Path(__file__).with_name(name).read_bytes()).hexdigest()
                  for name in ('p2_9_rear_upright.py','p2_10_rear_wishbone.py',
                               'p2_11_rear_toe_link.py','p2_12_toe_adjuster.py')}
    try:
        if P212_SCHEMA!='podium-eds.p2.cad-first.rear-toe-adjuster-threaded.v3':
            raise RuntimeError('Original P2.12 source version mismatch')
        rows=[solve_angle(a) for a in angles]
        if len(rows)!=len(set(angles)) or not all(r['mechanicalG2']=='HOLD' for r in rows):
            raise RuntimeError('Invalid ideal-joint report source')
        maximum_bore=max(max([r['toeBearingAxisMismatchDeg']]+[
            w['bearingBoreToUprightPinAxisMismatchDeg'] for w in r['idealWishboneHingeSolutions']
        ]) for r in rows)
        result={
          'schema':SCHEMA,'cadSourceSchema':P212_SCHEMA,
          'cadSourceSha256':sha,'inputCadSourceSha256':input_hashes,'complete':True,
          'anglesDeg':list(angles),'sampleCount':len(rows),
          'maximumConstraintResidualMm':max(r['maximumIdealLinkageConstraintResidualMm'] for r in rows),
          'maximumBoreAxisMismatchDeg':maximum_bore,
          'sphericalJointCADNotVerified':True,
          'provisionalHardpointsOnly':True,
          'fullNativeBrepDynamicCollisionNotRun':True,
          'vehicleKinematicsCertified':False,
          'mechanicalG2':'HOLD','samples':rows,
        }
    except Exception as e:
        fail={'schema':SCHEMA,'cadSourceSha256':sha,'complete':False,
              'error':str(e),'mechanicalG2':'HOLD'}
        out.write_text(json.dumps(fail,indent=2)+'\n',encoding='utf8')
        raise
    out.write_text(json.dumps(result,indent=2)+'\n',encoding='utf8')
    return result

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--out',type=Path,required=True)
    args=parser.parse_args()
    result=run_report(args.out)
    print('P2.12 six-DOF ideal source constraints:',result['sampleCount'],
          'poses; max numerical residual',result['maximumConstraintResidualMm'],
          'mm; G2 HOLD')
