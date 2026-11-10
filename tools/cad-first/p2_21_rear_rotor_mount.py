#!/usr/bin/env python3
"""P2.21: revise the authentic P2.16/P2.17 rear rotor hat interface.

Source-owned repair, rear wheel local millimetres. The prior P2.17 hat had no
face contact with the P2.16 rotor (4.123 mm shortest true B-Rep separation),
so zero-overlap could not establish an assembly. This revision adds a flange,
real clearanced rotor/hat mounting bores and eight individually named solid
studs (unthreaded and NOT structurally certified). It relocates a dust seal
away from the hat. DO NOT interpret a modeled face contact or a stud as proven
transmission of torque, adequate bolt grip, F1 regulation/OEM fit or Model B
installation. Existing P2.16/P2.17/P2.18 source is immutable.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
from pathlib import Path

import cadquery as cq
import numpy as np
import trimesh
from OCP.BRepExtrema import BRepExtrema_DistShapeShape

from p2_16_rear_wheel_end import QUALITY, neutral_palette, pair_audit, parts as p216_parts
from p2_17_rear_brake_drive import source_parts as p217_parts
from p2_18_center_lock import combined_static_study

SCHEMA = 'peds.cad-first.p221-rear-rotor-hat-mount-study.v1'
PREFIX = 'P221_REAR_'
ROTOR = 'P216_REAR_BRAKE_DISC_VENTED'
HAT = 'P217_REAR_ROTOR_HAT_SPACER'
SEAL = 'P217_REAR_BEARING_DUST_SEAL'
BOLT_PATTERN_RADIUS_MM = 80.0
BOLT_COUNT = 8
DRILL_RADIUS_MM = 3.40
BOLT_SHANK_RADIUS_MM = 3.05
ROTOR_FACE_Z_MM = -64.0
FLANGE_BOTTOM_Z_MM = -70.0


def cylinder(r:float,z:float,height:float,x:float=0.,y:float=0.) -> cq.Shape:
    return cq.Solid.makeCylinder(r,height,cq.Vector(x,y,z))


def hole_centres():
    for i in range(BOLT_COUNT):
        a=2*math.pi*i/BOLT_COUNT
        yield i, BOLT_PATTERN_RADIUS_MM*math.cos(a), BOLT_PATTERN_RADIUS_MM*math.sin(a)


def corrected_rotor(old:cq.Shape) -> cq.Shape:
    rotor=old
    for _,x,y in hole_centres():
        rotor=rotor.cut(cylinder(DRILL_RADIUS_MM,-65,20,x,y))
    return rotor.clean()


def corrected_hat() -> cq.Shape:
    # Former r=58..62 neck, z=-90..-68; the flange adds a face-seat to the
    # original brake rotor at z=-64 without volumetric penetration.
    stem=cylinder(62,-90,26).cut(cylinder(58,-91,28))
    flange=cylinder(96,FLANGE_BOTTOM_Z_MM,6).cut(cylinder(58,-71,8))
    hat=stem.fuse(flange)
    for _,x,y in hole_centres():
        hat=hat.cut(cylinder(DRILL_RADIUS_MM,-71,8,x,y))
    return hat.clean()


def corrected_seal() -> cq.Shape:
    # Prior dust ring was z=-65..-62 and physically conflicted with the
    # newly added flange. This is an alternative inspection position, not
    # a certified sealing contact, preload or actual lip seal.
    return cylinder(62.5,-94,3).cut(cylinder(58,-95,5)).clean()


def unthreaded_stud(x:float,y:float) -> cq.Shape:
    shank=cylinder(BOLT_SHANK_RADIUS_MM,-70,24,x,y)
    head=cylinder(5.5,-46,3.5,x,y)
    return shank.fuse(head).clean()


def revised_parts(old:dict[str,cq.Shape]) -> dict[str,cq.Shape]:
    for name in (ROTOR,HAT,SEAL):
        if name not in old:
            raise ValueError('P2.16/P2.17 original mating source absent: '+name)
    result={ROTOR:corrected_rotor(old[ROTOR]),HAT:corrected_hat(),SEAL:corrected_seal()}
    for i,x,y in hole_centres():
        result[PREFIX+f'ROTOR_HAT_STUD_UNTHREADED_{i+1:02d}']=unthreaded_stud(x,y)
    if len(result)!=11 or len(set(result))!=11:
        raise ValueError('P2.21 must contain 3 revisions + 8 original fasteners')
    for name,body in result.items():
        if body.isNull() or not body.isValid() or len(body.Solids())!=1 or body.Volume()<=0:
            raise ValueError('Invalid native B-Rep source: '+name)
    return result


def native_distance(a:cq.Shape,b:cq.Shape)->float:
    calc=BRepExtrema_DistShapeShape(a.wrapped,b.wrapped)
    calc.Perform()
    if not calc.IsDone():
        raise RuntimeError('Native B-Rep minimum distance kernel failed')
    return float(calc.Value())


def repaired_source():
    # Must consume the original, NOT a hand-transcribed mesh or a substitute car.
    prior,prior_audit=combined_static_study()
    changes=revised_parts(prior)
    merged={**prior,**changes}
    if len(prior)!=32 or len(merged)!=40:
        raise ValueError('Expected 32 prior -3 +3 revised +8 new = 40 source parts')
    audit=pair_audit(merged)
    original_gap=native_distance(prior[HAT],prior[ROTOR])
    repaired_gap=native_distance(merged[HAT],merged[ROTOR])
    hub_gap=native_distance(merged[HAT],merged['P216_REAR_HUB_STUB'])
    bolted_ids=[k for k in changes if k.startswith(PREFIX)]
    if not (4.0 < original_gap < 4.3 and repaired_gap<1e-4 and .35<hub_gap<.45):
        raise ValueError('P2.21 source contact distances unexpectedly changed')
    if not audit['passStatic']:
        raise ValueError('P2.21 native 40-body clearance failure: '+str(audit['unresolvedOverlap'][:5]))
    return merged,changes,{
        'existingSourceParts':len(prior),'revisedSourcePartIds':[ROTOR,HAT,SEAL],
        'newUnthreadedFasteners':bolted_ids,'finalDistinctSourceParts':len(merged),
        'originalHatToRotorMinimumMm':round(original_gap,6),
        'revisedHatToRotorMinimumMm':round(repaired_gap,6),
        'hatToHubRadialUnbridgedGapMm':round(hub_gap,6),
        'staticAudit':audit,'originalSourceFilesChanged':False,
        'functionalTorquePathCertified':False,'threadEngagementCertified':False,
        'originalModelBInstalled':False,'mechanicalG2Certified':False,
    }


def _glb(bodies:dict[str,cq.Shape],path:Path,linear:float,angular:float)->dict:
    palette,rgba=neutral_palette()
    scene=trimesh.Scene()
    tris=0
    for name,solid in bodies.items():
        v,f=solid.tessellate(linear,angular)
        mesh=trimesh.Trimesh(vertices=np.asarray([[p.x,p.y,p.z] for p in v],dtype=float)/1000,
                              faces=np.asarray(f,dtype=np.int64),process=False)
        mesh.merge_vertices(digits_vertex=7)
        if not mesh.is_watertight or not mesh.is_winding_consistent or not len(mesh.faces):
            raise ValueError('P2.21 source mesh not watertight: '+name)
        role='carbon-brake' if name==ROTOR else 'hub' if name==HAT else 'bearing' if name==SEAL else 'hardware'
        material=palette['presets'][role]
        mesh.visual=trimesh.visual.TextureVisuals(material=trimesh.visual.material.PBRMaterial(
             name=name,baseColorFactor=rgba,metallicFactor=material['metalness'],
             roughnessFactor=material['roughness'],doubleSided=True))
        scene.add_geometry(mesh,geom_name=name,node_name=name)
        tris+=len(mesh.faces)
    path.write_bytes(scene.export(file_type='glb'))
    return {'file':path.name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
            'bytes':path.stat().st_size,'triangles':tris,'nodes':list(bodies)}


def build(out:Path)->dict:
    if out.exists() and any(out.iterdir()):
        raise FileExistsError('Never overwrite a P2.21 original CAD review')
    out.mkdir(parents=True,exist_ok=True)
    full,changed,proof=repaired_source()
    (out/'P221_rear40_rotor_mount_audit.json').write_text(json.dumps(proof,indent=2)+'\n')
    group=cq.Assembly(name='P221_REAR_ROTOR_MOUNT_NATIVE_CAD_STUDY')
    for name,shape in changed.items():group.add(shape,name=name)
    path=out/'P221_rear_rotor_hat_mount.step'
    group.save(str(path),exportType='STEP')
    imported=cq.importers.importStep(str(path)).solids().vals()
    if len(imported)!=11 or any(not x.isValid() or x.Volume()<=0 for x in imported):
        raise ValueError('P2.21 STEP 11-solids roundtrip invalid')
    tiers={}
    for name,(lin,ang) in QUALITY.items():
        path_glb=out/('P221_rear_rotor_hat_mount_'+name.lower()+'.glb')
        # Refresh native OCCT triangulation per tier.
        tiers[name]=_glb(revised_parts({**p216_parts(),**p217_parts()}),path_glb,lin,ang)
    if not tiers['HIGH']['triangles']>tiers['BALANCED']['triangles']>tiers['PERFORMANCE']['triangles']:
        raise ValueError('P2.21 mesh LODs must have decreasing triangle counts')
    palette,_=neutral_palette()
    result={'schema':SCHEMA,'status':'ROTORMOUNT_BREP_STATIC_PASS_G2_HOLD',
            'changes':list(changed),'fullReviewSolids':40,
            'baseMaterial':palette['uniformColor'],'source':{'file':path.name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()},
            'STEProundtripSolids':len(imported),'geometryAudit':proof,'qualityProfiles':tiers,
            'knownRemainingBlockers':['Hat-to-hub clearance and missing torque-transmitting adapter/splines',
              'Unthreaded studs lack locknuts, applied preload and load path',
              'P2.9-P2.14 authoritative 63-solid integration still not certified',
              'Model B original rear geometry pickup measurements and browser full-car QA']}
    (out/'P221_rear_rotor_hat_manifest.json').write_text(json.dumps(result,indent=2)+'\n')
    return result


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--out',required=True,type=Path)
    print(json.dumps(build(parser.parse_args().out),indent=2))
