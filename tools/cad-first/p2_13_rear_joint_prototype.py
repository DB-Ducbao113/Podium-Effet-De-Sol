#!/usr/bin/env python3
"""P2.13 source-proposal spherical plain bearing articulation: four joints.

Replaces four P2.10/P2.11 nominal annular bearing proxies with four socket
races and four pierced spherical balls. Reuses P2.12 seven ideal source poses.
Engineering PROTOTYPE only: unsourced structural chassis, retaining system,
material strength and full 23-body fit remain G2 HOLD. STEP mm / GLB m.
"""
from __future__ import annotations
import argparse,hashlib,json,math
from pathlib import Path
import cadquery as cq
import numpy as np
from scipy.spatial.transform import Rotation
import trimesh
from p2_10_rear_wishbone import ARM_PICKUPS_MM,OUTER_EYE_Z_OFFSET_MM,QUALITY,exact_static_audit
from p2_11_rear_toe_link import TOE_OUTER_EYE_MM,TOE_INNER_EYE_MM
from p2_12_toe_adjuster import all_parts as p212_all_parts
from p2_12_constrained_kinematics import ANGLES,solve_angle,immutable_source

SCHEMA='podium-eds.p213.source-spherical-joint-articulation.v1'
BEARING_SPHERE_MM=9.65
RACE_CAVITY_SPHERE_MM=9.95
RACE_HALF_THICKNESS_MM=6.5
BALL_HALF_THICKNESS_MM=5.0
BALL_BORE_RADIUS_MM=7.5
RACE_RADII_MM={'UPPER':11.65,'LOWER':11.65,'TOE_OUTER':11.6,'TOE_INNER':11.6}
STATIONS=('UPPER','LOWER','TOE_OUTER','TOE_INNER')
SOURCE_BEARING_TO_REPLACE={
 'UPPER':'P210_REAR_UPPER_OUTER_SPHERICAL_BEARING_PROPOSAL',
 'LOWER':'P210_REAR_LOWER_OUTER_SPHERICAL_BEARING_PROPOSAL',
 'TOE_OUTER':'P211_REAR_TOE_OUTER_BEARING_PROPOSAL',
 'TOE_INNER':'P211_REAR_TOE_INNER_BEARING_PROPOSAL',
}

def sha(path:Path)->str:return hashlib.sha256(path.read_bytes()).hexdigest()

def joint_center(name:str)->np.ndarray:
    if name in ('UPPER','LOWER'):
        source=ARM_PICKUPS_MM[name]['outerUprightBore']
        return np.array([float(source[0]),float(source[1]),float(source[2])+OUTER_EYE_Z_OFFSET_MM])
    return np.asarray(TOE_OUTER_EYE_MM if name=='TOE_OUTER' else TOE_INNER_EYE_MM,dtype=float)

def sphere(radius:float)->cq.Shape:
    return cq.Solid.makeSphere(radius,cq.Vector(0,0,0),angleDegrees1=-90,angleDegrees2=90)

def parts_local(name:str)->tuple[cq.Shape,cq.Shape]:
    if name not in STATIONS:raise ValueError('Unknown rear spherical-joint source station')
    outer=cq.Solid.makeCylinder(RACE_RADII_MM[name],2*RACE_HALF_THICKNESS_MM,
                                cq.Vector(0,0,-RACE_HALF_THICKNESS_MM),cq.Vector(0,0,1))
    # One actual native spherical cavity: not a fake cylindrical bore.
    race=outer.cut(sphere(RACE_CAVITY_SPHERE_MM)).clean()
    flat=cq.Workplane('XY').box(28,28,2*BALL_HALF_THICKNESS_MM).val()
    ball=sphere(BEARING_SPHERE_MM).intersect(flat)
    hole=cq.Solid.makeCylinder(BALL_BORE_RADIUS_MM,2*BALL_HALF_THICKNESS_MM+2,
                                cq.Vector(0,0,-BALL_HALF_THICKNESS_MM-1),cq.Vector(0,0,1))
    ball=ball.cut(hole).clean()
    for label,body in (('race',race),('ball',ball)):
        if body.isNull() or not body.isValid() or len(body.Solids())!=1 or body.Volume()<100:
            raise ValueError(f'Invalid project bearing {name} {label} B-Rep')
    if race.intersect(ball).Volume()>.01:
        raise ValueError('Bearing ball/race must have nominal radial clearance')
    return race,ball

def source_parts()->dict[str,cq.Shape]:
    out={}
    for station in STATIONS:
        race,ball=parts_local(station)
        center=joint_center(station).tolist()
        out[f'P213_{station}_OUTER_SPHERICAL_RACE']=race.translate(tuple(center))
        out[f'P213_{station}_DRILLED_SPHERICAL_BALL']=ball.translate(tuple(center))
    return out

def apply_pose(local_shape:cq.Shape,center:np.ndarray,rot:Rotation)->cq.Shape:
    axis=rot.as_rotvec()
    magnitude=float(np.linalg.norm(axis))
    if magnitude>1e-10:
        local_shape=local_shape.rotate((0,0,0),tuple(axis/magnitude),math.degrees(magnitude))
    return local_shape.translate(tuple(center))

def ideal_joint_frames(angle:float)->dict:
    result=solve_angle(angle)
    source=immutable_source()
    upright=Rotation.from_rotvec(result['uprightRotationVectorRad'])
    trans=np.asarray(result['uprightTranslationMm'],dtype=float)
    outer0,inner0=source['toeOuter'],source['toeInner']
    outer_moved=upright.apply(outer0)+trans
    toe_axis=(inner0-outer_moved)/np.linalg.norm(inner0-outer_moved)
    toe_initial=(inner0-outer0)/np.linalg.norm(inner0-outer0)
    toe_rotation=Rotation.align_vectors([toe_axis],[toe_initial])[0]
    frames={}
    for name,original,a,b in source['arms']:
        center=upright.apply(original)+trans
        axis=(b-a)/np.linalg.norm(b-a)
        solution=next(row for row in result['idealWishboneHingeSolutions'] if row['station']==name)
        arm=Rotation.from_rotvec(axis*math.radians(solution['idealInnerHingeRotationDeg']))
        frames[name]={'center':center,'raceRot':arm,'ballRot':upright}
    frames['TOE_OUTER']={'center':outer_moved,'raceRot':toe_rotation,'ballRot':upright}
    frames['TOE_INNER']={'center':inner0,'raceRot':toe_rotation,'ballRot':Rotation.identity()}
    return frames

def review_pose(angle:float,do_boolean:bool=True)->dict:
    frames=ideal_joint_frames(angle)
    cases=[]
    for station in STATIONS:
        frame=frames[station]
        race,ball=parts_local(station)
        race=apply_pose(race,frame['center'],frame['raceRot'])
        ball=apply_pose(ball,frame['center'],frame['ballRot'])
        axis_a=frame['raceRot'].apply([0,0,1]);axis_b=frame['ballRot'].apply([0,0,1])
        deg=math.degrees(math.acos(float(np.clip(abs(np.dot(axis_a,axis_b)),-1,1))))
        common=float(race.intersect(ball).Volume()) if do_boolean else None
        if common is not None and (not math.isfinite(common) or common>.02):
            raise ValueError(f'Spherical-joint candidate intersects: {station} at {angle}')
        cases.append({'station':station,'centerMm':frame['center'].tolist(),
                      'raceBallAxisAngleDeg':deg,'nativeOverlapMm3':common,
                      'radialSeatGapMm':RACE_CAVITY_SPHERE_MM-BEARING_SPHERE_MM,
                      'realMechanicalJointCertified':False})
    return {'angleDeg':angle,'jointCount':4,'cases':cases,
            'jointBallCentresCoincidentByConstruction':True,
            'chassisHardpointsMeasured':False,'mechanicalG2':'HOLD'}

def nominal_combined_static_audit()->dict:
    """Replace four original annuli in P2.12's genuine source 19 CAD parts.

    Native Boolean may false-negative on P2.12 helical threads, so this is a
    static B-Rep screening ONLY, never dynamic or actual chassis signoff.
    """
    combined=p212_all_parts()
    if len(combined)!=19:
        raise RuntimeError('Expected the real P2.12 19 solid source')
    for prior in SOURCE_BEARING_TO_REPLACE.values():
        if prior not in combined:
            raise RuntimeError('Missing original spherical-bearing proxy: '+prior)
        del combined[prior]
    combined.update(source_parts())
    if len(combined)!=23:
        raise RuntimeError('P2.13 must yield exactly 23 native source CAD bodies')
    report=exact_static_audit(combined)
    if report['pairCount']!=253 or not report['passStatic']:
        raise RuntimeError('P2.13 nominal combined source static clearance FAIL')
    return report

def export(out:Path)->dict:
    if out.exists() and any(out.iterdir()):
        raise FileExistsError('Refusing to overwrite prototype native CAD evidence')
    out.mkdir(parents=True,exist_ok=True)
    parts=source_parts()
    source_hashes={name:hashlib.sha256(Path(__file__).with_name(name).read_bytes()).hexdigest()
                   for name in ('p2_9_rear_upright.py','p2_10_rear_wishbone.py',
                                'p2_11_rear_toe_link.py','p2_12_toe_adjuster.py',
                                'p2_12_constrained_kinematics.py')}
    assembly=cq.Assembly(name='P213_REAR_SPHERICAL_JOINT_CONCEPT_NOT_APPROVED')
    for name,body in parts.items():assembly.add(body,name=name)
    step=out/'P213_four_rear_spherical_joint_prototypes.step'
    assembly.save(str(step),exportType='STEP')
    imported=cq.importers.importStep(str(step)).solids().vals()
    if len(imported)!=8 or not all(x.isValid() for x in imported):
        raise RuntimeError('P2.13 8-solid STEP import FAIL')
    profiles={}
    for quality,(linear,angular) in QUALITY.items():
        scene=trimesh.Scene();face_count=0
        # Re-create each source for LOD purity; avoid OCC tessellation caching.
        for name,part in source_parts().items():
            vertices,faces=part.tessellate(linear,angular)
            mesh=trimesh.Trimesh(vertices=np.array([[v.x,v.y,v.z] for v in vertices])/1000,
                                 faces=np.array(faces,dtype=np.int32),process=False)
            mesh.merge_vertices(digits_vertex=7)
            if not mesh.is_watertight or not mesh.is_winding_consistent:
                raise RuntimeError('Native GLB P2.13 seam or winding FAIL: '+name)
            scene.add_geometry(mesh,geom_name=name,node_name=name)
            face_count+=len(mesh.faces)
        file=out/f'P213_spherical_joints_{quality.lower()}.glb'
        file.write_bytes(scene.export(file_type='glb'))
        profiles[quality]={'file':file.name,'sha256':sha(file),'triangles':face_count,
                           'bytes':file.stat().st_size,'meshCount':8,'allWatertight':True}
    counts=[profiles[tier]['triangles'] for tier in QUALITY]
    if not counts[0]>counts[1]>counts[2]:
        raise RuntimeError('P2.13 progressive LOD topology FAIL')
    poses=[review_pose(angle) for angle in ANGLES]
    static=nominal_combined_static_audit()
    (out/'P213_23_body_static_audit.json').write_text(json.dumps(static,indent=2)+'\n')
    data={
      'schema':SCHEMA,'unitsCad':'mm','unitsGLB':'m',
      'sourceCadFileSha256':source_hashes,'replaceAnnularProxies':SOURCE_BEARING_TO_REPLACE,
      'newCadPartIds':list(parts),'newCadSolids':8,'replacedOldCadSolids':4,
      'candidateCombinedCadSolids':23,
      'masterSTEP':step.name,'masterSTEPsha256':sha(step),
      'stepRoundtripSolids':len(imported),
      'ballSphereRadiusMm':BEARING_SPHERE_MM,
      'raceSphericalCavityRadiusMm':RACE_CAVITY_SPHERE_MM,
      'nominalSphericalRadialGapMm':RACE_CAVITY_SPHERE_MM-BEARING_SPHERE_MM,
      'nominalBallBoreRadiusMm':BALL_BORE_RADIUS_MM,
      'sphericalBallRetainedCertified':False,
      'bearingMaterialsSpecified':False,'actualSphericalArticulationCertified':False,
      'chassisHardpointsMeasured':False,'wholeCarClearanceCertified':False,
      'continuousSweptCollisionCertified':False,
      'anglesDeg':list(ANGLES),'poseCount':len(poses),'poseReviews':poses,
      'combinedNominalStaticAudit':static,
      'profiles':profiles,'mechanicalG2':'HOLD',
      'limitations':['Bearing prototype is not manufacturing-verified; ball insertion and axial capture unsolved',
         '23-part static Boolean screen was run, but not complete moving assembly; P2.12 helix Boolean may false-negative',
         'Model B actual chassis hardpoints and suspension bearing tolerances not measured',
         'Load paths, joint wear, fatigue, press fit, bolt preload and retention are HOLD'],
    }
    (out/'P213_joint_articulation_manifest.json').write_text(json.dumps(data,indent=2)+'\n')
    return data

if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--out',type=Path,required=True)
    result=export(ap.parse_args().out)
    print('P2.13',result['newCadSolids'],'new solids',result['poseCount'],'ideal joint poses',
          {k:v['triangles'] for k,v in result['profiles'].items()},'G2 HOLD')
