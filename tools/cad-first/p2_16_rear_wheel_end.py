#!/usr/bin/env python3
"""P2.16 independently authored REAR wheel-end B-Rep, not a reflected P2.8 front corner.

CAD geometry in millimetres. GLB geometry in metres. X forward, Y up,
Z outboard in the wheel-local frame. Wheel/rim exterior design starts from
published 2022 F1 nominal dimensions; all *internal* interfaces are new,
provisional project-authored shapes, not OEM CAD or measured Model B joints.

This stage does NOT replace P2.8 rear visual proxies or certify G2 mechanical
mating: actual Model B rear envelope, drive, caliper, suspension and axial
retention need independent physical measurements and clearance studies.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
from typing import Any

import cadquery as cq
import numpy as np
import trimesh

SCHEMA = 'podium-eds.cad-first.p216-independent-rear-wheel-end.v1'
PREFIX = 'P216_REAR_'
QUALITY = {'HIGH': (.04, .10), 'BALANCED': (.18, .26), 'PERFORMANCE': (.50, .50)}
TYRE_DIAMETER_MM = 720.0
TYRE_WIDTH_MM = 450.0
TYRE_TREAD_WIDTH_MM = 405.0
RIM_LIP_DIAMETER_MM = 490.6
RIM_MOUNTING_WIDTH_MM = 429.3
# The exact P2.9 proposal bore is r=71.5 mm, z=-150..-74 mm.
REAR_UPRIGHT_PROPOSAL_BORE_RADIUS_MM = 71.5
SOURCE_NOTE = (
    'Provisional original rear wheel CAD: not a P2.8 front source proxy, '
    'not a measured original Model B chassis fit, not a mechanical G2 release'
)


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def axial_ring(inner: float, outer: float, start: float, length: float) -> cq.Shape:
    if not (0 < inner < outer and length > 0):
        raise ValueError('Axial ring dimension invalid')
    outer_cyl = cq.Solid.makeCylinder(outer, length, cq.Vector(0, 0, start))
    bore = cq.Solid.makeCylinder(inner, length + 2, cq.Vector(0, 0, start - 1))
    return outer_cyl.cut(bore)


def rear_tyre() -> cq.Shape:
    # A section revolved around the Z axle. Continuous tread, rounded
    # shoulder/sidewall approximations and a hollow internal air envelope.
    # The bead never intersects the separately modeled rim.
    section = [
        (250, -212), (270, -221), (309, -225), (330, -220),
        (345, -214), (355, -207), (360, -TYRE_TREAD_WIDTH_MM / 2),
        (360, TYRE_TREAD_WIDTH_MM / 2), (355, 207), (345, 214),
        (330, 220), (309, 225), (270, 221), (250, 212),
        (248, 203), (251, 196), (272, 197), (309, 199),
        (330, 186), (344, 158), (348, 103), (350, 0),
        (348, -103), (344, -158), (330, -186), (309, -199),
        (272, -197), (251, -196), (248, -203),
    ]
    return cq.Workplane('XZ').polyline(section).close().revolve(360, (0, 0), (0, 1)).val()


def rear_rim() -> cq.Shape:
    # Original source rear-specific ring/spoke geometry. A separate inner
    # flange and ten load-path spokes are *fused* into one connected B-Rep.
    rim = axial_ring(223, 236, -214.65, RIM_MOUNTING_WIDTH_MM)
    rim = rim.fuse(axial_ring(224, RIM_LIP_DIAMETER_MM / 2, -214.65, 9))
    rim = rim.fuse(axial_ring(224, RIM_LIP_DIAMETER_MM / 2, 205.65, 9))
    rim = rim.fuse(axial_ring(61, 84, 125, 30))
    for index in range(10):
        angle = 2 * math.pi * index / 10
        axis = cq.Vector(math.cos(angle), math.sin(angle), 0)
        start = cq.Vector(78 * axis.x, 78 * axis.y, 140)
        rim = rim.fuse(cq.Solid.makeCylinder(11, 158, start, axis))
    return rim


def brake_rotor() -> cq.Shape:
    rotor = axial_ring(63, 194, -64, 18)
    # Vent/lightening holes are actual boolean-bored, not shader decals.
    for index in range(16):
        a = 2 * math.pi * index / 16
        x, y = 160 * math.cos(a), 160 * math.sin(a)
        rotor = rotor.cut(cq.Solid.makeCylinder(7, 20, cq.Vector(x, y, -65)))
    return rotor.clean()


def ball(index: int, count: int = 16) -> cq.Shape:
    a = 2 * math.pi * index / count
    return cq.Solid.makeSphere(1.60, cq.Vector(63.25 * math.cos(a), 63.25 * math.sin(a), -117), angleDegrees1=-90, angleDegrees2=90)


def parts() -> dict[str, cq.Shape]:
    catalog = {
        PREFIX + 'TYRE_SLICK': rear_tyre(),
        PREFIX + 'FORGED_RIM_10_SPOKE': rear_rim(),
        PREFIX + 'HUB_STUB': axial_ring(19, 57.6, -145, 311),
        PREFIX + 'BEARING_OUTER_RACE': axial_ring(65, 70.8, -139, 44),
        PREFIX + 'BEARING_INNER_RACE': axial_ring(58.5, 61.5, -139, 44),
        PREFIX + 'BRAKE_DISC_VENTED': brake_rotor(),
        PREFIX + 'CENTRE_LOCK_UNTHREADED_PROTOTYPE': axial_ring(20, 71, 169, 15),
    }
    for i in range(16):
        catalog[PREFIX + f'BEARING_BALL_{i + 1:02d}'] = ball(i)
    if len(catalog) != 23:
        raise RuntimeError('Independent rear wheel-end catalog count changed')
    for name, body in catalog.items():
        if body.isNull() or not body.isValid() or len(body.Solids()) != 1 or body.Volume() <= 0:
            raise ValueError('Invalid native connected B-Rep solid: ' + name)
    return catalog


def pair_audit(catalog: dict[str, cq.Shape], threshold: float = .05) -> dict[str, Any]:
    bounds = {name: solid.BoundingBox() for name, solid in catalog.items()}
    names = list(catalog)
    checked = 0
    excluded = 0
    overlaps = []
    for i, name in enumerate(names):
        for other in names[i+1:]:
            a, b = bounds[name], bounds[other]
            if any(min(getattr(a, axis + 'max'), getattr(b, axis + 'max')) <=
                   max(getattr(a, axis + 'min'), getattr(b, axis + 'min')) for axis in 'xyz'):
                excluded += 1
                continue
            checked += 1
            volume = catalog[name].intersect(catalog[other]).Volume()
            if not math.isfinite(volume) or volume > threshold:
                overlaps.append({'left': name, 'right': other, 'overlapMm3': volume})
    return {'solidPairs': len(names)*(len(names)-1)//2, 'broadphaseExcluded': excluded,
            'exactBrepPairs': checked, 'thresholdMm3': threshold,
            'unresolvedOverlap': overlaps, 'passStatic': not overlaps,
            'rearOriginalModelBFitCertified': False, 'suspensionKinematicsCertified': False,
            'mechanicalG2Certified': False}


def to_glb(catalog: dict[str, cq.Shape], path: Path, linear: float, angular: float) -> dict[str, Any]:
    scene = trimesh.Scene()
    total_triangles = 0
    for name, solid in catalog.items():
        if 'BEARING_BALL_' in name:
            # OCCT's pole/seam UV triangulation for a mathematically exact
            # sphere can be non-manifold in GLB. Tessellate its native B-Rep
            # analytic radius as a watertight icosphere at the same CAD datum.
            index = int(name.rsplit('_', 1)[-1]) - 1
            a = 2 * math.pi * index / 16
            subdivisions = 3 if linear < .1 else 2 if linear < .3 else 1
            mesh = trimesh.creation.icosphere(subdivisions=subdivisions, radius=.0016)
            mesh.apply_translation([.06325 * math.cos(a), .06325 * math.sin(a), -.117])
        else:
            vertices, faces = solid.tessellate(linear, angular)
            mesh = trimesh.Trimesh(
                vertices=np.array([[v.x, v.y, v.z] for v in vertices], dtype=np.float64)/1000,
                faces=np.array(faces, dtype=np.int64), process=False)
            mesh.merge_vertices(digits_vertex=7)
        if not mesh.is_watertight or not mesh.is_winding_consistent or not len(mesh.faces):
            raise ValueError('Invalid GLB tessellation/winding for ' + name)
        if 'TYRE' in name:
            rgba, metal, rough = [28, 30, 33, 255], 0.0, .84
        elif 'DISC' in name:
            rgba, metal, rough = [69, 72, 74, 255], .18, .63
        elif 'RIM' in name:
            rgba, metal, rough = [77, 82, 89, 255], .73, .3
        else:
            rgba, metal, rough = [183, 192, 197, 255], .76, .29
        mesh.visual = trimesh.visual.TextureVisuals(
            material=trimesh.visual.material.PBRMaterial(
                name=name, baseColorFactor=rgba, metallicFactor=metal,
                roughnessFactor=rough, doubleSided=True))
        scene.add_geometry(mesh, node_name=name, geom_name=name)
        total_triangles += len(mesh.faces)
    path.write_bytes(scene.export(file_type='glb'))
    return {'triangles': total_triangles, 'meshNodes': list(catalog),
            'bytes': path.stat().st_size, 'sha256': digest(path)}


def build(out: Path, export_all: bool = True) -> dict[str, Any]:
    if out.exists() and any(out.iterdir()):
        raise FileExistsError('Never overwrite existing rear CAD review exports')
    out.mkdir(parents=True, exist_ok=True)
    catalog = parts()
    audit = pair_audit(catalog)
    (out/'P216_static_audit.json').write_text(json.dumps(audit, indent=2) + '\n')
    if not audit['passStatic']:
        raise ValueError('Rear CAD source static collision gate failed')
    assembly = cq.Assembly(name='P216_INDEPENDENT_REAR_WHEEL_END_PROPOSAL')
    for name, body in catalog.items():
        assembly.add(body, name=name)
    step = out/'P216_rear_wheel_end.step'
    assembly.save(str(step), exportType='STEP')
    imported = cq.importers.importStep(str(step)).solids().vals()
    if len(imported) != len(catalog) or not all(s.isValid() and s.Volume() > 0 for s in imported):
        raise ValueError('Native STEP roundtrip failed 23-solid source identity')
    profiles = {}
    if export_all:
        for profile, (linear, angular) in QUALITY.items():
            path = out/('P216_rear_wheel_end_' + profile.lower() + '.glb')
            profiles[profile] = {'file': path.name, **to_glb(catalog, path, linear, angular)}
    manifest = {
        'schema': SCHEMA, 'originalCADSource': True, 'notFrontProxy': True,
        'status': 'NATIVE_REAR_CAD_SOURCE_STATIC_ONLY_G2_HOLD',
        'manufacturingAuthenticityClaim': False, 'ownerModelBRearEnvelopeMeasured': False,
        'rearWheelStationMated': False, 'rearUprightChassisMateCertified': False,
        'sourceNote': SOURCE_NOTE,
        'coordinateFrame': 'X forward / Y up / Z outboard in rear wheel-local coordinates',
        'unitsSTEP': 'mm', 'unitsGLB': 'm',
        'referenceDimensionsMm': {
            'tyreDiameter': TYRE_DIAMETER_MM, 'tyreOverallWidth': TYRE_WIDTH_MM,
            'tyreTreadWidth': TYRE_TREAD_WIDTH_MM,
            'rimLipDiameter': RIM_LIP_DIAMETER_MM, 'rimMountingWidth': RIM_MOUNTING_WIDTH_MM,
            'proposedP29CarrierBearingBoreRadius': REAR_UPRIGHT_PROPOSAL_BORE_RADIUS_MM,
        },
        'partIds': list(catalog), 'solidCount': len(catalog),
        'masterSTEP': step.name, 'masterSTEPSha256': digest(step),
        'nativeStepRoundTripSolids': len(imported), 'staticCadAudit': audit,
        'profiles': profiles,
        'blockingBeforeCarIntegration': [
            'Measure source Model B separate rear wheel envelope and wheel-centre registration',
            'Re-author exact rear brake caliper/rotor mount, drive shaft/CV and stud load paths',
            'Constrain central lock thread/axle spline and wheel rim bead interface',
            'Reconcile chassis hardpoints and P2.9/P2.10/P2.12/P2.14 native source clearances',
            'Verify steering/bump/toe sweep and wheel spin with finite clearances',
            'Execute fresh local original Model B Chromium visibility and 6-chapter video gates',
        ],
    }
    (out/'P216_rear_wheel_manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    return manifest


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--out', required=True, type=Path)
    args = parser.parse_args()
    result = build(args.out)
    print(json.dumps({'solidCount': result['solidCount'],
                      'audit': result['staticCadAudit'],
                      'profileTriangles': {k: v['triangles'] for k, v in result['profiles'].items()}}, indent=2))
