#!/usr/bin/env python3
"""P2.18: real helical B-Rep threads as a proposed Model B rear-wheel center lock.

Replaces ONLY P2.16's explicitly unthreaded center-lock *proposal* during
native static review. Preserves every prior source STEP/GLB and Model B exterior.
No torque, OEM thread spec, retention, preload, rotational sweep or chassis mate
is claimed. Coordinates are rear wheel-local mm, axle Z.
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

from p2_16_rear_wheel_end import QUALITY, neutral_palette, pair_audit, parts as p216_parts
from p2_17_rear_brake_drive import source_parts as p217_parts

SCHEMA = 'peds.cad-first.p218-threaded-rear-center-lock-source.v1'
OLD_NUT = 'P216_REAR_CENTRE_LOCK_UNTHREADED_PROTOTYPE'
SPINDLE = 'P218_REAR_MALE_HELICAL_SPINDLE_EXTENSION'
NUT = 'P218_REAR_FEMALE_HELICAL_CENTER_LOCK_NUT'
PITCH_MM = 3.0
AXIS = 'Z'
PALETTE_ROLE = 'hardware'


def _helix(radius: float, height: float = 21.0) -> cq.Wire:
    return cq.Wire.makeHelix(PITCH_MM, height, radius).translate(cq.Vector(0, 0, 168))


def male_spindle() -> cq.Shape:
    # New 19 mm axial bore mates by FACE to original P2.16 hub at z=166;
    # their load path remains unverified. This is a helical solid B-Rep,
    # not a normal-map or shader imitation of a thread.
    core = cq.Solid.makeCylinder(22, 26, cq.Vector(0, 0, 166)).cut(
        cq.Solid.makeCylinder(19, 28, cq.Vector(0, 0, 165)))
    crest = (cq.Workplane('XZ')
             .polyline([(21.6, 167.05), (23.35, 168), (21.6, 168.95)])
             .close().sweep(_helix(22), isFrenet=True, combine=False).val())
    return core.fuse(crest).clean()


def female_nut() -> cq.Shape:
    # Real material cut along a matching helical B-Rep path; 12 flats are
    # forged into its external shell. Grooves have a deliberately generous
    # illustrative clearance, not certified F1 centre-lock engagement.
    shell = cq.Workplane('XY').polygon(12, 84).extrude(16).val().translate(
        cq.Vector(0, 0, 170))
    shell = shell.cut(cq.Solid.makeCylinder(22.85, 18, cq.Vector(0, 0, 169)))
    groove = (cq.Workplane('XZ')
              .polyline([(22.6, 166.85), (24.25, 168), (22.6, 169.15)])
              .close().sweep(_helix(22.85), isFrenet=True, combine=False).val())
    return shell.cut(groove).clean()


def source_parts() -> dict[str, cq.Shape]:
    output = {SPINDLE: male_spindle(), NUT: female_nut()}
    for name, shape in output.items():
        if shape.isNull() or not shape.isValid() or len(shape.Solids()) != 1 or shape.Volume() <= 0:
            raise ValueError('P2.18 invalid threaded native B-Rep: ' + name)
    return output


def combined_static_study() -> tuple[dict[str, cq.Shape], dict]:
    prior = p216_parts()
    if set([OLD_NUT]) - set(prior):
        raise ValueError('Original P2.16 unthreaded nut no longer found')
    del prior[OLD_NUT]
    prior.update(p217_parts())
    prior.update(source_parts())
    if len(prior) != 32:
        raise RuntimeError('Expected 23 - 1 + 8 + 2 = 32 native bodies')
    audit = pair_audit(prior)
    if not audit['passStatic']:
        raise ValueError('P2.18 combined native B-Rep collision: '+str(audit['unresolvedOverlap'][:4]))
    audit['removedSourceProxy'] = OLD_NUT
    audit['proposedSourcePartCount'] = len(prior)
    audit['replacedOriginalP216Files'] = False
    audit['dynamicMechanicalG2Certified'] = False
    return prior, audit


def _glb(catalog: dict[str, cq.Shape], path: Path, linear: float, angular: float) -> dict:
    palette, rgba = neutral_palette()
    scene = trimesh.Scene()
    triangles = 0
    for name, solid in catalog.items():
        vertices, faces = solid.tessellate(linear, angular)
        mesh = trimesh.Trimesh(
            vertices=np.asarray([[x.x, x.y, x.z] for x in vertices], dtype=float)/1000,
            faces=np.asarray(faces, dtype=np.int64), process=False)
        mesh.merge_vertices(digits_vertex=7)
        if len(mesh.faces) == 0 or not mesh.is_watertight or not mesh.is_winding_consistent:
            raise ValueError('Threaded P2.18 tessellation is non-manifold: ' + name)
        finish = palette['presets'][PALETTE_ROLE]
        mesh.visual = trimesh.visual.TextureVisuals(
            material=trimesh.visual.material.PBRMaterial(
                name=name, baseColorFactor=rgba,
                metallicFactor=finish['metalness'], roughnessFactor=finish['roughness'],
                doubleSided=True))
        scene.add_geometry(mesh, geom_name=name, node_name=name)
        triangles += len(mesh.faces)
    path.write_bytes(scene.export(file_type='glb'))
    return {'file': path.name, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
            'bytes': path.stat().st_size, 'meshNodes': list(catalog), 'triangles': triangles}


def build(out: Path) -> dict:
    if out.exists() and any(out.iterdir()):
        raise FileExistsError('P2.18 refuses overwrite of earlier CAD evidence')
    out.mkdir(parents=True, exist_ok=True)
    combined, audit = combined_static_study()
    (out/'P218_rear32_static_audit.json').write_text(json.dumps(audit, indent=2)+'\n')
    original = source_parts()
    assembly = cq.Assembly(name='P218_REAR_THREADED_CENTRE_LOCK_PROPOSAL')
    for name, body in original.items():
        assembly.add(body, name=name)
    step = out/'P218_threaded_center_lock.step'
    assembly.save(str(step), exportType='STEP')
    roundtrip = cq.importers.importStep(str(step)).solids().vals()
    if len(roundtrip) != 2 or not all(body.isValid() and body.Volume() > 0 for body in roundtrip):
        raise ValueError('P2.18 native STEP roundtrip failed')
    profiles = {}
    for tier, (linear, angular) in QUALITY.items():
        path = out/('P218_threaded_center_lock_' + tier.lower() + '.glb')
        profiles[tier] = _glb(source_parts(), path, linear, angular)
    palette, _ = neutral_palette()
    result = {
        'schema': SCHEMA, 'status': 'NATIVE_STATIC_THREAD_STUDY_PASS_G2_HOLD',
        'authoredParts': list(original), 'newCadSolids': 2,
        'reviewAssemblySolids': len(combined), 'originalP216UnthreadedNutReplacedOnlyInReview': OLD_NUT,
        'malePitchMm': PITCH_MM, 'femalePitchMm': PITCH_MM,
        'actualHelicalNativeBrep': True, 'threadHandedness': 'right',
        'shaftToHubFaceContactOnly': True, 'manufacturerThreadSpecCertified': False,
        'torqueOrBearingPreloadCertified': False, 'trueThreadEngagementCertified': False,
        'wheelSpindleDynamicMotionCertified': False, 'rearChassisHardpointsMeasured': False,
        'functionalDriveShaftLinkCertified': False, 'mechanicalG2Certified': False,
        'fullModelBIntegrated': False, 'sourceP216OrP217Changed': False,
        'materialPaletteSchema': palette['schema'], 'uniformMaterialColor': palette['uniformColor'],
        'nativeStep': {'file': step.name, 'sha256': hashlib.sha256(step.read_bytes()).hexdigest(),
                       'roundtripSolids': len(roundtrip)},
        'combinedStaticSourceAudit': audit, 'profiles': profiles,
        'blockers': [
            'Measured original Model B rear axle and chassis/gearbox pickup datums',
            'B-Rep fit with independent P2.9, P2.10, P2.12 and P2.14 components',
            'Fully constrained center-lock spindle load path and shaft engagement',
            'Thread tolerance class, rotation/torque, bearing preload and retention',
            'Real CV, brake hydraulic, bump and toe dynamic motion sweeps',
            'Browser Model B integration and captured visual QA',
        ],
    }
    (out/'P218_threaded_center_lock_manifest.json').write_text(json.dumps(result, indent=2)+'\n')
    return result


if __name__ == '__main__':
    cli = argparse.ArgumentParser()
    cli.add_argument('--out', required=True, type=Path)
    print(json.dumps(build(cli.parse_args().out), indent=2))
