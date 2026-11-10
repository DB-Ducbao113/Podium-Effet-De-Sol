#!/usr/bin/env python3
"""P2.19 original-source rear double-wishbone re-route to clear P2.16 rim.

Uses the ORIGINAL P2.9 and P2.10 source *at build time*. Only the two
P2.10 forged A-arm B-Reps are remodeled; all chassis/outer joint datums,
original rear source and Model B geometry remain untouched. Model B hardpoints
are still provisional. No continuous kinematics, load-path or G2 signoff.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import cadquery as cq
import numpy as np
import trimesh

from p2_9_rear_upright import PART_ID as UPRIGHT_ID, build_rear_upright
from p2_10_rear_wishbone import ARM_PICKUPS_MM, OUTER_EYE_Z_OFFSET_MM, RADIUS, build_parts as previous_parts
from p2_16_rear_wheel_end import QUALITY, neutral_palette, pair_audit
from p2_18_center_lock import combined_static_study

SCHEMA = 'peds.cad-first.p219-rear-double-wishbone-clearance.v1'
ARMS = ('P210_REAR_UPPER_A_ARM_FORGED', 'P210_REAR_LOWER_A_ARM_FORGED')
ELBOW_INBOARD_DELTA_MM = 55.0
LINK_RADIUS_MM = 10.2


def _annulus(inner: float, outer: float, center: list[float], height: float) -> cq.Shape:
    x, y, z = map(float, center)
    return cq.Solid.makeCylinder(outer, height, cq.Vector(x, y, z - height/2)).cut(
        cq.Solid.makeCylinder(inner, height + 2, cq.Vector(x, y, z-height/2-1)))


def _link(start: list[float], end: list[float], radius: float) -> cq.Shape:
    vector = cq.Vector(*[end[i] - start[i] for i in range(3)])
    return cq.Solid.makeCylinder(radius, vector.Length, cq.Vector(*start), vector.normalized())


def revised_arm(side: str) -> cq.Shape:
    if side not in ARM_PICKUPS_MM:
        raise ValueError('Unknown source rear suspension arm ' + side)
    datum = ARM_PICKUPS_MM[side]
    outer = [float(x) for x in datum['outerUprightBore']]
    outer[2] += OUTER_EYE_Z_OFFSET_MM
    eye_shoulder = [outer[0] + 16, outer[1], outer[2]]
    elbow = [outer[0] + 16, outer[1], outer[2] - ELBOW_INBOARD_DELTA_MM]
    inners = [[float(x) for x in datum[key]] for key in ('innerA', 'innerB')]
    arm = _annulus(RADIUS['outerEyeBore'], RADIUS['outerEyeOuter'], outer, 16)
    arm = arm.fuse(_link(eye_shoulder, elbow, LINK_RADIUS_MM))
    for inner in inners:
        arm = arm.fuse(_link(elbow, inner, LINK_RADIUS_MM))
        arm = arm.fuse(_annulus(RADIUS['innerEyeBore'], RADIUS['innerEyeOuter'], inner, 24))
    for center, radius, thick in [(outer, RADIUS['outerEyeBore'], 110),
                                  (inners[0], RADIUS['innerEyeBore'], 100),
                                  (inners[1], RADIUS['innerEyeBore'], 100)]:
        arm = arm.cut(cq.Solid.makeCylinder(radius, thick+2,
                          cq.Vector(center[0], center[1], center[2]-thick/2-1)))
    arm = arm.clean()
    if arm.isNull() or not arm.isValid() or len(arm.Solids()) != 1:
        raise ValueError('Re-routed rear source arm is not one valid solid: '+side)
    return arm


def revised_suspension() -> dict[str, cq.Shape]:
    old = previous_parts()
    if len(old) != 10 or any(x not in old for x in ARMS):
        raise ValueError('P2.10 native 10-solid source has changed')
    for side in ('UPPER','LOWER'):
        old[f'P210_REAR_{side}_A_ARM_FORGED'] = revised_arm(side)
    return {UPRIGHT_ID: build_rear_upright(), **old}


def full_source_audit() -> tuple[dict[str,cq.Shape],dict]:
    wheel,_ = combined_static_study()
    suspension = revised_suspension()
    if len(wheel) != 32 or len(suspension) != 11:
        raise ValueError('P2.18/P2.10 source count drift')
    merged = {**wheel, **suspension}
    if len(merged) != 43:
        raise ValueError('P2.19 source IDs overlap existing owners')
    audit = pair_audit(merged)
    audit.update({'sourceOwners': ['P2.9', 'P2.10', 'P2.16', 'P2.17', 'P2.18'],
                  'originalP210SolidCount':10, 'newP219ReplacementArmIds':list(ARMS),
                  'sourceHardpointsMoved': False, 'replacesExistingSourceFiles': False,
                  'modelBHardpointsMeasured':False,'mechanicalG2Certified':False})
    return merged, audit


def source_glb(catalog: dict[str,cq.Shape], path:Path, linear:float, angular:float)->dict:
    palette, rgba = neutral_palette()
    scene = trimesh.Scene()
    tri = 0
    for name,part in catalog.items():
        vertices, faces = part.tessellate(linear,angular)
        geometry = trimesh.Trimesh(vertices=np.array([[p.x,p.y,p.z] for p in vertices],dtype=float)/1000,
                                   faces=np.array(faces,dtype=np.int64),process=False)
        geometry.merge_vertices(digits_vertex=7)
        if not geometry.is_watertight or not geometry.is_winding_consistent or not len(geometry.faces):
            raise ValueError('P2.19 nonwatertight source tessellation '+name)
        finish = palette['presets']['suspension']
        geometry.visual = trimesh.visual.TextureVisuals(material=trimesh.visual.material.PBRMaterial(
            name=name,baseColorFactor=rgba,metallicFactor=finish['metalness'],
            roughnessFactor=finish['roughness'],doubleSided=True))
        scene.add_geometry(geometry,geom_name=name,node_name=name)
        tri += len(geometry.faces)
    path.write_bytes(scene.export(file_type='glb'))
    return {'file':path.name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
            'bytes':path.stat().st_size,'triangles':tri,'partNames':list(catalog)}


def build(out:Path)->dict:
    if out.exists() and any(out.iterdir()):
        raise FileExistsError('Refuse to overwrite earlier P2.19 CAD evidence')
    out.mkdir(parents=True,exist_ok=True)
    merged,audit = full_source_audit()
    (out/'P219_cross_source_audit.json').write_text(json.dumps(audit,indent=2)+'\n')
    if not audit['passStatic']:
        raise ValueError('P2.19 rear cross-source B-Rep intersections exceed 0.05mm3: '+str(audit['unresolvedOverlap'][:6]))
    authored = {side:revised_arm(side.split('_')[2]) for side in ARMS}
    assembly = cq.Assembly(name='P219_REAR_SUSPENSION_ARMS_SOURCE')
    for name,shape in authored.items():assembly.add(shape,name=name)
    step=out/'P219_rear_wishbone_clearance.step'
    assembly.save(str(step), exportType='STEP')
    imported=cq.importers.importStep(str(step)).solids().vals()
    if len(imported)!=2 or any(not p.isValid() or p.Volume()<=0 for p in imported):
        raise ValueError('P2.19 native STEP roundtrip failed')
    profiles={}
    for quality,(lin,ang) in QUALITY.items():
        glb=out/('P219_rear_wishbone_clearance_'+quality.lower()+'.glb')
        profiles[quality]=source_glb({side:revised_arm(side.split('_')[2]) for side in ARMS},glb,lin,ang)
    if not profiles['HIGH']['triangles'] > profiles['BALANCED']['triangles'] > profiles['PERFORMANCE']['triangles']:
        raise ValueError('P2.19 GLB LOD triangle tiers invalid')
    palette,_=neutral_palette()
    manifest={'schema':SCHEMA,'status':'REVISED_PROVISIONAL_REAR_WISHBONES_NATIVE_STATIC_ONLY_G2_HOLD',
              'sourceP29P210ImportedAtRuntime':True,'revisedPartCount':2,
              'replacedPartIds':list(ARMS),'sourceP29P210Changed':False,
              'modelBOriginalChanged':False,'chassisPickupDatumsPreserved':True,
              'wheelSourceP216P218Changed':False,'modelBRealHardpointsMeasured':False,
              'mechanicalG2Certified':False,'continuousKinematicsCertified':False,
              'elbowInboardOffsetMm':ELBOW_INBOARD_DELTA_MM,
              'materialBaseColor':palette['uniformColor'],
              'staticSourceAudit':audit,
              'nativeStep':{'file':step.name,'sha256':hashlib.sha256(step.read_bytes()).hexdigest(),
                            'roundtripSolids':len(imported)},'profiles':profiles,
              'remainingGates':['Original Model B rear wheel envelope/hardpoint measurement',
                                'P2.12 / P2.14 cross source static and moving joint audits',
                                'Real strength, wheel bump/toe/roll, torsional axle and CV articulation',
                                'Original source browser fitting and video QA']}
    (out/'P219_rear_wishbone_manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    return manifest


if __name__=='__main__':
    arg=argparse.ArgumentParser();arg.add_argument('--out',required=True,type=Path)
    print(json.dumps(build(arg.parse_args().out),indent=2))
