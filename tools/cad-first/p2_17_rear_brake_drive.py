#!/usr/bin/env python3
"""P2.17 provisional rear brake/drive interfaces for original Model B CAD-first.

Eight independently named native B-Rep solids, in rear wheel-local mm.
This is static geometry for fit studies, NOT chassis hardpoint measurement,
proof of a CV joint, wheel drive kinematics, actual fastener/thread or G2 mate.
The original P2.16 source is never altered.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import cadquery as cq
import numpy as np
import trimesh

from p2_16_rear_wheel_end import QUALITY, axial_ring, neutral_palette, pair_audit, parts as p216_parts

PREFIX = 'P217_REAR_'
SCHEMA = 'podium-eds.cad-first.p217-rear-brake-drive-static.v1'


def _box(x: float, y: float, z: float, size: tuple[float, float, float]) -> cq.Shape:
    return cq.Workplane('XY').box(*size).val().translate((x, y, z))


def _shaft(radius: float, z0: float, length: float) -> cq.Shape:
    return cq.Solid.makeCylinder(radius, length, cq.Vector(0, 0, z0))


def source_parts() -> dict[str, cq.Shape]:
    # Rotor r=63..194, z=-64..-46 in P2.16. An inboard caliper cheek and
    # an outboard cheek sit on opposite sides, joined clear of the rotor OD.
    # The study intentionally leaves air gaps instead of fictional contact.
    cheek_in = _box(0, 205, -83, (40, 18, 22))     # z -94..-72
    cheek_out = _box(0, 205, -31, (40, 18, 22))    # z -42..-20
    bridge = _box(0, 214, -57, (40, 12, 74))      # r max < rim's r=223
    caliper = cheek_in.fuse(cheek_out).fuse(bridge).clean()
    catalog = {
        PREFIX + 'ROTOR_HAT_SPACER': axial_ring(58, 62, -90, 22),
        PREFIX + 'BRAKE_CALIPER_CAST_BODY': caliper,
        PREFIX + 'BRAKE_PAD_INBOARD': _box(0, 187, -68, (30, 12, 4)),
        PREFIX + 'BRAKE_PAD_OUTBOARD': _box(0, 187, -42, (30, 12, 4)),
        PREFIX + 'BEARING_DUST_SEAL': axial_ring(58, 62.5, -65, 3),
        PREFIX + 'DRIVE_HALF_SHAFT_UNSPLINED': _shaft(20, -348, 99),
        PREFIX + 'CV_BOOT_ENVELOPE': axial_ring(23, 36, -232, 16),
        PREFIX + 'CV_HOUSING_PROTOTYPE': axial_ring(21, 40, -245, 11),
    }
    if len(catalog) != 8:
        raise AssertionError('P2.17 part catalog changed')
    for name, shape in catalog.items():
        if shape.isNull() or not shape.isValid() or len(shape.Solids()) != 1 or shape.Volume() <= 0:
            raise ValueError('Invalid P2.17 native connected solid: ' + name)
    return catalog


def _role(name: str) -> str:
    if 'PAD' in name: return 'friction-pad'
    if 'BRAKE_CALIPER' in name: return 'caliper'
    if 'ROTOR' in name: return 'hub'
    if 'BEARING' in name: return 'bearing'
    if 'SHAFT' in name: return 'hardware'
    if 'CV_' in name: return 'rear-joint'
    return 'other'


def _profile_glb(catalog: dict[str, cq.Shape], path: Path, linear: float, angular: float) -> dict:
    palette, rgba = neutral_palette()
    scene = trimesh.Scene()
    triangles = 0
    for name, solid in catalog.items():
        v, f = solid.tessellate(linear, angular)
        mesh = trimesh.Trimesh(vertices=np.array([[p.x, p.y, p.z] for p in v], dtype=float)/1000,
                               faces=np.array(f, dtype=np.int64), process=False)
        mesh.merge_vertices(digits_vertex=7)
        if not mesh.is_watertight or not mesh.is_winding_consistent or not len(mesh.faces):
            raise ValueError('P2.17 nonmanifold glTF tessellation: ' + name)
        preset = palette['presets'][_role(name)]
        mesh.visual = trimesh.visual.TextureVisuals(material=trimesh.visual.material.PBRMaterial(
            name=name, baseColorFactor=rgba, metallicFactor=preset['metalness'],
            roughnessFactor=preset['roughness'], doubleSided=True))
        scene.add_geometry(mesh, node_name=name, geom_name=name)
        triangles += len(mesh.faces)
    path.write_bytes(scene.export(file_type='glb'))
    return {'file':path.name, 'bytes':path.stat().st_size, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
            'triangles': triangles, 'meshNodes':list(catalog)}


def build(out: Path) -> dict:
    if out.exists() and any(out.iterdir()):
        raise FileExistsError('Refusing to overwrite existing native P2.17 evidence')
    out.mkdir(parents=True, exist_ok=True)
    catalog = source_parts()
    # Joint audit is an independent source study, NOT a measured Model B fit.
    combined = {**p216_parts(), **catalog}
    audit = pair_audit(combined)
    (out/'P217_cross_p216_static_audit.json').write_text(json.dumps(audit, indent=2)+'\n')
    if not audit['passStatic']:
        raise ValueError('P2.17/P2.16 source collision audit failed')
    assembly = cq.Assembly(name='P217_INDEPENDENT_REAR_INTERFACE_PROPOSAL')
    for name, shape in catalog.items():
        assembly.add(shape, name=name)
    step = out/'P217_rear_brake_drive.step'
    assembly.save(str(step), exportType='STEP')
    imported = cq.importers.importStep(str(step)).solids().vals()
    if len(imported) != 8 or not all(x.isValid() for x in imported):
        raise ValueError('P2.17 native STEP roundtrip failed')
    exports = {}
    for tier, (linear, angular) in QUALITY.items():
        path = out/('P217_rear_brake_drive_' + tier.lower() + '.glb')
        # OpenCascade caches triangulation on the TopoDS shape: generate a
        # fresh B-Rep per LOD instead of re-exporting the HIGH mesh three times.
        exports[tier] = _profile_glb(source_parts(), path, linear, angular)
    palette, _ = neutral_palette()
    result = {
        'schema':SCHEMA,'status':'STATIC_CAD_ONLY_G2_HOLD', 'nativeSolids':8,
        'sourcePartIds':list(catalog), 'crossP216StaticAudit':audit,
        'sourceP216Changed':False, 'sourceModelBChanged':False,
        'modelBRearStationMeasured':False, 'crossP29P210P212P214Verified':False,
        'functionalCVJointClaim':False,'axleSplineClaim':False,
        'driveLoadPathCertified':False,'dynamicKinematicsCertified':False,
        'mechanicalG2Certified':False,
        'materialPaletteSchema':palette['schema'],
        'materialBaseColor':palette['uniformColor'],
        'source':{'step':step.name,'sha256':hashlib.sha256(step.read_bytes()).hexdigest()},
        'qualityProfiles':exports,
        'blockingBeforeModelBAssembly':[
            'Real Model B rear chassis and gearbox half-shaft points',
            'P2.9/P2.10/P2.12/P2.14 joint re-mate and static interference',
            'Actual center lock thread, torque, bearing preload and seal fit',
            'Real brake pad/rotor contact, caliper hydraulic mount and loads',
            'CV articulation plus combined wheel bump, roll and toe clearance',
        ],
    }
    (out/'P217_rear_brake_drive_manifest.json').write_text(json.dumps(result,indent=2)+'\n')
    return result


if __name__ == '__main__':
    ap=argparse.ArgumentParser()
    ap.add_argument('--out',type=Path,required=True)
    opts=ap.parse_args()
    print(json.dumps(build(opts.out),indent=2))
