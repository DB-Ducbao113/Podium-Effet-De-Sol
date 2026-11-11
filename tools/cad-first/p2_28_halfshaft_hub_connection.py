#!/usr/bin/env python3
"""P2.28: original-source native rear halfshaft -> hub keyed engagement study.

Fixes the 104 mm guaranteed axle gap found by P2.27 by extending the
P2.17 source halfshaft inboard-to-outboard into the P2.23 source hub.
Four integral axial keys are broached against four slightly wider slots.
A native shoulder touches the hub inboard face at z=-145 mm. This is
pure nominal pose source geometry, not OEM drive train, transmission torque,
CV articulation, axial preload, F1 safety, or original Model B mating.

All original source part names and 40-part counts are preserved. The P2.17
CV housing remains radially disconnected from the shaft (2.6 mm) and is HOLD.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import cadquery as cq
import numpy as np
import trimesh
from OCP.BRepExtrema import BRepExtrema_DistShapeShape

from p2_16_rear_wheel_end import QUALITY, neutral_palette, pair_audit
from p2_23_spindle_hub_keyed_mate import joined_source_223

SCHEMA='peds.cad-first.p228-real-halfshaft-hub-keyed-engagement.v1'
SHAFT='P217_REAR_DRIVE_HALF_SHAFT_UNSPLINED'
HUB='P216_REAR_HUB_STUB'
CV='P217_REAR_CV_HOUSING_PROTOTYPE'
BOOT='P217_REAR_CV_BOOT_ENVELOPE'
COLOR='#87929d'
KEY_COUNT=4
RADIAL_SHAFT_MM=18.4
RADIAL_HUB_BORE_MM=19.0
EXTENSION_START_Z_MM=-249.0
EXTENSION_END_Z_MM=-130.0
SHOULDER_START_Z_MM=-149.0
HUB_INBOARD_FACE_Z_MM=-145.0


def native_distance(a:cq.Shape,b:cq.Shape)->float:
    kernel=BRepExtrema_DistShapeShape(a.wrapped,b.wrapped)
    kernel.Perform()
    if not kernel.IsDone():
        raise RuntimeError('OpenCascade minimum-distance kernel did not complete')
    return float(kernel.Value())


def geometry(prior:dict[str,cq.Shape])->dict[str,cq.Shape]:
    if SHAFT not in prior or HUB not in prior or CV not in prior:
        raise ValueError('Missing owner P2.17/P2.23 source body')
    original=prior[SHAFT]
    # Connected through shared planar face with the P2.17 solid at z=-249.
    tenon=cq.Solid.makeCylinder(RADIAL_SHAFT_MM,EXTENSION_END_Z_MM-EXTENSION_START_Z_MM,
                                cq.Vector(0,0,EXTENSION_START_Z_MM))
    axial_shoulder=cq.Solid.makeCylinder(23,4,cq.Vector(0,0,SHOULDER_START_Z_MM))
    shaft=original.fuse(tenon).fuse(axial_shoulder)
    hub=prior[HUB]
    for turn in range(KEY_COUNT):
        # Clearance: 4.5-mm key vs 5.2-mm radial cut, 6 vs 6.8 tangent.
        tab=(cq.Workplane('XY').box(4.5,6.0,14).val()
             .translate((19.4,0,-137)).rotate((0,0,0),(0,0,1),90*turn))
        slot=(cq.Workplane('XY').box(5.2,6.8,18).val()
              .translate((19.5,0,-136.5)).rotate((0,0,0),(0,0,1),90*turn))
        shaft=shaft.fuse(tab)
        hub=hub.cut(slot)
    changes={SHAFT:shaft.clean(), HUB:hub.clean()}
    for name,shape in changes.items():
        if shape.isNull() or not shape.isValid() or len(shape.Solids())!=1 or shape.Volume()<=0:
            raise ValueError('Invalid P2.28 native one-piece B-Rep: '+name)
    return changes


def audit_source()->tuple[dict[str,cq.Shape],dict[str,cq.Shape],dict]:
    original,_,original_proof=joined_source_223()
    if len(original)!=40 or not original_proof['nativeStaticAudit']['passStatic']:
        raise ValueError('P2.23 original native source audit is not PASS')
    before=native_distance(original[SHAFT],original[HUB])
    changes=geometry(original)
    merged={**original,**changes}
    if len(merged)!=40 or set(merged)!=set(original):
        raise ValueError('P2.28 must not duplicate original source part IDs')
    after=native_distance(merged[SHAFT],merged[HUB])
    cv_gap=native_distance(merged[SHAFT],merged[CV])
    boot_gap=native_distance(merged[SHAFT],merged[BOOT])
    rotated=merged[SHAFT].rotate((0,0,0),(0,0,1),2.0)
    forced=float(merged[HUB].intersect(rotated).Volume())
    static_overlap=float(merged[SHAFT].intersect(merged[HUB]).Volume())
    proof=pair_audit(merged)
    if not (103.9<before<104.1 and after<1e-4 and 2.5<cv_gap<2.7 and 4.5<boot_gap<4.7):
        raise ValueError('Unexpected owner source datum or CV remaining gap')
    if forced<30 or static_overlap>.05 or not proof['passStatic']:
        raise ValueError('Native keyed drive-shaft engagement/collision test failed')
    report={
        'schema':SCHEMA,'status':'P228_SHAFT_HUB_STATIC_FACE_SEAT_PASS_G2_HOLD',
        'replacedNativePartIds':[SHAFT,HUB], 'source40Solids':40,
        'originalShaftToHubDistanceMm':round(before,6),
        'revisedShaftToHubDistanceMm':round(after,6),
        'shaftToCvHousingRemainingGapMm':round(cv_gap,6),
        'shaftToCvBootRemainingGapMm':round(boot_gap,6),
        'shaftExtensionStartMm':EXTENSION_START_Z_MM,
        'shaftExtensionEndMm':EXTENSION_END_Z_MM,
        'hubInboardAxialShoulderZMm':HUB_INBOARD_FACE_Z_MM,
        'shaftHubRadialTenonClearanceMm':RADIAL_HUB_BORE_MM-RADIAL_SHAFT_MM,
        'keyCount':KEY_COUNT,
        'keyLengthMm':14,
        'keyTabDimensionsMm':[4.5,6.0,14],
        'keyGrooveDimensionsMm':[5.2,6.8,18],
        'forcedRelativeRotationDeg':2,
        'forcedRotationInterferenceMm3':round(forced,6),
        'nominalShaftHubOverlapMm3':round(static_overlap,6),
        'nativeStaticAudit':proof,
        'realCvJointEngagementCertified':False,
        'hubSplineStrengthCertified':False,
        'axialClampingCertified':False,
        'dynamicGearboxAndSuspensionValidated':False,
        'p224Authentic71BodyBRepPassed':False,
        'originalModelBIntegrated':False,
        'mechanicalG2Certified':False,
        'originalFilesModified':False,
    }
    return merged,changes,report


def to_glb(parts:dict[str,cq.Shape],path:Path,linear:float,angular:float)->dict:
    palette,rgba=neutral_palette()
    scene=trimesh.Scene()
    for name,solid in parts.items():
        verts,faces=solid.tessellate(linear,angular)
        mesh=trimesh.Trimesh(vertices=np.array([[v.x,v.y,v.z] for v in verts],dtype=float)/1000,
                             faces=np.asarray(faces,dtype=np.int64),process=False)
        mesh.merge_vertices(digits_vertex=7)
        if not mesh.is_watertight or not mesh.is_winding_consistent or len(mesh.faces)==0:
            raise ValueError('P2.28 nonmanifold source GLB: '+name)
        preset=palette['presets']['hardware' if name==SHAFT else 'hub']
        mesh.visual=trimesh.visual.TextureVisuals(material=trimesh.visual.material.PBRMaterial(
            name=name,baseColorFactor=rgba,metallicFactor=preset['metalness'],
            roughnessFactor=preset['roughness'],doubleSided=True))
        scene.add_geometry(mesh,node_name=name,geom_name=name)
    path.write_bytes(scene.export(file_type='glb'))
    return {'file':path.name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
            'triangles':sum(len(m.faces) for m in scene.geometry.values()),
            'meshNodes':sorted(parts),'bytes':path.stat().st_size}


def build(out:Path)->dict:
    if out.exists():raise FileExistsError('P2.28 refuses overwrite of existing evidence')
    _,changed,proof=audit_source()
    out.mkdir(parents=True)
    assy=cq.Assembly(name='P228_ORIGINAL_HALF_SHAFT_TO_HUB_STATIC_REVIEW_G2_HOLD')
    for name,solid in changed.items():assy.add(solid,name=name)
    step=out/'P228_keyed_halfshaft_hub.step'
    assy.save(str(step),exportType='STEP')
    imported=cq.importers.importStep(str(step)).solids().vals()
    if len(imported)!=2 or not all(s.isValid() and len(s.Solids())==1 for s in imported):
        raise ValueError('Native P2.28 STEP must import 2 valid solids')
    profiles={}
    for tier,(linear,angular) in QUALITY.items():
        # Import the freshly validated native STEP, so OCC does not rebuild
        # all 40 older source solids three more times. A new STEP import on
        # every iteration also avoids cached native triangulation/LOD drift.
        bodies=cq.importers.importStep(str(step)).solids().vals()
        if len(bodies)!=2:
            raise ValueError('Native P2.28 source STEP geometry changed')
        fresh={SHAFT:next(b for b in bodies if b.BoundingBox().zmin<-300),
               HUB:next(b for b in bodies if b.BoundingBox().zmax>160)}
        if len(set(id(s) for s in fresh.values()))!=2:
            raise ValueError('Original STEP body ownership mapping changed')
        glb=out/('P228_keyed_halfshaft_hub_'+tier.lower()+'.glb')
        profiles[tier]=to_glb(fresh,glb,linear,angular)
    if not profiles['HIGH']['triangles']>profiles['BALANCED']['triangles']>profiles['PERFORMANCE']['triangles']:
        raise ValueError('P2.28 GLB LOD triangle counts not strictly descending')
    info={'schema':SCHEMA,'status':proof['status'],'nativePartCount':2,
          'revised40BodyCount':40,'sharedColor':COLOR,'sourceSTEP':step.name,
          'sourceSTEPsha256':hashlib.sha256(step.read_bytes()).hexdigest(),
          'stepRoundtripSolids':len(imported),'audit':proof,'profiles':profiles,
          'modelBIntegrated':False,'mechanicalG2Certified':False}
    (out/'P228_halfshaft_hub_manifest.json').write_text(json.dumps(info,indent=2)+'\n')
    (out/'P228_halfshaft_hub_native_audit.json').write_text(json.dumps(proof,indent=2)+'\n')
    return info


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--out',required=True,type=Path)
    print(json.dumps(build(parser.parse_args().out),indent=2))
