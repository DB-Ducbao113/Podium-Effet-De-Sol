#!/usr/bin/env python3
"""P2.5 sampled wheel-spin B-Rep clearance, NOT continuous-motion certification.

CAD +Z axle, geometry in mm. Source is the original P2.4 53-solid STEP.
Group A: wheel/hub/rotor/fasteners and bearing inner race spin together.
Group B: bearing ball centers and cage orbit at HALF the wheel angle as
a deliberately idealized demonstration (NOT actual bearing dynamics).
Group C: caliper, pads, upright, rods and bearing outer race stay fixed.

Conservative scope: all pairs of DIFFERENT motion groups are inspected
when their AABBs overlap. Same-group contacts are inherited from SHA-verified
neutral P2.4 static B-Rep audit; transform is rigid for the whole group.
Sampling does NOT prove the unsampled trajectory has no collisions.

Run:
 python tools/cad-first/p2_5_dynamic_clearance.py \
   --folder .local-assets/cad-first/front-left-p2-4 \
   --report .local-assets/cad-first/front-left-p2-4/P2_5_dynamic_spin_audit.json \
   --step-degrees 15
"""
from __future__ import annotations
import argparse, hashlib, json, math, time
from pathlib import Path
from p2_4_assembly_fit import make_fitted_parts

VOLUME_THRESHOLD_MM3 = 0.05
BROADPHASE_EPSILON_MM = 0.00001
WHEEL_PARTS = {
    'P2_BEARING_INNER_RACE','P2_TYRE_SLICK_BODY','P2_RIM_FORGED_BARREL',
    'P2_WHEEL_HUB_SHAFT_FLANGE','P2_CENTER_STUD_EXTERNAL_HELIX',
    'P2_CENTER_LOCK_NUT_BORE','P2_CENTER_LOCK_FACE_RING',
    'P2_BRAKE_ROTOR_DRILLED_CARBON','P2_BRAKE_ROTOR_HAT',
}

def sha256(file: Path) -> str:
    return hashlib.sha256(file.read_bytes()).hexdigest()

def motion_group(name: str) -> str:
    if name.startswith('P2_BEARING_BALL_') or name == 'P2_BEARING_RETAINER_12_POCKET':
        return 'BEARING_ORBIT'
    if name in WHEEL_PARTS or name.startswith('P2_ROTOR_MOUNT_'):
        return 'WHEEL_ROTATION'
    return 'STATIC'

def aabb_overlap(first, second) -> bool:
    return all(
        min(getattr(first, axis+'max'),getattr(second,axis+'max')) -
        max(getattr(first, axis+'min'),getattr(second,axis+'min')) > BROADPHASE_EPSILON_MM
        for axis in 'xyz'
    )

def run(folder: Path, angles: list[int]) -> dict:
    manifest_file = folder/'P2_4_fit_manifest.json'
    manifest = json.loads(manifest_file.read_text())
    static_file = folder/manifest['staticCollisionAudit']['file']
    static = json.loads(static_file.read_text())
    step_file = folder/manifest['masterSTEP']
    if (sha256(step_file) != manifest['masterSTEPsha256'] or
        sha256(static_file) != manifest['staticCollisionAudit']['sha256']):
        raise ValueError('P2.4 STEP and static collision audit SHA-256 mismatch')
    if not static['allStaticPairsPass'] or static['unresolvedPairs']:
        raise ValueError('P2.4 neutral assembled pose has not passed its static audit')

    t0 = time.monotonic()
    parts, _, _ = make_fitted_parts()
    if len(parts) != 53 or set(parts) != set(manifest['partIds']):
        raise ValueError('Incorrect source identity: expected precisely 53 P2.4 solids')
    names = list(parts)
    groups = {name: motion_group(name) for name in names}
    counts = {g: sum(value == g for value in groups.values()) for g in sorted(set(groups.values()))}
    moving_pairs = [(a,b) for i,a in enumerate(names) for b in names[i+1:]
                    if groups[a] != groups[b]]
    total = len(names)*(len(names)-1)//2
    report = {
        'schema': 'podium-eds.p2.cad-first.dynamic-spin.v1',
        'sourceSTEP': step_file.name,
        'sourceSTEPsha256': manifest['masterSTEPsha256'],
        'sourceManifestSha256': sha256(manifest_file),
        'baselineAuditSha256': sha256(static_file),
        'model': 'Project-authored 53-solid P2.4 front-left CAD; axle +Z in source mm',
        'motionGroups': counts,
        'groupMap': groups,
        'motionAssumptions': {
            'wheelRigidSpinAboutGlobalZ': True,
            'bearingsBallsAndCageOrbitAtHalfWheelAngle':
                'idealized stationary outer race / moving inner race',
            'outerBearingRaceUprightCaliperFixed': True,
            'suspensionArmJointsNotModeled': True,
            'steerAngleDegrees': 'NOT EVALUATED',
            'suspensionTravelMm': 'NOT EVALUATED',
            'brakePadCompression': 'NOT EVALUATED',
            'discreteSamplesNotContinuousGuarantee': True,
        },
        'wheelDegrees': angles,
        'candidateDynamicPairsPerPose': len(moving_pairs),
        'unchangedPairsInheritedFromStaticBaseline': total - len(moving_pairs),
        'intersectionThresholdMm3': VOLUME_THRESHOLD_MM3,
        'poses': [],
        'unresolvedCollisions': [],
        'booleanErrors': [],
        'passedSampledWheelSpin': False,
        'dynamicSteeringAndSuspensionCertified': False,
        'f1ManufacturingOrSafetyCertified': False,
    }
    for angle in angles:
        if angle == 0:
            report['poses'].append({
                'wheelAngleDeg': 0, 'bearingOrbitalAngleDeg': 0,
                'broadphaseCandidates': 0, 'exactBrepPairs': 0,
                'skippedPairs': len(moving_pairs), 'collisionCount': 0,
                'status': 'BASELINE STATIC AUDIT (SHA VERIFIED)',
            })
            continue
        moved = {}
        bounds = {}
        for name, solid in parts.items():
            group = groups[name]
            degrees = angle if group == 'WHEEL_ROTATION' else (
                angle*0.5 if group == 'BEARING_ORBIT' else 0
            )
            moved[name] = solid.rotate((0,0,0),(0,0,1),float(degrees)) if degrees else solid
            bounds[name] = moved[name].BoundingBox()
        candidates = [(a,b) for a,b in moving_pairs if aabb_overlap(bounds[a],bounds[b])]
        collisions = []
        errors = []
        for a,b in candidates:
            try:
                volume = moved[a].intersect(moved[b]).Volume()
                if not math.isfinite(volume):
                    raise ValueError('Nonfinite intersection volume')
                if volume > VOLUME_THRESHOLD_MM3:
                    collisions.append({'a':a,'b':b,'volumeMm3':round(volume,4)})
            except Exception as error:
                errors.append({'a':a,'b':b,'error':str(error)})
        report['poses'].append({
            'wheelAngleDeg':angle, 'bearingOrbitalAngleDeg':angle*0.5,
            'broadphaseCandidates':len(candidates),
            'exactBrepPairs':len(candidates),
            'skippedPairs':len(moving_pairs)-len(candidates),
            'collisionCount':len(collisions),'booleanErrorCount':len(errors),
            'collisions':collisions,'errors':errors,
            'status':'SAMPLED PASS' if not collisions and not errors else 'FAIL',
        })
        report['unresolvedCollisions'].extend({'angle':angle,**v} for v in collisions)
        report['booleanErrors'].extend({'angle':angle,**v} for v in errors)
        print(f'{angle:3d}°: {len(candidates):3d} exact B-Rep pairs, '
              f'{len(collisions)} collisions, {len(errors)} errors', flush=True)
    report['totalExactBrepOperations'] = sum(
        item['exactBrepPairs'] for item in report['poses']
    )
    report['passedSampledWheelSpin'] = (
        not report['unresolvedCollisions'] and not report['booleanErrors']
        and len(report['poses']) == len(angles)
    )
    report['elapsedSeconds'] = round(time.monotonic()-t0,3)
    report['resultScope'] = (
        'PASS on sampled rigid-wheel poses ONLY; NOT continuous rotation, '
        'contact dynamics, bearing preload, suspension travel or steering.'
    )
    return report

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--folder',required=True,type=Path)
    parser.add_argument('--report',required=True,type=Path)
    parser.add_argument('--step-degrees',type=int,default=15)
    args = parser.parse_args()
    if args.step_degrees < 1 or args.step_degrees > 90 or 360 % args.step_degrees:
        raise ValueError('step-degrees must be a divisor of 360 between 1 and 90')
    result = run(args.folder,list(range(0,360,args.step_degrees)))
    args.report.parent.mkdir(parents=True,exist_ok=True)
    args.report.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print('SAMPLED MOTION:', 'PASS' if result['passedSampledWheelSpin'] else 'FAIL',
          '· exact B-Rep intersections:',result['totalExactBrepOperations'],flush=True)
