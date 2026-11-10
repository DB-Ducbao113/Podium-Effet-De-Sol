#!/usr/bin/env python3
"""P2.22 original rear hub-to-rotor-hat torque *interface study*.

Replace three P2.21 viewer-only source bodies in a verified 40-body CAD
review: hub, rotor hat, and a dust-seal envelope. Four integral hub keys
enter four broached clearanced slots in the hat, and a hub shoulder touches
the hat's inboard face. The source axle, wheel/rim, P2.18 threads, and original
Model B GLB remain immutable. Nominal contact and angular obstruction are
not proof of running torque, clamp preload, safety, or actual F1 OEM mates.
B-Rep mm, GLB metres, rear wheel-local frame X forward Y up Z outboard.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import cadquery as cq
import numpy as np
import trimesh

from p2_16_rear_wheel_end import QUALITY, neutral_palette, pair_audit
from p2_21_rear_rotor_mount import (
    HAT, ROTOR, SEAL, repaired_source as prior_source,
    corrected_hat, native_distance,
)

SCHEMA = 'peds.cad-first.p222-keyed-hub-rotor-hat.v1'
HUB = 'P216_REAR_HUB_STUB'
KEY_COUNT = 4
PALETTE = '#87929d'


def annulus(inner: float, outer: float, z0: float, length: float) -> cq.Shape:
    if not (0 < inner < outer and length > 0):
        raise ValueError('Invalid hub collar dimensions')
    outer_body = cq.Solid.makeCylinder(outer, length, cq.Vector(0, 0, z0))
    inside = cq.Solid.makeCylinder(inner, length + 2, cq.Vector(0, 0, z0 - 1))
    return outer_body.cut(inside)


def keyed_hub(previous: cq.Shape) -> cq.Shape:
    # Annular shoulder is axially seated at the original hat stem z=-90.
    # Preserve the original 19 mm through-bore for a future retention system.
    hub = previous.fuse(annulus(19, 62, -93.5, 3.5))
    for i in range(KEY_COUNT):
        key = (cq.Workplane('XY').box(6.4, 10, 15).val()
               .translate((57.9, 0, -80.5))
               .rotate((0, 0, 0), (0, 0, 1), 90*i))
        hub = hub.fuse(key)
    return hub.clean()


def broached_hat() -> cq.Shape:
    # An enlarged, *connected* local bearing stem preserves enough outer wall
    # around four native subtracted keyways. It still seats against the rotor
    # on z=-64 with the same P2.21 eight-hole B-Rep flange.
    hat = corrected_hat().fuse(annulus(61.8, 67, -90, 20)).clean()
    for i in range(KEY_COUNT):
        window = (cq.Workplane('XY').box(6.5, 10.8, 15.6).val()
                  .translate((59.2, 0, -80.5))
                  .rotate((0, 0, 0), (0, 0, 1), 90*i))
        hat = hat.cut(window)
    return hat.clean()


def seal_envelope() -> cq.Shape:
    # Relocate previous P2.21 seal *concept* out of the newly seated shoulder.
    # This is deliberately NOT called a physically functional dust seal:
    # it has clearance to both inner/outer bearing races and no lip preload.
    return annulus(62.5, 64.7, -98, 3)


def native_revisions(source: dict[str, cq.Shape]) -> dict[str, cq.Shape]:
    for name in (HUB, HAT, SEAL, ROTOR):
        if name not in source:
            raise ValueError('Missing P2.21 source owner: ' + name)
    changed = {HUB: keyed_hub(source[HUB]), HAT: broached_hat(), SEAL: seal_envelope()}
    for name, body in changed.items():
        if body.isNull() or not body.isValid() or len(body.Solids()) != 1 or body.Volume() <= 0:
            raise ValueError('P2.22 disconnected or invalid native B-Rep: ' + name)
    return changed


def joined_source() -> tuple[dict[str,cq.Shape],dict[str,cq.Shape],dict]:
    prior, _, prior_report = prior_source()
    if len(prior) != 40 or not prior_report['staticAudit']['passStatic']:
        raise ValueError('Unverified P2.21 rear source')
    old_gap = native_distance(prior[HUB], prior[HAT])
    changed = native_revisions(prior)
    all_parts = {**prior, **changed}
    if len(all_parts) != 40:
        raise ValueError('P2.22 cannot introduce ghost duplicate parts')
    audit = pair_audit(all_parts)
    face_distance = native_distance(all_parts[HUB], all_parts[HAT])
    disc_distance = native_distance(all_parts[HAT], all_parts[ROTOR])
    # Check actual geometric tooth obstruction at a small angular turn,
    # not mere color or 2D polygon overlap. This *failing* rotational pose
    # is the intended positive control and NOT a permitted running motion.
    rotated_hat = all_parts[HAT].rotate((0,0,0),(0,0,1),0.5)
    angular_interference = float(all_parts[HUB].intersect(rotated_hat).Volume())
    if not (0.35 < old_gap < 0.45 and face_distance < 1e-4 and disc_distance < 1e-4):
        raise ValueError('Hub/hat/disc source face seating failed')
    if not (angular_interference > .05):
        raise ValueError('Keyway lacks native anti-rotation obstruction')
    if not audit['passStatic']:
        raise ValueError('P2.22 nominal B-Rep source has interferences: '+str(audit['unresolvedOverlap'][:6]))
    return all_parts, changed, {
        'schema': SCHEMA, 'status': 'NATIVE_STATIC_SEAT_PASS_G2_HOLD',
        'originalP221GapMm': round(old_gap, 6),
        'hubToHatSeatedDistanceMm': round(face_distance, 6),
        'hatToRotorSeatedDistanceMm': round(disc_distance, 6),
        'keywayCount': KEY_COUNT, 'angularNegativeControlDegrees': 0.5,
        'angularNegativeControlIntersectionMm3': round(angular_interference, 6),
        'legacyReviewBodyCount': 40, 'revisedNativeSourceIDs': list(changed),
        'nominalStaticAudit': audit, 'sourceP216P221Changed': False,
        'functionalSealCertified': False, 'transmittedTorqueCertified': False,
        'positiveCenterLockRetentionCertified': False,
        'authenticModelBWheelStationMeasured': False,
        'realSuspensionChassisMatingCertified': False,
        'mechanicalG2Certified': False,
    }


def glb_parts(bodies:dict[str,cq.Shape],path:Path,linear:float,angular:float)->dict:
    palette,rgba=neutral_palette()
    scene=trimesh.Scene()
    triangles=0
    for name,solid in bodies.items():
        vertices,faces=solid.tessellate(linear,angular)
        mesh=trimesh.Trimesh(
            vertices=np.asarray([[p.x,p.y,p.z] for p in vertices],dtype=float)/1000,
            faces=np.asarray(faces,dtype=np.int64),process=False)
        mesh.merge_vertices(digits_vertex=7)
        if not mesh.is_watertight or not mesh.is_winding_consistent or len(mesh.faces)<4:
            raise ValueError('Non-watertight original P2.22 source tessellation: '+name)
        role='hub' if name==HUB else 'bearing' if name==SEAL else 'hardware'
        finish=palette['presets'][role]
        mesh.visual=trimesh.visual.TextureVisuals(material=trimesh.visual.material.PBRMaterial(
            name=name,baseColorFactor=rgba,metallicFactor=finish['metalness'],
            roughnessFactor=finish['roughness'],doubleSided=True))
        scene.add_geometry(mesh,geom_name=name,node_name=name)
        triangles+=len(mesh.faces)
    path.write_bytes(scene.export(file_type='glb'))
    return {'file':path.name, 'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
            'bytes':path.stat().st_size,'triangles':triangles,'partIds':list(bodies)}


def build(out:Path)->dict:
    if out.exists():
        raise FileExistsError('Never overwrite old P2.22 native CAD evidence')
    # Run native source and exact Boolean clearance before creating outputs.
    _,changed,audit=joined_source()
    out.mkdir(parents=True)
    group=cq.Assembly(name='P222_REAR_KEYED_HUB_ROTOR_HAT_SOURCE_ONLY')
    for name,solid in changed.items():group.add(solid,name=name)
    step=out/'P222_keyed_hub_hat_seal.step'
    group.save(str(step),exportType='STEP')
    imported=cq.importers.importStep(str(step)).solids().vals()
    if len(imported)!=3 or any(not x.isValid() for x in imported):
        raise ValueError('Original STEP 3-solid roundtrip failed')
    tier={}
    for quality,(linear,angular) in QUALITY.items():
        current=native_revisions(prior_source()[0])
        file=out/('P222_keyed_hub_hat_'+quality.lower()+'.glb')
        tier[quality]=glb_parts(current,file,linear,angular)
    if not tier['HIGH']['triangles']>tier['BALANCED']['triangles']>tier['PERFORMANCE']['triangles']:
        raise ValueError('P2.22 3-tier GLB LOD source triangles not descending')
    palette,_=neutral_palette()
    report={'schema':SCHEMA, 'status':audit['status'],
            'uniformColor':palette['uniformColor'],
            'replacesOnlyOnReview':list(changed),'nativeSTEP':step.name,
            'nativeSTEPhash':hashlib.sha256(step.read_bytes()).hexdigest(),
            'nativeSTEPsolids':len(imported),'geometryAudit':audit,
            'qualityProfiles':tier,'ownerModelBOriginalModified':False,
            'fullCarIntegrated':False,'mechanicalG2Certified':False}
    (out/'P222_keyed_hub_hat_manifest.json').write_text(json.dumps(report,indent=2)+'\n')
    return report


if __name__ == '__main__':
    cli=argparse.ArgumentParser()
    cli.add_argument('--out',required=True,type=Path)
    report=build(cli.parse_args().out)
    print(json.dumps({'status':report['status'],
                      'geometryAudit':report['geometryAudit']},indent=2))
