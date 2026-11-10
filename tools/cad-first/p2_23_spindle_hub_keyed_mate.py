#!/usr/bin/env python3
"""P2.23 proposed four-key spindle / rear hub source connection.

Works from authentic P2.22 40-body rear source shapes, without altering
P2.16-P2.22 STEP, GLB, Model B, or the female centre-lock. Replaces the
hub and male threaded spindle bodies only in an auditable review instance.

Four axial male tabs on a hollow spindle insertion tenon occupy clearanced
female keyways broached in the P2.22 hub. Original swept right-handed thread
is retained. Nominal static fit, a positive forced-rotation collision and
isolated 40-body B-Rep audit are verified. This is a geometric proposal,
NOT proof of axial retention, structural torque, preload, stress, thermal
motion, bearing assembly or physical fit on the original Model B vehicle.

All lengths in millimetres. Axis Z. GLB output metres.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import cadquery as cq
import trimesh

from p2_16_rear_wheel_end import QUALITY, neutral_palette, pair_audit
from p2_18_center_lock import SPINDLE
from p2_22_keyed_hub_rotor import HUB, joined_source, glb_parts

SCHEMA = 'peds.cad-first.p223-rear-spindle-hub-keyed-mate.v1'
KEYS = 4
TENON_OUTER_RADIUS_MM = 18.65
HUB_BORE_RADIUS_MM = 19.0
TENON_INNER_RADIUS_MM = 14.0
INSERTION_START_Z_MM = 149.0
TENON_LENGTH_MM = 17.0
KEY_RADIAL_CENTER_MM = 19.7
# A deliberate clearanced, *rectangular* engineering proposal; not involute
# splines, broach manufacturing drawings or a manufacturer's part dimensions.
GROOVE_RADIAL_MM = 3.8
GROOVE_TANGENTIAL_MM = 5.4
GROOVE_LENGTH_MM = 14.3
TAB_RADIAL_MM = 3.0
TAB_TANGENTIAL_MM = 4.2
TAB_LENGTH_MM = 13.2
FORCED_TEST_ANGLE_DEG = 2.0
TEST_VOLUME_MIN_MM3 = 5.0


def source_box(radial: float, tangent: float, z: float, axial: float, turn: float) -> cq.Shape:
    return (cq.Workplane('XY').box(radial, tangent, axial).val()
            .translate((KEY_RADIAL_CENTER_MM, 0, z))
            .rotate((0, 0, 0), (0, 0, 1), turn))


def broach_hub(source: cq.Shape) -> cq.Shape:
    hub = source
    for index in range(KEYS):
        pocket = source_box(GROOVE_RADIAL_MM, GROOVE_TANGENTIAL_MM,
                            158.15, GROOVE_LENGTH_MM, 90 * index)
        hub = hub.cut(pocket)
    return hub.clean()


def spindle_with_tenon(source: cq.Shape) -> cq.Shape:
    # Insert OD 18.65 < source hub bore r19 (0.35 mm radial clearance).
    sleeve = (cq.Solid.makeCylinder(TENON_OUTER_RADIUS_MM, TENON_LENGTH_MM,
                                   cq.Vector(0, 0, INSERTION_START_Z_MM))
              .cut(cq.Solid.makeCylinder(TENON_INNER_RADIUS_MM, TENON_LENGTH_MM + 2,
                                         cq.Vector(0, 0, INSERTION_START_Z_MM - 1))))
    # A one-millimetre transition annulus bridges the 14-mm-ID tenon and
    # the existing 19-mm-ID P2.18 threaded spindle without extra 3D parts.
    bridge = (cq.Solid.makeCylinder(22, 1, cq.Vector(0, 0, 166))
              .cut(cq.Solid.makeCylinder(TENON_INNER_RADIUS_MM, 3,
                                         cq.Vector(0, 0, 165))))
    spindle = source.fuse(sleeve).fuse(bridge)
    for index in range(KEYS):
        key = source_box(TAB_RADIAL_MM, TAB_TANGENTIAL_MM,
                         158, TAB_LENGTH_MM, 90 * index)
        spindle = spindle.fuse(key)
    return spindle.clean()


def revised_parts(prior: dict[str, cq.Shape]) -> dict[str, cq.Shape]:
    if HUB not in prior or SPINDLE not in prior:
        raise ValueError('Missing original P2.22 hub or helical P2.18 spindle source')
    revised = {HUB: broach_hub(prior[HUB]),
               SPINDLE: spindle_with_tenon(prior[SPINDLE])}
    for name, shape in revised.items():
        if shape.isNull() or not shape.isValid() or len(shape.Solids()) != 1 or shape.Volume() <= 0:
            raise ValueError('P2.23 keyed replacement is not one valid native B-Rep: ' + name)
    return revised


def joined_source_223() -> tuple[dict[str, cq.Shape], dict[str, cq.Shape], dict]:
    prior, _, previous_report = joined_source()
    if len(prior) != 40 or not previous_report['nominalStaticAudit']['passStatic']:
        raise ValueError('P2.22 40-body source is not verified')
    revised = revised_parts(prior)
    joined = {**prior, **revised}
    if len(joined) != 40 or set(joined) != set(prior):
        raise ValueError('P2.23 source revisions must preserve precisely 40 part IDs')
    audit = pair_audit(joined)
    static_intersection = float(joined[HUB].intersect(joined[SPINDLE]).Volume())
    displaced = joined[SPINDLE].rotate((0, 0, 0), (0, 0, 1), FORCED_TEST_ANGLE_DEG)
    forced_overlap = float(joined[HUB].intersect(displaced).Volume())
    old_turn = prior[SPINDLE].rotate((0, 0, 0), (0, 0, 1), FORCED_TEST_ANGLE_DEG)
    previous_forced_overlap = float(prior[HUB].intersect(old_turn).Volume())
    old_helix_loss = float(prior[SPINDLE].cut(joined[SPINDLE]).Volume())
    if not audit['passStatic'] or static_intersection > .05:
        raise ValueError('P2.23 nominal source has unacceptable native intersections')
    if forced_overlap < TEST_VOLUME_MIN_MM3 or previous_forced_overlap > .05:
        raise ValueError('P2.23 native key engagement negative control failed')
    if old_helix_loss > .05:
        raise ValueError('P2.18 original helical surface was altered or deleted')
    evidence = {
        'schema': SCHEMA,
        'status': 'FOUR_KEY_NOMINAL_SOURCE_STATIC_PASS_G2_HOLD',
        'partCount': 40,
        'replacedNativePartIds': list(revised),
        'actualHelicalBrepPreserved': True,
        'radialTenonToBoreClearanceMm': HUB_BORE_RADIUS_MM - TENON_OUTER_RADIUS_MM,
        'keyCount': KEYS,
        'keyGrooveDimensionsMm': [GROOVE_RADIAL_MM, GROOVE_TANGENTIAL_MM, GROOVE_LENGTH_MM],
        'keyTabDimensionsMm': [TAB_RADIAL_MM, TAB_TANGENTIAL_MM, TAB_LENGTH_MM],
        'nominalNativeHubSpindleOverlapMm3': static_intersection,
        'originalHubSpindleForcedOverlapMm3': previous_forced_overlap,
        'forcedRelativeRotationDeg': FORCED_TEST_ANGLE_DEG,
        'forcedRotationNativeOverlapMm3': forced_overlap,
        'originalHelixMissingVolumeMm3': old_helix_loss,
        'nativeStaticAudit': audit,
        'originalModelBIncluded': False,
        'actualCarHardpointsMeasured': False,
        'axialRetentionCertified': False,
        'transmittedTorqueCertified': False,
        'bearingPreloadCertified': False,
        'mechanicalG2Certified': False,
        'p220Original63BodyCrossSourcePassed': False,
    }
    return joined, revised, evidence


def build(out: Path) -> dict:
    if out.exists():
        raise FileExistsError('P2.23 refuses overwrite of old native CAD evidence')
    _, revised, evidence = joined_source_223()
    out.mkdir(parents=True)
    assembly = cq.Assembly(name='P223_REAR_KEYED_SPINDLE_HUB_NOMINAL_SOURCE_G2_HOLD')
    for name, shape in revised.items():
        assembly.add(shape, name=name)
    step = out / 'P223_rear_keyed_spindle_hub.step'
    assembly.save(str(step), exportType='STEP')
    imported = cq.importers.importStep(str(step)).solids().vals()
    if len(imported) != 2 or not all(s.isValid() and len(s.Solids()) == 1 for s in imported):
        raise ValueError('P2.23 STEP original 2-solid roundtrip failed')
    profiles = {}
    for name, (linear, angular) in QUALITY.items():
        # Fresh OpenCascade B-Reps per LOD prevent triangulation-cache drift.
        previous, _, _ = joined_source()
        fresh = revised_parts(previous)
        file = out / ('P223_rear_keyed_spindle_hub_' + name.lower() + '.glb')
        profiles[name] = glb_parts(fresh, file, linear, angular)
    triangles = [profiles[name]['triangles'] for name in QUALITY]
    if not triangles[0] > triangles[1] > triangles[2]:
        raise ValueError('P2.23 quality tiers must use progressively fewer triangles')
    palette, _ = neutral_palette()
    manifest = {
        'schema': SCHEMA,
        'status': evidence['status'],
        'nativeRevisedSolids': 2,
        'preservedReviewBodyCount': 40,
        'materialColor': palette['uniformColor'],
        'sourceSTEP': {'file': step.name, 'sha256': hashlib.sha256(step.read_bytes()).hexdigest(),
                       'roundtripSolidCount': len(imported)},
        'profiles': profiles,
        'geometryAudit': evidence,
        'originalOwnerSourceFilesModified': False,
        'originalModelBIntegrated': False,
        'mechanicalG2Certified': False,
        'remainingBlockingChecks': [
            'Real original Model B rear chassis pickup and wheel station measurements',
            'P2.9-P2.14 cross source geometry and dynamic articulation with latest P2.23 source',
            'Positive axial spindle and center-lock retention plus real load/torque and fatigue study',
            'Authentic spline/shaft interface and running wheel-spin, bump and toe clearances',
            'Original Model B web assembly and six-chapter desktop/mobile visual QA',
        ],
    }
    (out / 'P223_rear_keyed_spindle_hub_manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
    (out / 'P223_rear_keyed_spindle_hub_native_audit.json').write_text(json.dumps(evidence, indent=2)+'\n')
    return manifest


if __name__ == '__main__':
    cli = argparse.ArgumentParser()
    cli.add_argument('--out', required=True, type=Path)
    print(json.dumps(build(cli.parse_args().out), indent=2))
