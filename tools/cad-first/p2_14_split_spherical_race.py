#!/usr/bin/env python3
"""P2.14 independently modeled radially assemblable split race + sleeve.

Each joint: two axially-symmetric race semicircles split along x=0,
original drilled ball, and slide-on external radial containment sleeve.
The sleeve has no axial stop or verified press-fit; mechanical G2 HOLD.
Native STEP mm, trimesh GLB m; no modification of source Model B/P2.8.
"""
from __future__ import annotations
import argparse, hashlib, json, math
from pathlib import Path
import cadquery as cq
import numpy as np
import trimesh
from p2_10_rear_wishbone import QUALITY, exact_static_audit
from p2_12_toe_adjuster import all_parts as p212_parts
from p2_13_rear_joint_prototype import (
    STATIONS, SOURCE_BEARING_TO_REPLACE, RACE_CAVITY_SPHERE_MM,
    BEARING_SPHERE_MM, RACE_HALF_THICKNESS_MM, BALL_BORE_RADIUS_MM,
    joint_center, sphere, parts_local, ideal_joint_frames, apply_pose,
)
from p2_12_constrained_kinematics import ANGLES

SCHEMA='podium-eds.p214.split-race-radial-assembly.v1'
RACE_OUTER_RADIUS_MM=11.25
SLEEVE_INNER_RADIUS_MM=11.35
SLEEVE_OUTER_RADIUS_MM=11.88
EYE_INNER_RADIUS_MM=12.0
SLEEVE_HALF_HEIGHT_MM=6.5


def sha(p:Path)->str:return hashlib.sha256(p.read_bytes()).hexdigest()

def local_parts(station:str)->dict[str,cq.Shape]:
    if station not in STATIONS: raise ValueError('Unknown rear joint')
    barrel=cq.Solid.makeCylinder(RACE_OUTER_RADIUS_MM,2*RACE_HALF_THICKNESS_MM,
                                  cq.Vector(0,0,-RACE_HALF_THICKNESS_MM))
    race=barrel.cut(sphere(RACE_CAVITY_SPHERE_MM)).clean()
    positive=cq.Workplane('XY').box(30,45,17).val().translate((15,0,0))
    negative=cq.Workplane('XY').box(30,45,17).val().translate((-15,0,0))
    half_pos=race.intersect(positive).clean()
    half_neg=race.intersect(negative).clean()
    _,ball=parts_local(station)
    sleeve=cq.Solid.makeCylinder(SLEEVE_OUTER_RADIUS_MM,2*SLEEVE_HALF_HEIGHT_MM,
                                cq.Vector(0,0,-SLEEVE_HALF_HEIGHT_MM)).cut(
        cq.Solid.makeCylinder(SLEEVE_INNER_RADIUS_MM,2*SLEEVE_HALF_HEIGHT_MM+2,
                              cq.Vector(0,0,-SLEEVE_HALF_HEIGHT_MM-1))).clean()
    parts={
      f'P214_{station}_SPLIT_RACE_POSITIVE_X':half_pos,
      f'P214_{station}_SPLIT_RACE_NEGATIVE_X':half_neg,
      f'P214_{station}_DRILLED_SPHERICAL_BALL':ball,
      f'P214_{station}_SLIDING_RETENTION_SLEEVE':sleeve,
    }
    for name,shape in parts.items():
        if shape.isNull() or not shape.isValid() or len(shape.Solids())!=1 or shape.Volume()<10:
            raise ValueError('Invalid native P2.14 part '+name)
    # Positive overlap screening only, NOT a simulated manufacturing assembly.
    bodies=list(parts.items())
    for i in range(len(bodies)):
        for j in range(i+1,len(bodies)):
            v=bodies[i][1].intersect(bodies[j][1]).Volume()
            if v>.01:raise ValueError('P2.14 native joint source intersection: '+str((bodies[i][0],bodies[j][0],v)))
    return parts

def source_parts()->dict[str,cq.Shape]:
    result={}
    for station in STATIONS:
        center=joint_center(station)
        for name,part in local_parts(station).items():
            result[name]=part.translate(tuple(center))
    if len(result)!=16:raise RuntimeError('P2.14 must author exactly 16 native CAD bodies')
    return result

def combined_nominal()->dict[str,cq.Shape]:
    old=p212_parts()
    if len(old)!=19:raise RuntimeError('P2.12 original source must contain 19 bodies')
    for key in SOURCE_BEARING_TO_REPLACE.values():
        if key not in old:raise RuntimeError('Original bearing identity missing: '+key)
        del old[key]
    old.update(source_parts())
    if len(old)!=31:raise RuntimeError('Incorrect 31-body split-race candidate source')
    return old

def opening_check()->dict:
    # A rigid one-piece P2.13 race cannot receive its sphere along Z.
    old_opening=math.sqrt(RACE_CAVITY_SPHERE_MM**2-RACE_HALF_THICKNESS_MM**2)
    if old_opening>=BEARING_SPHERE_MM:
        raise RuntimeError('Original one-piece axial insertion obstruction assumption changed')
    if not (RACE_CAVITY_SPHERE_MM>BEARING_SPHERE_MM and
            RACE_OUTER_RADIUS_MM<SLEEVE_INNER_RADIUS_MM<
            SLEEVE_OUTER_RADIUS_MM<EYE_INNER_RADIUS_MM):
        raise ValueError('Split race, ball, retainer or owner eye diameters incompatible')
    return {
        'originalOnePieceAxialInsertionRadiusMm':old_opening,
        'rigidBallMaximumRadiusMm':BEARING_SPHERE_MM,
        'originalOnePieceAxialInsertionPossible':False,
        'splitPlane':'x=0 through ball centre',
        'halvesPlacedFromRadiallyOppositeSides':True,
        'radialBallToSphericalCavityClearanceMm':RACE_CAVITY_SPHERE_MM-BEARING_SPHERE_MM,
        'raceToSleeveRadialGapMm':SLEEVE_INNER_RADIUS_MM-RACE_OUTER_RADIUS_MM,
        'sleeveToOriginalEyeRadialGapMm':EYE_INNER_RADIUS_MM-SLEEVE_OUTER_RADIUS_MM,
        'axialSleeveRetentionCertified':False,
        'pressFitDesignedOrCertified':False,
        'actualPhysicalAssemblyDemonstrated':False,
    }

RADIAL_ASSEMBLY_STEPS_MM=(0.,.5,1.,2.,3.,4.,6.,8.,10.,12.,20.)
SLEEVE_ASSEMBLY_STEPS_MM=(0.,1.,2.,4.,8.,16.,24.)

def assembly_path_audit()->dict:
    """Finite-step opening-and-sleeve feasibility; never force signoff.

    Check lateral race-half approach and axial containment sleeve placement.
    Pre-assembled sleeve is free to slide axially: a real locking end stop
    is still missing and axial retention is explicitly not certified.
    """
    checks=[];positive_controls=[]
    for station in STATIONS:
        pieces=local_parts(station)
        ball=pieces[f'P214_{station}_DRILLED_SPHERICAL_BALL']
        halves=[pieces[f'P214_{station}_SPLIT_RACE_POSITIVE_X'],
                pieces[f'P214_{station}_SPLIT_RACE_NEGATIVE_X']]
        sleeve=pieces[f'P214_{station}_SLIDING_RETENTION_SLEEVE']
        for shift in RADIAL_ASSEMBLY_STEPS_MM:
            for sign,half in zip((1,-1),halves):
                volume=half.translate((sign*shift,0,0)).intersect(ball).Volume()
                if not math.isfinite(volume) or volume>.01:
                    raise ValueError('Blocked split-race lateral insertion '+station)
                checks.append((station,'lateralRaceHalf',sign,shift,round(volume,8)))
        for shift in SLEEVE_ASSEMBLY_STEPS_MM:
            for sign,half in zip((1,-1),halves):
                volume=sleeve.translate((0,0,shift)).intersect(half).Volume()
                if not math.isfinite(volume) or volume>.01:
                    raise ValueError('Blocked split-race sleeve insertion '+station)
                checks.append((station,'axialRetentionSleeve',sign,shift,round(volume,8)))
        # Intentional misplaced ball must be detected by the same native kernel.
        control=halves[0].intersect(ball.translate((1.,0.,0.))).Volume()
        if not math.isfinite(control) or control<50:
            raise ValueError('False negative sphere-contact negative control '+station)
        positive_controls.append({'station':station,'intentionalBallShiftMm':1.,
                                  'intersectionMm3':round(control,6),'detected':True})
    return {'finiteInsertionPairChecks':len(checks),
            'radialApproachPositionsMm':list(RADIAL_ASSEMBLY_STEPS_MM),
            'axialSleeveApproachPositionsMm':list(SLEEVE_ASSEMBLY_STEPS_MM),
            'intentionallyCollidingSphereControls':positive_controls,
            'positiveControlCount':len(positive_controls),
            'maxObservedIntersectionMm3':max(x[4] for x in checks),
            'discreteRadialAssemblyPathPass':True,
            'discreteAxialSleevePlacementPass':True,
            'continuousInsertionCertified':False,
            'axialSleeveRetentionCertified':False,
            'manufacturingAssemblyCertified':False,
            'mechanicalG2':'HOLD'}

def export(out:Path)->dict:
    if out.exists() and any(out.iterdir()):raise FileExistsError('Refuse overwrite P2.14 CAD review')
    out.mkdir(parents=True,exist_ok=True)
    parts=source_parts()
    entry=opening_check()
    path_audit=assembly_path_audit()
    upstream=['p2_9_rear_upright.py','p2_10_rear_wishbone.py',
              'p2_11_rear_toe_link.py','p2_12_toe_adjuster.py',
              'p2_12_constrained_kinematics.py','p2_13_rear_joint_prototype.py']
    hashes={name:sha(Path(__file__).with_name(name)) for name in upstream}
    assembly=cq.Assembly(name='P214_SPLIT_BEARING_ASSEMBLY_PATH_G2_HOLD')
    for name,part in parts.items():assembly.add(part,name=name)
    step=out/'P214_split_spherical_joint_sleeve_prototypes.step'
    assembly.save(str(step),exportType='STEP')
    imported=cq.importers.importStep(str(step)).solids().vals()
    if len(imported)!=16 or any(not x.isValid() or x.Volume()<=0 for x in imported):
        raise RuntimeError('Native P2.14 STEP roundtrip 16-solid failure')
    profiles={}
    for tier,(linear,angular) in QUALITY.items():
        # Start with fresh OCCT solids per LOD, not cached tessellation.
        scene=trimesh.Scene()
        perPart={}
        for name,part in source_parts().items():
            verts,faces=part.tessellate(linear,angular)
            mesh=trimesh.Trimesh(
                vertices=np.array([[v.x,v.y,v.z] for v in verts],dtype=np.float64)/1000,
                faces=np.array(faces,dtype=np.int32),process=False)
            mesh.merge_vertices(digits_vertex=7)
            if not mesh.is_watertight or not mesh.is_winding_consistent:
                raise ValueError('Source P2.14 GLB not watertight/wound: '+name)
            scene.add_geometry(mesh,geom_name=name,node_name=name)
            perPart[name]=len(mesh.faces)
        file=out/f'P214_split_spherical_joints_{tier.lower()}.glb'
        file.write_bytes(scene.export(file_type='glb'))
        profiles[tier]={'file':file.name,'bytes':file.stat().st_size,'sha256':sha(file),
                        'triangles':sum(perPart.values()),'perPartTriangles':perPart,
                        'meshCount':16,'allWatertight':True}
    tris=[profiles[k]['triangles'] for k in QUALITY]
    if not tris[0]>tris[1]>tris[2]:raise ValueError('P2.14 descending source LOD requirement failed')
    pose_meta=[]
    for angle in ANGLES:
        frames=ideal_joint_frames(angle)
        pose_meta.append({'sleeveTurnDeg':angle,
                          'stations':list(frames),
                          'ballCentresCoincidentWithRaceCentresByConstruction':True,
                          'clearanceFromExactSweptSimulationCertified':False})
    report=exact_static_audit(combined_nominal())
    if report['pairCount']!=465 or not report['passStatic']:
        raise RuntimeError('P2.14 31-body nominal native source static gate failure')
    (out/'P214_31_body_static_audit.json').write_text(json.dumps(report,indent=2)+'\n')
    manifest={
      'schema':SCHEMA,'cadUnits':'mm','glbUnits':'m',
      'replacesSourceBearingProxies':SOURCE_BEARING_TO_REPLACE,
      'replacesP213SourceParts':True,
      'newPartNames':list(parts),'newNativeSolidCount':16,
      'previousP213Solids':8,'candidateCombinedSourceSolids':31,
      'upstreamCadSourceSha256':hashes,
      'step':step.name,'stepSha256':sha(step),'stepRoundtripSolids':16,
      'openingFeasibility':entry,'discreteAssemblyPathAudit':path_audit,
      'nominalStaticAudit':report,
      'sampledIdealPoseReviewCount':len(pose_meta),'sampledIdealPoses':pose_meta,
      'profiles':profiles,'axialRetentionCertified':False,
      'assemblySequenceKinematicallyVerified':False,
      'chassisHardpointsMeasured':False,'dynamic31BodyCollisionCertified':False,
      'nativeBearingStrengthCertified':False,'mechanicalG2':'HOLD',
    }
    (out/'P214_split_race_manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    return manifest

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--out',type=Path,required=True)
    m=export(p.parse_args().out)
    print('P2.14',m['newNativeSolidCount'],'native solids,',
          m['nominalStaticAudit']['pairCount'],'nominal static pairs, G2 HOLD')
