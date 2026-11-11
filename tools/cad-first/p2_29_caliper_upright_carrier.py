#!/usr/bin/env python3
"""P2.29 brake-caliper radial carrier for authentic source P2.9 and P2.28.

CadQuery/OCCT source-only static assembly; no Model B body binary required or
modified. Original P2.9 upright and P2.17 caliper are machined as *review*
instances to accept a curved/saddle-faced carrier and four independent
unthreaded mounting studs. Exact prior Git blob integrity is required.

This is not an OEM/F1 CAD drawing, compliant caliper attachment, finite-
element load study, fastener retention, suspension kinematic fit or G2 signoff.
Lengths mm, glTF vertices metres, local wheel axis Z.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import cadquery as cq
import numpy as np
import trimesh

from p2_9_rear_upright import PART_ID as UPRIGHT, build_rear_upright
from p2_17_rear_brake_drive import source_parts as source_p217
from p2_16_rear_wheel_end import QUALITY,neutral_palette,pair_audit
from p2_28_halfshaft_hub_connection import audit_source as source_p228
from p2_21_rear_rotor_mount import native_distance

SCHEMA='peds.cad-first.p229-original-p29-caliper-carrier-static.v1'
REVIEW_SCHEMA='peds.cad-first.p229-native-mount-source-review.v1'
CALIPER='P217_REAR_BRAKE_CALIPER_CAST_BODY'
CARRIER='P229_REAR_BRAKE_CALIPER_RADIAL_CARRIER'
CAL_BOLT=('P229_REAR_CALIPER_MOUNT_BOLT_UNTHREADED_01','P229_REAR_CALIPER_MOUNT_BOLT_UNTHREADED_02')
UPR_BOLT=('P229_REAR_UPRIGHT_MOUNT_BOLT_UNTHREADED_01','P229_REAR_UPRIGHT_MOUNT_BOLT_UNTHREADED_02')
SOURCE_EXPECTED={
 'p2_9_rear_upright.py':'0a6b95d53479b63006d2103b24efb44e846589b1',
 'p2_17_rear_brake_drive.py':'7d4a0b64b309b234c16965465130e496f787de5e',
 'p2_28_halfshaft_hub_connection.py':'a33a5f5d0f98310ab7d948554d038e5d2f667bdc',
}
COLOR='#87929d'


def git_blob(path:Path)->str:
    raw=path.read_bytes()
    return hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()


def verify_source()->dict:
    root=Path(__file__).resolve().parent
    verified={}
    for file,sha in SOURCE_EXPECTED.items():
        actual=git_blob(root/file)
        if actual!=sha:
            raise ValueError(f'Original Git source mismatch {file}: {actual} != {sha}')
        verified[file]=actual
    return verified


def cyl_y(r:float,y:float,length:float,x:float,z:float)->cq.Shape:
    return cq.Solid.makeCylinder(r,length,cq.Vector(x,y,z),cq.Vector(0,1,0))


def revised_parts(upright:cq.Shape,caliper:cq.Shape)->dict[str,cq.Shape]:
    # Tangent-contact saddle: subtract ACTUAL original P2.9 upright surface,
    # not a guessed spherical/proxy frame. Far end touches actual caliper
    # cheek at y=196, with z overlap -94..-85 and x overlap -19..19.
    blank=cq.Workplane('XY').box(38,106,22).val().translate((0,143,-96))
    carrier=blank.cut(upright).clean()
    upr=upright
    cal=caliper
    # Two caliper mount through-holes along radial +Y. Outer cheek and bridge
    # are both bored. Nominal shank clearance is 0.45 mm radial.
    for x in (-10,10):
        drill=cyl_y(3.45,181,47,x,-90)
        cal=cal.cut(drill)
        carrier=carrier.cut(drill)
        # Inboard recessed heads avoid the real P2.16 rim radial envelope.
        carrier=carrier.cut(cyl_y(5.5,181,7,x,-90))
    # Two dedicated upright-carrier holes through the *actual* P2.9 carrier
    # ring wall. The visual bolts are UNTHREADED and have no certified grip.
    for x in (-11,11):
        drill=cyl_y(3.45,68,52,x,-100)
        upr=upr.cut(drill)
        carrier=carrier.cut(drill)
        # Counterbore, exact radial head seat at y=111 mm.
        carrier=carrier.cut(cyl_y(5.5,111,9,x,-100))
    revised={UPRIGHT:upr.clean(), CALIPER:cal.clean(), CARRIER:carrier.clean()}
    for i,x in enumerate((-10,10)):
        shank=cyl_y(3.0,188,32,x,-90)
        head=cyl_y(5.0,185,3,x,-90)
        revised[CAL_BOLT[i]]=shank.fuse(head).clean()
    for i,x in enumerate((-11,11)):
        shank=cyl_y(3.0,75,36,x,-100)
        head=cyl_y(5.0,111,3,x,-100)
        revised[UPR_BOLT[i]]=shank.fuse(head).clean()
    if len(revised)!=7:
        raise ValueError('Two revised native bodies + one bracket + four bolts required')
    for name,body in revised.items():
        if body.isNull() or not body.isValid() or len(body.Solids())!=1 or body.Volume()<=0:
            raise ValueError('Invalid P2.29 native connected solid: '+name)
    return revised


def original_parts()->dict[str,cq.Shape]:
    return revised_parts(build_rear_upright(),source_p217()[CALIPER])


def static_source()->tuple[dict[str,cq.Shape],dict[str,cq.Shape],dict]:
    verified=verify_source()
    rear40,_,rear40_report=source_p228()
    if len(rear40)!=40 or not rear40_report['nativeStaticAudit']['passStatic']:
        raise ValueError('P2.28 native 40-solid source failed its original gate')
    original_upright=build_rear_upright()
    old_gap=native_distance(rear40[CALIPER],original_upright)
    revised=revised_parts(original_upright,rear40[CALIPER])
    merged={**rear40,UPRIGHT:revised[UPRIGHT], CALIPER:revised[CALIPER],
            **{name:body for name,body in revised.items() if name not in (UPRIGHT,CALIPER)}}
    if len(merged)!=46 or len(set(merged))!=46:
        raise ValueError('P2.29 source collision audit must include exactly 46 independently authored B-Reps')
    audit=pair_audit(merged)
    cal_gap=native_distance(merged[CALIPER],merged[CARRIER])
    upright_gap=native_distance(merged[UPRIGHT],merged[CARRIER])
    if not (82.5 < old_gap <82.8 and cal_gap<1e-4 and upright_gap<1e-4):
        raise ValueError('Original P2.9 / P2.17 caliper contact is not actually seated')
    if not audit['passStatic']:
        raise ValueError('Native 46-body P2.29 source interference: '+str(audit['unresolvedOverlap'][:8]))
    report={
        'schema':SCHEMA,'status':'P229_AUTHENTIC_P29_STATIC_MOUNT_CLEARANCE_PASS_G2_HOLD',
        'sourceGitBlobsVerified':verified,
        'originalCaliperUprightMinimumDistanceMm':round(old_gap,6),
        'newCaliperToCarrierMinimumDistanceMm':round(cal_gap,6),
        'newUprightToCarrierMinimumDistanceMm':round(upright_gap,6),
        'replacedOriginalPartIds':[UPRIGHT,CALIPER],
        'addedNativePartIds':[CARRIER,*CAL_BOLT,*UPR_BOLT],
        'revisedAndNewNativeBodies':len(revised),
        'realP228SourceBodies':40,'combinedNativeCADBodies':46,
        'caliperMountDrillRadiusMm':3.45,'unthreadedBoltShankRadiusMm':3.0,
        'caliperMountBoltCount':2,'uprightMountBoltCount':2,
        'source46NativeStaticAudit':audit,
        'nativeRear56WithRemainingP210BodiesVerified':False,
        'realBrakeForceAndTorsionalLoadCertified':False,
        'positiveBoltRetentionCertified':False,
        'p224Authentic71BodyGatePassed':False,
        'originalModelBVehicleIncluded':False,'mechanicalG2Certified':False,
    }
    return merged,revised,report


def native_glb(parts:dict[str,cq.Shape],path:Path,linear:float,angular:float)->dict:
    palette,rgba=neutral_palette()
    scene=trimesh.Scene()
    for name,part in parts.items():
        vertices,faces=part.tessellate(linear,angular)
        mesh=trimesh.Trimesh(
            vertices=np.array([[p.x,p.y,p.z] for p in vertices],dtype=float)/1000,
            faces=np.asarray(faces,dtype=np.int64),process=False)
        mesh.merge_vertices(digits_vertex=7)
        if not mesh.is_watertight or not mesh.is_winding_consistent or len(mesh.faces)<4:
            raise ValueError('P2.29 nonmanifold source tessellation: '+name)
        role='caliper' if name in (CALIPER,CARRIER) else 'upright' if name==UPRIGHT else 'hardware'
        pbr=palette['presets'][role]
        mesh.visual=trimesh.visual.TextureVisuals(material=trimesh.visual.material.PBRMaterial(
            name=name,baseColorFactor=rgba,metallicFactor=pbr['metalness'],
            roughnessFactor=pbr['roughness'],doubleSided=True))
        scene.add_geometry(mesh,node_name=name,geom_name=name)
    path.write_bytes(scene.export(file_type='glb'))
    return {'file':path.name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
            'bytes':path.stat().st_size,
            'triangles':sum(len(m.faces) for m in scene.geometry.values()),
            'partIds':sorted(parts)}


def build(out:Path)->dict:
    if out.exists():
        raise FileExistsError('P2.29 original CAD evidence must not be overwritten')
    _,parts,study=static_source()
    out.mkdir(parents=True)
    assembly=cq.Assembly(name='P229_SOURCE_CALIPER_TO_UPRIGHT_PROVISIONAL_MATE_G2_HOLD')
    for name,part in parts.items():assembly.add(part,name=name)
    step=out/'P229_rear_caliper_carrier_7_native.step'
    assembly.save(str(step),exportType='STEP')
    imported=cq.importers.importStep(str(step)).solids().vals()
    if len(imported)!=7 or any(not body.isValid() for body in imported):
        raise ValueError('P2.29 STEP source 7-solids roundtrip failed')
    profile={}
    # Fresh P29 + P217 source B-Reps per tier, no rerun of whole rear40.
    for tier,(linear,angular) in QUALITY.items():
        target=out/('P229_caliper_carrier_'+tier.lower()+'.glb')
        profile[tier]=native_glb(original_parts(),target,linear,angular)
    triangles=[profile[tier]['triangles'] for tier in QUALITY]
    if not triangles[0]>triangles[1]>triangles[2]:
        raise ValueError('P2.29 source GLB LOD tiers do not descend')
    manifest={'schema':REVIEW_SCHEMA,'status':study['status'],
        'revisedAndNewNativeBodies':7,'sourceGitBlobsVerified':study['sourceGitBlobsVerified'],
        'nativeSTEP':{'file':step.name,'sha256':hashlib.sha256(step.read_bytes()).hexdigest(),
                      'roundtripSolids':len(imported)},
        'materialColor':COLOR,'source46NativeAudit':study,
        'profiles':profile,'modelBOriginalIncluded':False,'mechanicalG2Certified':False}
    (out/'P229_caliper_carrier_source_manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    (out/'P229_caliper_carrier_native_audit.json').write_text(json.dumps(study,indent=2)+'\n')
    return manifest


if __name__=='__main__':
    cli=argparse.ArgumentParser()
    cli.add_argument('--out',type=Path,required=True)
    print(json.dumps(build(cli.parse_args().out),indent=2))
